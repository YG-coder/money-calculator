'use client'

import { useMemo, useState } from "react";
import { hasFieldError } from "@/lib/calcInput";
import { useCalcState } from "@/hooks/useCalcState";
import type { RepaymentType } from "@/lib/loan";
import {
  calcAmortizationExact,
  MAX_AMORTIZATION_MONTHS,
} from "@/lib/amortizationExact";
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
    // 0 이하 판정은 Number 대신 raw 숫자로 한다(아주 작은 양수가 Number에서 0으로 사라지지 않게). "."은 기존처럼 오류 없이 결과만 없다.
    validate: (v: string) =>
      !v || (v !== "." && !/[1-9]/.test(v)) ? "이자율을 입력해주세요" : undefined,
  },
  {
    key: "months",
    kind: "integer" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0
        ? "기간을 입력해주세요"
        : Number(v) > MAX_AMORTIZATION_MONTHS
          ? "1,200개월(100년) 이하로 입력해주세요"
          : undefined,
  },
];

export default function AmortizationCalc() {
  const { state, setValue } = useCalcState(FIELDS);
  const [repaymentType, setRepaymentType] =
    useState<RepaymentType>("equal_payment");
  const [showSchedule, setShowSchedule] = useState(false);

  // 현재 렌더의 state.raw를 직접 읽는다(getWon/getNum의 ref는 한 박자 늦다).
  // 입력 문자열을 Number로 바꾸지 않고 정확값으로 계산한다(원금·이자율·개월이 0이면 결과 없음 — 기존과 같음).
  const result = useMemo(() => {
    if (hasFieldError(state)) return null;
    return calcAmortizationExact(
      state.principal?.raw ?? "",
      state.rate?.raw ?? "",
      state.months?.raw ?? "",
      repaymentType,
    );
  }, [state, repaymentType]);

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
               aria-pressed={repaymentType === t}>
                {t === "equal_payment" ? "원리금균등" : "원금균등"}
              </button>
            ),
          )}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
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

      {result?.status === "too-large" && (
        <p
          data-calc-notice
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          총 납입액이 계산 범위(2^1024원, 약 1.8×10^308원)를 넘어 결과를 표시하지
          않습니다. 원금·이자율·기간을 줄여 다시 입력해주세요.
        </p>
      )}

      {result?.status === "ok" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          {/* 정확한 긴 금액이 좁은 화면에서 카드 밖으로 나가지 않게 줄바꿈만 허용한다(글자·자릿수는 그대로) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 [&>*]:min-w-0 [&_p]:[overflow-wrap:anywhere]">
            <ResultCard
              label={
                repaymentType === "equal_payment" ? "월 납입액" : "첫달 납입액"
              }
              value={result.monthlyPayment}
              highlight
            />
            <ResultCard
              label="총 납입액"
              value={result.totalPayment}
            />
            <ResultCard
              label="총 이자"
              value={result.totalInterest}
            />
          </div>

          <div className="[&_p]:min-w-0 [&_p]:[overflow-wrap:anywhere]">
            <SavingBanner
              message={result.savingMessage}
              isProfit={result.isProfit}
            />
          </div>

          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="w-full rounded-xl border border-brand-200 py-2.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
          >
            {showSchedule ? "상환 스케줄 닫기 ▲" : "월별 상환 스케줄 보기 ▼"}
          </button>

          {showSchedule && (
            // 좁은 화면에서 표가 가로로 스크롤되므로 키보드로도 이 영역에 초점을 두고 화살표로 스크롤할 수 있게 한다(기본 Tab 순서).
            <div
              className="overflow-x-auto rounded-xl border border-slate-100 text-xs"
              tabIndex={0}
              role="region"
              aria-label="월별 상환 스케줄"
            >
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
                  {result.rows.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-600">
                        {row.month}회
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {row.payment.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right text-brand-700">
                        {row.principal.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right text-orange-500">
                        {row.interest.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-500">
                        {row.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-slate-500">
            ※ 표준 월 단위 계산 기준입니다. 실제 은행은 대출 실행일에 따라 첫
            달·마지막 달을 일할계산(실제 경과일수 기준)하는 경우가 있어, 실제
            상환 스케줄과 다를 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
