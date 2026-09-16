import { describe, it, expect } from "vitest";
import {
  calcMovingCost,
  sumMovingCosts,
  MOVING_COST_KEYS,
  type MovingCosts,
} from "@/lib/funds";

const 만 = (v: number) => v * 10_000;

function costs(partial: Partial<MovingCosts> = {}): MovingCosts {
  const base = Object.fromEntries(
    MOVING_COST_KEYS.map((k) => [k, 0]),
  ) as MovingCosts;
  return { ...base, ...partial };
}

describe("sumMovingCosts", () => {
  it("4개 항목을 더한다", () => {
    expect(
      sumMovingCosts(
        costs({ movingFee: 만(120), brokerage: 만(80), appliance: 만(200), etc: 만(50) }),
      ),
    ).toBe(만(450));
  });

  it("전부 0 이면 0", () => {
    expect(sumMovingCosts(costs())).toBe(0);
  });

  it("잘못된 값이 있으면 null (0 으로 바꾸지 않는다)", () => {
    expect(sumMovingCosts(costs({ movingFee: Number.NaN }))).toBeNull();
    expect(sumMovingCosts(costs({ etc: 만(-10) }))).toBeNull();
  });

  it("키가 없는 항목은 미입력으로 보고 0", () => {
    const partial = { movingFee: 만(100) } as unknown as MovingCosts;
    expect(sumMovingCosts(partial)).toBe(만(100));
  });
});

describe("calcMovingCost — 추가 필요자금이 양수", () => {
  const r = calcMovingCost({
    newDepositWon: 만(20000),
    returnedDepositWon: 만(15000),
    costsWon: costs({ movingFee: 만(120), brokerage: 만(80), appliance: 만(200), etc: 만(50) }),
  })!;

  it("보증금 차액", () => expect(r.depositDiffWon).toBe(만(5000)));
  it("부대비용 합계", () => expect(r.extraCostWon).toBe(만(450)));
  it("추가 필요자금 = 차액 + 부대비용", () =>
    expect(r.totalNeededWon).toBe(만(5450)));
  it("남는 금액이 아니다", () => expect(r.isSurplus).toBe(false));
});

describe("calcMovingCost — 부호 구분", () => {
  it("보증금 차액은 음수지만 전체 합계는 양수일 수 있다", () => {
    const r = calcMovingCost({
      newDepositWon: 만(10000),
      returnedDepositWon: 만(10300),
      costsWon: costs({ movingFee: 만(120), brokerage: 만(80), appliance: 만(200) }),
    })!;
    expect(r.depositDiffWon).toBe(만(-300));
    expect(r.extraCostWon).toBe(만(400));
    expect(r.totalNeededWon).toBe(만(100));
    expect(r.isSurplus).toBe(false);
  });

  it("부대비용까지 덮으면 전체 합계가 음수 — 값을 유지한다", () => {
    const r = calcMovingCost({
      newDepositWon: 만(10000),
      returnedDepositWon: 만(15000),
      costsWon: costs({ movingFee: 만(120), brokerage: 만(80) }),
    })!;
    expect(r.depositDiffWon).toBe(만(-5000));
    expect(r.totalNeededWon).toBe(만(-4800));
    expect(r.isSurplus).toBe(true);
  });

  it("전체 합계가 정확히 0 이면 남는 금액이 아니다", () => {
    const r = calcMovingCost({
      newDepositWon: 만(10000),
      returnedDepositWon: 만(10200),
      costsWon: costs({ movingFee: 만(200) }),
    })!;
    expect(r.totalNeededWon).toBe(0);
    expect(r.isSurplus).toBe(false);
  });

  it("보증금이 같으면 부대비용이 그대로 추가 필요자금", () => {
    const r = calcMovingCost({
      newDepositWon: 만(10000),
      returnedDepositWon: 만(10000),
      costsWon: costs({ movingFee: 만(150) }),
    })!;
    expect(r.depositDiffWon).toBe(0);
    expect(r.totalNeededWon).toBe(만(150));
  });
});

describe("calcMovingCost — 경계와 잘못된 입력", () => {
  it("회수 예상액 0 원이면 새 보증금 전액이 차액", () => {
    const r = calcMovingCost({
      newDepositWon: 만(5000),
      returnedDepositWon: 0,
      costsWon: costs(),
    })!;
    expect(r.depositDiffWon).toBe(만(5000));
    expect(r.totalNeededWon).toBe(만(5000));
  });

  it("부대비용이 전부 0 이어도 계산한다", () => {
    const r = calcMovingCost({
      newDepositWon: 만(5000),
      returnedDepositWon: 만(3000),
      costsWon: costs(),
    })!;
    expect(r.extraCostWon).toBe(0);
    expect(r.totalNeededWon).toBe(만(2000));
  });

  it("새 보증금 0 원도 유효한 입력이다", () => {
    const r = calcMovingCost({
      newDepositWon: 0,
      returnedDepositWon: 0,
      costsWon: costs({ movingFee: 만(100) }),
    })!;
    expect(r.totalNeededWon).toBe(만(100));
  });

  it("잘못된 값은 0 으로 바꾸지 않고 null", () => {
    expect(
      calcMovingCost({
        newDepositWon: Number.NaN,
        returnedDepositWon: 0,
        costsWon: costs(),
      }),
    ).toBeNull();
    expect(
      calcMovingCost({
        newDepositWon: 만(5000),
        returnedDepositWon: 만(-1),
        costsWon: costs(),
      }),
    ).toBeNull();
    expect(
      calcMovingCost({
        newDepositWon: 만(5000),
        returnedDepositWon: 0,
        costsWon: costs({ appliance: Number.POSITIVE_INFINITY }),
      }),
    ).toBeNull();
  });

  it("잘못된 부대비용 하나가 있으면 나머지로 계산하지 않는다", () => {
    expect(
      calcMovingCost({
        newDepositWon: 만(5000),
        returnedDepositWon: 0,
        costsWon: costs({ movingFee: 만(100), etc: Number.NaN }),
      }),
    ).toBeNull();
  });
});
