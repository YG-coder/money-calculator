// ─────────────────────────────────────────────
// 금융(저축) 계산 로직 — 예금 · 적금 · 복리
// 순수 계산 함수 + 타입. 포맷(formatKRW/formatUnit)은 @/lib/loan에서
// 재사용하므로 여기서 정의하지 않는다. (계산기 컴포넌트가 직접 import)
// ─────────────────────────────────────────────

// 과세 유형 — 내부는 영문 리터럴, 화면 표시만 한글
export type TaxType = "general" | "taxPreferred" | "taxExempt";
// general → 일반과세 · taxPreferred → 세금우대 · taxExempt → 비과세

// 예금 이자 지급 방식
export type InterestMethod = "simple" | "monthlyCompound";
// simple → 단리(만기일시지급) · monthlyCompound → 월복리

/**
 * ⚠️ 배포 전 국세청·예금보험공사 공식 자료로 재검증할 수치.
 * - general(일반과세): 이자소득세 14% + 지방소득세 1.4% = 15.4% (오랜 표준값)
 * - taxPreferred(세금우대): 9.5% — 적용 대상·상품·신규 가입 가능 여부를 반드시 확인.
 *   UI 기본 옵션으로 노출하지 말 것(스펙 §4). 유효성 확인 후에만 선택지 제공.
 * - taxExempt(비과세): 0% — 자격·상품 조건 필요. 사용자가 임의 선택하는 옵션 아님.
 */
export const INTEREST_TAX_RATE: Record<TaxType, number> = {
  general: 0.154,
  taxPreferred: 0.095,
  taxExempt: 0,
};

// ─────────────────────────────────────────────
// 공통 헬퍼
// ─────────────────────────────────────────────

/** 연이율(%) → 월이율(소수) */
export function toMonthlyRate(annualRate: number): number {
  return annualRate / 100 / 12;
}

/** 연이율(%) → 기간이율(소수) · periodsPerYear회 복리 */
export function toPeriodRate(annualRate: number, periodsPerYear: number): number {
  if (periodsPerYear <= 0) return 0;
  return annualRate / 100 / periodsPerYear;
}

/**
 * 세전이자에 과세 적용 → { tax, netInterest }
 *
 * ⚠️ 원 단위 처리 정책: 소수값을 그대로 유지한다. 실제 은행 원천징수는
 *    세목별 절사·징수 규칙이 있어, 공식 기준 확인 전까지 Math.round/floor를
 *    임의로 박지 않는다. 결과 페이지에 "일반 세율 적용 예상치이며 실제
 *    원천징수·원 단위 처리에 따라 차이가 날 수 있다"는 안내를 필수 노출한다(스펙 §5).
 */
export function applyInterestTax(
  grossInterest: number,
  taxType: TaxType,
): { tax: number; netInterest: number } {
  const tax = grossInterest * INTEREST_TAX_RATE[taxType];
  return { tax, netInterest: grossInterest - tax };
}

// ─────────────────────────────────────────────
// 1. 예금 이자 (목돈 일시 예치)
// ─────────────────────────────────────────────

export interface DepositInput {
  principal: number; // 원금(원)
  annualRate: number; // 연이율(%)
  months: number; // 예치 기간(개월)
  method: InterestMethod;
  taxType: TaxType;
}

export interface DepositResult {
  principal: number;
  grossInterest: number; // 세전 이자
  tax: number; // 이자과세
  netInterest: number; // 세후 이자
  maturityAmount: number; // 세후 만기 수령액 (원금 + 세후이자)
  netAnnualizedRate: number; // 세후 연환산 수익률(%) — 기하 연환산(CAGR형)
}

