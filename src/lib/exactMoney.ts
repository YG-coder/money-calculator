/**
 * 상환표·단리 vs 복리 전용 정확 계산 도우미(5묶음).
 *
 * - 입력 raw 문자열을 그대로 유리수(BigInt 분자/분모)로 읽는다. `Number(raw)`·`rate/100/12`의 이진 근사를 거치지 않는다.
 * - 거듭제곱이 큰 값은 2진 고정소수 **구간 연산**으로 계산한다. 아래 한계는 내림, 위 한계는 올림으로만 계산하므로
 *   참값은 항상 [lo, hi] 안에 있다. 화면 문자열이 lo와 hi에서 같을 때만 확정한다(임의 epsilon·허용오차 없음).
 *   정해지지 않으면 호출부가 정밀도를 올려 다시 계산하고, 그래도 안 되면(정확한 0.5 동률 등) 정확 유리수로 계산한다.
 * - 표시 규칙은 기존 규칙(formatKRW·formatUnit·Math.round·toFixed)을 정확값에 한 번만 적용한다.
 *
 * 기존 exactDecimal.ts(환전·부동산)와 loan.ts/finance.ts의 Number API는 바꾸지 않는다.
 */

export type Q = { n: bigint; d: bigint }; // d > 0

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const TEN = BigInt(10);

/** 표시 금액 지원 상한(미만만 계산). 기존 JS Number가 유한값으로 다루던 범위(2^1024 미만)와 같다. */
export const AMOUNT_LIMIT = TWO ** BigInt(1024);

export const q = (n: bigint, d: bigint = ONE): Q => (d < ZERO ? { n: -n, d: -d } : { n, d });

export function gcd(a: bigint, b: bigint): bigint {
  if (a < ZERO) a = -a;
  if (b < ZERO) b = -b;
  while (b) [a, b] = [b, a % b];
  return a;
}

export function reduce(x: Q): Q {
  const g = gcd(x.n, x.d);
  return g > ONE ? { n: x.n / g, d: x.d / g } : x;
}

