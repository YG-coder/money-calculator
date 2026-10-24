/**
 * 단리 vs 복리 정확 계산(5묶음) — /finance/simple-vs-compound 화면 전용.
 *
 * 기존 화면은 calcCompoundInterest(Number, 월복리 12회·추가납입 0)를 매월 반복 곱했고, 표의 단리는 따로 Number로 계산했다.
 * 큰 원금·긴 기간에서 원 단위가 틀리고(예: 단리 600,999,999,993,888,400원), 표는 지수 표기(1.968993263129713e+262억)였다.
 * 여기서는 같은 금융 가정을 정확값으로 계산한다.
 *   월이율 r = 연이율 ÷ 1,200, 월복리(연 12회), 추가납입 0
 *   복리 C(y) = P·(1+r)^(12y), 단리 S(y) = P·(1 + 연이율·y/100) (= 기간마다 원금에만 붙는 이자의 합)
 *   카드·차이 문구·연차표가 모두 같은 정확값을 쓴다(마지막 행 = 카드).
 * 복리 거듭제곱은 제곱 반복 구간 연산이라 비용이 기간 길이에 비례하지 않는다. 표는 기존처럼 최대 9행.
 * 지원 범위: 복리 최종액(가장 큰 표시 금액) < 2^1024원. 넘으면 결과 전체를 보류한다.
 *
 * 기존 calcCompoundInterest(복리 적금 계산기 사용)는 바꾸지 않는다.
 */
import {
  AMOUNT_LIMIT, NeedPrecision, Resolver, addQ, bitLength, cmpQ, divQ, exactIv, fmtFixed, fmtKRW, fmtUnit,
  ivDiv, ivMul, ivNonNeg, ivOfQ, ivPow, ivScale, ivSub, mulQ, parseDecimal, parseDigits, q, reduce, subQ,
  withPrecision, type Iv, type Q,
} from "@/lib/exactMoney";

export type SimpleVsCompoundRow = { year: string; simple: string; compound: string; diff: string };

export type SimpleVsCompoundExactResult =
  | { status: "too-large" }
  | {
      status: "ok";
      simpleFinal: string; // formatKRW
      simpleInterest: string;
      compoundFinal: string;
      compoundInterest: string;
      advantagePositive: boolean; // 복리 초과분 > 0 (이자율 > 0이면 참)
      advantage: string; // formatKRW
      advantageRate: string; // toFixed(2), 최종액 기준 %
      interestMultiple: string | null; // toFixed(2), 단리 이자가 0이면 null
      rows: SimpleVsCompoundRow[]; // 2행 이상일 때만 표시(기존과 같음)
    };

const ZERO = BigInt(0);
const ONE = BigInt(1);
const EIGHT = BigInt(8);
const TWELVE = BigInt(12);
const HUNDRED = BigInt(100);
const HUNDRED_TWELVE = BigInt(1200);
const MANWON = BigInt(10000);

/** 기존 표와 같은 연차: step = max(1, ⌈Y/8⌉)의 배수 + 마지막 해 */
function tableYears(Y: bigint): bigint[] {
  const step = Y <= EIGHT ? ONE : (Y + EIGHT - ONE) / EIGHT;
  const out: bigint[] = [];
  for (let y = step; y <= Y; y += step) out.push(y);
  if (out[out.length - 1] !== Y) out.push(Y);
  return out;
}

/**
 * 양의 정수 x의 log2. 큰 정수를 통째로 Number로 바꾸지 않는다(2^1024 근처에서 Infinity가 되지 않게).
 * 위쪽 60비트만 Number로 읽고 나머지 비트 수를 더한다. 절대오차는 2^-50 수준이다.
 */
function log2Int(x: bigint): number {
  const bits = bitLength(x);
  if (bits <= 60) return Math.log2(Number(x));
  return Math.log2(Number(x >> BigInt(bits - 60))) + (bits - 60);
}

/** 양의 유리수 n/d의 log2(log2Int의 차, 넘침·아래넘침 없음) */
const log2Ratio = (n: bigint, d: bigint): number => log2Int(n) - log2Int(d);

/**
 * 복리 최종액 P·(1+r)^N이 2^1024 미만인지 로그 추정으로 먼저 가른다.
 * 추정은 모두 비트 수로 계산해 넘침이 없고, 오차(수십억분의 1비트 이하)보다 훨씬 넓은 여유(위아래 2비트)를 둔다.
 * 그 사이(1022 ≤ log2 ≤ 1026)는 null → 기존 구간·정확 판정으로 넘긴다.
 */
function estimateRange(P: bigint, c: bigint, b: bigint, N: bigint): "below" | "above" | null {
  // 아래 한계(Bernoulli): (1+r)^N ≥ 1 + N·r → 이것만으로 넘으면 확정(정확 정수 비교)
  if (cmpQ(q(P * (b + N * c), b), q(AMOUNT_LIMIT)) >= 0) return "above";
  const log2P = log2Int(P); // P ≥ 10^4이므로 log2P > 13
  const log2r = log2Ratio(c, b);
  // log2(log2(1+r)): r 크기에 따라 넘침·아래넘침 없이 계산
  let log2lg: number;
  if (log2r > 1000) log2lg = Math.log2(log2r); // r ≥ 2^1000: log2(1+r) = log2r + log2(1+1/r), 차이 < 2^-999
  else if (log2r < -1000) log2lg = log2r - Math.log2(Math.LN2); // r < 2^-1000: log2(1+r) = r/ln2·(1 − r/2 + …)
  else log2lg = Math.log2(Math.log1p(Math.pow(2, log2r)) / Math.LN2);
  const log2Growth = log2Int(N) + log2lg; // log2(N·log2(1+r))
  // 증가분만으로 2048비트를 넘으면 log2P > 0이므로 확실히 상한 초과
  if (log2Growth > 11) return "above";
  const L = log2P + Math.pow(2, log2Growth);
  if (L > 1026) return "above";
  if (L < 1022) return "below";
  return null;
}

