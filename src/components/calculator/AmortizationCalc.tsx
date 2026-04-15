"use client";

import { useMemo, useState } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import {
  calcAmortization,
  formatKRW,
  formatUnit,
  type RepaymentType,
} from "@/lib/loan";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";
import SavingBanner from "@/components/calculator/SavingBanner";

const FIELDS = [
  {
    key: "principal",
    kind: "money" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0 ? "원금을 입력해주세요" : undefined,
  },
  {
    key: "rate",
    kind: "decimal" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0 ? "이자율을 입력해주세요" : undefined,
  },
  {
    key: "months",
    kind: "integer" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0 ? "기간을 입력해주세요" : undefined,
  },
];

export default function AmortizationCalc() {
  const { state, setValue, getWon, getNum } = useCalcState(FIELDS);
  const [repaymentType, setRepaymentType] =
    useState<RepaymentType>("equal_payment");
  const [showSchedule, setShowSchedule] = useState(false);

  const result = useMemo(() => {
    const p = getWon("principal");
    const r = getNum("rate");
    const m = getNum("months");

    if (!p || !r || !m) return null;

    return calcAmortization(p, r, m, repaymentType);
  }, [state, repaymentType, getWon, getNum]);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-600">상환 방식</p>
        <div className="grid grid-cols-2 gap-2">
          {(["equal_payment", "equal_principal"] as RepaymentType[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => setRepaymentType(t)}
                className={`rounded-xl border py-3 text-sm font-bold transition-all ${
                  repaymentType === t
                    ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
                }`}
              >
                {t === "equal_payment" ? "원리금균등" : "원금균등"}
              </button>
            ),
          )}
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          {repaymentType === "equal_payment"
            ? "매달 동일 금액 납부. 초반에 이자 비중이 높아요."
            : "원금은 동일, 이자는 매달 감소. 초반 납입 부담이 커요."}
        </p>
      </div>

      <InputField
        label="대출 원금"
        name="principal"
        suffix="만원"
        placeholder="예: 30,000"
        hint="단위: 만원"
        value={state.principal?.value ?? ""}
        error={state.principal?.error}
        onChange={(v) => setValue("principal", v)}
      />

      <InputField
        label="연 이자율"
        name="rate"
        suffix="%"
        step={0.1}
        placeholder="예: 4.5"
        value={state.rate?.value ?? ""}
        error={state.rate?.error}
        onChange={(v) => setValue("rate", v)}
      />

      <InputField
        label="대출 기간"
        name="months"
        suffix="개월"
        placeholder="예: 360"
        value={state.months?.value ?? ""}
        error={state.months?.error}
        onChange={(v) => setValue("months", v)}
      />

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResultCard
              label={
                repaymentType === "equal_payment" ? "월 납입액" : "첫달 납입액"
              }
              value={formatKRW(result.monthlyPayment)}
              highlight
            />
            <ResultCard
              label="총 납입액"
              value={formatUnit(result.totalPayment)}
            />
            <ResultCard
              label="총 이자"
              value={formatUnit(result.totalInterest)}
            />
          </div>

          <SavingBanner
            message={result.savingMessage}
            isProfit={result.rateSaving > 0}
          />

          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="w-full rounded-xl border border-brand-200 py-2.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
          >
            {showSchedule ? "상환 스케줄 닫기 ▲" : "월별 상환 스케줄 보기 ▼"}
          </button>

          {showSchedule && (
            <div className="overflow-x-auto rounded-xl border border-slate-100 text-xs">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-50 text-slate-500">
                  <tr>
                    {["회차", "납입액", "원금", "이자", "잔여원금"].map((h) => (
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
                  {result.schedule.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-600">
                        {row.month}회
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {Math.round(row.payment).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right text-brand-700">
                        {Math.round(row.principal).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right text-orange-500">
                        {Math.round(row.interest).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-500">
                        {Math.round(row.balance).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
