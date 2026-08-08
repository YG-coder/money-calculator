// src/lib/dsr.ts
// ─────────────────────────────────────────────
// 스트레스 DSR 정책 엔진 (v1 — 주택담보대출 전용)
//
// 검증일: 2026-08-08
// 근거:
//   · 금융위원회 '3단계 스트레스 DSR 시행방안' 보도자료 (2025-07-01 시행)
//   · 금융위 '스트레스 DSR 3단계 행정지도 변경시행 예고' (2026-06-18)
//       — 지방 주담대는 2026-12-31까지 2단계(0.75%) 유지 유예
//   · 전국은행연합회 소비자포털 스트레스 금리 공시
//
// ⚠️ 이 상수들은 규제 변경에 따라 바뀝니다. 값 수정 시 반드시 검증일과
//    근거를 함께 갱신하세요. (지방 유예 종료일 2026-12-31 경과 시 재확인 필요)
//
// v1 범위:
//   · 대상: 주택담보대출만. (신용·기타대출은 v2 — 아래 스펙 주석 참고)
//   · 기존 부채 = 사용자가 DSR 산정용 연간 원리금을 직접 입력
//   · 신규 대출 = 원리금균등 / 원금균등 만 지원 (만기일시·거치식 제외)
//   · 금리유형 = 변동형 / 순수고정형 만 지원 (혼합형·주기형 제외)
//
// ── v2 신용대출 지원 시 필요 (검증일 2026-08-08, 출처 금융위 3단계 시행방안) ──
//   1) 게이팅: 신용대출 총잔액(기존+신규)이 1억원 초과 시에만 스트레스 적용
//   2) 스트레스 배율: 변동 100%(1.5%), 3년~5년 미만 고정 60%(≈0.9%),
//                     5년 이상 고정 0%
//   3) 원리금 산정: 실제 약정만기·상환방식 무시, 일괄 5년 만기 원금균등
//                   (원금/5년 + 이자)로 산정
//   4) 전세자금대출: 원금 제외, 이자만 DSR 반영
//   5) 추정 가능액 모드: 1억원 경계 전후로 스트레스 적용 여부가 갈리므로
//                        두 구간(무적용/적용)으로 분기 계산 필요
// ─────────────────────────────────────────────

import { monthlyRate, equalPaymentMonthly, principalFromPayment } from "@/lib/loan";

// ── 타입 ──
export type Region = "metro" | "local"; // 수도권·규제지역 / 지방(비규제)
export type RateType = "variable" | "fixed"; // 변동형 / 순수고정형(만기까지 고정)
export type DsrRepayment = "equal_payment" | "equal_principal"; // 원리금균등 / 원금균등

// ── 정책 상수 (검증일 2026-08-08) ──
export const DSR_VERIFIED_DATE = "2026-08-08";
export const LOCAL_MORTGAGE_DEFERRAL_UNTIL = "2026-12-31";

// 주담대 변동형(100%) 기준 스트레스 금리(%p)
//   수도권·규제지역 : 3.0  (3단계 하한, 상한 없음)
//   지방(비규제)     : 0.75 (2단계 유지 — 유예 ~2026-12-31)
const MORTGAGE_VARIABLE_STRESS_RATE: Record<Region, number> = {
  metro: 3.0,
  local: 0.75,
};

// DSR 규제 한도(%) 참고 기본값 — 은행권 40 / 비은행권 50
export const DSR_LIMIT = { bank: 40, nonbank: 50 } as const;

// ─────────────────────────────────────────────
// 유효 스트레스 금리(%p) — 주택담보대출
//   v1: 변동형 100%(지역별 3.0/0.75), 순수고정형 0% (혼합·주기형 미지원)
// ─────────────────────────────────────────────
export function getEffectiveStressRate(params: {
  region: Region;
  rateType: RateType;
}): number {
  // 순수고정형(만기까지 고정)은 미래 금리변동 위험이 없어 스트레스 0
  if (params.rateType === "fixed") return 0;
  return MORTGAGE_VARIABLE_STRESS_RATE[params.region];
}

// ─────────────────────────────────────────────
// 신규 대출의 DSR 산정용 연간 원리금
//   · 원리금균등 : 월 상환액 × 12
//   · 원금균등   : 첫해(부담 최대) 기준 = 원금/기간×12 + 첫 12개월 이자 합
//   ⚠️ DSR 분자는 실제 상환액과 다를 수 있음(대출종류·상환방식별 산정규칙 상이).
// ─────────────────────────────────────────────
export function calcNewLoanAnnualDebtService(
  principal: number,
  ratePercent: number,
  months: number,
  repayment: DsrRepayment,
): number {
  if (principal <= 0 || months <= 0) return 0;

  const r = monthlyRate(ratePercent);

  if (repayment === "equal_payment") {
    return equalPaymentMonthly(principal, r, months) * 12;
  }

  // 원금균등: 첫해 원리금 (원금 균등분할 + 잔액 기준 이자)
  const monthsInYear = Math.min(12, months);
  const principalPay = principal / months;
  let balance = principal;
  let interestSum = 0;

  for (let i = 0; i < monthsInYear; i++) {
    interestSum += balance * r;
    balance -= principalPay;
  }

  return principalPay * monthsInYear + interestSum;
}

