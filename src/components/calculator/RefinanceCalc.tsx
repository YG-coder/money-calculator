"use client";

import { useMemo } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { calcRefinance, formatKRW, formatUnit } from "@/lib/loan";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  { key: "remaining", kind: "money" as const, defaultValue: "" },
  { key: "oldRate", kind: "decimal" as const, defaultValue: "" },
  { key: "oldMonths", kind: "integer" as const, defaultValue: "" },
  { key: "newRate", kind: "decimal" as const, defaultValue: "" },
  { key: "newMonths", kind: "integer" as const, defaultValue: "" },
  { key: "feeRate", kind: "decimal" as const, defaultValue: "1.2" },
  { key: "otherCost", kind: "money" as const, defaultValue: "" },
];

export default function RefinanceCalc() {
  const { state, setValue } = useCalcState(FIELDS);

  // 현재 렌더의 state.raw를 직접 읽는다 (getWon/getNum의 ref는 한 박자 늦어 stale)
  const won = (key: string): number => {
    const n = Number(state[key]?.raw ?? "0");
    return isNaN(n) ? 0 : n * 10_000;
  };
  const num = (key: string): number => {
    const n = Number(state[key]?.raw ?? "0");
    return isNaN(n) ? 0 : n;
  };

  const result = useMemo(() => {
    const remaining = won("remaining");
    const oldRate = num("oldRate");
    const oldMonths = num("oldMonths");
    const newRate = num("newRate");
    const newMonths = num("newMonths");
    if (!remaining || !oldRate || !oldMonths || !newRate || !newMonths)
      return null;

    return calcRefinance({
      remainingPrincipal: remaining,
      oldRate,
      oldMonths,
      newRate,
      newMonths,
      prepaymentFeeRate: num("feeRate"),
      otherCost: won("otherCost"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-5">
      {/* ── 기존 대출 ── */}
      <div>
        <p className="mb-3 text-sm font-bold text-slate-700">기존 대출</p>
        <div className="space-y-3">
          <InputField
            label="남은 원금"
            name="remaining"
            suffix="만원"
            placeholder="예: 20,000"
            hint="단위: 만원 (2억 → 20,000)"
            value={state.remaining?.value ?? ""}
            onChange={(v) => setValue("remaining", v)}
          />
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="기존 금리"
              name="oldRate"
              suffix="%"
              step={0.1}
              placeholder="예: 5.5"
              value={state.oldRate?.value ?? ""}
              onChange={(v) => setValue("oldRate", v)}
            />
            <InputField
              label="남은 기간"
              name="oldMonths"
              suffix="개월"
              placeholder="예: 240"
              value={state.oldMonths?.value ?? ""}
              onChange={(v) => setValue("oldMonths", v)}
            />
          </div>
        </div>
      </div>

      {/* ── 새 대출 ── */}
      <div>
        <p className="mb-3 text-sm font-bold text-slate-700">새 대출 (대환)</p>
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="새 금리"
            name="newRate"
            suffix="%"
            step={0.1}
            placeholder="예: 4.0"
            value={state.newRate?.value ?? ""}
            onChange={(v) => setValue("newRate", v)}
          />
          <InputField
            label="새 기간"
            name="newMonths"
            suffix="개월"
            placeholder="예: 240"
            value={state.newMonths?.value ?? ""}
            onChange={(v) => setValue("newMonths", v)}
          />
        </div>
      </div>

      {/* ── 비용 ── */}
      <div>
        <p className="mb-3 text-sm font-bold text-slate-700">전환 비용</p>
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="중도상환수수료율"
            name="feeRate"
            suffix="%"
            step={0.1}
            placeholder="예: 1.2"
            hint="남은 원금 기준"
            value={state.feeRate?.value ?? ""}
            onChange={(v) => setValue("feeRate", v)}
          />
          <InputField
            label="기타 비용 (선택)"
            name="otherCost"
            suffix="만원"
            placeholder="예: 50"
            hint="인지세·감정료 등"
            value={state.otherCost?.value ?? ""}
            onChange={(v) => setValue("otherCost", v)}
          />
        </div>
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          {/* 순절감액 (핵심) */}
          <ResultCard
            label="순절감액 (총이자 기준)"
            value={formatUnit(result.netSaving)}
            sub="이자 절감액 − 전환비용 · 새 대출 전 기간 기준"
            highlight
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResultCard
              label="이자 절감액"
              value={formatUnit(result.interestSaving)}
              sub="기존 총이자 − 새 총이자"
            />
            <ResultCard
              label="전환비용"
              value={formatUnit(result.totalCost)}
              sub={`수수료 ${formatUnit(result.prepaymentFee)}${
                result.otherCost > 0
                  ? ` + 기타 ${formatUnit(result.otherCost)}`
                  : ""
              }`}
            />
            <ResultCard
              label="손익분기"
              value={
                result.breakEvenMonths !== null
                  ? `${result.breakEvenMonths}개월`
                  : "해당 없음"
              }
              sub="월 상환액 절감 기준"
            />
          </div>

          {/* 참고: 월 상환액·총이자 비교 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="월 상환액"
              value={`${formatKRW(result.oldMonthly)} → ${formatKRW(result.newMonthly)}`}
              sub={
                result.monthlyDiff > 0
                  ? `월 ${formatKRW(result.monthlyDiff)} 감소`
                  : result.monthlyDiff < 0
                    ? `월 ${formatKRW(-result.monthlyDiff)} 증가`
                    : "변동 없음"
              }
            />
            <ResultCard
              label="총이자"
              value={`${formatUnit(result.oldTotalInterest)} → ${formatUnit(result.newTotalInterest)}`}
              sub={
                result.interestSaving >= 0
                  ? `총이자 ${formatUnit(result.interestSaving)} 감소`
                  : `총이자 ${formatUnit(-result.interestSaving)} 증가`
              }
            />
          </div>

          {/* 기간 연장/총이자 증가 시 사실 고지 */}
          {(result.termExtended || result.interestSaving < 0) && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-slate-700">
              {result.termExtended && (
                <p>
                  새 기간이 기존보다 깁니다. 기간이 늘면 월 상환액은 줄어도 총이자는
                  늘어날 수 있으니, 손익분기(월 기준)와 순절감액(총이자 기준)을 함께
                  확인하세요.
                </p>
              )}
              {result.interestSaving < 0 && (
                <p className={result.termExtended ? "mt-2" : ""}>
                  이 조건에서는 새 대출의 총이자가 기존보다{" "}
                  {formatUnit(-result.interestSaving)} 많습니다.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 고지 ── */}
      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
        <p>
          ※ 원리금균등 상환 기준으로 계산한 참고용 추정치입니다. 중도상환수수료는
          남은 원금 전체에 수수료율을 적용합니다.
        </p>
        <p>
          ※ 손익분기는 월 상환액 절감액으로 전환비용을 회수하는 데 걸리는
          개월수입니다. 실제 수수료율·부대비용·금리 조건은 금융회사에 따라 다를 수
          있습니다.
        </p>
      </div>
    </div>
  );
}
