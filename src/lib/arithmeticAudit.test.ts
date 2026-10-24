import { describe, expect, it } from "vitest";
import { calcAcquisitionTax, calcJeonseVsWolse, calcPropertyYield } from "./realEstate";
import { calcExchange } from "./exchange";
import { formatKRW } from "./loan";

const firstHome = { ownership: "first" as const, isAdjustedArea: false, isOver85: false, isMetroArea: true };

/** 독립 기준: 지방세법 6~9억 1주택 세율(소수 넷째 자리까지 반올림한 %)을 정수로 계산해 원 미만 내림 */
function expectedFirstHome(priceMan: number) {
  const price = BigInt(priceMan) * BigInt(10_000);
  // 세율(%) × 10,000 = round((2/3 × 가격/1억 − 3) × 10,000) = round(가격/15,000) − 30,000 (0.5는 올림)
  const unit = BigInt(15_000);
  const rounded = price / unit + ((price % unit) * BigInt(2) >= unit ? BigInt(1) : BigInt(0));
  const pctTimes1e4 = priceMan <= 60_000 ? BigInt(10_000) : priceMan <= 90_000 ? rounded - BigInt(30_000) : BigInt(30_000);
  const acquisition = (price * pctTimes1e4) / BigInt(1_000_000);
  const education = (price * pctTimes1e4) / BigInt(10_000_000);
  return { acquisition: Number(acquisition), education: Number(education) };
}

describe("취득세 — 곱셈 경계에서 원 미만 내림이 1원을 더 빼지 않는다", () => {
  it("6억 488만원 1주택: 취득세 6,245,386원 · 지방교육세 624,538원 · 합계 6,869,924원", () => {
    const r = calcAcquisitionTax({ ...firstHome, priceMan: 60_488 });
    expect(r.acquisitionTax).toBe(6_245_386);
    expect(r.localEduTax).toBe(624_538);
    expect(r.totalTax).toBe(6_869_924);
  });

  it("6억 2,100만원 85㎡ 초과: 취득세 7,079,400원 · 농특세 1,242,000원 · 교육세 707,940원", () => {
    const r = calcAcquisitionTax({ ...firstHome, priceMan: 62_100, isOver85: true });
    expect([r.acquisitionTax, r.farmSpecialTax, r.localEduTax]).toEqual([7_079_400, 1_242_000, 707_940]);
  });

  it("6억~9억 1만원 단위 전 구간(30,001개)이 독립 정수 계산과 같다", () => {
    const mismatches: number[] = [];
    for (let priceMan = 60_000; priceMan <= 90_000; priceMan += 1) {
      const r = calcAcquisitionTax({ ...firstHome, priceMan });
      const e = expectedFirstHome(priceMan);
      if (r.acquisitionTax !== e.acquisition || r.localEduTax !== e.education) mismatches.push(priceMan);
    }
    expect(mismatches).toEqual([]);
  });

  it("생애최초 감면 후 지방교육세: 2억 4만원 → 남은 취득세 400원, 교육세 40원", () => {
    const r = calcAcquisitionTax({ ...firstHome, priceMan: 20_004, firstHomeReduction: "standard" });
    expect(r.acquisitionTax).toBe(400);
    expect(r.localEduTax).toBe(40);
    expect(r.totalTax).toBe(440);
  });

  it("6억 488만원 생애최초(200만원) 감면: 취득세 4,245,386원 · 교육세 424,538원", () => {
    const r = calcAcquisitionTax({ ...firstHome, priceMan: 60_488, firstHomeReduction: "standard" });
    expect([r.acquisitionTax, r.localEduTax, r.totalTax]).toEqual([4_245_386, 424_538, 4_669_924]);
  });

  it("중과·표준 고정세율 결과는 기존과 같다", () => {
    expect(calcAcquisitionTax({ ...firstHome, priceMan: 50_000 }).totalTax).toBe(5_500_000);
    const heavy = calcAcquisitionTax({ ...firstHome, priceMan: 100_000, ownership: "fourth_plus", isAdjustedArea: true });
    expect([heavy.acquisitionTax, heavy.localEduTax]).toEqual([120_000_000, 4_000_000]);
  });
});

