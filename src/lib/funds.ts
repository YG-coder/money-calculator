// src/lib/funds.ts
// ─────────────────────────────────────────────
// 자금계획 허브 계산 엔진 — 순수 함수만. React·Next 의존 없음.
//
// ⚠️ 이 파일의 계산은 전부 사칙연산이며 정책값·요율을 사용하지 않는다.
//    따라서 policy/ 모듈도, verifiedAt 도 없다.
//
// ⚠️ 입력 소득이 "무엇까지 공제된 금액인가"는 엔진이 판정하지 않는다.
//    사용자가 실제로 받는 금액을 넣고, 그 금액에서 이미 빠진 항목은
//    지출에 다시 넣지 않는다. 이 원칙은 UI 안내로 전달한다.
// ─────────────────────────────────────────────

/** 연간 환산에 쓰는 개월 수. 같은 소득·지출이 유지된다는 가정이다. */
export const MONTHS_PER_YEAR = 12;

export const EXPENSE_KEYS = [
  "housing",
  "food",
  "transport",
  "telecom",
  "insurance",
  "loanRepayment",
  "other",
] as const;

export type ExpenseKey = (typeof EXPENSE_KEYS)[number];

export type ExpenseAmounts = Record<ExpenseKey, number>;

export interface MonthlySurplusInput {
  /** 월 소득(원) — 사용자가 실제로 받는 금액 */
  incomeWon: number;
  /** 항목별 월 지출(원) */
  expensesWon: ExpenseAmounts;
}

export interface MonthlySurplusResult {
  incomeWon: number;
  totalExpenseWon: number;
  /** 월 잉여자금. 지출이 소득을 넘으면 음수 그대로 반환한다 */
  surplusWon: number;
  /** 월 잉여자금 × 12. 같은 금액이 12개월 유지된다는 가정 */
  annualSurplusWon: number;
  /** 소득 대비 지출 비율(%). 소득이 0 이면 계산할 수 없어 null */
  expenseRatioPct: number | null;
  isDeficit: boolean;
}

/**
 * 금액으로 쓸 수 있는 값인지 판정한다.
 *
 * ⚠️ 잘못된 값을 0 으로 바꾸지 않는다. 0 으로 바꾸면 사용자 화면에서는
 *    "0원을 입력한 것"과 구분되지 않아 조용한 오답이 된다.
 *    미입력을 0 으로 다루는 것은 호출부(컴포넌트)의 설계 결정이고,
 *    엔진은 넘어온 숫자가 금액으로 성립하는지만 본다.
 */