export function calcDepositInterest(input: DepositInput): DepositResult {
  const { principal, annualRate, months, method, taxType } = input;

  let grossInterest: number;
  if (method === "monthlyCompound") {
    const rm = toMonthlyRate(annualRate);
    grossInterest = principal * Math.pow(1 + rm, months) - principal;
  } else {
    // 단리(만기일시지급)
    grossInterest = principal * (annualRate / 100) * (months / 12);
  }

  const { tax, netInterest } = applyInterestTax(grossInterest, taxType);
  const maturityAmount = principal + netInterest;

  // 세후 연환산 수익률(CAGR형): (세후 만기수령액 / 원금)^(12/개월) − 1
  // 단순 연환산이 아니라 기하 연환산이라 월복리·기간>12개월에서도 의미가 정확하다.
  const netAnnualizedRate =
    principal > 0 && months > 0
      ? (Math.pow(maturityAmount / principal, 12 / months) - 1) * 100
      : 0;

  return {
    principal,
    grossInterest,
    tax,
    netInterest,
    maturityAmount,
    netAnnualizedRate,
  };
}

// ─────────────────────────────────────────────
// 2. 적금 이자 (정액적립식) — 월 단위 표준 근사 모델
// ─────────────────────────────────────────────
// 이자 = 월납입액 × 월이율 × n(n+1)/2
//   (각 회차 예치기간을 첫 회 n개월 … 마지막 회 1개월로 보는 근사)
// ⚠️ 근사치. 실제 금융기관은 납입일·만기일·일수·회차별 예치기간으로
//    계산하므로 상품별 실제 지급액과 차이가 난다. 결과 UI에
//    "표준 정액적립식 예상치" 라벨 필수.

export interface InstallmentSavingsInput {
  monthlyDeposit: number; // 월 납입액(원)
  annualRate: number; // 연이율(%)
  months: number; // 납입 기간(개월)
  taxType: TaxType;
}

export interface InstallmentSavingsResult {
  monthlyDeposit: number;
  months: number;
  totalDeposited: number; // 총 납입 원금
  grossInterest: number; // 세전 예상 이자(근사)
  tax: number;
  netInterest: number; // 세후 예상 이자
  maturityAmount: number; // 세후 예상 만기 수령액
  isApproximate: true; // 항상 근사 — UI 라벨 강제용
}

export function calcInstallmentSavings(
  input: InstallmentSavingsInput,
): InstallmentSavingsResult {
  const { monthlyDeposit, annualRate, months, taxType } = input;

  const rm = toMonthlyRate(annualRate);
  const totalDeposited = monthlyDeposit * months;
  const grossInterest = monthlyDeposit * rm * ((months * (months + 1)) / 2);

  const { tax, netInterest } = applyInterestTax(grossInterest, taxType);
  const maturityAmount = totalDeposited + netInterest;

  return {
    monthlyDeposit,
    months,
    totalDeposited,
    grossInterest,
    tax,
    netInterest,
    maturityAmount,
    isApproximate: true,
  };
}

// ─────────────────────────────────────────────
// 3. 복리 계산 (저축 맥락: 원금 + 정기 납입)
// ─────────────────────────────────────────────
// 저축·예금 맥락으로 한정 — 주식계산기.kr의 투자수익률 복리와 역할 분리.
// 추가 납입은 각 복리주기 말에 적립(기말 적립, ordinary annuity).

export interface CompoundInput {
  principal: number; // 초기 원금(원)
  annualRate: number; // 연이율(%)
  years: number; // 기간(년)
  compoundsPerYear?: number; // 복리 횟수(기본 12: 월복리)
  contribution?: number; // 매 복리주기 추가 납입액(원, 기본 0)
}

export interface CompoundYearPoint {
  year: number;
  balance: number; // 해당 연말 잔액(복리)
  contributed: number; // 해당 연말까지 누적 납입 원금
}

export interface CompoundResult {
  principal: number;
  totalContributed: number; // 총 납입 원금(초기 + 추가납입)
  finalAmount: number; // 최종 예상 금액(복리)
  totalInterest: number; // 누적 이자(finalAmount - totalContributed)
  simpleFinalAmount: number; // 동일 조건 단리 가정 최종액
  compoundAdvantage: number; // 단리 대비 복리 초과분
  yearly: CompoundYearPoint[];
}

