"use client";

import { useMemo } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { calcOverdraft, formatKRW, formatUnit } from "@/lib/loan";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  { key: "used", kind: "money" as const, defaultValue: "" },
  { key: "limit", kind: "money" as const, defaultValue: "" },
  { key: "rate", kind: "decimal" as const, defaultValue: "" },
  { key: "days", kind: "integer" as const, defaultValue: "" },
];

export default function MinusAccountCalc() {
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
    const used = won("used");
    const rate = num("rate");
    if (!used || !rate) return null;

    return calcOverdraft({
      usedAmount: used,
      rate,
      limit: won("limit"),
      days: num("days"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-5">
      <InputField
        label="실제 사용금액"
        name="used"
        suffix="만원"
        placeholder="예: 2,000"
        hint="한도가 아니라, 실제로 쓴 금액을 입력하세요. 이자는 이 금액 기준으로 붙습니다."
        value={state.used?.value ?? ""}
        onChange={(v) => setValue("used", v)}
      />

      <InputField
        label="연 이자율"
        name="rate"
        suffix="%"
        step={0.1}
        placeholder="예: 6.5"
        value={state.rate?.value ?? ""}
        onChange={(v) => setValue("rate", v)}
      />

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="한도 (선택)"
          name="limit"
          suffix="만원"
          placeholder="예: 5,000"
          hint="사용률 표시용"
          value={state.limit?.value ?? ""}
          onChange={(v) => setValue("limit", v)}
        />
        <InputField
          label="사용일수 (선택)"
          name="days"
          suffix="일"
          placeholder="예: 30"
          hint="기간 이자 표시용"
          value={state.days?.value ?? ""}
          onChange={(v) => setValue("days", v)}
        />
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResultCard
              label="일 이자"
              value={formatKRW(result.dailyInterest)}
              highlight
            />
            <ResultCard
              label="월 예상 이자"
              value={formatKRW(result.monthlyInterest)}
            />
            <ResultCard
              label="연 예상 이자"
              value={formatUnit(result.yearlyInterest)}
            />
          </div>

          {(result.periodInterest !== null || result.utilization !== null) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {result.periodInterest !== null && (
                <ResultCard
                  label="기간 이자"
                  value={formatKRW(result.periodInterest)}
                  sub={`사용일수 ${num("days")}일 기준`}
                />
              )}
              {result.utilization !== null && (
                <ResultCard
                  label="사용률"
                  value={`${result.utilization.toFixed(result.utilization % 1 === 0 ? 0 : 1)}%`}
                  sub={`한도 ${formatUnit(won("limit"))} 중 ${formatUnit(won("used"))} 사용`}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 고지 ── */}
      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
        <p>
          ※ 이자는 한도가 아니라 실제 사용금액을 기준으로, 일할(단리)로 계산한
          참고용 추정치입니다.
        </p>
        <p>
          ※ 은행별 계산 기준과 실제 사용일수·사용금액 변동에 따라 차이가 있을 수
          있습니다.
        </p>
      </div>
    </div>
  );
}
