// src/lib/dsrEstimateDisplay.ts
// ─────────────────────────────────────────────
// DSR 기준 추정 가능액 — 화면 표시 금액 결정(DSR 계산기 전용)
//
// 왜 따로 두는가
//   역산 원금(estimatePrincipalFromDsr)은 목표 DSR에 정확히 닿는 실수 금액이다.
//   이를 공통 formatUnit(0.1억·만 반올림)으로 보이면 올림된 금액이 표시되고,
//   사용자가 그 금액을 DSR 확인 모드에 다시 넣으면 목표 DSR을 넘는다.
//   공통 formatUnit은 다른 계산기도 쓰므로 바꾸지 않고, 여기서만 처리한다.
//
// 규칙
//   1) 입력 단위인 '만원' 정수로 내림한다(상향 반올림 없음).
//   2) 그 금액을 같은 조건으로 calcDsr(DSR 확인 모드와 같은 엔진)에 넣어
//      원시 스트레스 DSR이 목표 이하인지 확인한다. 허용오차는 두지 않는다.
//      - 넘으면(부동소수 오차) 1만원씩 내린다.
//      - 1만원 더해도 넘지 않으면(역산 원금이 오차로 작게 나온 경우) 1만원씩 올린다.
//      두 방향 모두 몇 단계 안에 끝나야 정상이며, 끝나지 않으면 금액을 보이지 않는다.
//   3) 주담대는 역산과 같은 원리금균등 기준으로 확인한다.
//      신용대출은 표시 금액으로 기존 + 신규 총잔액의 1억원 경계를 다시 판정한다.
//      적용금리·구간 문구도 그 판정 결과에서 만든다.
//   4) 양수지만 1만원보다 작으면 '1만원 미만'으로 구분한다.
// ─────────────────────────────────────────────

import { equalPaymentMonthly, monthlyRate } from "@/lib/loan";
import {
  calcDsr,
  CREDIT_ESTIMATE_GATE_CAP_NOTE,
  CREDIT_ESTIMATE_NO_STRESS_NOTE,
  type DsrCheckResult,
  type DsrEstimateInput,
  type DsrEstimateResult,
  type NewLoanInput,
} from "@/lib/dsr";

/** 금액 입력 최소 단위(원) — 화면의 금액 칸은 만원 정수 */
export const DSR_INPUT_UNIT_WON = 10_000;

/** 내림·올림 확인 단계 상한. 부동소수 오차는 1단계를 넘지 않으므로 여유를 둔 값이다. */
const MAX_ADJUST_STEPS = 3;

export const DSR_BELOW_UNIT_TEXT = "1만원 미만";

export type DsrEstimateDisplay =
  | {
      kind: "amount";
      /** 화면 표시 = 재입력 금액(만원 정수) */
      manwon: number;
      won: number;
      text: string;
      /** 표시 금액을 DSR 확인 모드와 같은 조건으로 넣은 결과 */
      check: DsrCheckResult;
      stressedRatePercent: number;
      effectiveStressRate: number;
      /** 주담대만: 표시 금액 기준 실제 금리 원리금균등 월 상환액 */
      monthlyPaymentActual: number | null;
      notes: string[];
    }
  | { kind: "belowUnit"; text: string; notes: string[] }
  | { kind: "unverified"; reason: string };

/** 만원 정수 → '3억 2,456만원' · '1억원' · '2,456만원' (1만원 이상만) */
export function formatDsrManwon(manwon: number): string {
  const eok = Math.floor(manwon / 10_000);
  const man = manwon % 10_000;
  const n = (v: number) => v.toLocaleString("ko-KR");
  if (eok > 0 && man > 0) return `${n(eok)}억 ${n(man)}만원`;
  if (eok > 0) return `${n(eok)}억원`;
  return `${n(man)}만원`;
}

function withAmount(loan: NewLoanInput, won: number): NewLoanInput {
  return loan.kind === "mortgage"
    ? { ...loan, principal: won, repayment: "equal_payment" }
    : { ...loan, amount: won };
}

