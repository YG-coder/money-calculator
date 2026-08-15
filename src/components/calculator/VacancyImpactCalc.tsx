"use client";

import { useMemo } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { formatKRW, formatUnit } from "@/lib/loan";
import { calcVacancyImpact } from "@/lib/realEstate";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  { key: "rent", kind: "money" as const, defaultValue: "" },
  { key: "vacancy", kind: "decimal" as const, defaultValue: "" },
  { key: "opCost", kind: "money" as const, defaultValue: "" },
  { key: "price", kind: "money" as const, defaultValue: "" },
];

export default function VacancyImpactCalc() {
  const { state, setValue } = useCalcState(FIELDS);

  // 현재 렌더의 state.raw를 직접 읽는다 (getWon/getNum의 ref는 한 박자 늦어 stale)
  const man = (key: string): number => {
    const n = Number(state[key]?.raw ?? "0");
    return isNaN(n) ? 0 : n;
  };
  const filled = (key: string) => (state[key]?.raw ?? "") !== "";

  const result = useMemo(() => {
    const rent = man("rent");
    const vacancy = man("vacancy");
    // 월세·공실률 필수, 운영비/매입가는 선택. 공실률 0~100 범위 가드.
    if (!rent || !filled("vacancy") || vacancy < 0 || vacancy > 100) return null;

    return calcVacancyImpact({
      monthlyRentMan: rent,
      vacancyRatePct: vacancy,
      monthlyOpCostMan: man("opCost"),
      purchasePriceMan: man("price") || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="월세"
          name="rent"
          suffix="만원"
          min={0}
          placeholder="예: 100"
          value={state.rent?.value ?? ""}
          onChange={(v) => setValue("rent", v)}
        />
        <InputField
          label="공실률"
          name="vacancy"
          suffix="%"
          step={1}
          min={0}
          max={100}
          placeholder="예: 10"
          hint="연간 비어 있는 비율"
          value={state.vacancy?.value ?? ""}
          onChange={(v) => setValue("vacancy", v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="월 운영비 (선택)"
          name="opCost"
          suffix="만원"
          min={0}
          placeholder="예: 10"
          hint="관리비·수선 등 고정 지출"
          value={state.opCost?.value ?? ""}
          onChange={(v) => setValue("opCost", v)}
        />
        <InputField
          label="매입가 (선택)"
          name="price"
          suffix="만원"
          min={0}
          placeholder="예: 50,000"
          hint="입력 시 실효 수익률 표시"
          value={state.price?.value ?? ""}
          onChange={(v) => setValue("price", v)}
        />
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          {/* 1) 공실 반영 임대수입 · 2) 줄어든 금액 · 3) 공실 개월수 */}
          <ResultCard
            label="공실 반영 연 임대수입"
            value={formatKRW(result.effectiveIncome)}
            sub={`만실 ${formatUnit(result.grossAnnualIncome)} 기준`}
            highlight
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="공실로 줄어든 금액"
              value={formatKRW(result.vacancyLoss)}
              sub={`임대수입 감소율 ${result.incomeDropPct.toFixed(1)}%`}
            />
            <ResultCard
              label="예상 공실 기간"
              value={`${result.vacancyMonths.toFixed(1)}개월`}
              sub="연 12개월 기준 환산"
            />
          </div>

          {/* 4) 연 운영비 · 5) 공실 반영 순수익 · 6) 순수익 감소율 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="연 운영비"
              value={formatKRW(result.annualOpCost)}
              sub="공실과 무관하게 지출"
            />
            <ResultCard
              label="공실 반영 순수익"
              value={formatKRW(result.effectiveNetIncome)}
              sub={`만실 순수익 ${formatUnit(result.fullNetIncome)} 대비`}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-700">
            {result.netDropPct === null ? (
              <span>
                만실 순수익이 0 이하라 순수익 감소율은{" "}
                <strong className="text-slate-900">산정 불가</strong>입니다
                (운영비가 임대수입을 초과).
              </span>
            ) : (
              <>
                만실 대비 순수익 감소율{" "}
                <strong className="text-slate-900">
                  {result.netDropPct.toFixed(2)}%
                </strong>
                {result.netDropPct > result.incomeDropPct && (
                  <span className="text-slate-500">
                    {" "}
                    — 운영비는 그대로라 임대수입 감소율(
                    {result.incomeDropPct.toFixed(1)}%)보다 큽니다
                  </span>
                )}
              </>
            )}
          </div>

          {/* 7) 매입가 입력 시: 만실 vs 공실 반영 수익률 */}
          {result.fullNetYield !== null && result.effectiveNetYield !== null && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultCard
                label="만실 순수익률"
                value={`${result.fullNetYield.toFixed(2)}%`}
                sub="공실 없다고 가정"
              />
              <ResultCard
                label="공실 반영 실효 수익률"
                value={`${result.effectiveNetYield.toFixed(2)}%`}
                sub="공실·운영비 반영"
              />
            </div>
          )}
        </div>
      )}

      {/* ── 고지 ── */}
      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
        <p>
          ※ 입력한 공실률과 운영비를 기준으로 단순 시뮬레이션한 값입니다. 실제
          공실·수선비·세금·중개비 등은 임대 조건과 시장 상황에 따라 달라질 수
          있습니다.
        </p>
        <p>
          ※ 이 계산기는 매물의 투자 가치를 판단하거나 추천하지 않습니다. 공실이
          수익에 미치는 영향을 수치로 보여주는 참고용 도구입니다.
        </p>
      </div>
    </div>
  );
}
