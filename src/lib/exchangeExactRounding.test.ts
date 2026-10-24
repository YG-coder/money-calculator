import { describe, expect, it } from "vitest";
import { calcExchange, type ExchangeInput } from "./exchange";
import { formatKRW } from "./loan";

const KEYS = ["krwWithoutPreference", "krwWithPreference", "savedKrw", "krwAtBaseRate", "feeAfterPreference"] as const;

const krw = (input: ExchangeInput) => {
  const r = calcExchange(input);
  if (r.status !== "ok") throw new Error(r.reason);
  return Object.fromEntries(KEYS.map((k) => [k, formatKRW(r.value[k])])) as Record<(typeof KEYS)[number], string>;
};

const usd = (baseRate: number, spreadPercent: number, preferentialPercent: number, foreignAmount: number): ExchangeInput => ({
  currencyCode: "USD", direction: "buy", baseRate, spreadMode: "rate", spreadPercent, preferentialPercent, foreignAmount,
});

/**
 * 독립 기준(엔진 함수 미사용): 입력을 십진 문자열 그대로 BigInt 분수로 읽어 원화 금액을 정확히 계산하고,
 * 화면 규칙(Math.round, 0.5는 올림)으로 원 단위 반올림한다.
 */
type Q = [bigint, bigint];
const q = (s: string): Q => {
  const [i, f = ""] = s.split(".");
  return [BigInt(i + f), BigInt(10) ** BigInt(f.length)];
};
const qm = (a: Q, b: Q): Q => [a[0] * b[0], a[1] * b[1]];
const qa = (a: Q, b: Q): Q => [a[0] * b[1] + b[0] * a[1], a[1] * b[1]];
const qs = (a: Q, b: Q): Q => qa(a, [-b[0], b[1]]);
const qabs = (a: Q): Q => [a[0] < BigInt(0) ? -a[0] : a[0], a[1]];
const won = (a: Q): string => {
  const n = a[0] * BigInt(2) + a[1];
  const d = a[1] * BigInt(2);
  const fl = n >= BigInt(0) ? n / d : -((-n + d - BigInt(1)) / d);
  return `${fl.toLocaleString("en-US")}원`;
};
function expected(c: { cur: "USD" | "JPY" | "VND"; dir: "buy" | "sell"; base: string; mode: "rate" | "cashRate"; v: string; pref: string; amt: string }) {
  const one: Q = [BigInt(1), BigInt(1)];
  const base = q(c.base);
  const sp: Q = c.mode === "rate" ? q(c.v) : (() => {
    const diff = c.dir === "buy" ? qs(q(c.v), base) : qs(base, q(c.v));
    return [diff[0] * base[1] * BigInt(100), diff[1] * base[0]] as Q;
  })();
  const eff = qm(sp, qs(one, [q(c.pref)[0], q(c.pref)[1] * BigInt(100)]));
  const side = (p: Q): Q => (c.dir === "buy" ? qa : qs)(one, [p[0], p[1] * BigInt(100)]);
  const unit = BigInt(c.cur === "USD" ? 1 : 100);
  const amt: Q = [q(c.amt)[0], q(c.amt)[1] * unit];
  const wo = qm(qm(base, side(sp)), amt), wi = qm(qm(base, side(eff)), amt), at = qm(base, amt);
  return { krwWithoutPreference: won(wo), krwWithPreference: won(wi), savedKrw: won(qabs(qs(wo, wi))), krwAtBaseRate: won(at), feeAfterPreference: won(qabs(qs(wi, at))) };
}

describe("환전 원화 금액 — 중간 소수 반올림 없이 정확히 계산해 원 단위로 한 번만 반올림", () => {
  it("USD 살 때 1,380.01원 · 1.95% · 우대 30% · 31,660.73달러: 정확값 44,288,521.499999645원 → 44,288,521원", () => {
    expect(krw(usd(1380.01, 1.95, 30, 31660.73))).toEqual({
      krwWithoutPreference: "44,544,120원",
      krwWithPreference: "44,288,521원",
      savedKrw: "255,599원",
      krwAtBaseRate: "43,692,124원",
      feeAfterPreference: "596,397원",
    });
  });

  it("기존 회귀: 40,635달러 · 1,380원 · 1.95% · 우대 30% → 56,841,741원", () => {
    expect(krw(usd(1380, 1.95, 30, 40635)).krwWithPreference).toBe("56,841,741원");
  });

  it("정확히 x.5는 올리고, 그 바로 아래는 내리고, 바로 위는 올린다", () => {
    expect(krw(usd(1000, 0, 0, 1.0005)).krwWithPreference).toBe("1,001원");
    expect(krw(usd(1000, 0, 0, 1.0004999996)).krwWithPreference).toBe("1,000원");
    expect(krw(usd(1000, 0, 0, 1.000499999999)).krwWithPreference).toBe("1,000원");
    expect(krw(usd(1000, 0, 0, 1.0005000004)).krwWithPreference).toBe("1,001원");
  });

  it("차액 필드(절약액·남은 수수료)도 정확한 차액을 한 번만 반올림한다", () => {
    // 1,000원 · 1% · 우대 50%: 절약액 = 금액 × 5원 → 0.1달러는 정확히 0.5원
    expect(krw(usd(1000, 1, 50, 0.1))).toMatchObject({ savedKrw: "1원", feeAfterPreference: "1원" });
    expect(krw(usd(1000, 1, 50, 0.0999999))).toMatchObject({ savedKrw: "0원", feeAfterPreference: "0원" });
  });

  it("살 때·팔 때 × 수수료율·현찰 환율 × 1단위·100단위 고시 × 우대 0·30·100%가 독립 정수 계산과 같다", () => {
    const cash = { USD: { buy: "1406.92", sell: "1353.1" }, JPY: { buy: "966.99", sell: "933.75" }, VND: { buy: "5.52", sell: "5.34" } } as const;
    const base = { USD: "1380.01", JPY: "950.37", VND: "5.43" } as const;
    const mismatches: string[] = [];
    for (const dir of ["buy", "sell"] as const)
      for (const cur of ["USD", "JPY", "VND"] as const)
        for (const pref of ["0", "30", "100"])
          for (const mode of ["rate", "cashRate"] as const) {
            const v = mode === "rate" ? "1.95" : cash[cur][dir];
            const c = { cur, dir, base: base[cur], mode, v, pref, amt: "31660.73" };
            const actual = krw({
              currencyCode: cur, direction: dir, baseRate: Number(c.base), spreadMode: mode,
              spreadPercent: mode === "rate" ? Number(v) : undefined, cashRate: mode === "cashRate" ? Number(v) : undefined,
              preferentialPercent: Number(pref), foreignAmount: Number(c.amt),
            });
            if (JSON.stringify(actual) !== JSON.stringify(expected(c))) mismatches.push(`${dir}/${cur}/${mode}/${pref}`);
          }
    expect(mismatches).toEqual([]);
  });

  it("우대 100%면 절약액 = 수수료 전액, 남은 수수료 0원", () => {
    expect(krw(usd(1380.01, 1.95, 100, 31660.73))).toMatchObject({ krwWithPreference: "43,692,124원", feeAfterPreference: "0원" });
  });
});
