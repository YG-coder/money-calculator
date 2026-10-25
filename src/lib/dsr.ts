// src/lib/dsr.ts
// ─────────────────────────────────────────────
// 스트레스 DSR 계산 엔진
//
// ⚠️ 이 파일에는 정책값을 두지 않습니다.
//    모든 수치는 @/lib/policy/dsr 에서 가져옵니다.
//    값을 고쳐야 한다면 이 파일이 아니라 정책 파일을 고치세요.
//
// 조사 근거: docs/policies/DSR-POLICY-2026-08.md (rev.3)
//
// 범위
//   신규 대출 : 주택담보대출 | 신용대출
//   기존 부채 : 기타 부채(연간 원리금 직접 입력)
//               + 신용대출·마이너스통장(구조화 입력)
//               + 전세자금대출(제외 확인 포함)
//
// 지원하지 않는 것 — 값을 추정하지 않고 계산을 차단한다
//   · 주담대 만기일시·거치식
//   · 적격 분할상환 신용대출의 상품별 적격 분할상환 자동 판정
//       → 사용자가 실제 연간 원리금을 직접 입력
//   · 전세자금대출의 '그 밖의 조건'
//   · 지방 주담대 유예 만료 이후 기준
// ─────────────────────────────────────────────

import {
  monthlyRate,
  equalPaymentMonthly,
  principalFromPayment,
} from "@/lib/loan";
import {
  DSR_POLICY_META,
  getMortgageProductStressRatePct,
  mortgagePeriodError,
  MORTGAGE_PRODUCT_POLICY,
  getCreditStressRatePct,
  isStressRateEffective,
  STRESS_RATE,
  CREDIT_ASSESSMENT_TERM_YEARS,
  CREDIT_STRESS_GATE_WON,
  LOCAL_MORTGAGE_DEFERRAL_UNTIL,
  DSR_LIMIT,
  type MortgageRegion,
  type MortgageRateType,
  type CreditFixedTerm,
} from "@/lib/policy/dsr";

export { LOCAL_MORTGAGE_DEFERRAL_UNTIL, DSR_LIMIT, CREDIT_STRESS_GATE_WON };
export type { CreditFixedTerm };

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────

/** 주택담보대출 지역 구분. 정책 레이어의 MortgageRegion 과 같은 타입(기존 이름 유지). */
export type Region = MortgageRegion; // "metro" | "local"
export type RateType = MortgageRateType;
export type DsrRepayment = "equal_payment" | "equal_principal"; // 원리금균등 / 원금균등

/** 신규 대출 종류 */
export type NewLoanKind = "mortgage" | "credit";

/**
 * 신용대출 상환 유형.
 *   lumpSum     — 일시상환. 산정만기 5년
 *   creditLine  — 마이너스통장. 약정한도 전액을 원금으로 보고 산정만기 5년
 *   installment — 분할상환. 상품 요건 자동 판정 미지원 → 금융회사 확인값 직접 입력
 */
export type CreditRepaymentKind = "lumpSum" | "creditLine" | "installment";

/** 전세자금대출 상태 — 조용한 0원을 막기 위해 미선택·없음을 별도 상태로 둔다. */
export type JeonseInput =
  | { status: "unselected" }
  | { status: "none" }
  | { status: "noHouse" }
  | { status: "confirmedExempt" }
  | { status: "oneHouseMetro"; annualInterest: number }
  | { status: "other" };

/** 정책 검증일 — 정책 레이어가 단일 출처 */
export const DSR_VERIFIED_DATE = DSR_POLICY_META.verifiedAt;

/**
 * 값을 찾지 못하면 추정하지 않고 사유를 돌려준다.
 * (lib/policy/types 의 lookupPolicy 와 같은 규약)
 */
export type DsrOutcome<T> =
  { status: "ok"; value: T } | { status: "unsupported"; reason: string };

