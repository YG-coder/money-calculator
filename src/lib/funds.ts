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
