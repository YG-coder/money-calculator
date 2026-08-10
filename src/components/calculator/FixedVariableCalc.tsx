"use client";

import { useMemo, useState } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import {
  calcFixedVsVariable,
  formatKRW,
  formatUnit,
  type RepaymentType,
} from "@/lib/loan";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  { key: "principal", kind: "money" as const, defaultValue: "" },
  { key: "months", kind: "integer" as const, defaultValue: "" },
  { key: "fixedRate", kind: "decimal" as const, defaultValue: "" },
  { key: "variableRate", kind: "decimal" as const, defaultValue: "" },
];

const DELTAS = [0, 0.5, 1.0, 1.5];

const trimPct = (n: number) => Number(n.toFixed(2));

export default function FixedVariableCalc() {
  const { state, setValue } = useCalcState(FIELDS);
  const [repayment, setRepayment] = useState<RepaymentType>("equal_payment");

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
    const principal = won("principal");
    const months = num("months");
    if (!principal || !months || !filled("fixedRate") || !filled("variableRate"))
      return null;

    return calcFixedVsVariable(
      principal,
      months,
      repayment,
      num("fixedRate"),
      num("variableRate"),
      DELTAS,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, repayment]);

  return (
    <div className="space-y-5">
      <InputField
        label="대출 금액"
        name="principal"
        suffix="만원"
        placeholder="예: 30,000"
        hint="단위: 만원 (3억 → 30,000)"
        value={state.principal?.value ?? ""}
        onChange={(v) => setValue("principal", v)}
      />

      <InputField
        label="대출 기간"
        name="months"
        suffix="개월"
        placeholder="예: 360"
        value={state.months?.value ?? ""}
        onChange={(v) => setValue("months", v)}
      />

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="고정 금리"
          name="fixedRate"
          suffix="%"
          step={0.1}
          placeholder="예: 4.5"
          value={state.fixedRate?.value ?? ""}
          onChange={(v) => setValue("fixedRate", v)}
        />
        <InputField
          label="현재 변동 금리"
          name="variableRate"
          suffix="%"
          step={0.1}
          placeholder="예: 3.8"
          value={state.variableRate?.value ?? ""}
          onChange={(v) => setValue("variableRate", v)}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-600">상환 방식</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["equal_payment", "원리금균등"],
              ["equal_principal", "원금균등"],
            ] as [RepaymentType, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => setRepayment(t)}
              className={`rounded-xl border py-3 text-sm font-bold transition-all ${
                repayment === t
                  ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          {/* 고정 vs 변동(현재 유지) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="고정금리"
              value={formatUnit(result.fixedTotalInterest)}
              sub={`총이자 · 월 ${formatKRW(result.fixedMonthly)}`}
            />
            <ResultCard
              label="변동금리 (현재 유지 가정)"
              value={formatUnit(result.variableTotalInterestNow)}
              sub={`총이자 · 월 ${formatKRW(result.variableMonthlyNow)}`}
            />
          </div>

          {/* break-even */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-slate-700">
            {result.breakEvenDelta > 0 ? (
              <p>
                변동금리가 평균 <strong>{trimPct(result.fixedRate)}%</strong>
                (지금보다 약 <strong>{trimPct(result.breakEvenDelta)}%p</strong>{" "}
                이상) 수준으로 오르면, 변동의 총이자가 고정과 같아지거나 커집니다.
                그 아래로 유지되면 변동의 총이자가 더 적습니다.
              </p>
            ) : result.breakEvenDelta < 0 ? (
              <p>
                현재 변동금리({trimPct(result.variableRate)}%)가 이미
                고정금리({trimPct(result.fixedRate)}%)보다 높습니다. 변동금리가
                평균 <strong>{trimPct(-result.breakEvenDelta)}%p</strong> 이상
                내려가야 총이자가 고정보다 적어집니다.
              </p>
            ) : (
              <p>
                고정금리와 현재 변동금리가 같아, 금리가 그대로 유지되면 총이자도
                같습니다.
              </p>
            )}
          </div>

          {/* 시나리오 표 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 p-3 text-left">
                    변동금리 시나리오
                  </th>
                  <th className="border border-slate-200 p-3 text-right">
                    변동 총이자
                  </th>
                  <th className="border border-slate-200 p-3 text-right">
                    고정 대비
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map((s, i) => (
                  <tr key={i} className={s.delta === 0 ? "bg-brand-50" : ""}>
                    <td className="border border-slate-200 p-3">
                      <span className="font-semibold">
                        {s.delta === 0 ? "현재" : `+${s.delta}%p`}
                      </span>
                      <span className="ml-1 text-xs text-slate-400">
                        ({trimPct(s.variableRate)}%)
                      </span>
                    </td>
                    <td className="border border-slate-200 p-3 text-right">
                      {formatUnit(s.variableTotalInterest)}
                    </td>
                    <td className="border border-slate-200 p-3 text-right">
                      {s.vsFixed < 0
                        ? `${formatUnit(-s.vsFixed)} 적음`
                        : s.vsFixed > 0
                          ? `${formatUnit(s.vsFixed)} 많음`
                          : "동일"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 고지 ── */}
      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
        <p>
          ※ 이 계산기는 어느 쪽이 유리한지 판단하지 않습니다. 미래 변동금리 경로는
          알 수 없으므로, &lsquo;변동금리가 현재 수준으로 유지된다면&rsquo;과
          &lsquo;일정 폭 오른다면&rsquo;을 가정한 시나리오만 보여줍니다.
        </p>
        <p>
          ※ 변동금리의 총이자는 가정에 따른 값이며, 실제로는 기준금리·가산금리·조정
          주기에 따라 달라집니다. 고정금리는 만기까지 금리가 고정된다는 전제입니다.
        </p>
      </div>
    </div>
  );
}
