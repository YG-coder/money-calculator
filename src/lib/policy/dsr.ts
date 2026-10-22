// src/lib/policy/dsr.ts
// 스트레스 DSR 정책 테이블 — 2026-10-20 공식 원문 대조
//
// ⚠️ 이 파일은 정책값만 담습니다. 계산은 @/lib/dsr 에서 합니다.
//    값을 수정할 때는 반드시 같은 커밋에서 verifiedAt 과 sources 를 갱신하세요.
//
// 조사 근거: docs/policies/DSR-POLICY-2026-08.md (rev.3)
//
// ─────────────────────────────────────────────
// ⚠️ 재검증 트리거가 법령이 아닙니다
//
//   취득세·중개보수는 법령 개정으로 추적할 수 있지만, 스트레스 DSR 은
//   금융위원회 '행정지도'로 운용됩니다. 따라서 "시행일"이 아니라
//   아래 두 가지가 재검증 시점입니다.
//     · 스트레스 금리 반기 발표 (매년 6월 · 12월)
//     · 가계부채 관리방안 발표
// ─────────────────────────────────────────────

import type { PolicyMeta, PolicyTable } from "@/lib/policy/types";

// ─────────────────────────────────────────────
// 조건 축
// ─────────────────────────────────────────────

/**
 * 주택담보대출의 지역 구분 (2분법).
 *
 * ⚠️ @/lib/policy/ltv 의 LtvRegion(3분법)과 이름이 비슷하지만 다릅니다.
 *    두 타입을 서로 대입하지 마세요.
 *
 * ⚠️ 이 축은 **주택담보대출 전용**입니다. 신용대출 스트레스 금리는
 *    전국 동일하므로 신용대출 계산 경로에 이 타입을 넘기지 마세요.
 *    (넘길 수 없도록 getCreditStressRatePct 는 지역 인자를 받지 않습니다)
 */
export type MortgageRegion = "metro" | "local";
export type MortgageRateType = "variable" | "fixed" | "hybrid" | "periodic";

/**
 * 신용대출의 금리유형 축 — **고정금리 기간** 기준.
 *
 * ⚠️ 주택담보대출의 금리유형 축(변동 / 혼합형 / 주기형)과 다른 축입니다.
 *    두 표는 구조가 닮았을 뿐 서로 다른 표이며, 값을 교차 적용하면 안 됩니다.
 */
export type CreditFixedTerm =
  | "fixed5plus" // 만기 5년 이상 고정
  | "fixed3to5" // 만기 3년 이상 5년 미만 고정
  | "other"; // 변동형 등 그 밖의 대출

export const CREDIT_FIXED_TERM_LABEL: Record<CreditFixedTerm, string> = {
  fixed5plus: "5년 이상 고정금리",
  fixed3to5: "3년 이상 5년 미만 고정금리",
  other: "변동금리 등 그 밖",
};

// ─────────────────────────────────────────────
// 일반 스트레스 금리 — 반기 산정값
//
//   스트레스 금리 = 과거 5년 中 최고 가계대출 금리 − 현재 금리(5월·11월)
//                   단, 일반대출은 하한 1.5%p · 상한 3.0%p
//   발표 연 2회(6월·12월), 발표 이후 6개월 적용.
//
//   ⚠️ currentPct 는 **상수가 아니라 이번 반기의 산정 결과**입니다.
//      현재는 산정 결과가 하한에 걸려 1.5% 입니다.
//      2026년 12월 발표 시 갱신하고 applicableHalf 도 함께 올리세요.
//      이 값 하나만 바꾸면 신용대출·지방 주담대가 함께 움직입니다(파생 함수 참고).
// ─────────────────────────────────────────────

export const STRESS_RATE = {
  /** 2026-H2 산정 결과 (%p) — 하한에 걸린 상태 */
  currentPct: 1.5,
  /** 일반대출 하한 (%p) */
  minPct: 1.5,
  /** 일반대출 상한 (%p) */
  maxPct: 3.0,
  /** 적용 반기 */
  applicableHalf: "2026-H2",
  effectiveFrom: "2026-07-01",
  effectiveUntil: "2026-12-31",
} as const;

// ─────────────────────────────────────────────
// 게이팅 기준 — 두 개의 1억원
//
//   ⚠️ 값이 같다고 하나로 합치지 마세요. 의미가 다르므로
//      한쪽 정책이 바뀌면 다른 쪽이 조용히 따라 움직입니다.
// ─────────────────────────────────────────────

