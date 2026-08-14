"use client";

import { useMemo } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { formatKRW } from "@/lib/loan";
import { calcRealInterestRate } from "@/lib/finance";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  { key: "nominal", kind: "decimal" as const, defaultValue: "" },
  { key: "inflation", kind: "decimal" as const, defaultValue: "" },
  { key: "principal", kind: "money" as const, defaultValue: "" },
];

export default function RealInterestCalc() {
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
  const filled = (key: string) => (state[key]?.raw ?? "") !== "";

  const result = useMemo(() => {
    if (!filled("nominal") || !filled("inflation")) return null;

    return calcRealInterestRate({
      nominalRate: num("nominal"),
      inflationRate: num("inflation"),
      principal: won("principal") || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="예금 금리 (명목)"
          name="nominal"
          suffix="%"
          step={0.1}
          placeholder="예: 5.0"
          value={state.nominal?.value ?? ""}
          onChange={(v) => setValue("nominal", v)}
        />
        <InputField
          label="물가 상승률"
          name="inflation"
          suffix="%"
          step={0.1}
          placeholder="예: 3.0"
          value={state.inflation?.value ?? ""}
          onChange={(v) => setValue("inflation", v)}
        />
      </div>

      <InputField
        label="예치 금액 (선택)"
        name="principal"
        suffix="만원"
        placeholder="예: 1,000"
        hint="입력하면 1년 기준 명목 이자와 실질 가치 증감을 금액으로 보여줍니다."
        value={state.principal?.value ?? ""}
        onChange={(v) => setValue("principal", v)}
      />

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          {/* 실질금리 (정확식 메인) */}
          <ResultCard
            label="실질금리 (물가 반영)"
            value={`${result.realRateExact.toFixed(2)}%`}
            sub={`피셔 정확식 · 근사식(명목−물가) ${result.realRateApprox.toFixed(2)}% · 근사 오차 ${result.approxGap >= 0 ? "+" : ""}${result.approxGap.toFixed(2)}%p`}
            highlight
          />

          {/* 구매력 해석 (중립·사실) */}
          <div
            className={`rounded-2xl border p-4 text-sm ${
              result.realRateExact < 0
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            {result.realRateExact > 0 ? (
              <p>
                예금 금리가 물가상승률보다 높아, 돈의 구매력이 실질{" "}
                <strong>{result.realRateExact.toFixed(2)}%</strong> 늘어납니다.
              </p>
            ) : result.realRateExact < 0 ? (
              <p>
                물가상승률이 예금 금리보다 높아, 이자를 받아도 구매력이 실질{" "}
                <strong>{Math.abs(result.realRateExact).toFixed(2)}%</strong>{" "}
                줄어듭니다.
              </p>
            ) : (
              <p>예금 금리와 물가상승률이 같아, 구매력에 변화가 없습니다.</p>
            )}
          </div>

          {/* 예치금액 입력 시: 1년 기준 금액 */}
          {result.nominalInterest1y !== null && result.realGain1y !== null && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultCard
                label="명목 이자 (1년·세전)"
                value={formatKRW(result.nominalInterest1y)}
                sub="입력한 명목금리 기준 (이자소득세 미반영)"
              />
              <ResultCard
                label="실질 가치 증감 (1년)"
                value={formatKRW(result.realGain1y)}
                sub="세전 명목금리에 물가를 반영한 값"
              />
            </div>
          )}
        </div>
      )}

      {/* ── 고지 ── */}
      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
        <p>
          ※ 실질금리는 명목금리에서 물가상승률을 반영한 값으로, 돈의 구매력이 실제로
          얼마나 늘거나 주는지를 나타냅니다. 이 계산기는 투자 수익이 아니라 예금·현금의
          구매력 관점만 다룹니다.
        </p>
        <p>
          ※ 정확식은 피셔 방정식 (1+명목)÷(1+물가)−1이며, 근사식(명목−물가)은 물가가
          높을수록 실질금리를 실제보다 크게 보이게 합니다. 금액은 입력한 물가상승률이
          유지된다는 가정의 1년 기준 예시입니다.
        </p>
      </div>
    </div>
  );
}
