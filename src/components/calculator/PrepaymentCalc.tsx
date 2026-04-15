"use client";

import { useMemo } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { calcPrepayment, formatKRW, formatUnit } from "@/lib/loan";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";
import SavingBanner from "@/components/calculator/SavingBanner";

const FIELDS = [
  {
    key: "remaining",
    kind: "money" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0 ? "잔여 원금을 입력해주세요" : undefined,
  },
  {
    key: "prepay",
    kind: "money" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0 ? "중도상환 금액을 입력해주세요" : undefined,
  },
  {
    key: "rate",
    kind: "decimal" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0 ? "이자율을 입력해주세요" : undefined,
  },
  {
    key: "remMonths",
    kind: "integer" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0 ? "잔여 기간을 입력해주세요" : undefined,
  },
  {
    key: "feeRate",
    kind: "decimal" as const,
    defaultValue: "1.2",
  },
];

export default function PrepaymentCalc() {
  const { state, setValue, getWon, getNum } = useCalcState(FIELDS);

  const remainingWon = getWon("remaining");
  const prepayWon = getWon("prepay");

  const amountError =
    remainingWon > 0 && prepayWon > 0 && prepayWon > remainingWon
      ? "중도상환 금액은 잔여 원금보다 클 수 없습니다."
      : "";

  const result = useMemo(() => {
    const rem = getWon("remaining");
    const pre = getWon("prepay");
    const r = getNum("rate");
    const m = getNum("remMonths");
    const fee = getNum("feeRate") || 1.2;

    if (!rem || !pre || !r || !m) return null;
    if (pre > rem) return null;

    return calcPrepayment(rem, pre, r, m, fee);
  }, [state, getWon, getNum]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          label="잔여 원금"
          name="remaining"
          suffix="만원"
          placeholder="예: 20,000"
          hint="현재 남은 원금"
          value={state.remaining?.value ?? ""}
          error={state.remaining?.error}
          onChange={(v) => setValue("remaining", v)}
        />

        <InputField
          label="중도상환 금액"
          name="prepay"
          suffix="만원"
          placeholder="예: 5,000"
          hint="지금 갚을 금액"
          value={state.prepay?.value ?? ""}
          error={state.prepay?.error || amountError}
          onChange={(v) => setValue("prepay", v)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          label="잔여 기간"
          name="remMonths"
          suffix="개월"
          placeholder="예: 30"
          value={state.remMonths?.value ?? ""}
          error={state.remMonths?.error}
          onChange={(v) => setValue("remMonths", v)}
        />
      </div>

      <InputField
        label="중도상환 수수료율"
        name="feeRate"
        suffix="%"
        step={0.1}
        hint="은행별 상이 (보통 0.6~1.5%)"
        value={state.feeRate?.value ?? ""}
        onChange={(v) => setValue("feeRate", v)}
      />

      {amountError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {amountError}
        </div>
      )}

      {result && !amountError && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResultCard
              label="예상 절약 이자"
              value={formatUnit(Math.max(0, result.interestSaving))}
            />
            <ResultCard
              label="중도상환 수수료"
              value={formatKRW(result.prepaymentFee)}
              danger={!result.isProfit}
            />
            <ResultCard
              label="실질 이득"
              value={formatUnit(result.netProfit)}
              highlight={result.isProfit}
              danger={!result.isProfit}
            />
          </div>

          {result.isProfit && result.breakEvenMonths > 0 && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              📊 손익분기 시점:{" "}
              <strong className="text-slate-900">
                {result.breakEvenMonths}개월
              </strong>{" "}
              후부터 순이익
            </div>
          )}

          <SavingBanner
            message={result.savingMessage}
            isProfit={result.isProfit}
          />

          <p className="text-xs text-slate-400">
            ※ 원리금균등상환 기준 계산입니다. 수수료는 대출 계약서 기준으로 다를
            수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
