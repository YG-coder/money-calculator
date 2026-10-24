'use client'

import { useMemo, useState } from "react";
import { hasFieldError } from "@/lib/calcInput";
import { useCalcState } from "@/hooks/useCalcState";
import type { RepaymentType } from "@/lib/loan";
import { calcFixedVsVariableExact } from "@/lib/rateCompareExact";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  { key: "principal", kind: "money" as const, defaultValue: "" },
  { key: "months", kind: "integer" as const, defaultValue: "" },
  { key: "fixedRate", kind: "decimal" as const, defaultValue: "" },
  { key: "variableRate", kind: "decimal" as const, defaultValue: "" },
];

export default function FixedVariableCalc() {
  const { state, setValue } = useCalcState(FIELDS);
  const [repayment, setRepayment] = useState<RepaymentType>("equal_payment");

  // 현재 렌더의 state.raw를 직접 읽는다(getWon/getNum의 ref는 한 박자 늦다).
  // 입력 문자열을 Number로 바꾸지 않고 정확값으로 계산한다. 카드·손익분기 문장·시나리오 표가 같은 정확값을 쓰고,
  // 고정 대비 차액·많음/적음/동일·손익분기 방향도 정확값으로 정한다. 결과 없음 조건(원금·기간 0, 금리 빈칸)은 기존과 같다.
  const computed = useMemo(() => {
    if (hasFieldError(state)) return null;
    return calcFixedVsVariableExact(
      state.principal?.raw ?? "",
      state.months?.raw ?? "",
      state.fixedRate?.raw ?? "",
      state.variableRate?.raw ?? "",
      repayment,
    );
  }, [state, repayment]);
  const result = computed?.status === "ok" ? computed : null;

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

      <InputField
        label="대출 기간"
        name="months"
        suffix="개월"
        placeholder="예: 360"
        value={state.months?.value ?? ""}
        onChange={(v) => setValue("months", v)}
        error={state.months?.error}
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
          error={state.fixedRate?.error}
        />
        <InputField
          label="현재 변동 금리"
          name="variableRate"
          suffix="%"
          step={0.1}
          placeholder="예: 3.8"
          value={state.variableRate?.value ?? ""}
          onChange={(v) => setValue("variableRate", v)}
          error={state.variableRate?.error}
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

      {computed?.status === "too-large" && (
        <p
          data-calc-notice
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          총 납입액이 계산 범위(2^1024원, 약 1.8×10^308원)를 넘어 결과를 표시하지
          않습니다. 대출 금액·금리·기간을 줄여 다시 입력해주세요.
        </p>
      )}

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          {/* 고정 vs 변동(현재 유지) — 정확한 긴 금액이 좁은 화면에서 카드 밖으로 나가지 않게 줄바꿈만 허용한다 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 [&>*]:min-w-0 [&_p]:[overflow-wrap:anywhere]">
            <ResultCard
              label="고정금리"
              value={result.fixedTotalInterest}
              sub={`총이자 · 월 ${result.fixedMonthly}`}
            />
            <ResultCard
              label="변동금리 (현재 유지 가정)"
              value={result.variableTotalInterestNow}
              sub={`총이자 · 월 ${result.variableMonthlyNow}`}
            />
          </div>

          {/* break-even */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-slate-700 [overflow-wrap:anywhere]">
            {result.breakEven.direction === "up" ? (
              <p>
                변동금리가 평균 <strong>{result.breakEven.fixedRate}%</strong>
                (지금보다 약 <strong>{result.breakEven.delta}%p</strong>{" "}
                이상) 수준으로 오르면, 변동의 총이자가 고정과 같아지거나 커집니다.
                그 아래로 유지되면 변동의 총이자가 더 적습니다.
              </p>
            ) : result.breakEven.direction === "down" ? (
              <p>
                현재 변동금리({result.breakEven.variableRate}%)가 이미
                고정금리({result.breakEven.fixedRate}%)보다 높습니다. 변동금리가
                평균 <strong>{result.breakEven.delta}%p</strong> 이상
                내려가야 총이자가 고정보다 적어집니다.
              </p>
            ) : (
              <p>
                고정금리와 현재 변동금리가 같아, 금리가 그대로 유지되면 총이자도
                같습니다.
              </p>
            )}
          </div>

          {/* 시나리오 표 — 좁은 화면에서 가로로 스크롤되므로 키보드로도 초점을 두고 화살표로 스크롤할 수 있게 한다(기본 Tab 순서). */}
          <div
            className="overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label="변동금리 시나리오별 총이자"
          >
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
                  <tr key={i} className={s.isCurrent ? "bg-brand-50" : ""}>
                    <td className="border border-slate-200 p-3">
                      <span className="font-semibold">
                        {s.label}
                      </span>
                      <span className="ml-1 text-xs text-slate-500">
                        ({s.rate}%)
                      </span>
                    </td>
                    <td className="border border-slate-200 p-3 text-right">
                      {s.totalInterest}
                    </td>
                    <td className="border border-slate-200 p-3 text-right">
                      {s.vsFixed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 고지 ── */}
      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
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
