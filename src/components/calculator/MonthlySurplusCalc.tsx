"use client";

import { useMemo } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { readWon, isFilled, hasRejectedInput } from "@/lib/calcInput";
import { formatKRW, formatUnit } from "@/lib/loan";
import {
  calcMonthlySurplus,
  EXPENSE_KEYS,
  type ExpenseAmounts,
  type ExpenseKey,
} from "@/lib/funds";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

/** 만원 단위 입력의 상식적인 상한. 초과하면 오타로 보고 안내한다. */
const MAX_MAN = 100_000; // 10억원

const overLimit = (v: string) =>
  v && Number(v) > MAX_MAN ? "금액을 다시 확인해주세요" : undefined;

const EXPENSE_FIELDS: {
  key: ExpenseKey;
  label: string;
  hint?: string;
}[] = [
  {
    key: "housing",
    label: "주거비",
    hint: "월세·관리비·공과금. 전세대출 이자는 대출상환에 넣으세요",
  },
  { key: "food", label: "식비", hint: "장보기·외식·배달" },
  { key: "transport", label: "교통비", hint: "대중교통·주유·주차" },
  { key: "telecom", label: "통신비", hint: "휴대폰·인터넷·구독료" },
  {
    key: "insurance",
    label: "보험료",
    hint: "고지서를 받아 직접 내는 보험료만",
  },
  {
    key: "loanRepayment",
    label: "대출상환",
    hint: "원금과 이자를 합한 실제 이체 금액",
  },
  { key: "other", label: "기타 지출", hint: "의료·교육·경조사·용돈 등" },
];

const FIELDS = [
  { key: "income", kind: "money" as const, defaultValue: "", validate: overLimit },
  ...EXPENSE_FIELDS.map((f) => ({
    key: f.key,
    kind: "money" as const,
    defaultValue: "",
    validate: overLimit,
  })),
];

export default function MonthlySurplusCalc() {
  const { state, setValue } = useCalcState(FIELDS);

  /** 입력값에 오류 표시가 있으면 계산을 진행하지 않는다. */
  const hasInputError = useMemo(
    () => FIELDS.some((f) => !!state[f.key]?.error),
    [state],
  );

  const result = useMemo(() => {
    if (hasRejectedInput(state)) return null;
    if (hasInputError) return null;
    if (!isFilled(state, "income")) return null;

    // 미입력 지출 항목은 설계상 0 으로 다룬다(0 을 넣은 것과 결과가 같다).
    // 반면 금액으로 성립하지 않는 값은 엔진이 null 을 돌려주므로 결과를 내지 않는다.
    const expensesWon = Object.fromEntries(
      EXPENSE_KEYS.map((key) => [key, readWon(state, key)]),
    ) as ExpenseAmounts;

    return calcMonthlySurplus({
      incomeWon: readWon(state, "income"),
      expensesWon,
    });
  }, [state, hasInputError]);

  const anyExpenseFilled = EXPENSE_KEYS.some((key) => isFilled(state, key));
  const blockedByError = hasInputError && isFilled(state, "income");

  return (
    <div className="space-y-5">
      {/* 입력 기준 — 이중 차감 방지 */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-800">입력 기준</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          월 소득에는 <strong>실제로 손에 들어오는 금액</strong>을 넣으세요. 그
          금액에서 이미 빠져나간 세금·보험료는 아래 지출에 다시 넣지 않습니다.
          급여에서 공제되지 않고 <strong>따로 납부하는 금액만</strong> 지출에
          포함하세요.
        </p>
      </div>

      <InputField
        label="월 소득"
        name="income"
        value={state.income?.value ?? ""}
        onChange={(v) => setValue("income", v)}
        suffix="만원"
        hint="세금·4대보험이 공제된 뒤 실제로 받는 금액"
        error={state.income?.error}
      />

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-600">
          월 지출 (해당 없는 항목은 비워두세요)
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {EXPENSE_FIELDS.map((f) => (
            <InputField
              key={f.key}
              label={f.label}
              name={f.key}
              value={state[f.key]?.value ?? ""}
              onChange={(v) => setValue(f.key, v)}
              suffix="만원"
              hint={f.hint}
              error={state[f.key]?.error}
            />
          ))}
        </div>
      </div>

      {blockedByError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          입력값에 확인이 필요한 항목이 있어 결과를 표시하지 않았습니다. 위에
          표시된 항목을 수정해 주세요.
        </p>
      )}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="월 소득"
              value={formatKRW(result.incomeWon)}
              sub={formatUnit(result.incomeWon)}
            />
            <ResultCard
              label="월 총지출"
              value={formatKRW(result.totalExpenseWon)}
              sub={
                result.expenseRatioPct === null
                  ? undefined
                  : `월 소득의 ${result.expenseRatioPct.toFixed(1)}%`
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="월 잉여자금"
              value={formatKRW(result.surplusWon)}
              sub={
                result.isDeficit
                  ? "지출이 소득보다 큽니다"
                  : "소득에서 지출을 뺀 금액"
              }
              highlight={!result.isDeficit}
              danger={result.isDeficit}
            />
            <ResultCard
              label="연간 환산 잉여자금"
              value={formatKRW(result.annualSurplusWon)}
              sub="같은 소득·지출이 12개월 유지될 경우"
              danger={result.isDeficit}
            />
          </div>

          {!anyExpenseFilled && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              지출을 아직 입력하지 않아 <strong>총지출 0원</strong>으로
              계산했습니다.
            </p>
          )}

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
            <p>
              · 연간 환산은 <strong>같은 소득·지출이 12개월 그대로 유지된다는
              가정</strong>입니다. 상여금·연말정산·계절 지출은 반영하지
              않습니다.
            </p>
            <p>
              · 입력한 금액만으로 계산한 참고용 결과입니다. 이 값이 적절한지
              판단하거나 저축·소비 수준을 권하지 않습니다.
            </p>
            <p>
              · 여기서 계산한 잉여자금은 생활 현금흐름이며, 대출 규제에서 쓰는
              소득 기준과는 계산 방식이 다릅니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
