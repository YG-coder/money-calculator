import { describe, it, expect } from "vitest";
import {
  calcMonthlySurplus,
  sumExpenses,
  EXPENSE_KEYS,
  MONTHS_PER_YEAR,
  type ExpenseAmounts,
} from "@/lib/funds";

/** 만원 단위를 원으로 */
const 만 = (v: number) => v * 10_000;

/** 정상 입력 케이스용 — null 이면 테스트를 실패시킨다 */
function calc(input: Parameters<typeof calcMonthlySurplus>[0]) {
  const r = calcMonthlySurplus(input);
  if (r === null) throw new Error("정상 입력인데 null 이 반환되었습니다");
  return r;
}

function expenses(partial: Partial<ExpenseAmounts> = {}): ExpenseAmounts {
  const base = Object.fromEntries(
    EXPENSE_KEYS.map((k) => [k, 0]),
  ) as ExpenseAmounts;
  return { ...base, ...partial };
}

describe("sumExpenses", () => {
  it("7개 항목을 모두 더한다", () => {
    const sum = sumExpenses(
      expenses({
        housing: 만(80),
        food: 만(50),
        transport: 만(15),
        telecom: 만(7),
        insurance: 만(20),
        loanRepayment: 만(60),
        other: 만(18),
      }),
    );
    expect(sum).toBe(만(250));
  });

  it("전부 0 이면 0", () => {
    expect(sumExpenses(expenses())).toBe(0);
  });
});

describe("calcMonthlySurplus — 정상 흑자", () => {
  const r = calc({
    incomeWon: 만(400),
    expensesWon: expenses({
      housing: 만(80),
      food: 만(50),
      transport: 만(15),
      telecom: 만(7),
      insurance: 만(20),
      loanRepayment: 만(60),
      other: 만(18),
    }),
  });

  it("총지출을 합산한다", () => {
    expect(r.totalExpenseWon).toBe(만(250));
  });

  it("월 잉여자금 = 소득 − 총지출", () => {
    expect(r.surplusWon).toBe(만(150));
  });

  it("연간 환산 = 월 잉여자금 × 12", () => {
    expect(r.annualSurplusWon).toBe(만(150) * MONTHS_PER_YEAR);
    expect(r.annualSurplusWon).toBe(만(1800));
  });

  it("소득 대비 지출 비율", () => {
    expect(r.expenseRatioPct).toBeCloseTo(62.5, 10);
  });

  it("적자가 아니다", () => {
    expect(r.isDeficit).toBe(false);
  });
});

describe("calcMonthlySurplus — 적자", () => {
  const r = calc({
    incomeWon: 만(200),
    expensesWon: expenses({ housing: 만(150), food: 만(80) }),
  });

  it("음수 금액을 그대로 반환한다 (0 으로 자르지 않는다)", () => {
    expect(r.surplusWon).toBe(만(-30));
  });

  it("연간 환산도 음수", () => {
    expect(r.annualSurplusWon).toBe(만(-360));
  });

  it("isDeficit 가 true", () => {
    expect(r.isDeficit).toBe(true);
  });

  it("지출 비율이 100% 를 넘는다", () => {
    expect(r.expenseRatioPct).toBeCloseTo(115, 10);
  });
});

describe("calcMonthlySurplus — 경계", () => {
  it("잉여자금 정확히 0 은 적자가 아니다", () => {
    const r = calc({
      incomeWon: 만(300),
      expensesWon: expenses({ housing: 만(300) }),
    });
    expect(r.surplusWon).toBe(0);
    expect(r.annualSurplusWon).toBe(0);
    expect(r.isDeficit).toBe(false);
  });

  it("지출이 전부 0 이면 잉여자금 = 소득", () => {
    const r = calc({
      incomeWon: 만(300),
      expensesWon: expenses(),
    });
    expect(r.totalExpenseWon).toBe(0);
    expect(r.surplusWon).toBe(만(300));
    expect(r.expenseRatioPct).toBe(0);
  });

  it("소득 0 이면 지출 비율은 null (0 으로 나누지 않는다)", () => {
    const r = calc({
      incomeWon: 0,
      expensesWon: expenses({ housing: 만(50) }),
    });
    expect(r.expenseRatioPct).toBeNull();
    expect(r.surplusWon).toBe(만(-50));
    expect(r.isDeficit).toBe(true);
  });

  it("소득 0 · 지출 0 이면 전부 0 이고 비율은 null", () => {
    const r = calc({ incomeWon: 0, expensesWon: expenses() });
    expect(r.surplusWon).toBe(0);
    expect(r.isDeficit).toBe(false);
    expect(r.expenseRatioPct).toBeNull();
  });
});

describe("sumExpenses — 잘못된 값", () => {
  it("음수가 있으면 null", () => {
    expect(sumExpenses(expenses({ housing: 만(-100) }))).toBeNull();
  });

  it("NaN 이 있으면 null", () => {
    expect(sumExpenses(expenses({ food: Number.NaN }))).toBeNull();
  });

  it("키가 아예 없으면 0 으로 다룬다 (미입력 항목)", () => {
    const partial = { housing: 만(100) } as unknown as ExpenseAmounts;
    expect(sumExpenses(partial)).toBe(만(100));
  });
});

describe("calcMonthlySurplus — 잘못된 입력은 0 이 아니라 null", () => {
  it("소득이 NaN 이면 null (0 원으로 계산하지 않는다)", () => {
    expect(
      calcMonthlySurplus({ incomeWon: Number.NaN, expensesWon: expenses() }),
    ).toBeNull();
  });

  it("소득이 Infinity 면 null", () => {
    expect(
      calcMonthlySurplus({
        incomeWon: Number.POSITIVE_INFINITY,
        expensesWon: expenses(),
      }),
    ).toBeNull();
  });

  it("소득이 음수면 null", () => {
    expect(
      calcMonthlySurplus({ incomeWon: 만(-300), expensesWon: expenses() }),
    ).toBeNull();
  });

  it("지출에 음수가 있으면 null — 소득만으로 계산하지 않는다", () => {
    expect(
      calcMonthlySurplus({
        incomeWon: 만(300),
        expensesWon: expenses({ housing: 만(-100) }),
      }),
    ).toBeNull();
  });

  it("지출에 NaN 이 있으면 null", () => {
    expect(
      calcMonthlySurplus({
        incomeWon: 만(300),
        expensesWon: expenses({ food: Number.NaN }),
      }),
    ).toBeNull();
  });

  it("잘못된 값과 '실제 0원'은 구분된다", () => {
    const zero = calcMonthlySurplus({
      incomeWon: 만(300),
      expensesWon: expenses({ housing: 0 }),
    });
    const invalid = calcMonthlySurplus({
      incomeWon: 만(300),
      expensesWon: expenses({ housing: Number.NaN }),
    });
    expect(zero).not.toBeNull();
    expect(zero!.totalExpenseWon).toBe(0);
    expect(invalid).toBeNull();
  });

  it("누락된 항목 키는 유효한 미입력으로 본다", () => {
    const partial = { housing: 만(100) } as unknown as ExpenseAmounts;
    const r = calcMonthlySurplus({ incomeWon: 만(300), expensesWon: partial });
    expect(r).not.toBeNull();
    expect(r!.totalExpenseWon).toBe(만(100));
    expect(r!.surplusWon).toBe(만(200));
  });
});