/** 차주단위 DSR 적용 기준 — 차주의 **총 대출** 기준 */
export const DSR_APPLICATION_THRESHOLD_WON = 100_000_000;

/** 신용대출 스트레스 게이팅 — **신용대출 총잔액(기존 + 신규)** 기준 */
export const CREDIT_STRESS_GATE_WON = 100_000_000;

// ─────────────────────────────────────────────
// 주택담보대출 스트레스 금리
// ─────────────────────────────────────────────

/**
 * 수도권·규제지역 주담대의 **강화 하한** (%p).
 * 10·15 대책 이후 적용.
 *
 * ⚠️ "하한"이므로 문언대로면 max(현재 스트레스 금리, 3.0) 입니다.
 *    현재 일반 스트레스 금리(1.5%)와 그 상한(3.0%) 모두 3.0 을 넘지 않으므로,
 *    "하한 해석"과 "고정값 3.0 해석"은 지금 같은 값을 냅니다.
 *    값 대신 관계를 남기기 위해 max() 로 구현합니다.
 */
export const METRO_MORTGAGE_MINIMUM_PCT = 3.0;

/**
 * 지방 비규제지역 주담대에 적용되는 2단계 적용비율.
 * 유예 조치이며 종료일은 LOCAL_MORTGAGE_DEFERRAL_UNTIL.
 */
export const LOCAL_MORTGAGE_PHASE_RATIO = 0.5;

/**
 * 지방 주담대 2단계(0.75%) 유지 유예 종료일.
 *
 * ⚠️ 이미 두 차례 연장된 이력이 있습니다. 이 날짜가 지나면 값이 자동으로
 *    틀려지므로, 경과 여부를 isLocalDeferralActive() 로 확인하세요.
 */
export const LOCAL_MORTGAGE_DEFERRAL_UNTIL = "2026-12-31";

// ─────────────────────────────────────────────
// 신용대출 금리유형별 스트레스 적용비율
//
//   근거: 금융위원회 2026-07-01 변경 시행 행정지도 및 은행연합회 2026-H2 공시.
// ─────────────────────────────────────────────

const DSR_META: PolicyMeta = {
  id: "dsr-stress",
  version: "2.1.0",
  effectiveFrom: "2026-07-01", // 현재 반기 스트레스 금리 적용 개시일
  effectiveUntil: "2026-12-31", // 반기 종료 = 재산정 시점
  verifiedAt: "2026-10-21",
  sources: [
    {
      name: "금융위원회 「스트레스 DSR 제도」 변경 시행 — 2026-07-01~12-31 최종 행정지도",
      url: "https://better.fsc.go.kr/fsc_new/status/adminMap/OpertnDetail.do?muNo=145&postNo=4215&stNo=11",
    },
    {
      name: "은행연합회 스트레스금리 공시 — 2026년 하반기 적용값",
      url: "https://portal.kfb.or.kr/compare/stress_loan.php",
      publishedAt: "2026-06-30",
    },
    {
      name: "은행업감독업무시행세칙 (2026-06-30 시행) 별표18 표3·주1 — 신용대출 원리금·한도대출",
      url: "https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2200000108789&chrClsCd=010201",
      publishedAt: "2026-06-26",
    },
    {
      name: "은행업감독규정 (2026-10-02 시행) 별표6 — 총대출 1억원 초과·은행 DSR 40%",
      url: "https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000285624&chrClsCd=010201",
      publishedAt: "2026-09-29",
    },
    {
      name: "금융위원회 주택담보대출 리스크관리 기준 (2026-08-31 변경 시행) — 10쪽 전세대출·19쪽 경과조치",
      url: "https://better.fsc.go.kr/fsc_new/file/displayFile.do?filePath=/2026/08/28&orgFileName=260813_%EC%A3%BC%ED%83%9D%EB%8B%B4%EB%B3%B4%EB%8C%80%EC%B6%9C%EC%97%90%20%EB%8C%80%ED%95%9C%20%EB%A6%AC%EC%8A%A4%ED%81%AC%20%EA%B4%80%EB%A6%AC%20%EA%B8%B0%EC%A4%80%20%ED%96%89%EC%A0%95%EC%A7%80%EB%8F%84.pdf&sysFileName=9150b4d6f5564462ab5cf218254697e9.pdf",
    },
  ],
  supported: [
    "신용대출 총잔액 1억원 초과 게이팅",
    "신용대출 금리유형별 적용비율 (5년 이상 고정 0% / 3~5년 고정 60% / 그 밖 100%)",
    "수도권·규제지역 주택담보대출 스트레스 금리",
    "지방 비규제지역 주택담보대출 유예 스트레스 금리",
    "주택담보대출 혼합형·주기형의 5년·만기 대비 30/50/70% 경계와 공시 적용금리",
    "차주단위 DSR 한도 (은행 40% / 비은행 50%)",
  ],
  unsupported: [
    "분할상환 신용대출의 상품별 요건 자동 판정 (금융회사 확인값 직접 입력)",
    "기타대출 종류별 세부 산정만기",
    "보증기관(HF·HUG·SGI)별 전세자금대출 취급 차이",
    "스트레스 DSR 4단계 (확정 시행일·수치 확인 불가)",
    "지방 주담대 유예의 2026-12-31 이후 처리",
  ],
  note:
    "2026-10-21에 주담대 금리유형 표를 2026년 하반기 최종 행정지도와 은행연합회 공시로 재대조했습니다. " +
    "그 밖의 산정 기준은 2026-10-20 대조 범위입니다. " +
    "신용대출 원리금은 2026년 시행 은행업감독업무시행세칙 별표18에 따라 " +
    "일시상환 기준 원금/5년과 이자를 합산합니다. 상품별 예외와 경과조치는 자동 판정하지 않습니다.",
  nextReviewHint:
    "2026년 12월 스트레스 금리 반기 발표 / 지방 주담대 유예 2026-12-31 만료 / 차기 가계부채 관리방안 발표",
  // 스트레스 금리는 6월·12월 발표. 12월 발표 전에 확인한다.
  reviewBy: "2026-12-01",
};

