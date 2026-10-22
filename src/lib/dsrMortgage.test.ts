import { describe, it, expect, vi, afterEach } from "vitest";
import { calcDsr, estimatePrincipalFromDsr, getEffectiveStressRate,
  type NewMortgageInput, type ExistingDebtInput } from "@/lib/dsr";
import { getMortgageProductStressRatePct } from "@/lib/policy/dsr";

const AS_OF = "2026-10-21";
const existing: ExistingDebtInput = {
  otherAnnualDebt: 0, creditBalance: 0, creditLineLimit: 0,
  creditInstallmentBalance: 0, creditRatePercent: 0, jeonse: { status: "none" },
};
const mortgage: NewMortgageInput = {
  kind: "mortgage", principal: 300_000_000, ratePercent: 4.5, months: 360,
  repayment: "equal_payment", region: "metro", rateType: "hybrid", fixedMonths: 60,
};
const input = { annualIncome: 50_000_000, existing, limitPercent: 40, asOf: AS_OF };

// 2026-07-01 금융위 표의 경계와 2026-06-30 은행연합회 적용금리로 적은 기대값.
// 구현 테이블이나 대출 산식 함수를 가져와 기대값을 만들지 않는다.
const periods = [1, 59, 60, 107, 108, 109, 179, 180, 181, 251, 252, 253, 360];
const rows = [
  { region: "metro", rateType: "hybrid", expected: [3,3,2.4,2.4,1.8,1.8,1.8,1.2,1.2,1.2,0,0,0] },
  { region: "metro", rateType: "periodic", expected: [3,3,1.2,1.2,0.9,0.9,0.9,0.6,0.6,0.6,0,0,0] },
  { region: "local", rateType: "hybrid", expected: [0.75,0.75,0.45,0.45,0.3,0.3,0.3,0.15,0.15,0.15,0,0,0] },
  { region: "local", rateType: "periodic", expected: [0.75,0.75,0.23,0.23,0.15,0.15,0.15,0.08,0.08,0.08,0,0,0] },
] as const;
const cases = rows.flatMap(({ region, rateType, expected }) => periods.map((fixedMonths, i) => ({
  region, rateType, fixedMonths, expected: expected[i],
})));

describe("2026-H2 혼합·주기형 공시표와 경계", () => {
  it.each(cases)("$region/$rateType/$fixedMonths개월 → $expected%p (정방향·역산)", (c) => {
    const loan = { ...mortgage, ...c };
    expect(getMortgageProductStressRatePct({ ...loan, asOf: AS_OF })).toBe(c.expected);
    const check = calcDsr({ ...input, newLoan: loan });
    const estimate = estimatePrincipalFromDsr({ ...input, newLoan: loan });
    expect(check.status).toBe("ok"); expect(estimate.status).toBe("ok");
    if (check.status !== "ok" || estimate.status !== "ok") throw new Error("계산 차단");
    expect(check.value.effectiveStressRate).toBe(c.expected);
    expect(estimate.value.effectiveStressRate).toBe(c.expected);
    // 연금현가 공식으로 별도 계산. 정책 표뿐 아니라 금액에의 반영도 검증한다.
    const r = (4.5 + c.expected) / 1200;
    const factor = r / (1 - (1 + r) ** -360);
    expect(check.value.newAnnualDebtStressed).toBeCloseTo(300_000_000 * factor * 12, 4);
    expect(estimate.value.estimatedPrincipal).toBeCloseTo(20_000_000 / 12 / factor, 3);
    expect(check.value.notes.join(" ")).toContain(`${c.fixedMonths}개월`);
    expect(estimate.value.notes).toEqual(check.value.notes);
  });
  it.each(rows)("$region/$rateType: 70% 이상이어도 5년 미만이면 변동형", ({ region, rateType }) => {
    expect(getEffectiveStressRate({ region, rateType, months: 60, fixedMonths: 59, asOf: AS_OF }))
      .toEqual({ status: "ok", value: region === "metro" ? 3 : 0.75 });
    expect(getEffectiveStressRate({ region, rateType, months: 60, fixedMonths: 60, asOf: AS_OF }))
      .toEqual({ status: "ok", value: 0 });
  });
  it("만기 361개월에서도 비중을 반올림하지 않고 경계를 분류한다", () => {
    for (const [fixedMonths, expected] of [[108,2.4],[109,1.8],[180,1.8],[181,1.2],[252,1.2],[253,0]]) {
      expect(getEffectiveStressRate({ region: "metro", rateType: "hybrid", months: 361, fixedMonths, asOf: AS_OF }))
        .toEqual({ status: "ok", value: expected });
    }
  });
  it("지방 주기형은 0.225/0.075 대신 공시값 0.23/0.08로 금액을 계산한다", () => {
    for (const [fixedMonths, expected] of [[60,0.23],[180,0.08]]) {
      const result = calcDsr({ ...input, newLoan: { ...mortgage, region: "local", rateType: "periodic", fixedMonths } });
      if (result.status !== "ok") throw new Error(result.reason);
      expect(result.value.stressedRatePercent).toBe(4.5 + expected);
    }
  });
  it("원금균등 확인 모드도 같은 표를 사용한다", () => {
    const result = calcDsr({ ...input, newLoan: { ...mortgage, repayment: "equal_principal" } });
    if (result.status !== "ok") throw new Error(result.reason);
    const expected = 300_000_000 / 360 * 12 + (6.9 / 1200) * (12 * 300_000_000 - 66 * 300_000_000 / 360);
    expect(result.value.newAnnualDebtStressed).toBeCloseTo(expected, 5);
  });
});

