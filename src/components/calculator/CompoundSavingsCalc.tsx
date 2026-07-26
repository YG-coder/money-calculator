"use client";

import { useMemo, useState } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { formatKRW, formatUnit } from "@/lib/loan";
import { calcCompoundInterest } from "@/lib/finance";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  {
    key: "principal",
    kind: "money" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) < 0 ? "초기 원금을 입력해주세요" : undefined,
  },
  {
    key: "rate",
    kind: "decimal" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0
        ? "예상 연이율을 입력해주세요"
        : Number(v) > 30
          ? "예상 연이율이 너무 높습니다"
          : undefined,
  },
  {
    key: "years",
    kind: "integer" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0
        ? "기간(년)을 입력해주세요"
        : Number(v) > 50
          ? "기간이 너무 깁니다"
          : undefined,
  },
  {
    // 월 추가 납입액 — 선택 입력(비워두면 0)
    key: "monthly",
    kind: "money" as const,
    defaultValue: "",
  },
];

export default function CompoundSavingsCalc() {
  const { state, setValue, getWon, getNum } = useCalcState(FIELDS);
  const [showYearly, setShowYearly] = useState(false);

  const result = useMemo(() => {
    const principal = getWon("principal");
    const rate = getNum("rate");
    const years = getNum("years");
    const monthly = getWon("monthly");

    if (!rate || !years || (!principal && !monthly)) return null;

    // 월복리 고정(compoundsPerYear = 12), 월 추가 납입은 기말 적립
    return calcCompoundInterest({
      principal,
      annualRate: rate,
      years,
      compoundsPerYear: 12,
      contribution: monthly,
    });
  }, [state, getWon, getNum]);

  return (
    <div className="space-y-5">
      <InputField
        label="초기 원금"
        name="principal"
        suffix="만원"
        placeholder="예: 1,000"
        hint="단위: 만원 (1,000만 원 → 1,000)"
        value={state.principal?.value ?? ""}
        error={state.principal?.error}
        onChange={(v) => setValue("principal", v)}
      />

      <InputField
        label="예상 연이율"
        name="rate"
        suffix="%"
        step={0.1}
        placeholder="예: 5"
        value={state.rate?.value ?? ""}
        error={state.rate?.error}
        onChange={(v) => setValue("rate", v)}
      />

      <InputField
        label="기간"
        name="years"
        suffix="년"
        placeholder="예: 10"
        hint="정수 연 단위로 입력하세요"
        value={state.years?.value ?? ""}
        error={state.years?.error}
        onChange={(v) => setValue("years", v)}
      />

      <InputField
        label="월 추가 납입액 (선택)"
        name="monthly"
        suffix="만원"
        placeholder="예: 20 (없으면 비워두세요)"
        hint="매달 추가로 넣는 금액. 비워두면 초기 원금만 계산합니다."
        value={state.monthly?.value ?? ""}
        error={state.monthly?.error}
        onChange={(v) => setValue("monthly", v)}
      />

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResultCard
              label="총 납입 원금"
              value={formatUnit(result.totalContributed)}
            />
            <ResultCard
              label="누적 이자 (세전)"
              value={formatUnit(result.totalInterest)}
            />
            <ResultCard
              label="단리 대비 복리 효과"
              value={formatUnit(result.compoundAdvantage)}
              sub={`단리 가정 ${formatUnit(result.simpleFinalAmount)}`}
            />
          </div>

          <ResultCard
            label="최종 예상 금액 (세전)"
            value={formatUnit(result.finalAmount)}
            sub="월복리 기준 · 세전"
            highlight
          />

          {result.yearly.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowYearly(!showYearly)}
                className="w-full rounded-xl border border-brand-200 py-2.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
              >
                {showYearly ? "연도별 잔액 닫기 ▲" : "연도별 잔액 보기 ▼"}
              </button>

              {showYearly && (
                <div className="overflow-x-auto rounded-xl border border-slate-100 text-xs">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-slate-50 text-slate-500">
                      <tr>
                        {["연차", "누적 납입", "잔액(세전)"].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2.5 text-right font-semibold first:text-left"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {result.yearly.map((row) => (
                        <tr key={row.year} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-600">{row.year}년</td>
                          <td className="px-3 py-2 text-right text-slate-500">
                            {Math.round(row.contributed).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-brand-700">
                            {Math.round(row.balance).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <p className="text-xs leading-relaxed text-slate-400">
            ※ 월복리·기말 적립 기준의 세전 예상치입니다. 실제 세후 수령액은 상품의
            이자 지급 시점과 과세 방식, 비과세 적용 여부 및 금융기관의 원 단위 처리에
            따라 달라집니다. 일반과세 상품은 이자 지급 시 통상 15.4%가 원천징수될 수
            있어 실제 수령액은 표시된 세전 금액보다 적을 수 있으며, 예금·적금의 세후
            금액은 예금·적금 계산기에서 확인할 수 있습니다. 입력한 예상 연이율이
            유지된다는 가정으로, 미래 수익을 보장하지 않습니다.
          </p>
        </div>
      )}
    </div>
  );
}
