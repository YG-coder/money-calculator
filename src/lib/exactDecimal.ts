/**
 * 원 미만 내림 경계 전용 십진 정확 계산.
 *
 * 화면 입력은 십진 숫자다. 이진 부동소수로 `금액 × 세율`·`보증금 × 연이율 ÷ 1200`을 계산하면
 * 정확히 정수인 금액이 6,245,385.999…처럼 되어 `Math.floor`가 1원을 빼는 경우가 있다.
 * 여기서는 JS 숫자를 가장 짧은 십진 표기(String)로 읽어 정확한 유리수로 계산한 뒤 내림한다.
 * 내림·반올림 정책 자체는 바꾸지 않는다(호출부의 기존 규칙 그대로).
 */
export type Ratio = { n: bigint; d: bigint }; // d > 0

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TEN = BigInt(10);

/** 유한한 JS 숫자 → 그 십진 표기와 같은 유리수 */
export function ratio(value: number): Ratio {
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/.exec(String(value));
  if (!Number.isFinite(value) || !m) throw new RangeError("유한한 숫자만 정확히 계산할 수 있습니다.");
  const [, sign, intPart, fracPart = "", exp = "0"] = m;
  let n = BigInt(intPart + fracPart);
  let d = TEN ** BigInt(fracPart.length);
  const e = Number(exp);
  if (e > 0) n *= TEN ** BigInt(e);
  else if (e < 0) d *= TEN ** BigInt(-e);
  return { n: sign ? -n : n, d };
}

export const mul = (a: Ratio, b: Ratio): Ratio => ({ n: a.n * b.n, d: a.d * b.d });
export const add = (a: Ratio, b: Ratio): Ratio => ({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
export const sub = (a: Ratio, b: Ratio): Ratio => add(a, { n: -b.n, d: b.d });
/** 양의 정수로 나누기 */
export const divInt = (a: Ratio, k: number): Ratio => ({ n: a.n, d: a.d * BigInt(k) });
export const abs = (a: Ratio): Ratio => ({ n: a.n < ZERO ? -a.n : a.n, d: a.d });
export const isPositive = (a: Ratio): boolean => a.n > ZERO;

/** Math.floor 와 같은 방향(−∞ 쪽)으로 내림 */
export function floorRatio(a: Ratio): number {
  let q = a.n / a.d;
  if (a.n % a.d !== ZERO && a.n < ZERO) q -= ONE;
  return Number(q);
}

/** 0이 아닌 유리수로 나누기 */
export const div = (a: Ratio, b: Ratio): Ratio =>
  b.n < ZERO ? { n: -a.n * b.d, d: a.d * -b.n } : { n: a.n * b.d, d: a.d * b.n };

/** Math.round 와 같은 방향(0.5는 +∞ 쪽)으로 정수 반올림: floor(x + 1/2) */
export function roundHalfUpRatio(a: Ratio): number {
  return floorRatio({ n: a.n * BigInt(2) + a.d, d: a.d * BigInt(2) });
}

/** 금액(원) × 세율을 원 미만 내림. 세율은 소수 7자리 이내로 정해진다(예: 1.0325% → 0.010325). */
export function floorWonByRate(amountWon: number, rate: number): number {
  if (!Number.isFinite(amountWon) || !Number.isFinite(rate)) return Math.floor(amountWon * rate);
  const scale = 10_000_000;
  return floorRatio(mul(ratio(amountWon), { n: BigInt(Math.round(rate * scale)), d: BigInt(scale) }));
}