describe("혼합·주기형 누락·잘못된 기간을 추정하지 않는다", () => {
  it.each([undefined, 0, -1, 1.5, NaN, Infinity, 361, Number.MAX_SAFE_INTEGER + 1])("고정기간/주기 %s 차단", (fixedMonths) => {
    for (const rateType of ["hybrid", "periodic"] as const) {
      const newLoan = { ...mortgage, rateType, fixedMonths };
      expect(calcDsr({ ...input, newLoan }).status).toBe("unsupported");
      expect(estimatePrincipalFromDsr({ ...input, newLoan }).status).toBe("unsupported");
    }
  });
  it.each([0, -1, 360.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("대출만기 %s 차단", (months) => {
    expect(calcDsr({ ...input, newLoan: { ...mortgage, months } }).status).toBe("unsupported");
    expect(estimatePrincipalFromDsr({ ...input, newLoan: { ...mortgage, months } }).status).toBe("unsupported");
  });
  it("숨겨진 기간 오류가 변동·순수고정형을 막지 않는다", () => {
    for (const [rateType, expected] of [["variable",3],["fixed",0]] as const) {
      expect(getEffectiveStressRate({ region: "metro", rateType, months: 360, fixedMonths: NaN, asOf: AS_OF }))
        .toEqual({ status: "ok", value: expected });
    }
  });
});

describe("정책 적용기간 — 비중 70% 미적용 상품도 만료 차단", () => {
  it.each(["2026-06-30", "2026-07-01", "2026-12-31", "2027-01-01", "2026-02-30"])("%s 양쪽 모드·지역·유형·비중", (asOf) => {
    for (const { region, rateType } of rows) for (const fixedMonths of [60,252]) {
      const newLoan = { ...mortgage, region, rateType, fixedMonths };
      const expected = asOf === "2026-07-01" || asOf === "2026-12-31" ? "ok" : "unsupported";
      expect(calcDsr({ ...input, asOf, newLoan }).status).toBe(expected);
      expect(estimatePrincipalFromDsr({ ...input, asOf, newLoan }).status).toBe(expected);
    }
  });
  afterEach(() => vi.useRealTimers());
  it("한국시간 2027-01-01 자정부터 기준일 생략 호출도 차단", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-12-31T14:59:59Z"));
    expect(getEffectiveStressRate(mortgage).status).toBe("ok");
    vi.setSystemTime(new Date("2026-12-31T15:00:00Z"));
    expect(getEffectiveStressRate(mortgage).status).toBe("unsupported");
  });
});
