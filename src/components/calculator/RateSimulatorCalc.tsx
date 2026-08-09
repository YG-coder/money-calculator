"use client";

import { useMemo, useState } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import {
  calcRateScenarios,
  formatKRW,
  formatUnit,
  type RepaymentType,
} from "@/lib/loan";
import InputField from "@/components/calculator/InputField";

const FIELDS = [
  { key: "principal", kind: "money" as const, defaultValue: "" },
  { key: "rate", kind: "decimal" as const, defaultValue: "" },
  { key: "months", kind: "integer" as const, defaultValue: "" },
  { key: "customDelta", kind: "decimal" as const, defaultValue: "" },
];

const BASE_DELTAS = [0, 0.25, 0.5, 1.0];

export default function RateSimulatorCalc() {
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

  // 금리 0%는 유효한 입력이므로 truthy 검사 대신 빈 문자열 여부로 판정
  const rateFilled = (state.rate?.raw ?? "") !== "";

  const rows = useMemo(() => {
    const principal = won("principal");
    const months = num("months");
    if (!principal || !rateFilled || !months) return null;

    const custom = num("customDelta");
    const deltas = Array.from(
      new Set(custom > 0 ? [...BASE_DELTAS, custom] : BASE_DELTAS),
    ).sort((a, b) => a - b);

    return calcRateScenarios(principal, num("rate"), months, repayment, deltas);
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

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="현재 금리"
          name="rate"
          suffix="%"
          step={0.1}
          placeholder="예: 4.0"
          value={state.rate?.value ?? ""}
          onChange={(v) => setValue("rate", v)}
        />
        <InputField
          label="남은 기간"
          name="months"
          suffix="개월"
          placeholder="예: 360"
          value={state.months?.value ?? ""}
          onChange={(v) => setValue("months", v)}
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

      <InputField
        label="직접 입력 시나리오 (선택)"
        name="customDelta"
        suffix="%p"
        step={0.1}
        placeholder="예: 1.5"
        hint="현재 금리에서 몇 %p 오를 경우를 추가로 볼지"
        value={state.customDelta?.value ?? ""}
        onChange={(v) => setValue("customDelta", v)}
      />

      {rows && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3 pt-2 duration-300">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 p-3 text-left">
                    시나리오
                  </th>
                  <th className="border border-slate-200 p-3 text-right">
                    월 상환액
                  </th>
                  <th className="border border-slate-200 p-3 text-right">
                    총이자
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={row.isBase ? "bg-brand-50" : ""}>
                    <td className="border border-slate-200 p-3">
                      <span className="font-semibold">
                        {row.isBase ? "현재" : `+${row.delta}%p`}
                      </span>
                      <span className="ml-1 text-xs text-slate-400">
                        ({row.rate.toFixed(2)}%)
                      </span>
                    </td>
                    <td className="border border-slate-200 p-3 text-right">
                      <div>{formatKRW(row.monthlyPayment)}</div>
                      <div className="text-xs text-slate-400">
                        {row.isBase
                          ? "기준"
                          : `+${formatKRW(row.monthlyDiff)}`}
                      </div>
                    </td>
                    <td className="border border-slate-200 p-3 text-right">
                      <div>{formatUnit(row.totalInterest)}</div>
                      <div className="text-xs text-slate-400">
                        {row.isBase
                          ? "기준"
                          : `+${formatUnit(row.interestDiff)}`}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {repayment === "equal_principal" && (
            <p className="text-xs text-slate-400">
              ※ 원금균등의 월 상환액은 첫 달(가장 큰 달) 기준입니다. 이후 매달
              조금씩 줄어듭니다.
            </p>
          )}
        </div>
      )}

      {/* ── 고지 ── */}
      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
        <p>
          ※ 이 계산기는 금리를 예측하지 않습니다. &lsquo;만약 금리가 ○%p
          변한다면&rsquo;을 가정한 시나리오별 상환 부담을 원리금균등·원금균등
          기준으로 보여주는 참고용 도구입니다.
        </p>
        <p>
          ※ 실제 변동금리는 대출 상품의 기준금리·가산금리·조정 주기에 따라
          달라지며, 여기 표시된 값과 차이가 있을 수 있습니다.
        </p>
      </div>
    </div>
  );
}
