"use client";

import { useMemo } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { formatKRW } from "@/lib/loan";
import { calcInflation } from "@/lib/finance";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  { key: "amount", kind: "money" as const, defaultValue: "" },
  { key: "inflation", kind: "decimal" as const, defaultValue: "" },
  { key: "years", kind: "integer" as const, defaultValue: "" },
];

export default function InflationCalc() {
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
    const amount = won("amount");
    const years = num("years");
    const inflationRate = num("inflation");
    // 경계 가드: 물가 −100% 이하는 (1+물가)^기간 이 0/음수가 되어 무의미, 기간은 1년 이상
    if (!amount || years < 1 || !filled("inflation") || inflationRate <= -100)
      return null;

    return calcInflation({
      amount,
      inflationRate,
      years,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-5">
      <InputField
        label="현재 금액"
        name="amount"
        suffix="만원"
        placeholder="예: 100"
        hint="단위: 만원 (1,000만원 → 1,000)"
        value={state.amount?.value ?? ""}
        onChange={(v) => setValue("amount", v)}
      />

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="연 물가 상승률"
          name="inflation"
          suffix="%"
          step={0.1}
          min={-99.9}
          placeholder="예: 3.0"
          value={state.inflation?.value ?? ""}
          onChange={(v) => setValue("inflation", v)}
        />
        <InputField
          label="기간"
          name="years"
          suffix="년"
          min={1}
          placeholder="예: 10"
          value={state.years?.value ?? ""}
          onChange={(v) => setValue("years", v)}
        />
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          {/* 미래 구매력 (핵심) */}
          <ResultCard
            label={`${num("years")}년 후 현재 금액의 구매력`}
            value={formatKRW(result.futurePurchasingPower)}
            sub={`지금의 ${formatKRW(won("amount"))}이 그때는 이만큼의 가치 · 구매력 ${result.lossRate.toFixed(1)}% 감소`}
            highlight
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="구매력 감소 금액"
              value={formatKRW(result.lossAmount)}
              sub={`${result.lossRate.toFixed(1)}% 줄어듦`}
            />
            <ResultCard
              label="동일 구매력 필요 금액"
              value={formatKRW(result.requiredFutureAmount)}
              sub={`${num("years")}년 후 지금과 같은 가치를 가지려면`}
            />
          </div>
        </div>
      )}

      {/* ── 고지 ── */}
      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
        <p>
          ※ 이 계산기는 투자 성과가 아니라, 물가가 오를 때 가지고 있는 현금·저축의
          구매력이 어떻게 변하는지를 보여줍니다. 이자·수익은 반영하지 않은,
          &lsquo;돈을 그대로 두었을 때&rsquo;의 가치 변화입니다.
        </p>
        <p>
          ※ 입력한 물가상승률이 기간 내내 일정하게 유지된다고 가정한 값입니다. 실제
          물가는 매년 달라지므로 참고용으로 활용하세요.
        </p>
      </div>
    </div>
  );
}
