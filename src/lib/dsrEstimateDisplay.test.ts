// DSR 추정 가능액 표시 도우미 — 엔진 단위 경계(원 단위 ±1원)와 표기 규칙.
// 기대 만원 금액은 Python 유리수 정확 계산으로 구한 '목표 DSR 이하가 되는 가장 큰 만원 정수'다.
// (이 파일은 새 도우미를 직접 부르므로 수정 전 실패는 함수 부재로 생긴다. 수정 전 실제 동작의 재현은 dsrEstimateReentry.test.ts가 맡는다.)
import { describe, expect, it } from "vitest";
import { calcDsr, estimatePrincipalFromDsr, CREDIT_ESTIMATE_GATE_CAP_NOTE, CREDIT_ESTIMATE_NO_STRESS_NOTE, type DsrEstimateInput } from "./dsr";
import { formatDsrManwon, resolveDsrEstimateDisplay, DSR_BELOW_UNIT_TEXT } from "./dsrEstimateDisplay";

const ASOF = "2026-10-25";
const none = { otherAnnualDebt: 0, creditBalance: 0, creditLineLimit: 0, creditInstallmentBalance: 0, creditRatePercent: 0, jeonse: { status: "none" as const } };
function credit(existingCreditWon: number, income: number, limit: 40 | 50, fixedTerm: "other" | "fixed3to5" = "other"): DsrEstimateInput {
  return { annualIncome: income, limitPercent: limit, asOf: ASOF, existing: { ...none, creditBalance: existingCreditWon, creditRatePercent: 5 },
    newLoan: { kind: "credit", amount: 0, ratePercent: 5, repaymentKind: "lumpSum", fixedTerm } };
}
function display(input: DsrEstimateInput) {
  const e = estimatePrincipalFromDsr(input);
  if (e.status !== "ok") throw new Error(e.reason);
  return { e: e.value, d: resolveDsrEstimateDisplay(input, e.value) };
}
const check = (input: DsrEstimateInput, won: number) => {
  const r = calcDsr({ ...input, newLoan: input.newLoan.kind === "credit" ? { ...input.newLoan, amount: won } : { ...input.newLoan, principal: won } });
  if (r.status !== "ok") throw new Error(r.reason);
  return r.value;
};

describe("표기", () => {
  it("억·만원, 쉼표, 1만원 이상만", () => {
    expect(formatDsrManwon(32456)).toBe("3억 2,456만원");
    expect(formatDsrManwon(10000)).toBe("1억원");
    expect(formatDsrManwon(10001)).toBe("1억 1만원");
    expect(formatDsrManwon(9999)).toBe("9,999만원");
    expect(formatDsrManwon(1)).toBe("1만원");
    expect(formatDsrManwon(123456789)).toBe("12,345억 6,789만원");
  });
});

describe("신용 총잔액 1억원 경계 — 엔진 ±1원", () => {
  // 연소득 6,400만원·40%, 기존 일시상환 신용대출 약 3,000만원(5%), 신규 5% 그 밖 금리:
  // 1억원 이하 구간 원금은 약 7,240만원, 1억원 초과(스트레스 1.5%p) 구간 원금은 약 6,830만원이라 한도가 1억원 경계에서 멈춘다.
  for (const [existing, manwon] of [[29_999_999, 7000], [30_000_000, 7000], [30_000_001, 6999]] as const) {
    it(`기존 ${existing.toLocaleString("ko-KR")}원 → ${manwon.toLocaleString("ko-KR")}만원, 총잔액 1억원 이하·스트레스 미적용`, () => {
      const input = credit(existing, 64_000_000, 40);
      const { d } = display(input);
      expect(d.kind).toBe("amount");
      if (d.kind !== "amount") return;
      expect(d.manwon).toBe(manwon);
      expect(existing + d.won).toBeLessThanOrEqual(100_000_000);
      expect(d.check.creditGatePassed).toBe(false);
      expect(d.stressedRatePercent).toBe(5);
      expect(d.check.exceeded).toBe(false);
      expect(d.notes).toContain(CREDIT_ESTIMATE_GATE_CAP_NOTE);
      const next = check(input, d.won + 10_000);
      expect(next.creditGatePassed).toBe(true);
      expect(next.exceeded).toBe(true);
    });
  }
  // 연소득 9,000만원·50%, 기존 신용대출 1억원 ±1원: 신규 대출은 모두 1억원 초과 구간
  for (const existing of [99_999_999, 100_000_000, 100_000_001]) {
    it(`기존 ${existing.toLocaleString("ko-KR")}원 → 7,547만원, 스트레스 1.5%p 적용 상태로 재판정`, () => {
      const input = credit(existing, 90_000_000, 50);
      const { d } = display(input);
      expect(d.kind).toBe("amount");
      if (d.kind !== "amount") return;
      expect(d.manwon).toBe(7547);
      expect(d.check.creditGatePassed).toBe(true);
      expect(d.stressedRatePercent).toBe(6.5);
      expect(d.notes).not.toContain(CREDIT_ESTIMATE_NO_STRESS_NOTE);
      expect(d.check.exceeded).toBe(false);
      expect(check(input, d.won + 10_000).exceeded).toBe(true);
    });
  }
});

describe("최소 단위·상한", () => {
  it("양수지만 1만원보다 작은 추정액은 1만원 미만", () => {
    const input: DsrEstimateInput = { annualIncome: 10_000, limitPercent: 40, asOf: ASOF, existing: none,
      newLoan: { kind: "mortgage", principal: 0, ratePercent: 4, months: 12, repayment: "equal_payment", region: "metro", rateType: "variable" } };
    const { e, d } = display(input);
    expect(e.estimatedPrincipal).toBeGreaterThan(0);
    expect(e.estimatedPrincipal).toBeLessThan(10_000);
    expect(d).toEqual({ kind: "belowUnit", text: DSR_BELOW_UNIT_TEXT, notes: [] });
  });
  it("만원 정수로 정확히 나타낼 수 없는 초대형 추정액은 금액을 보이지 않는다", () => {
    const input: DsrEstimateInput = { annualIncome: 1e18, limitPercent: 50, asOf: ASOF, existing: none,
      newLoan: { kind: "credit", amount: 0, ratePercent: 5, repaymentKind: "lumpSum", fixedTerm: "other" } };
    const { d } = display(input);
    expect(d.kind).toBe("unverified");
  });
  it("주담대 확인은 추정과 같은 원리금균등 기준(확인 모드 상환방식 선택과 무관)", () => {
    const input: DsrEstimateInput = { annualIncome: 52_500_000, limitPercent: 50, asOf: ASOF, existing: none,
      newLoan: { kind: "mortgage", principal: 0, ratePercent: 4.92, months: 480, repayment: "equal_principal", region: "metro", rateType: "variable" } };
    const { d } = display(input);
    expect(d.kind === "amount" && d.manwon).toBe(31734);
    expect(d.kind === "amount" && d.check.exceeded).toBe(false);
  });
});
