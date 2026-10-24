/**
 * 금리 변동 시뮬레이터·고정 vs 변동 정확 계산 — /rate-change-simulator, /fixed-vs-variable-calculator 화면 전용.
 *
 * 기존 화면은 loan.calcRateScenarios·calcFixedVsVariable(Number)을 썼다. 둘 다 calcAmortization의 월별 이자 합을
 * 총이자로 써서, 월 납입액과 이자가 거의 같을 때 원금 상환분이 이진 근사에서 사라졌다
 * (예: 1만원·연 50%·1,200개월 원리금균등 총이자 500,000.0000000086원 → '50만', 정확값 490,000원 → '49만').
 * 여기서는 같은 금융 가정을 입력 십진값 그대로 정확하게 계산하고, 표시 시점에 기존 규칙으로 한 번만 반올림한다.
 *
 *   월이율 r = 연이율 ÷ 1,200, 기말 상환, 계산 중 반올림 없음
 *   원리금균등: M = rP/(1 − (1+r)^−n), 총이자 = nM − P / 0%: M = P/n, 총이자 0
 *   원금균등: 월 상환액은 첫 달 = P/n + rP, 총이자 = rP(n+1)/2
 *   차액(현재 대비·고정 대비)은 정확값끼리 뺀 뒤 표시한다. 많음·적음·동일, 손익분기 방향도 정확값으로 정한다.
 *   (총이자는 금리에 대해 엄격히 증가하므로 고정 대비 부호는 두 금리의 정확한 대소와 같다)
 *
 * 월별 행을 만들지 않으므로 개월 수 상한은 두지 않는다(거듭제곱은 제곱 반복 구간 연산, 정확 대체는 비용이 작을 때만).
 * 지원 범위: 표시 금액 가운데 가장 큰 총 납입 < 2^1024원(5묶음 상환표·단리 vs 복리와 같은 경계). 넘으면 결과 전체를 보류한다.
 *
 * loan.ts의 calcRateScenarios·calcFixedVsVariable·calcAmortization·equalPaymentMonthly(Number API, DSR 사용)는 바꾸지 않는다.
 */
import {
  AMOUNT_LIMIT, NeedPrecision, Resolver, bitLength, cmpQ, divQ, exactIv, fmtFixed, fmtKRW, fmtUnit,
  ivDiv, ivMul, ivNonNeg, ivOfQ, ivPow, ivScale, ivSub, mulQ, parseDecimal, parseDigits, q, reduce, subQ,
  withPrecision, type Iv, type Q,
} from "@/lib/exactMoney";
import type { RepaymentType } from "@/lib/loan";

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const HUNDRED_TWELVE = BigInt(1200);
const MANWON = BigInt(10000);
/** 정확 유리수 대체를 허용하는 a^n 크기(비트). 넘으면 정확 대체 대신 구간 정밀도를 더 올린다. */
const EXACT_POW_BITS = 1 << 23;

/** 십진 입력의 표기: 앞 0·끝 0·끝 소수점 생략(String(Number(x))와 같지만 자릿수·지수 표기 손실 없음) */
export function decimalLabel(raw: string): string {
  const [i, f = ""] = raw.split(".");
  const ip = i.replace(/^0+/, "") || "0";
  const fp = f.replace(/0+$/, "");
  return fp ? `${ip}.${fp}` : ip;
}

/** trimPct(n) = Number(n.toFixed(2))의 표시를 정확값에 적용(끝 0·소수점 생략, 지수 표기 없음) */
export function trimPctExact(x: Q): string {
  let s = fmtFixed(x, 2);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s === "-0" ? "0" : s;
}

type Rate = { pct: Q; c: bigint; b: bigint }; // 월이율 = c/b(약분)
const rateOf = (pct: Q): Rate => {
  const r = reduce(divQ(pct, q(HUNDRED_TWELVE)));
  return { pct, c: r.n, b: r.d };
};
const maxQ0 = (x: Q): Q => (x.n < ZERO ? q(ZERO) : x);
const addQ2 = (a: Q, b: Q): Q => reduce({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });

