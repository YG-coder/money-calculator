/**
 * 대출 상환표 정확 계산(5묶음) — /amortization-calculator 화면 전용.
 *
 * 기존 calcAmortization(Number)은 월 납입액 M과 이자 B·r이 거의 같을 때 `M − 이자`가 이진 근사에서 사라져
 * 원금 상환분이 0이 되고 마지막 잔액이 남았다(예: 1만원·연 50%·1,200개월 → 총이자 50만, 잔액 1만원).
 * 여기서는 같은 금융 가정(월이율 = 연이율 ÷ 1,200, 기말 상환, 계산 중 반올림 없음)을 정확값으로 계산하고,
 * 카드·안내·상환표가 모두 같은 정확값에서 기존 표시 규칙으로 한 번만 반올림한다.
 *
 * 원리금균등(h = 1/(1+r), E = 1 − h^n):
 *   M = rP/E, k회 원금 = rP·h^(n−k+1)/E, 이자 = rP·(1 − h^(n−k+1))/E = r·잔액(k−1), 잔액(k) = P·(1 − h^(n−k))/E, 잔액(n) = 0
 *   총이자 = nM − P (= Σ이자), 총 납입 = nM
 * 원금균등: 원금 = P/n, 이자 = r·P·(n−k+1)/n, 총이자 = rP(n+1)/2
 * 금리 1%p 인하: 같은 방식으로 max(0, 연이율 − 1)의 총이자와의 차이(0%면 원리금균등 M = P/n, 이자 0)
 *
 * 기존 calcAmortization·equalPaymentMonthly(금리 시뮬레이터·고정 vs 변동·DSR 사용)는 바꾸지 않는다.
 */
import {
  AMOUNT_LIMIT, NeedPrecision, Resolver, addQ, bitLength, cmpQ, divQ, exactIv, fmtKRW, fmtUnit,
  ivDiv, ivMul, ivNonNeg, ivOfQ, ivPow, ivScale, ivSub, mulQ, parseDecimal, parseDigits, q, reduce, roundHalfUp, subQ,
  withPrecision, type Iv, type Q,
} from "@/lib/exactMoney";
import type { RepaymentType } from "@/lib/loan";

/** 상환표 기간 상한. 표가 개월 수만큼 행을 만들기 때문에 무제한 배열·DOM을 막는다(목표 저축 기간 상한과 같은 100년). */
export const MAX_AMORTIZATION_MONTHS = 1200;

export type AmortizationRowExact = { month: number; payment: bigint; principal: bigint; interest: bigint; balance: bigint };

export type AmortizationExactResult =
  | { status: "too-large" }
  | {
      status: "ok";
      monthlyPayment: string; // formatKRW
      totalPayment: string; // formatUnit
      totalInterest: string; // formatUnit
      rateSaving: string; // formatUnit
      isProfit: boolean; // rateSaving > 0
      savingMessage: string;
      rows: AmortizationRowExact[]; // 표 칸: Math.round 정수(화면이 toLocaleString())
    };

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const HUNDRED_TWELVE = BigInt(1200);
const MANWON = BigInt(10000);

type Model = { P: bigint; c: bigint; b: bigint; n: number; c2: bigint; b2: bigint };

function message(saving: string) {
  return "금리가 1%p 낮아지면 약 " + saving + " 절약됩니다.";
}

/** 원금균등: 모든 값이 작은 유리수라 정확 계산 */
function equalPrincipal(m: Model): AmortizationExactResult {
  const { P, c, b, n } = m;
  const N = BigInt(n);
  const tp = addQ(q(P), q(c * P * (N + ONE), TWO * b));
  if (cmpQ(tp, q(AMOUNT_LIMIT)) >= 0) return { status: "too-large" };
  const ti = q(c * P * (N + ONE), TWO * b);
  const ti2 = q(m.c2 * P * (N + ONE), TWO * m.b2);
  const saving = subQ(ti, ti2);
  const rows: AmortizationRowExact[] = [];
  const pp = q(P, N);
  const ppRound = roundHalfUp(pp);
  for (let k = 1; k <= n; k++) {
    const K = BigInt(k);
    const interest = q(c * P * (N - K + ONE), b * N);
    rows.push({ month: k, payment: roundHalfUp(addQ(pp, interest)), principal: ppRound, interest: roundHalfUp(interest), balance: roundHalfUp(q(P * (N - K), N)) });
  }
  const first = addQ(pp, q(c * P, b));
  const savingText = fmtUnit(saving);
  return { status: "ok", monthlyPayment: fmtKRW(first), totalPayment: fmtUnit(tp), totalInterest: fmtUnit(ti), rateSaving: savingText, isProfit: saving.n > ZERO, savingMessage: message(savingText), rows };
}

/** 원리금균등 총이자(정확 유리수, 인하 비교·정확 대체용) */
function epExact(P: bigint, c: bigint, b: bigint, n: number) {
  const N = BigInt(n);
  if (c === ZERO) return { M: q(P, N), an: ONE, bn: ONE, D: ZERO };
  const a = b + c;
  const an = a ** N, bn = b ** N, D = an - bn;
  const M = q(c * P * an, b * D);
  return { M, an, bn, D };
}