export function calcCompoundInterest(input: CompoundInput): CompoundResult {
  const {
    principal,
    annualRate,
    years,
    compoundsPerYear = 12,
    contribution = 0,
  } = input;

  const n = compoundsPerYear > 0 ? compoundsPerYear : 12;
  // years는 정수 연 단위 입력을 전제한다(복리 계산기 UI에서 제한).
  // 소수 연도를 허용하려면 마지막 부분연도 스냅샷을 별도로 추가해야 한다
  // (현재 yearly 배열에는 완전한 연도만 기록된다).
  const periods = Math.round(n * years);
  const rate = toPeriodRate(annualRate, n);

  let balance = principal;
  let contributed = principal;

  // 단리 비교용 — 이자를 원금에 재투자하지 않는다
  let simpleBase = principal;
  let simpleInterest = 0;

  const yearly: CompoundYearPoint[] = [];

  for (let i = 1; i <= periods; i++) {
    balance = balance * (1 + rate) + contribution;

    simpleInterest += simpleBase * rate;
    simpleBase += contribution;

    contributed += contribution;

    if (i % n === 0) {
      yearly.push({ year: i / n, balance, contributed });
    }
  }

  const finalAmount = balance;
  const totalContributed = contributed;
  const totalInterest = finalAmount - totalContributed;
  const simpleFinalAmount = simpleBase + simpleInterest; // simpleBase === totalContributed
  const compoundAdvantage = finalAmount - simpleFinalAmount;

  return {
    principal,
    totalContributed,
    finalAmount,
    totalInterest,
    simpleFinalAmount,
    compoundAdvantage,
    yearly,
  };
}

// ─────────────────────────────────────────────
// 4. 목표 저축 계산기 (월복리 · 기말 납입 · 세전)
// ─────────────────────────────────────────────
// 특정 상품의 세후 수령액을 맞추는 도구가 아니라 목표 달성을 위한
// 저축 계획을 세우는 계산기. 세금·수수료·중도인출 미반영(세전 기준).
// 결과 UI에 "실제 금융상품의 세후 수령액과 다를 수 있습니다" 안내 필수.

export type GoalMode = "targetToMonthly" | "monthlyToMonths" | "monthlyAndMonthsToAmount";
// targetToMonthly → 목표금액에서 월 납입액 역산 (모드 A)
// monthlyToMonths → 월 납입액에서 목표까지 기간 역산 (모드 B)
// monthlyAndMonthsToAmount → 월 납입액+기간에서 도달액 (모드 C)

/** 정액 적립(기말 납입) 월복리 미래가치. i = 월이율(소수) */
function monthlyAnnuityFV(monthly: number, i: number, n: number): number {
  if (n <= 0) return 0;
  if (i === 0) return monthly * n;
  return monthly * ((Math.pow(1 + i, n) - 1) / i);
}

// ── 모드 A: 목표금액 → 필요한 월 납입액 ──
export interface GoalMonthlyInput {
  targetAmount: number; // 목표 금액(원)
  months: number; // 목표 기간(개월)
  annualRate: number; // 연이율(%)
}
export interface GoalMonthlyResult {
  requiredMonthly: number; // 필요한 월 납입액(원)
  months: number;
  targetAmount: number;
  totalDeposit: number; // 총 납입 원금(= 월납입 × 개월)
  totalInterest: number; // 세전 이자(= 목표금액 − 총 납입)
}
export function goalRequiredMonthly(input: GoalMonthlyInput): GoalMonthlyResult {
  const { targetAmount, months, annualRate } = input;
  const i = toMonthlyRate(annualRate);
  const requiredMonthly =
    i === 0 ? targetAmount / months : (targetAmount * i) / (Math.pow(1 + i, months) - 1);
  const totalDeposit = requiredMonthly * months;
  return {
    requiredMonthly,
    months,
    targetAmount,
    totalDeposit,
    totalInterest: targetAmount - totalDeposit,
  };
}