/** 오늘(Asia/Seoul) YYYY-MM-DD. 유예 만료 판정에 쓴다. */
export function todayKst(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// ─────────────────────────────────────────────
// 유효 스트레스 금리(%p) — 주택담보대출
//   변동형: 정책 레이어에서 지역별로 조회
//   순수고정형(만기까지 고정): 미래 금리변동 위험이 없어 0
//
//   ⚠️ 지방 유예가 만료되면 정책 레이어가 값을 돌려주지 않습니다.
//      그 경우 임의 대체값을 쓰지 않고 unsupported 로 되돌립니다.
// ─────────────────────────────────────────────
export function getEffectiveStressRate(params: {
  region: Region;
  rateType: RateType;
  /** 혼합·주기형은 약정만기와 고정기간/변동주기(월)가 모두 필요 */
  months?: number;
  fixedMonths?: number;
  asOf?: string;
}): DsrOutcome<number> {
  const asOf = params.asOf ?? todayKst();

  // 반기 적용 기간이 끝나면 금리유형과 무관하게 계산하지 않는다.
  // "순수고정은 스트레스 0" 도 현행 행정지도의 규율이므로, 다음 발표를
  // 확인하기 전에는 그 규율이 유지된다고 단정할 수 없다.
  if (!isStressRateEffective(asOf)) {
    return { status: "unsupported", reason: STRESS_EXPIRED_REASON };
  }

  const periodError = mortgagePeriodError(params);
  if (periodError) return { status: "unsupported", reason: periodError };
  const pct = getMortgageProductStressRatePct({ ...params, asOf });

  if (pct === null) {
    return { status: "unsupported", reason: "해당 지역·금리유형·기준일의 주택담보대출 공시값을 확인할 수 없어 계산하지 않습니다. 금융회사 또는 금융위원회 공시로 확인하세요." };
  }

  return { status: "ok", value: pct };
}

/**
 * 반기 스트레스 금리 만료 시 공통 사유.
 *
 * 스트레스 금리는 6월·12월에 발표되어 이후 6개월 적용된다. 적용 기간이 끝나면
 * 그 값은 현행 정책값이 아니므로 수도권·지방·신용대출 **전부** 계산하지 않는다.
 * (PolicyMeta 의 expired 판정과 런타임 동작을 일치시키기 위한 처리)
 */
const STRESS_EXPIRED_REASON =
  `기준일이 스트레스 금리 적용 기간(${STRESS_RATE.effectiveFrom}~${STRESS_RATE.effectiveUntil})에 속하지 않거나 유효하지 않습니다. ` +
  "6월·12월 반기 발표 및 해당 시점의 공시를 확인하기 전에는 계산하지 않습니다. 금융회사 또는 금융위원회 공시로 확인하세요.";

// ─────────────────────────────────────────────
// 유효 스트레스 금리(%p) — 신용대출
//
//   ⚠️ 지역 인자를 받지 않습니다. 지방 유예는 주담대 한정이며
//      신용대출 스트레스는 전국 동일합니다.
//   게이팅: 신용대출 총잔액(기존 + 신규)이 1억원을 넘을 때만 적용됩니다.
//   ⚠️ 반기 적용 기간이 지나면 계산하지 않고 사유를 돌려줍니다.
// ─────────────────────────────────────────────
export function getCreditEffectiveStressRate(params: {
  fixedTerm: CreditFixedTerm;
  creditTotalWon: number;
  asOf?: string;
}): DsrOutcome<number> {
  const pct = getCreditStressRatePct({
    fixedTerm: params.fixedTerm,
    creditTotalWon: params.creditTotalWon,
    asOf: params.asOf ?? todayKst(),
  });

  if (pct === null) {
    return { status: "unsupported", reason: STRESS_EXPIRED_REASON };
  }
  return { status: "ok", value: pct };
}

// ─────────────────────────────────────────────
// 신규 주택담보대출의 DSR 산정용 연간 원리금
//   · 원리금균등 : 월 상환액 × 12
//   · 원금균등   : 첫해(부담 최대) 기준 = 원금/기간×12 + 첫 12개월 이자 합
//   ⚠️ DSR 분자는 실제 상환액과 다를 수 있음(대출종류·상환방식별 산정규칙 상이).
// ─────────────────────────────────────────────
export function calcNewLoanAnnualDebtService(
  principal: number,
  ratePercent: number,
  months: number,
  repayment: DsrRepayment,
): number {
  if (principal <= 0 || months <= 0) return 0;

  const r = monthlyRate(ratePercent);

  if (repayment === "equal_payment") {
    return equalPaymentMonthly(principal, r, months) * 12;
  }

  // 원금균등: 첫해 원리금 (원금 균등분할 + 잔액 기준 이자)
  const monthsInYear = Math.min(12, months);
  const principalPay = principal / months;
  let balance = principal;
  let interestSum = 0;

  for (let i = 0; i < monthsInYear; i++) {
    interestSum += balance * r;
    balance -= principalPay;
  }

  return principalPay * monthsInYear + interestSum;
}

// ─────────────────────────────────────────────
// 신용대출의 DSR 산정용 연간 원리금
//   원금은 대출총액/5년, 이자는 원금이 줄지 않는 일시상환 기준이다.
//   2026-06-30 시행 은행업감독업무시행세칙 별표18 표3·주1.
//
//   ⚠️ 마이너스통장은 사용액이 아니라 약정한도 전액이 principal 이다.
//   ⚠️ 분할상환 신용대출은 이 함수를 쓰지 않는다.
//      상품의 거치·상환비중·약정만기 확인이 필요하므로
//      금융회사가 확인한 DSR 산정용 연간 원리금을 직접 입력한다.
// ─────────────────────────────────────────────
export function calcCreditAnnualDebtService(
  principal: number,
  ratePercent: number,
): number {
  if (principal <= 0) return 0;
  return principal / CREDIT_ASSESSMENT_TERM_YEARS + principal * (ratePercent / 100);
}

// ─────────────────────────────────────────────
// 기존 부채
// ─────────────────────────────────────────────

export interface ExistingDebtInput {
  /** 기타 부채의 DSR 산정용 연간 원리금 — 사용자 직접 입력 */
  otherAnnualDebt: number;
  /** 기존 일시상환 신용대출 잔액 */
  creditBalance: number;
  /**
   * 기존 적격 분할상환 신용대출 잔액.
   *
   * ⚠️ 게이팅(신용대출 총잔액 1억원) 판정에만 합산하고, 연간 원리금은 계산하지 않는다.
   *    상품별 인정 만기·실제 이자를 자동 판정하지 않으므로
   *    실제 연간 원리금은 otherAnnualDebt 로 직접 입력받는다.
   */
  creditInstallmentBalance: number;
  /** 기존 마이너스통장 약정한도 — 사용액이 아니라 한도 전액 */
  creditLineLimit: number;
  /** 기존 신용대출·마이너스통장의 평균 금리(%) */
  creditRatePercent: number;
  /** 전세자금대출 */
  jeonse: JeonseInput;
}

export interface ExistingDebtBreakdown {
  /** 합산된 연간 원리금 (원) */
  annualDebt: number;
  otherAnnualDebt: number;
  creditAnnualDebt: number;
  jeonseAnnualDebt: number;
  /** 신용대출 게이팅 판정에 쓰는 기존 신용대출 총잔액 (원) — 적격 분할상환 잔액 포함 */
  existingCreditTotal: number;
  /** 그중 적격 분할상환 잔액. 연간 원리금 산정에는 쓰지 않는다. */
  installmentBalance: number;
  /** 전세대출이 0원으로 잡힌 이유 — '없음'과 '무주택 제외'를 구분해 표시한다 */
  jeonseNote: string | null;
  warnings: string[];
}

export function resolveExistingDebt(
  input: ExistingDebtInput,
): DsrOutcome<ExistingDebtBreakdown> {
  const { jeonse } = input;

  if (jeonse.status === "unselected") {
    return {
      status: "unsupported",
      reason:
        "전세자금대출 여부를 선택해 주세요. 전세대출은 주택 보유 여부와 지역에 따라 " +
        "DSR 산정에서 제외되기도 하고 이자만 반영되기도 하므로, 선택하지 않으면 계산하지 않습니다.",
    };
  }

  if (jeonse.status === "other") {
    return {
      status: "unsupported",
      reason:
        "선택하신 전세자금대출 조건은 이 계산기가 자동으로 판정하지 않습니다. " +
        "무주택자는 원칙적으로 DSR 산정에서 제외되고, 1주택자가 수도권·규제지역에서 임차인으로 받는 " +
        "전세대출은 이자상환분만 반영됩니다. 그 밖의 조건은 금융회사에 확인하세요.",
    };
  }

  // 연간 원리금을 자동 산정하는 대상 — 일시상환 + 마이너스통장
  const servicedCreditPrincipal = input.creditBalance + input.creditLineLimit;

  // 게이팅 판정 대상 — 여기에는 적격 분할상환 잔액까지 더한다
  const installmentBalance = Math.max(0, input.creditInstallmentBalance);
  const existingCreditTotal = servicedCreditPrincipal + installmentBalance;

  const creditAnnualDebt =
    servicedCreditPrincipal > 0
      ? calcCreditAnnualDebtService(
          servicedCreditPrincipal,
          input.creditRatePercent,
        )
      : 0;

  const jeonseAnnualDebt =
    jeonse.status === "oneHouseMetro" ? Math.max(0, jeonse.annualInterest) : 0;

  const jeonseNote =
    jeonse.status === "noHouse"
      ? "무주택자 전세자금대출은 원칙적으로 DSR 산정에서 제외되어 0원으로 반영했습니다."
      : jeonse.status === "confirmedExempt"
        ? "정책상품·경과조치 등으로 금융회사가 DSR 제외를 확인한 전세대출로 선택하여 0원으로 반영했습니다."
        : jeonse.status === "none"
        ? null
        : jeonse.status === "oneHouseMetro"
          ? "1주택자가 수도권·규제지역에서 받는 전세대출은 이자상환분만 반영합니다. 전세대출분에는 스트레스 금리를 더하지 않았습니다. 실제 스트레스 DSR은 금융회사에 확인하세요."
          : null;

  const warnings: string[] = [];
  // ⚠️ '기타 부채 원리금 + 적격 분할상환 잔액'은 의도된 정상 조합이므로 경고하지 않는다.
  //    중복 위험은 연간 원리금을 자동 산정하는 대상(일시상환·마이너스통장)에만 있다.
  if (input.otherAnnualDebt > 0 && servicedCreditPrincipal > 0) {
    warnings.push(
      "'기타 부채 연간 원리금'과 '기존 신용대출'을 함께 입력하셨습니다. " +
        "기타 부채 금액에 신용대출·마이너스통장이 이미 포함돼 있다면 같은 빚이 두 번 더해집니다. " +
        "기타 부채에는 신용대출을 빼고 입력하세요.",
    );
  }
  if (input.otherAnnualDebt > 0 && jeonseAnnualDebt > 0) {
    warnings.push(
      "'기타 부채 연간 원리금'에 전세자금대출 이자가 이미 포함돼 있다면 두 번 더해집니다.",
    );
  }

  return {
    status: "ok",
    value: {
      annualDebt: input.otherAnnualDebt + creditAnnualDebt + jeonseAnnualDebt,
      otherAnnualDebt: input.otherAnnualDebt,
      creditAnnualDebt,
      jeonseAnnualDebt,
      existingCreditTotal,
      installmentBalance,
      jeonseNote,
      warnings,
    },
  };
}

// ─────────────────────────────────────────────
// 신규 대출
// ─────────────────────────────────────────────

export interface NewMortgageInput {
  kind: "mortgage";
  principal: number;
  ratePercent: number;
  months: number;
  repayment: DsrRepayment;
  region: Region;
  rateType: RateType;
  /** 혼합형: 최초 고정기간, 주기형: 금리변동주기. 잔여기간이 아닌 약정 월수 */
  fixedMonths?: number;
}

function mortgageProductNotes(loan: NewMortgageInput, stressPct: number): string[] {
  if (loan.rateType !== "hybrid" && loan.rateType !== "periodic") return [];
  const label = loan.rateType === "hybrid" ? "혼합형 고정금리 기간" : "주기형 금리변동주기";
  const classification = (loan.fixedMonths ?? 0) < MORTGAGE_PRODUCT_POLICY.minimumFixedMonths
    ? "5년 미만이므로 변동형 기준을 적용했습니다."
    : "약정 대출만기 대비 비중에 따른 공시값을 적용했습니다.";
  return [
    `${label} ${loan.fixedMonths}개월 / 약정 대출만기 ${loan.months}개월. ${classification} ` +
      `적용 스트레스 금리는 ${stressPct}%p입니다(${MORTGAGE_PRODUCT_POLICY.effectiveFrom}~${MORTGAGE_PRODUCT_POLICY.effectiveUntil}).`,
  ];
}

export interface NewCreditInput {
  kind: "credit";
  /** 일시상환·분할상환은 대출금액, 마이너스통장은 약정한도 */
  amount: number;
  ratePercent: number;
  repaymentKind: CreditRepaymentKind;
  fixedTerm: CreditFixedTerm;
  /** 분할상환일 때만 사용 — 사용자가 직접 입력한 연간 원리금 */
  installmentAnnualDebt?: number;
}

export type NewLoanInput = NewMortgageInput | NewCreditInput;

interface NewLoanResolved {
  /** 적용 스트레스 금리(%p) */
  stressPct: number;
  /** 스트레스 미적용 기준 연간 원리금 */
  annualNormal: number;
  /** 스트레스 적용 기준 연간 원리금 */
  annualStressed: number;
  /** 신용대출 게이팅 통과 여부 (주담대는 null) */
  creditGatePassed: boolean | null;
  /** 신용대출 총잔액 (주담대는 null) */
  creditTotalWon: number | null;
  notes: string[];
}

function resolveNewLoan(
  loan: NewLoanInput,
  existingCreditTotal: number,
  asOf: string | undefined,
): DsrOutcome<NewLoanResolved> {
  if (loan.kind === "mortgage") {
    const stress = getEffectiveStressRate({
      region: loan.region,
      rateType: loan.rateType,
      months: loan.months,
      fixedMonths: loan.fixedMonths,
      asOf,
    });
    if (stress.status === "unsupported") return stress;

    return {
      status: "ok",
      value: {
        stressPct: stress.value,
        annualNormal: calcNewLoanAnnualDebtService(
          loan.principal,
          loan.ratePercent,
          loan.months,
          loan.repayment,
        ),
        annualStressed: calcNewLoanAnnualDebtService(
          loan.principal,
          loan.ratePercent + stress.value,
          loan.months,
          loan.repayment,
        ),
        creditGatePassed: null,
        creditTotalWon: null,
        notes: mortgageProductNotes(loan, stress.value),
      },
    };
  }

  // ── 신용대출 ──
  const creditTotalWon = existingCreditTotal + loan.amount;
  const stress = getCreditEffectiveStressRate({
    fixedTerm: loan.fixedTerm,
    creditTotalWon,
    asOf,
  });
  if (stress.status === "unsupported") return stress;

  const stressPct = stress.value;
  const creditGatePassed = creditTotalWon > CREDIT_STRESS_GATE_WON;

  const notes: string[] = [];
  if (!creditGatePassed) {
    notes.push(
      "신용대출 총잔액(기존 + 신규)이 1억원 이하라 스트레스 금리가 적용되지 않았습니다.",
    );
  }
  if (loan.repaymentKind === "creditLine") {
    notes.push(
      "마이너스통장은 사용액이 아니라 약정한도 전액을 대출금액으로 보고 산정했습니다.",
    );
  }

  if (loan.repaymentKind === "installment") {
    const direct = loan.installmentAnnualDebt;
    if (direct === undefined || direct <= 0) {
      return {
        status: "unsupported",
        reason:
          "분할상환 신용대출은 거치 없이 월별·분기별 균등분할하고 총대출액의 40% 이상을 분할상환하는 요건을 충족하면 원금을 약정만기(5년 이상, 최장 10년)로 나누어 산정합니다. " +
          "이 계산기는 상품별 요건 충족 여부를 자동으로 판정하지 않습니다. " +
          "금융회사에서 안내받은 DSR 산정용 연간 원리금을 직접 입력해 주세요.",
      };
    }
    notes.push(
      "분할상환 신용대출은 직접 입력하신 연간 원리금을 그대로 사용했습니다. " +
        "스트레스 금리는 이 금액에 자동으로 더해지지 않습니다.",
    );
    return {
      status: "ok",
      value: {
        stressPct,
        annualNormal: direct,
        annualStressed: direct,
        creditGatePassed,
        creditTotalWon,
        notes,
      },
    };
  }

  return {
    status: "ok",
    value: {
      stressPct,
      annualNormal: calcCreditAnnualDebtService(loan.amount, loan.ratePercent),
      annualStressed: calcCreditAnnualDebtService(
        loan.amount,
        loan.ratePercent + stressPct,
      ),
      creditGatePassed,
      creditTotalWon,
      notes,
    },
  };
}

/**
 * 신규 대출이 신용대출일 때, 기타 부채에 숨은 분할상환 신용대출 때문에
 * 1억원 게이팅이 과소 판정되는 것을 막기 위한 조건부 안내.
 *
 * 적격 분할상환 잔액을 이미 입력했다면 안내하지 않는다.
 */
function buildInstallmentGateHints(
  newLoan: NewLoanInput,
  b: ExistingDebtBreakdown,
): string[] {
  if (newLoan.kind !== "credit") return [];
  if (b.otherAnnualDebt <= 0) return [];
  if (b.installmentBalance > 0) return [];
  return [
    "기타 부채에 분할상환 신용대출의 원리금이 포함되어 있다면, 해당 대출 잔액도 " +
      "'적격 분할상환 신용대출 잔액'에 입력해야 신용대출 총잔액 1억원 판정에 반영됩니다.",
  ];
}

// ─────────────────────────────────────────────
// 모드 A: DSR 확인
// ─────────────────────────────────────────────
export interface DsrCheckInput {
  annualIncome: number; // 원
  existing: ExistingDebtInput;
  newLoan: NewLoanInput;
  limitPercent: number; // 선택한 DSR 기준 (40 | 50)
  /** 유예 만료 판정 기준일. 생략하면 오늘(Asia/Seoul) */
  asOf?: string;
}

export interface DsrCheckResult {
  effectiveStressRate: number; // %p
  stressedRatePercent: number; // 실제금리 + 스트레스금리
  existingAnnualDebt: number; // 원
  newAnnualDebtNormal: number; // 원
  newAnnualDebtStressed: number; // 원
  dsrNormal: number; // %
  dsrStressed: number; // %
  headroomAnnual: number; // 원 (스트레스 기준 남은 연간 상환여력, 음수면 초과)
  exceeded: boolean;
  exceedByPct: number; // %p (dsrStressed − limit)
  breakdown: ExistingDebtBreakdown;
  creditGatePassed: boolean | null;
  creditTotalWon: number | null;
  notes: string[];
  warnings: string[];
}

export function calcDsr(input: DsrCheckInput): DsrOutcome<DsrCheckResult> {
  const existing = resolveExistingDebt(input.existing);
  if (existing.status === "unsupported") return existing;

  const resolved = resolveNewLoan(
    input.newLoan,
    existing.value.existingCreditTotal,
    input.asOf,
  );
  if (resolved.status === "unsupported") return resolved;

  const b = existing.value;
  const n = resolved.value;
  const baseRate = input.newLoan.ratePercent;

  const dsrOf = (newAnnual: number) =>
    input.annualIncome > 0
      ? ((b.annualDebt + newAnnual) * 100) / input.annualIncome
      : 0;

  const dsrNormal = dsrOf(n.annualNormal);
  const dsrStressed = dsrOf(n.annualStressed);

  // 규제 게이트는 스트레스 DSR 기준
  const headroomAnnual =
    (input.annualIncome * input.limitPercent) / 100 -
    (b.annualDebt + n.annualStressed);

  return {
    status: "ok",
    value: {
      effectiveStressRate: n.stressPct,
      stressedRatePercent: baseRate + n.stressPct,
      existingAnnualDebt: b.annualDebt,
      newAnnualDebtNormal: n.annualNormal,
      newAnnualDebtStressed: n.annualStressed,
      dsrNormal,
      dsrStressed,
      headroomAnnual,
      exceeded: dsrStressed > input.limitPercent,
      exceedByPct: dsrStressed - input.limitPercent,
      breakdown: b,
      creditGatePassed: n.creditGatePassed,
      creditTotalWon: n.creditTotalWon,
      notes: n.notes,
      warnings: [...b.warnings, ...buildInstallmentGateHints(input.newLoan, b)],
    },
  };
}

// ─────────────────────────────────────────────
// 모드 B: DSR 기준 추정 가능 대출액
//   허용 연간 원리금 = 연소득 × 목표 DSR
//   신규 가용 = 허용 − 기존 (≤0이면 0)
//   ※ 역산은 반드시 스트레스 금리 기준 (명목 역산은 한도 과대계상)
//   ※ 주담대는 원리금균등 기준 역산
//   ※ 신용대출은 원금/5년 + 잔액 전체의 연 이자 기준 역산이며,
//      1억원 경계에서 스트레스 적용 여부가 갈리므로 두 구간을 나눠 계산한다.
// ─────────────────────────────────────────────

export interface DsrEstimateInput {
  annualIncome: number; // 원
  existing: ExistingDebtInput;
  limitPercent: number; // 목표 DSR (40 | 50)
  /** 역산할 신규 대출의 조건. 금액(principal/amount)은 무시한다. */
  newLoan: NewLoanInput;
  asOf?: string;
}

export interface DsrEstimateResult {
  effectiveStressRate: number; // %p
  stressedRatePercent: number;
  existingAnnualDebt: number; // 원
  allowedAnnualDebt: number; // 원 (연소득 × 목표DSR)
  availableForNew: number; // 원 (허용 − 기존, ≥0)
  estimatedPrincipal: number; // 원
  monthlyPaymentActual: number; // 원 (실제금리 기준 월 상환액 — 주담대만, 신용대출은 0)
  breakdown: ExistingDebtBreakdown;
  /** 신용대출에서 1억원 경계에 걸려 한도가 제한된 경우 */
  cappedAtCreditGate: boolean;
  notes: string[];
  warnings: string[];
}

/** 신용대출 추정 — 표시 금액 기준으로 구간을 다시 판정할 때도 같은 문구를 쓰도록 공개한다(문구 변경 없음). */
export const CREDIT_ESTIMATE_NO_STRESS_NOTE =
  "신용대출 총잔액(기존 + 신규)이 1억원 이하라 스트레스 금리가 적용되지 않는 구간입니다.";
export const CREDIT_ESTIMATE_GATE_CAP_NOTE =
  "신용대출 총잔액이 1억원을 넘는 순간 스트레스 금리가 붙어 한도가 오히려 줄어듭니다. " +
  "1억원 경계 직전 금액을 추정치로 표시했습니다.";

/** 원금 1원당 연간 원리금 — 신용대출 원금/5년 + 잔액 전체의 연 이자 기준(원금에 선형) */
function creditUnitAnnualDebt(ratePercent: number): number {
  return calcCreditAnnualDebtService(1, ratePercent);
}

export function estimatePrincipalFromDsr(
  input: DsrEstimateInput,
): DsrOutcome<DsrEstimateResult> {
  const existing = resolveExistingDebt(input.existing);
  if (existing.status === "unsupported") return existing;
  const b = existing.value;

  const allowedAnnualDebt = (input.annualIncome * input.limitPercent) / 100;
  const availableForNew = Math.max(0, allowedAnnualDebt - b.annualDebt);

  const base = {
    existingAnnualDebt: b.annualDebt,
    allowedAnnualDebt,
    availableForNew,
    breakdown: b,
    warnings: [...b.warnings, ...buildInstallmentGateHints(input.newLoan, b)],
  };

  // ── 주택담보대출 ──
  if (input.newLoan.kind === "mortgage") {
    const loan = input.newLoan;
    const stress = getEffectiveStressRate({
      region: loan.region,
      rateType: loan.rateType,
      months: loan.months,
      fixedMonths: loan.fixedMonths,
      asOf: input.asOf,
    });
    if (stress.status === "unsupported") return stress;

    const stressedRatePercent = loan.ratePercent + stress.value;
    const estimatedPrincipal = principalFromPayment(
      availableForNew / 12,
      monthlyRate(stressedRatePercent),
      loan.months,
    );

    return {
      status: "ok",
      value: {
        ...base,
        effectiveStressRate: stress.value,
        stressedRatePercent,
        estimatedPrincipal,
        monthlyPaymentActual: equalPaymentMonthly(
          estimatedPrincipal,
          monthlyRate(loan.ratePercent),
          loan.months,
        ),
        cappedAtCreditGate: false,
        notes: mortgageProductNotes(loan, stress.value),
      },
    };
  }

  // ── 신용대출 — 1억원 경계 전후 분기 ──
  const loan = input.newLoan;

  if (loan.repaymentKind === "installment") {
    return {
      status: "unsupported",
      reason:
        "분할상환 신용대출의 실제만기 인정 요건은 확인했지만, 이 계산기는 상품별 요건 충족 여부를 자동으로 판정하지 않아 추정 가능액을 역산하지 않습니다. " +
        "금융회사에 한도를 확인하거나 DSR 확인 모드에서 금융회사가 안내한 연간 원리금을 직접 입력해 주세요.",
    };
  }

  const room = Math.max(0, CREDIT_STRESS_GATE_WON - b.existingCreditTotal);

  // 구간 1: 스트레스 미적용 (총잔액 ≤ 1억원)
  const pNoStress = availableForNew / creditUnitAnnualDebt(loan.ratePercent);

  // 구간 2: 스트레스 적용 (총잔액 > 1억원)
  const stress = getCreditEffectiveStressRate({
    fixedTerm: loan.fixedTerm,
    creditTotalWon: CREDIT_STRESS_GATE_WON + 1, // 게이팅 통과 가정
    asOf: input.asOf,
  });
  if (stress.status === "unsupported") return stress;

  const stressPct = stress.value;
  const pStressed =
    availableForNew / creditUnitAnnualDebt(loan.ratePercent + stressPct);

  const notes: string[] = [];
  let estimatedPrincipal: number;
  let effectiveStressRate: number;
  let cappedAtCreditGate = false;

  if (pNoStress <= room) {
    // 구간 1에서 해결 — 스트레스가 붙지 않는다
    estimatedPrincipal = pNoStress;
    effectiveStressRate = 0;
    notes.push(CREDIT_ESTIMATE_NO_STRESS_NOTE);
  } else if (b.existingCreditTotal + pStressed > CREDIT_STRESS_GATE_WON) {
    // 구간 2에서 해결
    estimatedPrincipal = pStressed;
    effectiveStressRate = stressPct;
  } else {
    // 경계: 1억원을 넘는 순간 스트레스가 붙어 오히려 한도가 줄어든다
    estimatedPrincipal = room;
    effectiveStressRate = 0;
    cappedAtCreditGate = true;
    notes.push(CREDIT_ESTIMATE_GATE_CAP_NOTE);
  }

  if (loan.repaymentKind === "creditLine") {
    notes.push(
      "마이너스통장은 약정한도 전액이 대출금액으로 잡히므로, 위 금액은 '사용액'이 아니라 '설정 가능한 한도'입니다.",
    );
  }

  return {
    status: "ok",
    value: {
      ...base,
      effectiveStressRate,
      stressedRatePercent: loan.ratePercent + effectiveStressRate,
      estimatedPrincipal: Math.max(0, estimatedPrincipal),
      monthlyPaymentActual: 0,
      cappedAtCreditGate,
      notes,
    },
  };
}