export interface CreditStressCondition {
  fixedTerm: CreditFixedTerm;
}

/** 신용대출 금리유형별 스트레스 적용비율 (0~1) */
export const CREDIT_STRESS_RATIO_TABLE: PolicyTable<
  CreditStressCondition,
  number
> = {
  meta: DSR_META,
  entries: [
    {
      conditions: { fixedTerm: "fixed5plus" },
      value: 0,
      note: "만기 5년 이상 고정금리 — 스트레스 금리 미적용",
    },
    {
      conditions: { fixedTerm: "fixed3to5" },
      value: 0.6,
      note: "만기 3년 이상 5년 미만 고정금리 — 스트레스 금리의 60%",
    },
    {
      conditions: { fixedTerm: "other" },
      value: 1,
      note: "변동금리 등 그 밖의 대출 — 스트레스 금리의 100%",
    },
  ],
};

export const DSR_POLICY_META = DSR_META;

/**
 * 2026-H2 혼합·주기형 공시표. 값의 단위는 %p.
 * 금융위 2026-07-01 최종 행정지도 1쪽: 5년 미만은 변동형, 그 이상은
 * 고정기간/금리변동주기를 약정만기로 나눈 비중으로 구분한다.
 * 은행연합회 2026-06-30 '실제 적용 스트레스 금리'를 그대로 저장한다.
 * 특히 지방 주기형 0.23/0.08은 0.225/0.075를 JS toFixed로 재생성하지 않는다.
 * 다음 반기는 기준금리만 바꾸지 말고 이 표·적용기간·5년 기준도 재대조한다.
 */
export const MORTGAGE_PRODUCT_POLICY = {
  effectiveFrom: "2026-07-01",
  effectiveUntil: "2026-12-31",
  minimumFixedMonths: 60,
  bands: [
    { minSharePct: 0, label: "30% 미만", metro: { hybrid: 2.4, periodic: 1.2 }, local: { hybrid: 0.45, periodic: 0.23 } },
    { minSharePct: 30, label: "30% 이상 50% 미만", metro: { hybrid: 1.8, periodic: 0.9 }, local: { hybrid: 0.3, periodic: 0.15 } },
    { minSharePct: 50, label: "50% 이상 70% 미만", metro: { hybrid: 1.2, periodic: 0.6 }, local: { hybrid: 0.15, periodic: 0.08 } },
    { minSharePct: 70, label: "70% 이상", metro: { hybrid: 0, periodic: 0 }, local: { hybrid: 0, periodic: 0 } },
  ],
} as const;