// ─────────────────────────────────────────────
// 모드 A: DSR 확인
// ─────────────────────────────────────────────
export interface DsrCheckInput {
  annualIncome: number; // 원
  existingAnnualDebt: number; // 원 (직접 입력)
  newPrincipal: number; // 원
  ratePercent: number; // 실제 대출 금리(%)
  months: number;
  repayment: DsrRepayment;
  region: Region;
  rateType: RateType;
  limitPercent: number; // 선택한 DSR 기준 (40 | 50)
}

export interface DsrCheckResult {
  effectiveStressRate: number; // %p
  stressedRatePercent: number; // 실제금리 + 스트레스금리
  newAnnualDebtNormal: number; // 원
  newAnnualDebtStressed: number; // 원
  dsrNormal: number; // %
  dsrStressed: number; // %
  headroomAnnual: number; // 원 (스트레스 기준 남은 연간 상환여력, 음수면 초과)
  exceeded: boolean; // 스트레스 DSR 이 기준 초과 여부
  exceedByPct: number; // %p (dsrStressed − limit)
}

export function calcDsr(input: DsrCheckInput): DsrCheckResult {
  const effectiveStressRate = getEffectiveStressRate({
    region: input.region,
    rateType: input.rateType,
  });

  const stressedRatePercent = input.ratePercent + effectiveStressRate;

  const newAnnualDebtNormal = calcNewLoanAnnualDebtService(
    input.newPrincipal,
    input.ratePercent,
    input.months,
    input.repayment,
  );
  const newAnnualDebtStressed = calcNewLoanAnnualDebtService(
    input.newPrincipal,
    stressedRatePercent,
    input.months,
    input.repayment,
  );

  const dsrNormal =
    input.annualIncome > 0
      ? ((input.existingAnnualDebt + newAnnualDebtNormal) /
          input.annualIncome) *
        100
      : 0;
  const dsrStressed =
    input.annualIncome > 0
      ? ((input.existingAnnualDebt + newAnnualDebtStressed) /
          input.annualIncome) *
        100
      : 0;

  // 규제 게이트는 스트레스 DSR 기준
  const headroomAnnual =
    (input.annualIncome * input.limitPercent) / 100 -
    (input.existingAnnualDebt + newAnnualDebtStressed);

  return {
    effectiveStressRate,
    stressedRatePercent,
    newAnnualDebtNormal,
    newAnnualDebtStressed,
    dsrNormal,
    dsrStressed,
    headroomAnnual,
    exceeded: dsrStressed > input.limitPercent,
    exceedByPct: dsrStressed - input.limitPercent,
  };
}

// ─────────────────────────────────────────────
// 모드 B: DSR 기준 추정 가능 대출액
//   허용 연간 원리금 = 연소득 × 목표 DSR
//   신규 가용 = 허용 − 기존 (≤0이면 0)
//   원금 = principalFromPayment(월 가용, 스트레스 금리 월이율, 기간)
//   ※ 역산은 반드시 스트레스 금리 기준 (명목 역산은 한도 과대계상)
//   ※ 원리금균등 기준 역산
// ─────────────────────────────────────────────
export interface DsrEstimateInput {
  annualIncome: number; // 원
  existingAnnualDebt: number; // 원
  limitPercent: number; // 목표 DSR (40 | 50)
  ratePercent: number;
  months: number;
  region: Region;
  rateType: RateType;
}

export interface DsrEstimateResult {
  effectiveStressRate: number; // %p
  stressedRatePercent: number;
  allowedAnnualDebt: number; // 원 (연소득 × 목표DSR)
  availableForNew: number; // 원 (허용 − 기존, ≥0)
  estimatedPrincipal: number; // 원 (DSR 기준 추정 가능 대출액, 스트레스 역산)
  monthlyPaymentActual: number; // 원 (그 원금의 실제금리 기준 월 상환액 — 참고)
}

export function estimatePrincipalFromDsr(
  input: DsrEstimateInput,
): DsrEstimateResult {
  const effectiveStressRate = getEffectiveStressRate({
    region: input.region,
    rateType: input.rateType,
  });

  const stressedRatePercent = input.ratePercent + effectiveStressRate;

  const allowedAnnualDebt = (input.annualIncome * input.limitPercent) / 100;
  const availableForNew = Math.max(
    0,
    allowedAnnualDebt - input.existingAnnualDebt,
  );

  const monthlyAvailable = availableForNew / 12;
  const estimatedPrincipal = principalFromPayment(
    monthlyAvailable,
    monthlyRate(stressedRatePercent),
    input.months,
  );

  const monthlyPaymentActual = equalPaymentMonthly(
    estimatedPrincipal,
    monthlyRate(input.ratePercent),
    input.months,
  );

  return {
    effectiveStressRate,
    stressedRatePercent,
    allowedAnnualDebt,
    availableForNew,
    estimatedPrincipal,
    monthlyPaymentActual,
  };
}
