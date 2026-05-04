// src/components/calculator/PropertyYieldCalc.tsx

"use client";

import { useMemo, useState } from "react";

function formatWon(value: number) {
    if (!Number.isFinite(value)) return "-";
    return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatPercent(value: number) {
    if (!Number.isFinite(value)) return "-";
    return `${value.toFixed(2)}%`;
}

function toNumber(value: string) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

export default function PropertyYieldCalc() {
    const [purchasePrice, setPurchasePrice] = useState("");
    const [deposit, setDeposit] = useState("");
    const [monthlyRent, setMonthlyRent] = useState("");
    const [loanAmount, setLoanAmount] = useState("");
    const [interestRate, setInterestRate] = useState("");
    const [monthlyCost, setMonthlyCost] = useState("");

    const result = useMemo(() => {
        const price = toNumber(purchasePrice);
        const dep = toNumber(deposit);
        const rent = toNumber(monthlyRent);
        const loan = toNumber(loanAmount);
        const rate = toNumber(interestRate);
        const cost = toNumber(monthlyCost);

        if (price <= 0 || dep < 0 || rent <= 0) return null;

        const monthlyInterest = loan > 0 && rate > 0 ? (loan * rate) / 100 / 12 : 0;
        const monthlyNetIncome = rent - monthlyInterest - cost;
        const annualNetIncome = monthlyNetIncome * 12;
        const investedCapital = price - dep - loan;
        const purchaseYield = price > 0 ? (annualNetIncome / price) * 100 : 0;
        const equityYield =
            investedCapital > 0 ? (annualNetIncome / investedCapital) * 100 : 0;

        return {
            monthlyInterest,
            monthlyNetIncome,
            annualNetIncome,
            investedCapital,
            purchaseYield,
            equityYield,
        };
    }, [purchasePrice, deposit, monthlyRent, loanAmount, interestRate, monthlyCost]);

    return (
        <div className="space-y-6">
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium leading-relaxed text-red-600">
                * 매입가, 보증금, 월세는 필수 입력값입니다. 대출금, 금리, 월 비용은 없으면 0으로 계산됩니다.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="매입가"
                    value={purchasePrice}
                    onChange={setPurchasePrice}
                    placeholder="예: 300000000"
                    required
                />
                <Input
                    label="보증금"
                    value={deposit}
                    onChange={setDeposit}
                    placeholder="예: 50000000"
                    required
                />
                <Input
                    label="월세"
                    value={monthlyRent}
                    onChange={setMonthlyRent}
                    placeholder="예: 1000000"
                    required
                />
                <Input
                    label="대출금"
                    value={loanAmount}
                    onChange={setLoanAmount}
                    placeholder="예: 150000000"
                />
                <Input
                    label="대출 금리(연 %)"
                    value={interestRate}
                    onChange={setInterestRate}
                    placeholder="예: 4.5"
                />
                <Input
                    label="월 관리비·기타비용"
                    value={monthlyCost}
                    onChange={setMonthlyCost}
                    placeholder="예: 100000"
                />
            </div>

            {result ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <h2 className="mb-4 text-lg font-black text-slate-900">계산 결과</h2>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Result label="월 대출 이자" value={formatWon(result.monthlyInterest)} />
                        <Result
                            label="월 순수익"
                            value={formatWon(result.monthlyNetIncome)}
                            highlight
                        />
                        <Result label="연 순수익" value={formatWon(result.annualNetIncome)} />
                        <Result label="실투자금" value={formatWon(result.investedCapital)} />
                        <Result
                            label="매입가 기준 수익률"
                            value={formatPercent(result.purchaseYield)}
                        />
                        <Result
                            label="자기자본 수익률"
                            value={formatPercent(result.equityYield)}
                            highlight
                        />
                    </div>

                    {result.investedCapital <= 0 && (
                        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            보증금과 대출금이 매입가 이상이면 자기자본 수익률 계산이 왜곡될 수 있습니다.
                        </p>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                    필수 입력값을 입력하면 계산 결과가 표시됩니다.
                </div>
            )}
        </div>
    );
}

function Input({
                   label,
                   value,
                   onChange,
                   placeholder,
                   required,
               }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    required?: boolean;
}) {
    return (
        <label className="block">
            <div className="mb-1.5 flex items-center gap-1 text-sm font-bold text-slate-700">
                {label}
                {required && <span className="text-red-500">*</span>}
            </div>
            <input
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
            />
        </label>
    );
}

function Result({
                    label,
                    value,
                    highlight,
                }: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div
            className={`rounded-xl border p-4 ${
                highlight
                    ? "border-brand-100 bg-brand-50"
                    : "border-slate-100 bg-white"
            }`}
        >
            <div className="text-xs font-semibold text-slate-500">{label}</div>
            <div
                className={`mt-1 text-lg font-black ${
                    highlight ? "text-brand-700" : "text-slate-900"
                }`}
            >
                {value}
            </div>
        </div>
    );
}