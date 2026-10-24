"use client";

import { useMemo } from "react";
import { hasFieldError } from "@/lib/calcInput";
import { useCalcState } from "@/hooks/useCalcState";
import { calcSimpleVsCompoundExact } from "@/lib/simpleVsCompoundExact";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  { key: "principal", kind: "money" as const, defaultValue: "" },
  { key: "rate", kind: "decimal" as const, defaultValue: "" },
  { key: "years", kind: "integer" as const, defaultValue: "" },
];

export default function SimpleVsCompoundCalc() {
  const { state, setValue } = useCalcState(FIELDS);

  // 현재 렌더의 state.raw를 직접 읽는다(getWon/getNum의 ref는 한 박자 늦다).
  // 월복리(연 12회)·추가납입 0을 입력 문자열 그대로 정확값으로 계산한다. 카드·문구·연차표가 같은 정확값을 쓴다.
  // 결과 없음 조건(원금 0, 기간 1년 미만, 이자율 빈칸)은 기존과 같다.
  const result = useMemo(() => {
    if (hasFieldError(state)) return null;
    return calcSimpleVsCompoundExact(
      state.principal?.raw ?? "",
      state.rate?.raw ?? "",
      state.years?.raw ?? "",
    );
  }, [state]);

  return (
    <div className="space-y-5">
      <InputField
        label="원금"
        name="principal"
        suffix="만원"
        placeholder="예: 1,000"
        hint="단위: 만원 (1,000만원 → 1,000)"
        value={state.principal?.value ?? ""}
        onChange={(v) => setValue("principal", v)}
        error={state.principal?.error}
      />

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="연 이자율"
          name="rate"
          suffix="%"
          step={0.1}
          min={0}
          placeholder="예: 5.0"
          value={state.rate?.value ?? ""}
          onChange={(v) => setValue("rate", v)}
          error={state.rate?.error}
        />
        <InputField
          label="기간"
          name="years"
          suffix="년"
          min={1}
          placeholder="예: 10"
          value={state.years?.value ?? ""}
          onChange={(v) => setValue("years", v)}
          error={state.years?.error}
        />
      </div>

      <p className="-mt-2 text-xs text-slate-500">
        단리와 월복리를 같은 원금·금리·기간으로 비교합니다. 추가 납입 없이 원금을
        그대로 둔 경우이며, 복리는 매달 이자를 원금에 더해 굴립니다.
      </p>

      {result?.status === "too-large" && (
        <p
          data-calc-notice
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          복리 최종액이 계산 범위(2^1024원, 약 1.8×10^308원)를 넘어 결과를 표시하지
          않습니다. 원금·이자율·기간을 줄여 다시 입력해주세요.
        </p>
      )}

      {result?.status === "ok" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          {/* 단리 vs 복리 최종액 — 정확한 긴 금액이 좁은 화면에서 카드 밖으로 나가지 않게 줄바꿈만 허용한다 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 [&>*]:min-w-0 [&_p]:[overflow-wrap:anywhere]">
            <ResultCard
              label="단리 최종액"
              value={result.simpleFinal}
              sub={`이자 ${result.simpleInterest}`}
            />
            <ResultCard
              label="복리 최종액 (월복리)"
              value={result.compoundFinal}
              sub={`이자 ${result.compoundInterest}`}
              highlight
            />
          </div>

          {/* 차이 (중립) */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-center text-sm text-slate-700 [overflow-wrap:anywhere]">
            {result.advantagePositive ? (
              <p>
                같은 조건에서 복리가 단리보다{" "}
                <strong className="text-brand-700">
                  {result.advantage}
                </strong>{" "}
                많습니다 (최종액 기준 +{result.advantageRate}%
                {result.interestMultiple
                  ? ` · 복리 이자가 단리의 ${result.interestMultiple}배`
                  : ""}
                ).
              </p>
            ) : (
              <p>이자율이 0이라 단리와 복리의 최종액이 같습니다.</p>
            )}
          </div>

          {/* 연차별 격차 */}
          {result.rows.length > 1 && (
            // 표가 가로로 스크롤될 때 키보드로도 이 영역에 초점을 두고 화살표로 스크롤할 수 있게 한다(기본 Tab 순서).
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="연차별 단리·복리 비교"
            >
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-200 p-3 text-left">연차</th>
                    <th className="border border-slate-200 p-3 text-right">단리</th>
                    <th className="border border-slate-200 p-3 text-right">복리</th>
                    <th className="border border-slate-200 p-3 text-right">차이</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r) => (
                    <tr key={r.year}>
                      <td className="border border-slate-200 p-3 font-semibold">
                        {r.year}년
                      </td>
                      <td className="border border-slate-200 p-3 text-right">
                        {r.simple}
                      </td>
                      <td className="border border-slate-200 p-3 text-right">
                        {r.compound}
                      </td>
                      <td className="border border-slate-200 p-3 text-right text-brand-700">
                        {r.diff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 고지 ── */}
      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
        <p>
          ※ 단리는 원금에만 이자가 붙고, 복리는 이자에도 이자가 붙습니다. 이
          계산기는 같은 원금을 추가 납입 없이 두었을 때의 성장 차이를 월복리 기준으로
          비교한 참고용 예시입니다.
        </p>
        <p>
          ※ 실제 상품의 이자 계산·지급 주기, 세금(이자소득세) 등은 반영하지 않은
          세전 단순 비교입니다.
        </p>
      </div>
    </div>
  );
}
