"use client";

import { useMemo } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { readWon, isFilled, hasFieldError } from "@/lib/calcInput";
import { formatKRW, formatUnit } from "@/lib/loan";
import {
  calcMovingCost,
  MOVING_COST_KEYS,
  type MovingCosts,
  type MovingCostKey,
} from "@/lib/funds";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const MAX_MAN = 1_000_000; // 100억원 — 보증금까지 다루므로 상한이 더 높다

const overAmount = (v: string) =>
  v && Number(v) > MAX_MAN ? "금액을 다시 확인해주세요" : undefined;

const COST_FIELDS: { key: MovingCostKey; label: string; hint: string }[] = [
  { key: "movingFee", label: "이사비", hint: "포장이사·용달 등 운송 비용" },
  {
    key: "brokerage",
    label: "임대차 중개보수",
    hint: "중개사무소와 협의한 금액을 직접 입력하세요",
  },
  { key: "appliance", label: "가전·가구", hint: "새로 구입하거나 옮기는 비용" },
  { key: "etc", label: "기타 초기비용", hint: "청소·입주 수리·보증보험료 등" },
];

const FIELDS = [
  { key: "newDeposit", kind: "money" as const, defaultValue: "", validate: overAmount },
  { key: "returnedDeposit", kind: "money" as const, defaultValue: "", validate: overAmount },
  ...COST_FIELDS.map((f) => ({
    key: f.key,
    kind: "money" as const,
    defaultValue: "",
    validate: overAmount,
  })),
];

export default function MovingCostCalc() {
  const { state, setValue } = useCalcState(FIELDS);

  /** 거부된 입력과 상한 초과 등 검증 오류를 모두 차단 사유로 본다. */
  const blocked = hasFieldError(state);

  const result = useMemo(() => {
    if (blocked) return null;
    if (!isFilled(state, "newDeposit")) return null;

    const costsWon = Object.fromEntries(
      MOVING_COST_KEYS.map((key) => [key, readWon(state, key)]),
    ) as MovingCosts;

    return calcMovingCost({
      newDepositWon: readWon(state, "newDeposit"),
      returnedDepositWon: readWon(state, "returnedDeposit"),
      costsWon,
    });
  }, [state, blocked]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-800">입력 기준</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          <strong>새 보증금</strong>만 필수입니다. 나머지는 선택 항목이며{" "}
          <strong>비워 두면 0원</strong>으로 계산합니다. 해당 없는 항목은 그대로
          비워 두세요.
        </p>
      </div>

      <InputField
        label="새 보증금"
        name="newDeposit"
        value={state.newDeposit?.value ?? ""}
        onChange={(v) => setValue("newDeposit", v)}
        suffix="만원"
        hint="새로 계약하는 집의 보증금"
        error={state.newDeposit?.error}
      />

      <InputField
        label="기존 보증금 회수 예상액 (선택)"
        name="returnedDeposit"
        value={state.returnedDeposit?.value ?? ""}
        onChange={(v) => setValue("returnedDeposit", v)}
        suffix="만원"
        hint="돌려받을 것으로 예상하는 금액을 직접 입력하세요"
        error={state.returnedDeposit?.error}
      />

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-600">
          이사 부대비용 (선택)
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {COST_FIELDS.map((f) => (
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

      {blocked && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          입력값에 확인이 필요한 항목이 있어 결과를 표시하지 않았습니다. 위에
          표시된 항목을 수정해 주세요.
        </p>
      )}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="보증금 차액"
              value={formatKRW(result.depositDiffWon)}
              sub={
                result.depositDiffWon > 0
                  ? "새 보증금이 더 큽니다"
                  : result.depositDiffWon < 0
                    ? "회수 예상액이 더 큽니다"
                    : "두 보증금이 같습니다"
              }
            />
            <ResultCard
              label="총 이사 부대비용"
              value={formatKRW(result.extraCostWon)}
              sub="이사비·중개보수·가전가구·기타의 합"
            />
          </div>

          <ResultCard
            label={result.isSurplus ? "계산상 남는 금액" : "추가로 필요한 자금"}
            value={formatKRW(result.totalNeededWon)}
            sub={
              result.isSurplus
                ? "회수 예상액으로 비용을 충당하고 남는 금액입니다"
                : `보증금 차액 ${formatUnit(result.depositDiffWon)} + 부대비용 ${formatUnit(result.extraCostWon)}`
            }
            highlight={!result.isSurplus}
          />

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            <p>
              입력하신 보증금 회수 예상액을 반영한 계산입니다. 실제 반환 여부·시점·
              감액 가능성은 판단하지 않습니다.
            </p>
            <p className="mt-2">
              기존 보증금을 돌려받기 전에 새 보증금을 먼저 내야 하는 경우, 그
              시차 동안 필요한 현금은 이 계산에 포함되지 않습니다.
            </p>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
            <p>
              · 임대차 중개보수는 직접 입력한 금액을 그대로 사용합니다. 이
              계산기는 요율로 자동 산정하지 않습니다.
            </p>
            <p>
              · 입력한 금액만으로 계산한 참고용 결과입니다. 계약 조건이나 대출을
              권하지 않습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