/** 혼합·주기형의 기간을 추정하지 않는다. 금리형식이 다른 대출의 숨은 값은 무시한다. */
export function mortgagePeriodError(params: {
  rateType: MortgageRateType;
  months?: number;
  fixedMonths?: number;
}): string | null {
  if (params.rateType !== "hybrid" && params.rateType !== "periodic") return null;
  const { months, fixedMonths } = params;
  if (!Number.isSafeInteger(months) || !Number.isSafeInteger(fixedMonths) ||
      months === undefined || fixedMonths === undefined || months <= 0 || fixedMonths <= 0) {
    return "약정 대출만기와 고정금리 기간·금리변동주기를 각각 1개월 이상의 정수로 입력해 주세요.";
  }
  if (fixedMonths > months) {
    return "고정금리 기간·금리변동주기는 약정 대출만기보다 길 수 없습니다. 계약 조건을 확인해 주세요.";
  }
  return null;
}

export function getMortgageProductStressRatePct(params: {
  region: MortgageRegion;
  rateType: MortgageRateType;
  months?: number;
  fixedMonths?: number;
  asOf: string;
}): number | null {
  const { region, rateType, months, fixedMonths, asOf } = params;
  // 일반 반기 값과 상품별 공시표 양쪽이 모두 유효해야 한다.
  if (!isStressRateEffective(asOf) || asOf < MORTGAGE_PRODUCT_POLICY.effectiveFrom ||
      asOf > MORTGAGE_PRODUCT_POLICY.effectiveUntil) return null;
  if (region !== "metro" && region !== "local") return null;
  if (rateType === "fixed") return 0;
  if (rateType === "variable") return getMortgageStressRatePct({ region, asOf });
  if (rateType !== "hybrid" && rateType !== "periodic") return null;
  if (mortgagePeriodError(params) || months === undefined || fixedMonths === undefined) return null;
  // 비중이 70% 이상이어도 5년 미만이면 먼저 변동형 규칙을 적용한다.
  if (fixedMonths < MORTGAGE_PRODUCT_POLICY.minimumFixedMonths) {
    return getMortgageStressRatePct({ region, asOf });
  }
  // 월 정수의 교차 곱으로 경계를 비교한다. 표시용 비율 반올림을 판정에 쓰지 않는다.
  const numerator = BigInt(fixedMonths) * BigInt(100);
  const denominator = BigInt(months);
  const band = MORTGAGE_PRODUCT_POLICY.bands.findLast(
    (entry) => numerator >= denominator * BigInt(entry.minSharePct),
  );
  return band ? band[region][rateType] : null;
}

// ─────────────────────────────────────────────
// 산정만기
// ─────────────────────────────────────────────

/**
 * 신용대출(일시상환·마이너스통장)의 DSR 산정만기(년).
 *
 * ⚠️ "모든 신용대출 5년"이 아닙니다. 요건을 갖춘 분할상환 신용대출은
 *    2026-06-30 시행 세칙 별표18 표3의 약정만기(5~10년)를 적용합니다.
 *    주3: 거치 없이 월별/분기별 균등분할, 총액의 40% 이상 분할상환.
 *    → 상품 요건은 자동 판단하지 않고 금융회사 확인 원리금을 직접 입력합니다.
 */
export const CREDIT_ASSESSMENT_TERM_YEARS = 5;

/**
 * 마이너스통장은 사용잔액이 아니라 **약정한도 전액**을 대출금액으로 봅니다.
 * 사용액이 0원이어도 한도가 유지되면 DSR 에 영향을 줍니다.
 *
 * 근거: 2026-06-30 시행 은행업감독업무시행세칙 별표18 표3 주1.
 *       한도대출의 원금 및 이자 산정 시 대출총액을 한도금액으로 적용.
 */
export const CREDIT_LINE_USES_FULL_LIMIT = true;

// ─────────────────────────────────────────────
// 차주단위 DSR 한도
// ─────────────────────────────────────────────

export const DSR_LIMIT = { bank: 40, nonbank: 50 } as const;

