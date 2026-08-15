"use client";

import { useMemo } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { formatKRW, formatUnit } from "@/lib/loan";
import { calcCompoundInterest } from "@/lib/finance";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  { key: "principal", kind: "money" as const, defaultValue: "" },
  { key: "rate", kind: "decimal" as const, defaultValue: "" },
  { key: "years", kind: "integer" as const, defaultValue: "" },
];

export default function SimpleVsCompoundCalc() {
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
    const principal = won("principal");
    const years = num("years");
    const rate = num("rate");
    if (!principal || years < 1 || rate < 0 || !filled("rate")) return null;

    // 단리·복리 비교는 calcCompoundInterest가 내부에서 이미 계산한다
    // (simpleFinalAmount / compoundAdvantage). 추가납입 없이(월복리) 순수 비교.
    const c = calcCompoundInterest({
      principal,
      annualRate: rate,
      years,
      compoundsPerYear: 12,
      contribution: 0,
    });

    const simpleInterest = c.simpleFinalAmount - principal;
    const compoundInterest = c.finalAmount - principal;

    // 연차별 단리/복리 격차 (yearly = 복리 잔액, 단리는 P×(1+r×t)로 산출)
    const step = Math.max(1, Math.ceil(c.yearly.length / 8));
    const rows = c.yearly
      .filter((_, i) => (i + 1) % step === 0 || i === c.yearly.length - 1)
      .map((p) => {
        const simple = principal * (1 + (rate / 100) * p.year);
        return { year: p.year, simple, compound: p.balance, diff: p.balance - simple };
      });

    return {
      principal,
      simpleFinal: c.simpleFinalAmount,
      compoundFinal: c.finalAmount,
      simpleInterest,
      compoundInterest,
      advantage: c.compoundAdvantage,
      advantageRate: c.simpleFinalAmount > 0 ? (c.compoundAdvantage / c.simpleFinalAmount) * 100 : 0,
      interestMultiple: simpleInterest > 0 ? compoundInterest / simpleInterest : null,
      rows,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      <p className="-mt-2 text-xs text-slate-400">
        단리와 월복리를 같은 원금·금리·기간으로 비교합니다. 추가 납입 없이 원금을
        그대로 둔 경우이며, 복리는 매달 이자를 원금에 더해 굴립니다.
      </p>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          {/* 단리 vs 복리 최종액 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="단리 최종액"
              value={formatKRW(result.simpleFinal)}
              sub={`이자 ${formatKRW(result.simpleInterest)}`}
            />
            <ResultCard
              label="복리 최종액 (월복리)"
              value={formatKRW(result.compoundFinal)}
              sub={`이자 ${formatKRW(result.compoundInterest)}`}
              highlight
            />
          </div>

          {/* 차이 (중립) */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-center text-sm text-slate-700">
            {result.advantage > 0 ? (
              <p>
                같은 조건에서 복리가 단리보다{" "}
                <strong className="text-brand-700">
                  {formatKRW(result.advantage)}
                </strong>{" "}
                많습니다 (최종액 기준 +{result.advantageRate.toFixed(2)}%
                {result.interestMultiple
                  ? ` · 복리 이자가 단리의 ${result.interestMultiple.toFixed(2)}배`
                  : ""}
                ).
              </p>
            ) : (
              <p>이자율이 0이라 단리와 복리의 최종액이 같습니다.</p>
            )}
          </div>

          {/* 연차별 격차 */}
          {result.rows.length > 1 && (
            <div className="overflow-x-auto">
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
                        {formatUnit(r.simple)}
                      </td>
                      <td className="border border-slate-200 p-3 text-right">
                        {formatUnit(r.compound)}
                      </td>
                      <td className="border border-slate-200 p-3 text-right text-brand-700">
                        +{formatUnit(r.diff)}
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
      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
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