function equalPayment(m: Model): AmortizationExactResult {
  const { P, c, b, n, c2, b2 } = m;
  const N = BigInt(n);
  const LIMIT = q(AMOUNT_LIMIT);
  // 지원 범위 사전 판정: n·r·P < 총 납입 ≤ n·P·(1+r)
  if (cmpQ(q(N * c * P, b), LIMIT) >= 0) return { status: "too-large" };
  const surelyInRange = cmpQ(q(N * P * (b + c), b), LIMIT) < 0;
  const a = b + c;

  // 정확 유리수(구간으로 정해지지 않은 값만 사용). k회 원금 = cP·a^(k−1)·b^(n−k)/D, 잔액(k) = P(a^n − a^k·b^(n−k))/D
  let cache: { M: Q; an: bigint; D: bigint } | null = null;
  const ex = () => (cache ??= epExact(P, c, b, n));
  const exPrincipal = (k: number): Q => q(c * P * a ** BigInt(k - 1) * b ** BigInt(n - k), ex().D);
  const exBalance = (k: number): Q => q(P * (ex().an - a ** BigInt(k) * b ** BigInt(n - k)), ex().D);
  const exTP = (): Q => mulQ(ex().M, q(N));
  const exTI = (): Q => subQ(exTP(), q(P));
  const exTI2 = (): Q => subQ(mulQ(epExact(P, c2, b2, n).M, q(N)), q(P));

  // 정밀도: 금액 비트 + 기간 + 작은 r·E 보정 + 여유
  const S0 = 96 + bitLength(P) + Math.max(0, bitLength(c) - bitLength(b) + 1) + Math.max(0, bitLength(b) - bitLength(c)) + 2 * bitLength(N);
  const run = (R: Resolver): AmortizationExactResult => {
    const S = R.S;
    const one = ONE << BigInt(S);
    const h = ivOfQ(q(b, a), S);
    const H: Iv[] = new Array(n + 1);
    H[0] = exactIv(one);
    for (let k = 1; k <= n; k++) H[k] = ivMul(H[k - 1], h, S);
    const E: Iv = { lo: one - H[n].hi, hi: one - H[n].lo };
    if (E.lo <= ZERO) throw new NeedPrecision();
    const rP = ivOfQ(q(c * P, b), S);
    const Ps = exactIv(P << BigInt(S));
    const M = ivDiv(rP, E, S);
    const tp = ivScale(M, N);
    if (!surelyInRange && !R.below(tp, AMOUNT_LIMIT, exTP)) return { status: "too-large" };
    const ti = ivNonNeg(ivSub(tp, Ps));
    // 1%p 인하 총이자
    let ti2: Iv;
    if (c2 === ZERO) ti2 = exactIv(ZERO);
    else {
      const h2 = ivOfQ(q(b2, b2 + c2), S);
      const H2 = ivPow(h2, N, S);
      const E2: Iv = { lo: one - H2.hi, hi: one - H2.lo };
      if (E2.lo <= ZERO) throw new NeedPrecision();
      const M2 = ivDiv(ivOfQ(q(c2 * P, b2), S), E2, S);
      ti2 = ivNonNeg(ivSub(ivScale(M2, N), Ps));
    }
    const saving = ivSub(ti, ti2);
    const exSaving = () => subQ(exTI(), exTI2());
    const savingText = R.str(saving, fmtUnit, exSaving);
    const payment = R.round(M, () => ex().M);
    const rows: AmortizationRowExact[] = new Array(n);
    for (let k = 1; k <= n; k++) {
      const Hk = H[n - k + 1];
      const principal = ivDiv(ivMul(rP, Hk, S), E, S);
      const interest = ivDiv(ivMul(rP, { lo: one - Hk.hi, hi: one - Hk.lo }, S), E, S);
      const Hb = H[n - k];
      const balance = k === n ? exactIv(ZERO) : ivDiv(ivMul(Ps, { lo: one - Hb.hi, hi: one - Hb.lo }, S), E, S);
      rows[k - 1] = {
        month: k,
        payment,
        principal: R.round(principal, () => exPrincipal(k)),
        interest: R.round(interest, () => subQ(ex().M, exPrincipal(k))),
        balance: R.round(balance, () => exBalance(k)),
      };
    }
    return {
      status: "ok",
      monthlyPayment: R.str(M, fmtKRW, () => ex().M),
      totalPayment: R.str(tp, fmtUnit, exTP),
      totalInterest: R.str(ti, fmtUnit, exTI),
      rateSaving: savingText,
      isProfit: R.positive(saving, exSaving),
      savingMessage: message(savingText),
      rows,
    };
  };

  return withPrecision(S0, Math.max(1 << 14, 8 * S0), run);
}

/**
 * 화면 raw 문자열로 상환표를 계산한다.
 * 결과 없음(null): 기존 화면과 같이 원금·이자율·개월 중 하나라도 0(빈칸·"." 포함)이면.
 * 기간 상한(1,200개월)은 화면 입력 검증이 먼저 막는다. 엔진에 넘어오면 null.
 */
export function calcAmortizationExact(principalRaw: string, rateRaw: string, monthsRaw: string, type: RepaymentType): AmortizationExactResult | null {
  const man = parseDigits(principalRaw);
  const rate = parseDecimal(rateRaw);
  const months = parseDigits(monthsRaw);
  if (man === null || rate === null || months === null) return null;
  if (man === ZERO || rate.n === ZERO || months === ZERO) return null;
  if (months > BigInt(MAX_AMORTIZATION_MONTHS)) return null;
  const P = man * MANWON;
  const r = reduce(divQ(rate, q(HUNDRED_TWELVE)));
  const rate2 = cmpQ(rate, q(ONE)) > 0 ? subQ(rate, q(ONE)) : q(ZERO);
  const r2 = reduce(divQ(rate2, q(HUNDRED_TWELVE)));
  const m: Model = { P, c: r.n, b: r.d, n: Number(months), c2: r2.n, b2: r2.d };
  return type === "equal_payment" ? equalPayment(m) : equalPrincipal(m);
}

export type { Q };
