// src/lib/realEstate.ts
// 부동산 관련 순수 계산 함수 (사이드 이펙트 없음)
// formatKRW, formatUnit 은 @/lib/loan 에서 export 되어 있으므로 중복 정의 없음

/* ─────────────────────────────────────────────
   취득세 계산 (2024년 기준 주택)
───────────────────────────────────────────── */

export type OwnershipType = "first" | "second" | "third_plus";

export interface AcquisitionTaxResult {
  acquisitionTax:  number;   // 취득세 (원)
  farmSpecialTax:  number;   // 농어촌특별세 (원)
  localEduTax:     number;   // 지방교육세 (원)
  totalTax:        number;   // 합계 (원)
  taxRate:         number;   // 취득세율 (소수, e.g. 0.01)
  breakdown: {
    acquisitionTaxRate: string;   // "1%"
    farmSpecialTaxRate:  string;
    localEduTaxRate:     string;
  };
}

/**
 * 1주택 구간별 취득세율
 * 6억 이하          → 1%
 * 6억 초과 ~ 9억 이하 → (취득가액(억) × 2 − 3) %
 * 9억 초과          → 3%
 */
function firstHouseRate(priceWon: number): number {
  if (priceWon <= 600_000_000) return 0.01;
  if (priceWon <= 900_000_000) {
    const uk = priceWon / 100_000_000;
    return (uk * 2 - 3) / 100;
  }
  return 0.03;
}

function pctStr(r: number): string {
  const v = r * 100;
  return v % 1 === 0 ? `${v}%` : `${v.toFixed(1)}%`;
}

export function calcAcquisitionTax(
  priceMan: number,           // 취득가액 (만원)
  ownership: OwnershipType,
  isAdjustedArea: boolean,    // 조정대상지역 (2주택 이상에서만 유효)
): AcquisitionTaxResult {
  const priceWon = priceMan * 10_000;

  let taxRate          = 0;
  let farmSpecialTaxRate = 0;
  let localEduTaxRate  = 0;

  if (ownership === "first") {
    taxRate             = firstHouseRate(priceWon);
    farmSpecialTaxRate  = taxRate <= 0.01 ? 0 : 0.002;
    localEduTaxRate     = taxRate * 0.1;
  } else if (ownership === "second") {
    if (isAdjustedArea) {
      taxRate             = 0.08;
      farmSpecialTaxRate  = 0.006;
      localEduTaxRate     = 0.004;
    } else {
      taxRate             = firstHouseRate(priceWon);
      farmSpecialTaxRate  = taxRate <= 0.01 ? 0 : 0.002;
      localEduTaxRate     = taxRate * 0.1;
    }
  } else {
    if (isAdjustedArea) {
      taxRate             = 0.12;
      farmSpecialTaxRate  = 0.01;
      localEduTaxRate     = 0.004;
    } else {
      taxRate             = 0.08;
      farmSpecialTaxRate  = 0.006;
      localEduTaxRate     = 0.004;
    }
  }

  const acquisitionTax = Math.floor(priceWon * taxRate);
  const farmSpecialTax  = Math.floor(priceWon * farmSpecialTaxRate);
  const localEduTax     = Math.floor(priceWon * localEduTaxRate);
  const totalTax        = acquisitionTax + farmSpecialTax + localEduTax;

  return {
    acquisitionTax,
    farmSpecialTax,
    localEduTax,
    totalTax,
    taxRate,
    breakdown: {
      acquisitionTaxRate: pctStr(taxRate),
      farmSpecialTaxRate:  pctStr(farmSpecialTaxRate),
      localEduTaxRate:     pctStr(localEduTaxRate),
    },
  };
}

/* ─────────────────────────────────────────────
   월세 vs 전세 비교 계산
───────────────────────────────────────────── */

export interface JeonseVsWolseResult {
  jeonseMonthlyOpportunityCost: number;  // 전세 월 기회비용 (원)
  wolseMonthlyTotalCost:         number;  // 월세 월 실질 비용 (원)
  jeonseIsBetter:                boolean;
  monthlyDiff:                   number;  // 절대값 차이 (원)
  yearlyDiff:                    number;  // 연간 차이 (원)
  breakEvenRate:                 number;  // 손익분기 연 이자율 (%)
}

export function calcJeonseVsWolse(
  jeonseDepositMan: number,  // 전세 보증금 (만원)
  wolseDepositMan:  number,  // 월세 보증금 (만원)
  wolseMonthlyMan:  number,  // 월 임대료 (만원)
  investRatePct:    number,  // 연 이자율 (%, e.g. 3.5)
): JeonseVsWolseResult {
  const rMonthly = investRatePct / 100 / 12;

  const jeonseOpp  = jeonseDepositMan * 10_000 * rMonthly;
  const wolseDeposOpp = wolseDepositMan  * 10_000 * rMonthly;
  const wolseTotal = wolseDeposOpp + wolseMonthlyMan * 10_000;

  const rawDiff        = wolseTotal - jeonseOpp;
  const jeonseIsBetter = rawDiff > 0;
  const monthlyDiff    = Math.floor(Math.abs(rawDiff));
  const yearlyDiff     = monthlyDiff * 12;

  // 손익분기: jeonseDeposit × r/12 = wolseDeposit × r/12 + wolseMonthly
  // → r = wolseMonthly / (jeonseDeposit − wolseDeposit) × 12 × 100
  const depositDiff = jeonseDepositMan - wolseDepositMan;
  const breakEvenRate = depositDiff > 0
    ? Math.round((wolseMonthlyMan / depositDiff) * 12 * 100 * 100) / 100
    : 0;

  return {
    jeonseMonthlyOpportunityCost: Math.floor(jeonseOpp),
    wolseMonthlyTotalCost:         Math.floor(wolseTotal),
    jeonseIsBetter,
    monthlyDiff,
    yearlyDiff,
    breakEvenRate,
  };
}
