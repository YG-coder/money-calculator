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

/** 숫자가 아니거나 유한하지 않으면 0 으로 본다. 음수 입력은 0 으로 막는다. */
function safeAmount(v: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v;
}

export function sumExpenses(expensesWon: ExpenseAmounts): number {
  return EXPENSE_KEYS.reduce((acc, key) => acc + safeAmount(expensesWon[key]), 0);
}

export function calcMonthlySurplus(
  input: MonthlySurplusInput,
): MonthlySurplusResult {
  const incomeWon = safeAmount(input.incomeWon);
  const totalExpenseWon = sumExpenses(input.expensesWon);
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
