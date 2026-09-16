import { describe, it, expect } from "vitest";
import {
  calcEmergencyNeed,
  calcCoverageMonths,
  floorTo,
  COVERAGE_DECIMALS,
} from "@/lib/funds";

const 만 = (v: number) => v * 10_000;

describe("모드 A — 대비기간 기준", () => {
  it("전체 필요자금 = 월 필수지출 × 대비 개월", () => {
    const r = calcEmergencyNeed({
      monthlyEssentialWon: 만(180),
      months: 8,
      availableWon: null,
    })!;
    expect(r.requiredWon).toBe(만(1440));
  });

  it("보유자금 미입력이면 추가 필요액을 내지 않는다", () => {
    const r = calcEmergencyNeed({
      monthlyEssentialWon: 만(180),
      months: 8,
      availableWon: null,
    })!;
    expect(r.availableWon).toBeNull();
    expect(r.shortfallWon).toBeNull();
  });

  it("보유자금 0 원은 추가 필요액 = 전체 필요자금", () => {
    const r = calcEmergencyNeed({
      monthlyEssentialWon: 만(180),
      months: 8,
      availableWon: 0,
    })!;
    expect(r.shortfallWon).toBe(만(1440));
  });

  it("보유자금이 있으면 차액", () => {
    const r = calcEmergencyNeed({
      monthlyEssentialWon: 만(180),
      months: 8,
      availableWon: 만(500),
    })!;
    expect(r.shortfallWon).toBe(만(940));
  });

  it("보유자금이 필요자금을 넘으면 0 (음수로 표시하지 않는다)", () => {
    const r = calcEmergencyNeed({
      monthlyEssentialWon: 만(180),
      months: 8,
      availableWon: 만(2000),
    })!;
    expect(r.shortfallWon).toBe(0);
  });

  it("보유자금이 정확히 같으면 0", () => {
    const r = calcEmergencyNeed({
      monthlyEssentialWon: 만(180),
      months: 8,
      availableWon: 만(1440),
    })!;
    expect(r.shortfallWon).toBe(0);
  });

  it("대비 개월 0 이면 필요자금 0", () => {
    const r = calcEmergencyNeed({
      monthlyEssentialWon: 만(180),
      months: 0,
      availableWon: null,
    })!;
    expect(r.requiredWon).toBe(0);
  });

  it("월 필수지출 0 이면 필요자금 0", () => {
    const r = calcEmergencyNeed({
      monthlyEssentialWon: 0,
      months: 8,
      availableWon: 만(100),
    })!;
    expect(r.requiredWon).toBe(0);
    expect(r.shortfallWon).toBe(0);
  });

  it("잘못된 값은 0 으로 바꾸지 않고 null", () => {
    expect(
      calcEmergencyNeed({ monthlyEssentialWon: Number.NaN, months: 8, availableWon: null }),
    ).toBeNull();
    expect(
      calcEmergencyNeed({ monthlyEssentialWon: 만(180), months: -1, availableWon: null }),
    ).toBeNull();
    expect(
      calcEmergencyNeed({
        monthlyEssentialWon: 만(180),
        months: 8,
        availableWon: Number.POSITIVE_INFINITY,
      }),
    ).toBeNull();
  });
});

describe("모드 B — 소득공백 기준", () => {
  it("감당 가능한 기간 = 보유자금 ÷ 월 필수지출", () => {
    const r = calcCoverageMonths({ availableWon: 만(900), monthlyEssentialWon: 만(180) });
    expect(r).toEqual(
      expect.objectContaining({ status: "ok", exactMonths: 5, displayMonths: 5 }),
    );
  });

  it("보유자금 미입력이면 결과를 내지 않는다 (0 원과 구분)", () => {
    expect(
      calcCoverageMonths({ availableWon: null, monthlyEssentialWon: 만(180) }),
    ).toBeNull();
  });

  it("보유자금 0 원은 0 개월로 표시한다", () => {
    const r = calcCoverageMonths({ availableWon: 0, monthlyEssentialWon: 만(180) });
    expect(r).toEqual(
      expect.objectContaining({ status: "ok", exactMonths: 0, displayMonths: 0 }),
    );
  });

  it("월 필수지출 0 이면 나누지 않고 사유를 돌려준다", () => {
    expect(
      calcCoverageMonths({ availableWon: 만(900), monthlyEssentialWon: 0 }),
    ).toEqual({ status: "cannotDivide" });
  });

  it("월 필수지출 0 · 보유자금 0 도 나누지 않는다", () => {
    expect(calcCoverageMonths({ availableWon: 0, monthlyEssentialWon: 0 })).toEqual({
      status: "cannotDivide",
    });
  });

  it("기간은 소수 1 자리로 내린다 (과대 표시 방지)", () => {
    const r = calcCoverageMonths({ availableWon: 만(1000), monthlyEssentialWon: 만(180) });
    if (r?.status !== "ok") throw new Error("ok 가 아님");
    expect(r.exactMonths).toBeCloseTo(5.5555, 3);
    expect(r.displayMonths).toBe(5.5);
  });

  it("년·개월 보조 표기도 내림", () => {
    const r = calcCoverageMonths({ availableWon: 만(2500), monthlyEssentialWon: 만(180) });
    if (r?.status !== "ok") throw new Error("ok 가 아님");
    expect(r.exactMonths).toBeCloseTo(13.888, 2);
    expect(r.years).toBe(1);
    expect(r.remainMonths).toBe(1);
  });

  it("잘못된 값은 null", () => {
    expect(
      calcCoverageMonths({ availableWon: Number.NaN, monthlyEssentialWon: 만(180) }),
    ).toBeNull();
    expect(
      calcCoverageMonths({ availableWon: 만(900), monthlyEssentialWon: -1 }),
    ).toBeNull();
  });
});

describe("floorTo", () => {
  it("설정한 자릿수로 내린다", () => {
    expect(floorTo(5.5555, 1)).toBe(5.5);
    expect(floorTo(5.99, 1)).toBe(5.9);
    expect(floorTo(0, 1)).toBe(0);
    expect(COVERAGE_DECIMALS).toBe(1);
  });
});

describe("두 모드의 역함수 관계", () => {
  it("모드 A 의 필요자금을 모드 B 에 넣으면 같은 개월이 나온다", () => {
    const need = calcEmergencyNeed({
      monthlyEssentialWon: 만(180),
      months: 8,
      availableWon: null,
    })!;
    const cov = calcCoverageMonths({
      availableWon: need.requiredWon,
      monthlyEssentialWon: 만(180),
    });
    if (cov?.status !== "ok") throw new Error("ok 가 아님");
    expect(cov.exactMonths).toBe(8);
  });
});