/** 한 금리의 월 상환액·총이자·총 납입(구간) + 정확 대체 */
type LoanIv = { M: Iv; TI: Iv; TP: Iv; exM: () => Q; exTI: () => Q; exTP: () => Q };

function exactEP(P: bigint, rt: Rate, n: bigint) {
  const a = rt.b + rt.c;
  if (bitLength(a) * Number(n) > EXACT_POW_BITS) throw new NeedPrecision(); // 정확 대체가 너무 크면 구간 정밀도를 올린다
  const an = a ** n, bn = rt.b ** n;
  const M = q(rt.c * P * an, rt.b * (an - bn));
  const TP = mulQ(M, q(n));
  return { M, TP, TI: subQ(TP, q(P)) };
}

function loanIv(P: bigint, rt: Rate, n: bigint, type: RepaymentType, S: number): LoanIv {
  const Ps = exactIv(P << BigInt(S));
  if (type === "equal_principal") {
    const first = q(P * rt.b + P * rt.c * n, n * rt.b);
    const TI = q(P * rt.c * (n + ONE), TWO * rt.b);
    const TP = addQ2(q(P), TI);
    return { M: ivOfQ(first, S), TI: ivOfQ(TI, S), TP: ivOfQ(TP, S), exM: () => first, exTI: () => TI, exTP: () => TP };
  }
  if (rt.c === ZERO) {
    const M = q(P, n);
    return { M: ivOfQ(M, S), TI: exactIv(ZERO), TP: Ps, exM: () => M, exTI: () => q(ZERO), exTP: () => q(P) };
  }
  const one = ONE << BigInt(S);
  const H = ivPow(ivOfQ(q(rt.b, rt.b + rt.c), S), n, S); // (1+r)^−n
  const E: Iv = { lo: one - H.hi, hi: one - H.lo };
  if (E.lo <= ZERO) throw new NeedPrecision();
  const M = ivDiv(ivOfQ(q(rt.c * P, rt.b), S), E, S);
  const TP = ivScale(M, n);
  const TI = ivNonNeg(ivSub(TP, Ps)); // nM ≥ P
  let cache: ReturnType<typeof exactEP> | null = null;
  const ex = () => (cache ??= exactEP(P, rt, n));
  return { M, TI, TP, exM: () => ex().M, exTI: () => ex().TI, exTP: () => ex().TP };
}

/** 총 납입 < 2^1024원 판정. 정확 상·하한(TP ≤ P(1+nr), TP ≥ max(P, nrP))으로 먼저 가르고 그 사이만 구간·정확 판정 */
function boundOf(P: bigint, rt: Rate, n: bigint, type: RepaymentType): "below" | "above" | null {
  const L = q(AMOUNT_LIMIT);
  if (type === "equal_principal") return cmpQ(addQ2(q(P), q(P * rt.c * (n + ONE), TWO * rt.b)), L) < 0 ? "below" : "above";
  if (rt.c === ZERO) return cmpQ(q(P), L) < 0 ? "below" : "above";
  if (cmpQ(q(P * (rt.b + n * rt.c), rt.b), L) < 0) return "below";
  if (cmpQ(q(P), L) >= 0 || cmpQ(q(n * rt.c * P, rt.b), L) >= 0) return "above";
  return null;
}

function precisionFor(P: bigint, rates: Rate[], n: bigint): number {
  let extra = 0;
  for (const rt of rates) {
    if (rt.c === ZERO) continue;
    extra = Math.max(extra, Math.abs(bitLength(rt.c) - bitLength(rt.b)) + 1);
  }
  return 96 + bitLength(P) + extra + 2 * bitLength(n);
}

type Parsed = { P: bigint; n: bigint };
function parseBase(principalRaw: string, monthsRaw: string): Parsed | null {
  const man = parseDigits(principalRaw);
  const n = parseDigits(monthsRaw);
  if (man === null || n === null || man === ZERO || n === ZERO) return null; // 기존: 원금·개월 0(빈칸 포함)이면 결과 없음
  return { P: man * MANWON, n };
}