export const addQ = (a: Q, b: Q): Q => ({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
export const subQ = (a: Q, b: Q): Q => ({ n: a.n * b.d - b.n * a.d, d: a.d * b.d });
export const mulQ = (a: Q, b: Q): Q => ({ n: a.n * b.n, d: a.d * b.d });
export const divQ = (a: Q, b: Q): Q => q(a.n * b.d, a.d * b.n);
export const cmpQ = (a: Q, b: Q): number => {
  const l = a.n * b.d, r = b.n * a.d;
  return l < r ? -1 : l > r ? 1 : 0;
};

/** −∞ 방향 몫(d > 0) */
export function floorDiv(n: bigint, d: bigint): bigint {
  const t = n / d;
  return n % d !== ZERO && (n < ZERO) !== (d < ZERO) ? t - ONE : t;
}
/** +∞ 방향 몫(d > 0) */
export const ceilDiv = (n: bigint, d: bigint): bigint => -floorDiv(-n, d);

export const bitLength = (x: bigint): number => (x < ZERO ? -x : x).toString(2).length;

// ─────────────────────────────────────────────
// 입력 raw → 유리수
// ─────────────────────────────────────────────

/** money·integer 칸 raw(숫자만). 빈 값은 0(기존 `Number("")` = 0과 같은 결과). 숫자가 아니면 null. */
export function parseDigits(raw: string): bigint | null {
  if (raw === "") return ZERO;
  return /^\d+$/.test(raw) ? BigInt(raw) : null;
}

/** decimal 칸 raw("4.5", ".5", "5."). 빈 값과 "."은 기존 화면이 `Number`→NaN→0으로 읽으므로 0. 그 밖의 형식은 null. */
export function parseDecimal(raw: string): Q | null {
  if (raw === "" || raw === ".") return q(ZERO);
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(raw)) return null;
  const [i, f = ""] = raw.split(".");
  return reduce(q(BigInt((i || "0") + f), TEN ** BigInt(f.length)));
}

// ─────────────────────────────────────────────
// 기존 표시 규칙을 정확값에 적용
// ─────────────────────────────────────────────

/** Math.round: floor(x + 1/2) */
export const roundHalfUp = (x: Q): bigint => floorDiv(TWO * x.n + x.d, TWO * x.d);

const groupKo = (m: bigint): string => m.toLocaleString("ko-KR");

/** formatKRW(v) = Math.round(v).toLocaleString("ko-KR") + "원" (−0.5 < v < 0 은 기존처럼 "-0원") */
export function fmtKRW(x: Q): string {
  const m = roundHalfUp(x);
  if (m === ZERO && x.n < ZERO) return "-0원";
  return groupKo(m) + "원";
}

/** Number.prototype.toFixed(f)의 정의(부호를 떼고 |x|에서 가장 가까운 n, 동률은 큰 n)를 정확값에 적용. 쉼표·지수 표기 없음. */
export function fmtFixed(x: Q, f: number): string {
  const neg = x.n < ZERO;
  const ax = neg ? -x.n : x.n;
  const scale = TEN ** BigInt(f);
  const n = floorDiv(TWO * ax * scale + x.d, TWO * x.d);
  let s = n.toString();
  if (f > 0) {
    s = s.padStart(f + 1, "0");
    s = `${s.slice(0, -f)}.${s.slice(-f)}`;
  }
  return (neg ? "-" : "") + s;
}

const E4 = TEN ** BigInt(4);
const E8 = TEN ** BigInt(8);

/** formatUnit(v): |v| ≥ 1억 → toFixed(1) ".0" 생략 + "억", |v| ≥ 1만 → toFixed(0) + "만", 그 밖은 formatKRW. 경계 판정도 정확값으로. */
export function fmtUnit(x: Q): string {
  const ax = x.n < ZERO ? -x.n : x.n;
  if (ax >= E8 * x.d) {
    let v = fmtFixed(q(x.n, x.d * E8), 1);
    if (v.endsWith(".0")) v = v.slice(0, -2);
    return `${v}억`;
  }
  if (ax >= E4 * x.d) return `${fmtFixed(q(x.n, x.d * E4), 0)}만`;
  return fmtKRW(x);
}

// ─────────────────────────────────────────────
// 2진 고정소수 구간: 값 = V / 2^S, 참값 ∈ [lo, hi]
// ─────────────────────────────────────────────

export type Iv = { lo: bigint; hi: bigint };

export const exactIv = (v: bigint): Iv => ({ lo: v, hi: v });
/** 유리수 x를 scale S의 구간으로 */
export const ivOfQ = (x: Q, S: number): Iv => ({ lo: floorDiv(x.n << BigInt(S), x.d), hi: ceilDiv(x.n << BigInt(S), x.d) });
/** 곱(두 구간 모두 ≥ 0) */
export const ivMul = (a: Iv, b: Iv, S: number): Iv => ({ lo: (a.lo * b.lo) >> BigInt(S), hi: -((-(a.hi * b.hi)) >> BigInt(S)) });
/** 나눗셈(a ≥ 0, b > 0) */
export const ivDiv = (a: Iv, b: Iv, S: number): Iv => ({ lo: floorDiv(a.lo << BigInt(S), b.hi), hi: ceilDiv(a.hi << BigInt(S), b.lo) });
export const ivSub = (a: Iv, b: Iv): Iv => ({ lo: a.lo - b.hi, hi: a.hi - b.lo });
export const ivAdd = (a: Iv, b: Iv): Iv => ({ lo: a.lo + b.lo, hi: a.hi + b.hi });
export const ivScale = (a: Iv, k: bigint): Iv => ({ lo: a.lo * k, hi: a.hi * k }); // k ≥ 0
/** 0 이상으로 알려진 값의 아래 한계를 0으로 자른다(참값이 0 이상이라는 수학적 사실이 있을 때만) */
export const ivNonNeg = (a: Iv): Iv => ({ lo: a.lo < ZERO ? ZERO : a.lo, hi: a.hi < ZERO ? ZERO : a.hi });
/** 거듭제곱(밑 ≥ 0) */
export function ivPow(base: Iv, e: bigint, S: number): Iv {
  let result: Iv = exactIv(ONE << BigInt(S));
  let b = base;
  while (e > ZERO) {
    if (e & ONE) result = ivMul(result, b, S);
    e >>= ONE;
    if (e > ZERO) b = ivMul(b, b, S);
  }
  return result;
}

export const ivLoQ = (a: Iv, S: number): Q => ({ n: a.lo, d: ONE << BigInt(S) });
export const ivHiQ = (a: Iv, S: number): Q => ({ n: a.hi, d: ONE << BigInt(S) });

/** 구간 양끝에서 같은 표시 문자열이면 그 문자열, 아니면 null(정밀도 부족). fmt는 단조 계단 함수여야 한다. */
export function decide(a: Iv, S: number, fmt: (x: Q) => string): string | null {
  const l = fmt(ivLoQ(a, S));
  return l === fmt(ivHiQ(a, S)) ? l : null;
}

/** Math.round 정수 확정(표 칸) */
export function decideRound(a: Iv, S: number): bigint | null {
  const half = ONE << BigInt(S - 1);
  const l = (a.lo + half) >> BigInt(S);
  return l === (a.hi + half) >> BigInt(S) ? l : null;
}

/** x < 한계 판정 */
export function decideBelow(a: Iv, S: number, limit: bigint): boolean | null {
  const L = limit << BigInt(S);
  if (a.hi < L) return true;
  if (a.lo >= L) return false;
  return null;
}

/** 정밀도 부족을 알리는 내부 신호 */
export class NeedPrecision extends Error {
  constructor() {
    super("need more precision");
  }
}

/**
 * 구간으로 정해지지 않은 값만 정확 유리수로 계산한다.
 * 정확한 0.5 동률(예: 첫 달 이자 = P·r = …,…,5원)은 정밀도를 올려도 구간이 경계를 품으므로 그 값만 정확 계산한다.
 * 한 번의 계산에서 정확 계산이 budget을 넘으면(정밀도 자체가 부족) NeedPrecision으로 정밀도를 올리게 한다.
 */
export class Resolver {
  exactCount = 0;
  constructor(readonly S: number, readonly budget: number) {}
  private spend() {
    if (++this.exactCount > this.budget) throw new NeedPrecision();
  }
  /** 표시 문자열 */
  str(a: Iv, fmt: (x: Q) => string, exact: () => Q): string {
    const v = decide(a, this.S, fmt);
    if (v !== null) return v;
    this.spend();
    return fmt(exact());
  }
  /** Math.round 정수 */
  round(a: Iv, exact: () => Q): bigint {
    const v = decideRound(a, this.S);
    if (v !== null) return v;
    this.spend();
    return roundHalfUpQ(exact());
  }
  /** x < limit */
  below(a: Iv, limit: bigint, exact: () => Q): boolean {
    const v = decideBelow(a, this.S, limit);
    if (v !== null) return v;
    this.spend();
    const x = exact();
    return x.n < limit * x.d;
  }
  /** x > 0 */
  positive(a: Iv, exact: () => Q): boolean {
    if (a.lo > ZERO) return true;
    if (a.hi <= ZERO) return false;
    this.spend();
    return exact().n > ZERO;
  }
}

const roundHalfUpQ = (x: Q): bigint => roundHalfUp(x);

/**
 * scale S부터 두 배씩 올리며 계산. maxS부터는 정해지지 않은 값을 모두 정확 계산(budget 무제한)한다.
 * 그래도 구간 자체가 성립하지 않으면(예: 아주 작은 r에서 1 − h^n의 아래 한계가 0 이하) 정밀도를 계속 올린다.
 * 유한한 입력이면 필요한 정밀도도 유한하므로 반드시 끝난다.
 */
export function withPrecision<T>(S0: number, maxS: number, run: (r: Resolver) => T): T {
  let S = Math.max(64, S0);
  for (;; S *= 2) {
    try {
      return run(new Resolver(S, S < maxS ? 8 : Infinity));
    } catch (e) {
      if (!(e instanceof NeedPrecision)) throw e;
    }
  }
}