describe("전세 vs 월세 — 정확히 정수인 월 차액에서 1원이 빠지지 않는다", () => {
  it("전세 3억 vs 보증금 3억·월 100만원, 4% → 월 1,000,000원 · 연 12,000,000원", () => {
    const r = calcJeonseVsWolse(30_000, 30_000, 100, 4);
    expect(r.monthlyDiff).toBe(1_000_000);
    expect(r.yearlyDiff).toBe(12_000_000);
    expect(r.jeonseIsBetter).toBe(true);
  });

  it("전세 4억 838만 vs 보증금 1,370만·월 460만원, 4.25% → 월 3,202,175원", () => {
    const r = calcJeonseVsWolse(40_838, 1_370, 460, 4.25);
    expect([r.jeonseMonthlyOpportunityCost, r.wolseMonthlyTotalCost, r.monthlyDiff]).toEqual([1_446_345, 4_648_520, 3_202_175]);
  });

  it("차액이 0이면 어느 쪽도 유리하지 않다", () => {
    const even = calcJeonseVsWolse(30_000, 0, 100, 4);
    expect(even.monthlyDiff).toBe(0);
    expect(even.jeonseIsBetter).toBe(false);
  });
});

describe("임대 수익률 — 연 순수익 내림", () => {
  it("연 순수익이 정확히 7,344,961원이면 그대로 표시한다", () => {
    const r = calcPropertyYield({ purchasePriceMan: 152_813, depositMan: 3_361, monthlyRentMan: 113, loanAmountMan: 1_561, loanRatePct: 5.99, monthlyCostMan: 44, extraCostMan: 0 });
    expect([r.monthlyInterest, r.monthlyNetIncome, r.annualNetIncome]).toEqual([77_919, 612_080, 7_344_961]);
  });

  it("음수 연 순수익도 기존 내림 방향(−∞) 그대로 정확히 계산한다 (−5,565,472원)", () => {
    const r = calcPropertyYield({ purchasePriceMan: 276_860, depositMan: 1_567, monthlyRentMan: 224, loanAmountMan: 61_876, loanRatePct: 4.72, monthlyCostMan: 27, extraCostMan: 0 });
    expect([r.monthlyInterest, r.monthlyNetIncome, r.annualNetIncome]).toEqual([2_433_789, -463_790, -5_565_472]);
  });
});

describe("환전 — 원화 금액을 두 번 반올림하지 않는다", () => {
  const krw = (input: Parameters<typeof calcExchange>[0]) => {
    const r = calcExchange(input);
    if (r.status !== "ok") throw new Error(r.reason);
    return r.value;
  };
  it("40,635달러 · 기준율 1,380원 · 수수료 1.95% · 우대 30% → 56,841,741.495원은 56,841,741원으로 표시", () => {
    const v = krw({ currencyCode: "USD", direction: "buy", baseRate: 1380, spreadMode: "rate", spreadPercent: 1.95, preferentialPercent: 30, foreignAmount: 40_635 });
    expect(formatKRW(v.krwWithPreference)).toBe("56,841,741원");
  });
  it("5,632엔 · 100엔당 1,380원 · 1.95% · 우대 30% → 78,782.49984원은 78,782원으로 표시", () => {
    const v = krw({ currencyCode: "JPY", direction: "buy", baseRate: 1380, spreadMode: "rate", spreadPercent: 1.95, preferentialPercent: 30, foreignAmount: 5_632 });
    expect(formatKRW(v.krwWithPreference)).toBe("78,782원");
  });
  it("정확히 정수인 금액은 기존과 같다 (1,000달러 · 1,200원 · 1.75% · 우대 50% → 1,210,500원)", () => {
    const v = krw({ currencyCode: "USD", direction: "buy", baseRate: 1200, spreadMode: "rate", spreadPercent: 1.75, preferentialPercent: 50, foreignAmount: 1_000 });
    expect(v.krwWithPreference).toBe(1_210_500);
    expect(v.savedKrw).toBe(10_500);
  });
});