export function calcSimpleVsCompoundExact(principalRaw: string, rateRaw: string, yearsRaw: string): SimpleVsCompoundExactResult | null {
  const man = parseDigits(principalRaw);
  const Y = parseDigits(yearsRaw);
  const rate = parseDecimal(rateRaw);
  // 기존 화면: 원금 0, 연 < 1, 이자율 칸이 비었으면 결과 없음. "."은 0%로 계산(기존 동작).
  if (man === null || Y === null || rate === null) return null;
  if (man === ZERO || Y < ONE || rateRaw === "") return null;
  const P = man * MANWON;
  const r = reduce(divQ(rate, q(HUNDRED_TWELVE)));
  const c = r.n, b = r.d, a = b + c;
  const N = TWELVE * Y;
  const LIMIT = q(AMOUNT_LIMIT);
  const simple = (y: bigint): Q => addQ(q(P), q(P * c * TWELVE * y, b)); // P + P·r·12y
  const years = tableYears(Y);
  const SY = simple(Y);
  const SI = subQ(SY, q(P));

  // 이자율 0: 복리 = 단리 = P (정확)
  if (c === ZERO) {
    if (cmpQ(q(P), LIMIT) >= 0) return { status: "too-large" };
    const rows = years.map((y) => ({ year: y.toString(), simple: fmtUnit(simple(y)), compound: fmtUnit(q(P)), diff: "+" + fmtUnit(q(ZERO)) }));
    return {
      status: "ok", simpleFinal: fmtKRW(SY), simpleInterest: fmtKRW(SI), compoundFinal: fmtKRW(q(P)), compoundInterest: fmtKRW(q(ZERO)),
      advantagePositive: false, advantage: fmtKRW(q(ZERO)), advantageRate: fmtFixed(q(ZERO), 2), interestMultiple: null,
      rows: rows.length > 1 ? rows : [],
    };
  }

  const est = estimateRange(P, c, b, N);
  if (est === "above") return { status: "too-large" };

  // 정확 유리수(구간으로 정해지지 않은 값만 사용)
  const comp = (y: bigint): Q => q(P * a ** (TWELVE * y), b ** (TWELVE * y));
  const exCY = () => comp(Y);
  const exAdv = () => subQ(exCY(), SY);
  const exCI = () => subQ(exCY(), q(P));

  const S0 = 96 + bitLength(P) + 1100 + 2 * bitLength(N) + Math.max(0, bitLength(b) - bitLength(c));
  const run = (R: Resolver): SimpleVsCompoundExactResult => {
    const S = R.S;
    const g = ivOfQ(q(a, b), S);
    const Ps = exactIv(P << BigInt(S));
    const g12 = ivPow(g, TWELVE, S);
    // 연차별 (1+r)^(12y): 앞 행에 차이만큼 곱한다
    const G: Iv[] = [];
    let prevY = ZERO;
    let prevG: Iv = exactIv(ONE << BigInt(S));
    for (const y of years) {
      prevG = ivMul(prevG, ivPow(g12, y - prevY, S), S);
      prevY = y;
      G.push(prevG);
    }
    const C = G.map((x) => ivMul(Ps, x, S));
    const CY = C[C.length - 1];
    if (est !== "below" && !R.below(CY, AMOUNT_LIMIT, exCY)) return { status: "too-large" };
    const SYs = ivOfQ(SY, S);
    const adv = ivNonNeg(ivSub(CY, SYs)); // 이자율 > 0, 12y ≥ 12회이면 복리 > 단리
    const CI = ivNonNeg(ivSub(CY, Ps));
    const SIs = ivOfQ(SI, S);
    if (SIs.lo <= ZERO) throw new NeedPrecision();
    const rateIv = ivDiv(ivScale(adv, HUNDRED), SYs, S);
    const multIv = ivDiv(CI, SIs, S);
    const rows = years.map((y, i) => {
      const s = simple(y);
      return {
        year: y.toString(),
        simple: fmtUnit(s),
        compound: R.str(C[i], fmtUnit, () => comp(y)),
        diff: "+" + R.str(ivNonNeg(ivSub(C[i], ivOfQ(s, S))), fmtUnit, () => subQ(comp(y), s)),
      };
    });
    return {
      status: "ok",
      simpleFinal: fmtKRW(SY), simpleInterest: fmtKRW(SI),
      compoundFinal: R.str(CY, fmtKRW, exCY), compoundInterest: R.str(CI, fmtKRW, exCI),
      advantagePositive: true,
      advantage: R.str(adv, fmtKRW, exAdv),
      advantageRate: R.str(rateIv, (x) => fmtFixed(x, 2), () => divQ(mulQ(exAdv(), q(HUNDRED)), SY)),
      interestMultiple: R.str(multIv, (x) => fmtFixed(x, 2), () => divQ(exCI(), SI)),
      rows: rows.length > 1 ? rows : [],
    };
  };

  return withPrecision(S0, Math.max(1 << 15, 8 * S0), run);
}