export function resolveDsrEstimateDisplay(
  input: DsrEstimateInput,
  estimate: DsrEstimateResult,
): DsrEstimateDisplay {
  const raw = estimate.estimatedPrincipal;
  if (!Number.isFinite(raw) || raw <= 0) {
    return { kind: "unverified", reason: "추정 가능액을 확인하지 못해 금액을 표시하지 않습니다." };
  }

  const check = (manwon: number) =>
    calcDsr({
      annualIncome: input.annualIncome,
      existing: input.existing,
      newLoan: withAmount(input.newLoan, manwon * DSR_INPUT_UNIT_WON),
      limitPercent: input.limitPercent,
      asOf: input.asOf,
    });
  const within = (r: ReturnType<typeof check>) => r.status === "ok" && !r.value.exceeded;

  let manwon = Math.floor(raw / DSR_INPUT_UNIT_WON);
  if (!Number.isSafeInteger((manwon + MAX_ADJUST_STEPS) * DSR_INPUT_UNIT_WON)) {
    return { kind: "unverified", reason: "추정 가능액이 너무 커서 만원 단위로 정확히 표시할 수 없습니다." };
  }

  // 원시 정방향 DSR이 목표를 넘으면 1만원씩 내린다.
  let result = manwon > 0 ? check(manwon) : null;
  if (result && result.status !== "ok") return { kind: "unverified", reason: result.reason };
  for (let step = 0; manwon > 0 && result && !within(result); step++) {
    if (step >= MAX_ADJUST_STEPS) {
      return { kind: "unverified", reason: "표시 금액이 목표 DSR 이하인지 확인하지 못해 금액을 표시하지 않습니다." };
    }
    manwon -= 1;
    result = manwon > 0 ? check(manwon) : null;
  }

  // 1만원 더해도 목표 이하라면 역산 원금이 작게 나온 것이므로 올린다(불필요한 축소 방지).
  for (let step = 0; ; step++) {
    const next = check(manwon + 1);
    if (!within(next)) break;
    if (step >= MAX_ADJUST_STEPS) {
      return { kind: "unverified", reason: "표시 금액이 목표 DSR 이하인 가장 큰 금액인지 확인하지 못해 금액을 표시하지 않습니다." };
    }
    manwon += 1;
    result = next;
  }

  if (manwon <= 0 || !result) {
    return { kind: "belowUnit", text: DSR_BELOW_UNIT_TEXT, notes: estimate.notes };
  }
  if (result.status !== "ok") return { kind: "unverified", reason: result.reason };

  const value = result.value;
  const won = manwon * DSR_INPUT_UNIT_WON;
  const loan = input.newLoan;

  let notes = estimate.notes;
  if (loan.kind === "credit") {
    // 구간 문구는 표시 금액으로 다시 판정한 총잔액 기준으로 고른다.
    const others = estimate.notes.filter(
      (n) => n !== CREDIT_ESTIMATE_NO_STRESS_NOTE && n !== CREDIT_ESTIMATE_GATE_CAP_NOTE,
    );
    const belowGate = value.creditGatePassed === false;
    // 역산이 경계 직전 금액이었거나(스트레스 구간 원금을 내린 결과 1억원 이하가 된 경우 포함) 경계에서 한도가 멈춘 경우
    const capped = belowGate && (estimate.cappedAtCreditGate || estimate.effectiveStressRate > 0);
    notes = [
      ...(capped ? [CREDIT_ESTIMATE_GATE_CAP_NOTE] : belowGate ? [CREDIT_ESTIMATE_NO_STRESS_NOTE] : []),
      ...others,
    ];
  }

  return {
    kind: "amount",
    manwon,
    won,
    text: formatDsrManwon(manwon),
    check: value,
    stressedRatePercent: value.stressedRatePercent,
    effectiveStressRate: value.effectiveStressRate,
    monthlyPaymentActual:
      loan.kind === "mortgage"
        ? equalPaymentMonthly(won, monthlyRate(loan.ratePercent), loan.months)
        : null,
    notes,
  };
}