// ── 모드 B: 월 납입액 → 목표까지 걸리는 기간 ──
export interface GoalMonthsInput {
  monthlyDeposit: number; // 월 납입액(원)
  targetAmount: number; // 목표 금액(원)
  annualRate: number; // 연이율(%)
  maxMonths?: number; // 기간 상한(기본 1200개월=100년)
}
export interface GoalMonthsResult {
  months: number; // 목표 도달에 필요한 개월(올림)
  monthlyDeposit: number;
  targetAmount: number;
  reachedAmount: number; // 해당 개월의 실제 도달액(목표 이상)
  totalDeposit: number;
  totalInterest: number;
  capped: boolean; // 상한(maxMonths) 도달 여부
}
export function goalRequiredMonths(input: GoalMonthsInput): GoalMonthsResult {
  const { monthlyDeposit, targetAmount, annualRate, maxMonths = 1200 } = input;
  const i = toMonthlyRate(annualRate);
  const nExact =
    i === 0
      ? targetAmount / monthlyDeposit
      : Math.log(1 + (targetAmount * i) / monthlyDeposit) / Math.log(1 + i);
  let months = Math.max(1, Math.ceil(nExact));
  let capped = false;
  if (months > maxMonths) {
    months = maxMonths;
    capped = true;
  }
  const reachedAmount = monthlyAnnuityFV(monthlyDeposit, i, months);
  const totalDeposit = monthlyDeposit * months;
  return {
    months,
    monthlyDeposit,
    targetAmount,
    reachedAmount,
    totalDeposit,
    totalInterest: reachedAmount - totalDeposit,
    capped,
  };
}

// ── 모드 C: 월 납입액 + 기간 → 예상 도달 금액 ──
export interface GoalAmountInput {
  monthlyDeposit: number; // 월 납입액(원)
  months: number; // 기간(개월)
  annualRate: number; // 연이율(%)
}
export interface GoalAmountResult {
  finalAmount: number; // 예상 도달 금액(세전)
  monthlyDeposit: number;
  months: number;
  totalDeposit: number;
  totalInterest: number;
}
export function goalFinalAmount(input: GoalAmountInput): GoalAmountResult {
  const { monthlyDeposit, months, annualRate } = input;
  const i = toMonthlyRate(annualRate);
  const finalAmount = monthlyAnnuityFV(monthlyDeposit, i, months);
  const totalDeposit = monthlyDeposit * months;
  return {
    finalAmount,
    monthlyDeposit,
    months,
    totalDeposit,
    totalInterest: finalAmount - totalDeposit,
  };
}

// ─────────────────────────────────────────────
// 6. 예금 vs 적금 비교
//   같은 금리·같은 총액에서, 예금(처음부터 일시예치)과 적금(매달 납입)의
//   원금 운용 기간 차이가 실제 이자에 얼마나 영향을 주는지 보여준다.
//   · 예금은 단리(만기일시) 기준으로 고정 — "원금 운용 기간 차이"만 순수하게
//     드러내기 위함. (월복리 예금은 이자가 더 늘며, 복리는 /finance/compound 담당)
//   · 판정(어느 쪽 유리)은 하지 않는다. 예금은 목돈이 있다는 가정, 적금은 매달
//     모으는 상품이라는 전제를 결과에 함께 고지한다.
//   · calcDepositInterest · calcInstallmentSavings 재사용.
// ─────────────────────────────────────────────

export interface DepositVsSavingsInput {
  monthlyDeposit: number; // 월 납입액(원)
  months: number; // 기간(개월)
  annualRate: number; // 연이율(%)
  taxType: TaxType;
}

export interface DepositVsSavingsResult {
  totalPrincipal: number; // 총 납입 원금(= 예금 일시예치 원금)
  savings: InstallmentSavingsResult;
  deposit: DepositResult;
  savingsNetInterestRate: number; // 적금 세후 이자 ÷ 총 납입액 (%)
  depositNetInterestRate: number; // 예금 세후 이자 ÷ 총 원금 (%)
  netInterestMultiple: number | null; // 예금 세후이자 ÷ 적금 세후이자 (예금이 몇 배)
}

