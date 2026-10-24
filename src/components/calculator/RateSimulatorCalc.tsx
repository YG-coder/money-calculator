'use client'

import { useMemo, useState } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { hasFieldError } from "@/lib/calcInput";
import type { RepaymentType } from "@/lib/loan";
import { calcRateScenariosExact } from "@/lib/rateCompareExact";
import InputField from "@/components/calculator/InputField";

const FIELDS = [
  { key: "principal", kind: "money" as const, defaultValue: "" },
  { key: "rate", kind: "decimal" as const, defaultValue: "" },
  { key: "months", kind: "integer" as const, defaultValue: "" },
  { key: "customDelta", kind: "decimal" as const, defaultValue: "" },
];

export default function RateSimulatorCalc() {
  const { state, setValue } = useCalcState(FIELDS);
  const [repayment, setRepayment] = useState<RepaymentType>("equal_payment");

  // 현재 렌더의 state.raw를 직접 읽는다(getWon/getNum의 ref는 한 박자 늦다).
  // 입력 문자열을 Number로 바꾸지 않고 정확값으로 계산한다. 시나리오 구성(기본 0·0.25·0.5·1%p + 0보다 큰 직접 입력),
  // 중복 제거·정렬, 결과 없음 조건(원금·기간 0, 금리 빈칸 — 0%는 정상 입력)은 기존과 같다.
  const result = useMemo(() => {
    if (hasFieldError(state)) return null;
    return calcRateScenariosExact(
      state.principal?.raw ?? "",
      state.rate?.raw ?? "",
      state.months?.raw ?? "",
      state.customDelta?.raw ?? "",
      repayment,
    );
  }, [state, repayment]);
  const rows = result?.status === "ok" ? result.rows : null;

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
        error={state.principal?.error}
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
          error={state.rate?.error}
        />
        <InputField
          label="남은 기간"
          name="months"
          suffix="개월"
          placeholder="예: 360"
          value={state.months?.value ?? ""}
          onChange={(v) => setValue("months", v)}
          error={state.months?.error}
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
             aria-pressed={repayment === t}>
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
        error={state.customDelta?.error}
      />

      {result?.status === "too-large" && (
        <p
          data-calc-notice
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          총 납입액이 계산 범위(2^1024원, 약 1.8×10^308원)를 넘어 결과를 표시하지
          않습니다. 대출 금액·금리·기간을 줄여 다시 입력해주세요.
        </p>
      )}

      {rows && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3 pt-2 duration-300">
          {/* 좁은 화면에서 표가 가로로 스크롤되므로 키보드로도 이 영역에 초점을 두고 화살표로 스크롤할 수 있게 한다(기본 Tab 순서). */}
          <div
            className="overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label="금리 시나리오별 상환 부담"
          >
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
                        {row.label}
                      </span>
                      <span className="ml-1 text-xs text-slate-500">
                        ({row.rate}%)
                      </span>
                    </td>
                    <td className="border border-slate-200 p-3 text-right">
                      <div>{row.monthlyPayment}</div>
                      <div className="text-xs text-slate-500">
                        {row.monthlyDiff}
                      </div>
                    </td>
                    <td className="border border-slate-200 p-3 text-right">
                      <div>{row.totalInterest}</div>
                      <div className="text-xs text-slate-500">
                        {row.interestDiff}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {repayment === "equal_principal" && (
            <p className="text-xs text-slate-500">
              ※ 원금균등의 월 상환액은 첫 달(가장 큰 달) 기준입니다. 이후 매달
              조금씩 줄어듭니다.
            </p>
          )}
        </div>
      )}

      {/* ── 고지 ── */}
      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
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