// ─────────────────────────────────────────────
// 금리 변동 시뮬레이터
// ─────────────────────────────────────────────

export type RateScenarioRowExact = {
  isBase: boolean;
  label: string; // "현재" | "+0.25%p"
  rate: string; // toFixed(2)
  monthlyPayment: string; // formatKRW
  monthlyDiff: string; // "기준" | "+…원"
  totalInterest: string; // formatUnit
  interestDiff: string; // "기준" | "+…"
};
export type RateScenariosExactResult = { status: "too-large" } | { status: "ok"; rows: RateScenarioRowExact[] };

/** 기본 시나리오(%p): 기존 [0, 0.25, 0.5, 1.0]과 같다 */
export const RATE_SIM_BASE_DELTAS = ["0", "0.25", "0.5", "1.0"];

export function calcRateScenariosExact(
  principalRaw: string, rateRaw: string, monthsRaw: string, customRaw: string, type: RepaymentType,
  baseDeltas: string[] = RATE_SIM_BASE_DELTAS,
): RateScenariosExactResult | null {
  const base = parseBase(principalRaw, monthsRaw);
  const rate = parseDecimal(rateRaw);
  if (!base || rate === null || rateRaw === "") return null; // 금리 0%는 정상 입력, 빈칸만 결과 없음
  const { P, n } = base;
  // 시나리오: 기본 + 직접 입력(0보다 클 때만). 같은 값은 정확값으로 하나만, 정확값 순으로 정렬
  const list: { raw: string; d: Q }[] = baseDeltas.map((raw) => ({ raw, d: parseDecimal(raw)! }));
  const custom = parseDecimal(customRaw);
  if (custom && custom.n > ZERO && !list.some((x) => cmpQ(x.d, custom) === 0)) list.push({ raw: customRaw, d: custom });
  list.sort((x, y) => cmpQ(x.d, y.d));
  const rates = list.map((x) => rateOf(maxQ0(addQ2(rate, x.d))));
  // 지원 범위: 총 납입은 금리에 대해 증가하므로 가장 높은 금리 행으로 판정
  const top = rates[rates.length - 1];
  const bound = boundOf(P, top, n, type);
  if (bound === "above") return { status: "too-large" };

  const run = (R: Resolver): RateScenariosExactResult => {
    const L = rates.map((rt) => loanIv(P, rt, n, type, R.S));
    if (bound === null && !R.below(L[L.length - 1].TP, AMOUNT_LIMIT, L[L.length - 1].exTP)) return { status: "too-large" };
    const b = L[0]; // 정렬 후 첫 행 = Δ 0(현재)
    const rows = list.map((x, i): RateScenarioRowExact => {
      const isBase = x.d.n === ZERO;
      const li = L[i];
      return {
        isBase,
        label: isBase ? "현재" : `+${decimalLabel(x.raw)}%p`,
        rate: fmtFixed(rates[i].pct, 2),
        monthlyPayment: R.str(li.M, fmtKRW, li.exM),
        monthlyDiff: isBase ? "기준" : "+" + R.str(ivNonNeg(ivSub(li.M, b.M)), fmtKRW, () => subQ(li.exM(), b.exM())),
        totalInterest: R.str(li.TI, fmtUnit, li.exTI),
        interestDiff: isBase ? "기준" : "+" + R.str(ivNonNeg(ivSub(li.TI, b.TI)), fmtUnit, () => subQ(li.exTI(), b.exTI())),
      };
    });
    return { status: "ok", rows };
  };
  const S0 = precisionFor(P, rates, n);
  return withPrecision(S0, Math.max(1 << 14, 8 * S0), run);
}

// ─────────────────────────────────────────────
// 고정 vs 변동
// ─────────────────────────────────────────────

export type FixedVariableScenarioExact = { isCurrent: boolean; label: string; rate: string; totalInterest: string; vsFixed: string };
export type FixedVsVariableExactResult =
  | { status: "too-large" }
  | {
      status: "ok";
      fixedTotalInterest: string; // formatUnit
      fixedMonthly: string; // formatKRW
      variableTotalInterestNow: string;
      variableMonthlyNow: string;
      breakEven: { direction: "up" | "down" | "same"; fixedRate: string; variableRate: string; delta: string }; // trimPct
      scenarios: FixedVariableScenarioExact[];
    };