export function compareDepositVsSavings(
  input: DepositVsSavingsInput,
): DepositVsSavingsResult {
  const { monthlyDeposit, months, annualRate, taxType } = input;

  const savings = calcInstallmentSavings({
    monthlyDeposit,
    annualRate,
    months,
    taxType,
  });

  const totalPrincipal = savings.totalDeposited;

  // 예금: 같은 총액을 처음부터 일시예치, 단리(만기일시) 기준
  const deposit = calcDepositInterest({
    principal: totalPrincipal,
    annualRate,
    months,
    method: "simple",
    taxType,
  });

  // 같은 분모(총 원금/총 납입액) 대비 세후 이자 비율.
  // ⚠️ CAGR/연환산이 아니다. 적금은 총 납입액이 첫날부터 굴러가지 않으므로
  //    (만기/총납입)^(12/n) 형태의 연환산은 현금흐름 시점을 왜곡한다.
  //    이 페이지의 목적("같은 총액 대비 이자 차이")에는 총액 대비 비율이 정확하다.
  const savingsNetInterestRate =
    totalPrincipal > 0 ? (savings.netInterest / totalPrincipal) * 100 : 0;
  const depositNetInterestRate =
    totalPrincipal > 0 ? (deposit.netInterest / totalPrincipal) * 100 : 0;

  const netInterestMultiple =
    savings.netInterest > 0 ? deposit.netInterest / savings.netInterest : null;

  return {
    totalPrincipal,
    savings,
    deposit,
    savingsNetInterestRate,
    depositNetInterestRate,
    netInterestMultiple,
  };
}

// ─────────────────────────────────────────────
// 7. CMA vs 예금 비교
//   같은 예치금액·기간에서 예금금리와 CMA 예상수익률을 비교한다.
//   · 둘 다 단리 일시예치·일반과세 15.4% 기준으로 통일 (calcDepositInterest 재사용).
//     → 복리 여부가 비교 결과를 흔드는 변수에서 빠지고, 입력한 두 금리만 비교하는
//       모델이 명확해진다.
//   · CMA는 확정금리가 아니다. 입력한 예상수익률이 기간 동안 유지된다는 "가정"이며,
//     RP형·MMF형·MMW형·발행어음형 등 상품유형·증권사·시장상황에 따라 실제 수익률과
//     산정·지급 방식이 다를 수 있다(고지는 UI에서).
//   · 판정(어느 쪽 유리) 없음. 손익분기 없음(둘 다 일시예치라 같은 금리면 동일).
// ─────────────────────────────────────────────

export interface CmaVsDepositInput {
  principal: number; // 예치금액(원)
  months: number; // 기간(개월)
  depositRate: number; // 예금 금리(%)
  cmaRate: number; // CMA 예상수익률(%)
}

export interface CmaVsDepositResult {
  deposit: DepositResult;
  cma: DepositResult;
  depositNetInterestRate: number; // 예금 세후이자 ÷ 원금 (%)
  cmaNetInterestRate: number; // CMA 세후이자 ÷ 원금 (%)
  netInterestDiff: number; // cma.netInterest − deposit.netInterest
  maturityDiff: number; // cma.maturityAmount − deposit.maturityAmount
}

export function compareCmaVsDeposit(
  input: CmaVsDepositInput,
): CmaVsDepositResult {
  const { principal, months, depositRate, cmaRate } = input;

  // 둘 다 단리 일시예치·일반과세 15.4% 고정
  const deposit = calcDepositInterest({
    principal,
    annualRate: depositRate,
    months,
    method: "simple",
    taxType: "general",
  });
  const cma = calcDepositInterest({
    principal,
    annualRate: cmaRate,
    months,
    method: "simple",
    taxType: "general",
  });

  const depositNetInterestRate =
    principal > 0 ? (deposit.netInterest / principal) * 100 : 0;
  const cmaNetInterestRate =
    principal > 0 ? (cma.netInterest / principal) * 100 : 0;

  return {
    deposit,
    cma,
    depositNetInterestRate,
    cmaNetInterestRate,
    netInterestDiff: cma.netInterest - deposit.netInterest,
    maturityDiff: cma.maturityAmount - deposit.maturityAmount,
  };
}