function isValidAmount(v: number): boolean {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

/** 7개 항목의 합. 하나라도 금액으로 성립하지 않으면 null. */
export function sumExpenses(expensesWon: ExpenseAmounts): number | null {
  let total = 0;

  for (const key of EXPENSE_KEYS) {
    const amount = expensesWon[key];
    // 키가 아예 없는 경우(undefined)는 "항목을 쓰지 않음"으로 보고 0 으로 다룬다.
    if (amount === undefined) continue;
    if (!isValidAmount(amount)) return null;
    total += amount;
  }

  return total;
}

/**
 * 월 잉여자금을 계산한다.
 *
 * 금액으로 성립하지 않는 값(음수·NaN·Infinity·숫자 아님)이 하나라도 있으면
 * **null 을 반환한다.** 호출부는 결과를 표시하지 말고 입력을 다시 받아야 한다.
 */
export function calcMonthlySurplus(
  input: MonthlySurplusInput,
): MonthlySurplusResult | null {
  const incomeWon = input.incomeWon;
  if (!isValidAmount(incomeWon)) return null;

  const totalExpenseWon = sumExpenses(input.expensesWon);
  if (totalExpenseWon === null) return null;

  const surplusWon = incomeWon - totalExpenseWon;

  return {
    incomeWon,
    totalExpenseWon,
    surplusWon,
    annualSurplusWon: surplusWon * MONTHS_PER_YEAR,
    expenseRatioPct:
      incomeWon > 0 ? (totalExpenseWon / incomeWon) * 100 : null,
    isDeficit: surplusWon < 0,
  };
}

// ─────────────────────────────────────────────
// 5. 비상자금 (소득이 없는 기간의 필수지출 대비)
// ─────────────────────────────────────────────
// ⚠️ 이 엔진이 다루는 것은 비상자금의 여러 용도 중 **소득 상실 대비** 하나다.
//    차량·주택 수리, 갑작스러운 의료비처럼 사건별로 금액이 정해지는 지출은
//    기간 × 월 지출로 산정되지 않으므로 계산 대상이 아니다.
//
// ⚠️ 권장 개월 수·적정 금액을 두지 않는다. 대비 개월은 전적으로 사용자 입력이다.
// ⚠️ 이자·물가·실업급여·정부지원금을 반영하지 않는다. 사칙연산만 쓴다.

/** 기간 표시 소수 자릿수. 버틸 수 있는 기간은 과대 표시가 위험하므로 내림한다. */
export const COVERAGE_DECIMALS = 1;

// ── 모드 A: 대비기간 기준 ──

export interface EmergencyNeedInput {
  /** 월 필수지출(원) */
  monthlyEssentialWon: number;
  /** 대비 개월 (사용자가 정한다. 기본값 없음) */
  months: number;
  /** 현재 보유자금(원). 미입력이면 null — 0 원과 구분한다 */
  availableWon: number | null;
}

export interface EmergencyNeedResult {
  monthlyEssentialWon: number;
  months: number;
  /** 전체 필요자금 = 월 필수지출 × 대비 개월 */
  requiredWon: number;
  /** 보유자금을 입력한 경우에만 값이 있다 */
  availableWon: number | null;
  /** 추가로 필요한 금액. 보유자금이 더 크면 0 으로 막는다(음수 표시 안 함) */
  shortfallWon: number | null;
}

/** 금액·기간으로 쓸 수 있는 값인지. 잘못된 값은 0 으로 바꾸지 않고 null 로 되돌린다. */
function isValidNonNegative(v: number): boolean {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

export function calcEmergencyNeed(
  input: EmergencyNeedInput,
): EmergencyNeedResult | null {
  const { monthlyEssentialWon, months, availableWon } = input;

  if (!isValidNonNegative(monthlyEssentialWon)) return null;
  if (!isValidNonNegative(months)) return null;
  if (availableWon !== null && !isValidNonNegative(availableWon)) return null;

  const requiredWon = monthlyEssentialWon * months;

  return {
    monthlyEssentialWon,
    months,
    requiredWon,
    availableWon,
    shortfallWon:
      availableWon === null ? null : Math.max(0, requiredWon - availableWon),
  };
}

// ── 모드 B: 소득공백 기준 ──

export interface CoverageInput {
  /** 현재 보유자금(원). 미입력이면 null */
  availableWon: number | null;
  /** 월 필수지출(원) */
  monthlyEssentialWon: number;
}

export type CoverageOutcome =
  /** 월 필수지출이 0 이라 나눌 수 없다. 기간을 산정하지 않고 이유를 알린다 */
  | { status: "cannotDivide" }
  | {
      status: "ok";
      /** 나눗셈 결과 그대로 */
      exactMonths: number;
      /** 화면 표시용 — 소수 1 자리 내림 */
      displayMonths: number;
      /** 보조 표기: 내림한 년 */
      years: number;
      /** 보조 표기: 년을 뺀 나머지 개월(내림) */
      remainMonths: number;
    };

/** 소수 자릿수만큼 내림. (과대 표시 방지) */
export function floorTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.floor(value * factor) / factor;
}

export function calcCoverageMonths(
  input: CoverageInput,
): CoverageOutcome | null {
  const { availableWon, monthlyEssentialWon } = input;

  // 보유자금 미입력은 결과를 내지 않는다. (0 원 입력과 구분)
  if (availableWon === null) return null;
  if (!isValidNonNegative(availableWon)) return null;
  if (!isValidNonNegative(monthlyEssentialWon)) return null;

  if (monthlyEssentialWon === 0) return { status: "cannotDivide" };

  const exactMonths = availableWon / monthlyEssentialWon;
  const displayMonths = floorTo(exactMonths, COVERAGE_DECIMALS);

  return {
    status: "ok",
    exactMonths,
    displayMonths,
    years: Math.floor(exactMonths / MONTHS_PER_YEAR),
    remainMonths: Math.floor(exactMonths % MONTHS_PER_YEAR),
  };
}

// ─────────────────────────────────────────────
// 6. 이사자금 (이사를 실행하는 데 필요한 추가 현금)
// ─────────────────────────────────────────────
// ⚠️ 이 엔진은 **금액만** 다룬다. 보증금이 실제로 반환되는지, 언제 반환되는지,
//    감액 가능성이 있는지는 판단하지 않는다. 회수 예상액은 사용자가 넣은 값이다.
//
// ⚠️ 보증금 회수 전에 새 보증금을 먼저 내야 하는 시차 때문에 필요한
//    일시적 현금은 이 계산으로 산정하지 않는다. 시점을 다루지 않기 때문이다.
//
// ⚠️ 임대차 중개보수는 사용자 직접 입력이다. 매매 요율표를 재사용하지 않는다.
//    (policy/brokerage.ts 는 주택 매매·교환 상한요율만 지원한다)

export const MOVING_COST_KEYS = [
  "movingFee",
  "brokerage",
  "appliance",
  "etc",
] as const;

export type MovingCostKey = (typeof MOVING_COST_KEYS)[number];

export type MovingCosts = Record<MovingCostKey, number>;

export interface MovingCostInput {
  /** 새 보증금(원) — 필수 */
  newDepositWon: number;
  /** 기존 보증금 회수 예상액(원). 사용자가 넣은 예상값이다 */
  returnedDepositWon: number;
  /** 이사 부대비용 항목별 금액(원) */
  costsWon: MovingCosts;
}

export interface MovingCostResult {
  newDepositWon: number;
  returnedDepositWon: number;
  /** 보증금 차액 = 새 보증금 − 회수 예상액. 음수일 수 있다 */
  depositDiffWon: number;
  /** 이사 부대비용 합계 */
  extraCostWon: number;
  /** 보증금 차액 + 부대비용. 음수면 계산상 남는 금액이다 */
  totalNeededWon: number;
  /** totalNeededWon < 0 */
  isSurplus: boolean;
}

/** 부대비용 합계. 하나라도 금액으로 성립하지 않으면 null. */
export function sumMovingCosts(costsWon: MovingCosts): number | null {
  let total = 0;

  for (const key of MOVING_COST_KEYS) {
    const amount = costsWon[key];
    // 키가 없는 경우(미입력)는 0 으로 다룬다. 잘못된 값과는 구분한다.
    if (amount === undefined) continue;
    if (!isValidNonNegative(amount)) return null;
    total += amount;
  }

  return total;
}

export function calcMovingCost(
  input: MovingCostInput,
): MovingCostResult | null {
  const { newDepositWon, returnedDepositWon, costsWon } = input;

  if (!isValidNonNegative(newDepositWon)) return null;
  if (!isValidNonNegative(returnedDepositWon)) return null;

  const extraCostWon = sumMovingCosts(costsWon);
  if (extraCostWon === null) return null;

  const depositDiffWon = newDepositWon - returnedDepositWon;
  const totalNeededWon = depositDiffWon + extraCostWon;

  return {
    newDepositWon,
    returnedDepositWon,
    depositDiffWon,
    extraCostWon,
    totalNeededWon,
    isSurplus: totalNeededWon < 0,
  };
}