/** 변동금리 시나리오(%p): 기존 [0, 0.5, 1.0, 1.5]와 같다 */
export const FIXED_VAR_DELTAS = ["0", "0.5", "1.0", "1.5"];

export function calcFixedVsVariableExact(
  principalRaw: string, monthsRaw: string, fixedRaw: string, variableRaw: string, type: RepaymentType,
  deltas: string[] = FIXED_VAR_DELTAS,
): FixedVsVariableExactResult | null {
  const base = parseBase(principalRaw, monthsRaw);
  const fx = parseDecimal(fixedRaw);
  const vr = parseDecimal(variableRaw);
  if (!base || fx === null || vr === null || fixedRaw === "" || variableRaw === "") return null;
  const { P, n } = base;
  const fixedRt = rateOf(fx);
  const list = deltas.map((raw) => ({ raw, d: parseDecimal(raw)! }));
  const scRates = list.map((x) => rateOf(maxQ0(addQ2(vr, x.d))));
  const varNowRt = rateOf(vr);
  const all = [fixedRt, varNowRt, ...scRates];
  // 지원 범위: 가장 높은 금리(고정 또는 최대 시나리오)의 총 납입으로 판정
  const top = cmpQ(fixedRt.pct, scRates[scRates.length - 1].pct) >= 0 ? fixedRt : scRates[scRates.length - 1];
  const bound = boundOf(P, top, n, type);
  if (bound === "above") return { status: "too-large" };

  const be = subQ(fx, vr);
  const direction = be.n > ZERO ? "up" : be.n < ZERO ? "down" : "same";
  const breakEven = { direction, fixedRate: trimPctExact(fx), variableRate: trimPctExact(vr), delta: trimPctExact(be.n < ZERO ? q(-be.n, be.d) : be) } as const;

  const run = (R: Resolver): FixedVsVariableExactResult => {
    const fl = loanIv(P, fixedRt, n, type, R.S);
    const vl = loanIv(P, varNowRt, n, type, R.S);
    const sl = scRates.map((rt) => loanIv(P, rt, n, type, R.S));
    const topL = top === fixedRt ? fl : sl[sl.length - 1];
    if (bound === null && !R.below(topL.TP, AMOUNT_LIMIT, topL.exTP)) return { status: "too-large" };
    const scenarios = list.map((x, i): FixedVariableScenarioExact => {
      const li = sl[i];
      const cmp = cmpQ(scRates[i].pct, fx); // 총이자는 금리에 대해 엄격히 증가 → 부호 = 금리 대소
      const vsFixed = cmp === 0
        ? "동일"
        : cmp < 0
          ? `${R.str(ivNonNeg(ivSub(fl.TI, li.TI)), fmtUnit, () => subQ(fl.exTI(), li.exTI()))} 적음`
          : `${R.str(ivNonNeg(ivSub(li.TI, fl.TI)), fmtUnit, () => subQ(li.exTI(), fl.exTI()))} 많음`;
      return {
        isCurrent: x.d.n === ZERO,
        label: x.d.n === ZERO ? "현재" : `+${decimalLabel(x.raw)}%p`,
        rate: trimPctExact(scRates[i].pct),
        totalInterest: R.str(li.TI, fmtUnit, li.exTI),
        vsFixed,
      };
    });
    return {
      status: "ok",
      fixedTotalInterest: R.str(fl.TI, fmtUnit, fl.exTI),
      fixedMonthly: R.str(fl.M, fmtKRW, fl.exM),
      variableTotalInterestNow: R.str(vl.TI, fmtUnit, vl.exTI),
      variableMonthlyNow: R.str(vl.M, fmtKRW, vl.exM),
      breakEven,
      scenarios,
    };
  };
  const S0 = precisionFor(P, all, n);
  return withPrecision(S0, Math.max(1 << 14, 8 * S0), run);
}