// ─────────────────────────────────────────────
// 8. 실질금리 (구매력 관점)
//   명목금리(예금금리)에서 물가상승률을 반영한 실질 수익률.
//   · 피셔 정확식이 메인, (명목 − 물가) 근사식은 참고로 병기.
//     물가가 높을수록 근사식이 실질금리를 과대평가하므로 정확식이 안전하다.
//   · 투자수익률이 아니라 예금·현금의 "구매력 변화" 관점으로만 해석한다.
//   · principal(선택) 입력 시 1년 기준 명목 이자와 실질 가치 증감(금액)을 함께 제공.
// ─────────────────────────────────────────────

export interface RealInterestInput {
  nominalRate: number; // 명목금리(예금금리, %)
  inflationRate: number; // 물가상승률(%)
  principal?: number; // 예치금액(원) — 선택, 1년 실질 수익 표시용
}

export interface RealInterestResult {
  realRateExact: number; // 피셔 정확식 실질금리(%)
  realRateApprox: number; // 근사식 실질금리(%) = 명목 − 물가
  approxGap: number; // 근사식 − 정확식 (근사식이 과대평가하는 폭, %p)
  nominalInterest1y: number | null; // 1년 명목 이자(원)
  realGain1y: number | null; // 1년 실질 가치 증감(원) = 원금 × 정확식
}

export function calcRealInterestRate(
  input: RealInterestInput,
): RealInterestResult {
  const { nominalRate, inflationRate, principal } = input;

  const denom = 1 + inflationRate / 100;
  const realRateExact =
    denom !== 0 ? ((1 + nominalRate / 100) / denom - 1) * 100 : 0;
  const realRateApprox = nominalRate - inflationRate;

  const hasPrincipal = typeof principal === "number" && principal > 0;

  return {
    realRateExact,
    realRateApprox,
    approxGap: realRateApprox - realRateExact,
    nominalInterest1y: hasPrincipal ? principal * (nominalRate / 100) : null,
    realGain1y: hasPrincipal ? principal * (realRateExact / 100) : null,
  };
}

// ─────────────────────────────────────────────
// 9. 인플레이션 (구매력 변화)
//   물가상승률이 지속될 때, 현재 금액의 미래 구매력과 동일 구매력 유지에 필요한
//   미래 금액을 계산한다.
//   · 투자수익률이 아니라 현금·저축의 구매력 변화 관점.
//   · 미래 구매력 = 현재금액 / (1+물가)^기간  (현재가치 기준)
//   · 동일 구매력 필요금액 = 현재금액 × (1+물가)^기간  (미래 명목금액)
// ─────────────────────────────────────────────

export interface InflationInput {
  amount: number; // 현재 금액(원)
  inflationRate: number; // 연 물가상승률(%)
  years: number; // 기간(년)
}

export interface InflationResult {
  futurePurchasingPower: number; // N년 후 현재금액의 구매력(현재가치)
  requiredFutureAmount: number; // 같은 구매력 유지에 필요한 미래 금액(명목)
  lossAmount: number; // 구매력 감소 금액
  lossRate: number; // 구매력 감소율(%)
}

export function calcInflation(input: InflationInput): InflationResult {
  const { amount, inflationRate, years } = input;

  // 경계 가드: 물가 −100% 이하 또는 기간 1년 미만은 (1+물가)^기간 이 0·음수가 되어
  // 경제적으로 무의미하다. 이 프로젝트는 계산 함수에서 throw 대신 안전값을 반환하므로,
  // 무효 입력은 "변화 없음"(구매력·필요금액 = 현재 금액, 감소 0)으로 처리한다.
  if (inflationRate <= -100 || years < 1) {
    return {
      futurePurchasingPower: amount,
      requiredFutureAmount: amount,
      lossAmount: 0,
      lossRate: 0,
    };
  }

  const factor = Math.pow(1 + inflationRate / 100, years);
  const futurePurchasingPower = factor !== 0 ? amount / factor : amount;
  const requiredFutureAmount = amount * factor;

  return {
    futurePurchasingPower,
    requiredFutureAmount,
    lossAmount: amount - futurePurchasingPower,
    lossRate: factor !== 0 ? (1 - 1 / factor) * 100 : 0,
  };
}