// ─────────────────────────────────────────────
// 파생 계산
//
//   ⚠️ 아래 함수들은 모두 STRESS_RATE.currentPct 하나에서 파생됩니다.
//      반기 발표로 그 값이 바뀌면 신용대출과 지방 주담대가 함께 움직입니다.
//      개별 상수(0.75 등)를 따로 박아두지 마세요.
//
//   ⚠️ 적용 기간(STRESS_RATE.effectiveUntil)이 지나면 두 함수 모두 null 을
//      돌려줍니다. 만료된 반기 금리로 계산하면 안 되기 때문입니다.
//      PolicyMeta.effectiveUntil 의 expired 판정과 런타임 동작이 여기서 일치합니다.
// ─────────────────────────────────────────────

/** 백분율 계산의 부동소수점 오차 제거 (1.5 × 0.6 = 0.8999… → 0.9) */
function roundPct(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/**
 * 신용대출의 유효 스트레스 금리(%p).
 *
 * ⚠️ 지역 인자를 받지 않습니다. 지방 유예는 주택담보대출 한정이며
 *    신용대출 스트레스 금리는 전국 동일합니다.
 *
 * @param fixedTerm 고정금리 기간 구분
 * @param creditTotalWon 신용대출 총잔액(기존 + 신규). 1억원 이하면 0 을 돌려줍니다.
 */
/**
 * 반기 스트레스 금리가 기준일에 유효한가.
 *
 * ⚠️ STRESS_RATE.currentPct 는 **이번 반기의 산정 결과**다. 적용 기간이 끝나면
 *    그 값은 더 이상 현행 정책값이 아니다. 다음 발표값을 확인하기 전에는
 *    계산하지 않는다 — 만료된 금리로 한도를 내면 조용한 오답이 된다.
 */
export function isStressRateEffective(asOf: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) return false;
  const date = new Date(`${asOf}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === asOf &&
    asOf >= STRESS_RATE.effectiveFrom &&
    asOf <= STRESS_RATE.effectiveUntil
  );
}

/**
 * 신용대출의 유효 스트레스 금리(%p).
 *
 * ⚠️ 지역 인자를 받지 않는다 (지방 유예는 주담대 한정, 신용대출은 전국 동일).
 * ⚠️ 반기 적용 기간이 지나면 null 을 돌려준다. 호출부가 계산을 막아야 한다.
 */
export function getCreditStressRatePct(params: {
  fixedTerm: CreditFixedTerm;
  creditTotalWon: number;
  asOf: string;
}): number | null {
  if (!isStressRateEffective(params.asOf)) return null;

  if (params.creditTotalWon <= CREDIT_STRESS_GATE_WON) return 0;

  const ratio = CREDIT_STRESS_RATIO_TABLE.entries.find(
    (e) => e.conditions.fixedTerm === params.fixedTerm,
  )?.value;

  // 테이블에 없는 조합은 추정하지 않는다 — 호출부에서 unsupported 처리
  if (ratio === undefined) return 0;

  return roundPct(STRESS_RATE.currentPct * ratio);
}

/** 지방 주담대 유예가 기준일 현재 살아 있는지 */
export function isLocalDeferralActive(asOf: string): boolean {
  return asOf <= LOCAL_MORTGAGE_DEFERRAL_UNTIL;
}

/**
 * 주택담보대출의 유효 스트레스 금리(%p) — 변동형(적용비율 100%) 기준.
 *
 *   수도권·규제지역 : max(현재 스트레스 금리, 강화 하한 3.0)
 *   지방 비규제     : 현재 스트레스 금리 × 2단계 적용비율 50%
 *
 * 지방 유예가 만료되면 지방도 수도권과 같은 산식으로 넘어가는지 여부는
 * 확인되지 않았습니다. 만료 시점에는 값을 돌려주지 않고 재검증합니다.
 */
export function getMortgageStressRatePct(params: {
  region: MortgageRegion;
  asOf: string;
}): number | null {
  // 반기 산정 기간이 끝나면 지역과 무관하게 계산하지 않는다.
  // 수도권 하한 3.0 도 강화 대책의 산물이라 새 정책 확인 전에는 보장되지 않는다.
  if (!isStressRateEffective(params.asOf)) return null;

  if (params.region === "metro") {
    return roundPct(
      Math.max(STRESS_RATE.currentPct, METRO_MORTGAGE_MINIMUM_PCT),
    );
  }

  // 지방 — 유예 만료 후 처리는 확인 불가
  if (!isLocalDeferralActive(params.asOf)) return null;

  return roundPct(STRESS_RATE.currentPct * LOCAL_MORTGAGE_PHASE_RATIO);
}
