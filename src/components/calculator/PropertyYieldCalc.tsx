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

export default function PropertyYieldCalc() {
    const [purchasePrice, setPurchasePrice] = useState("300000000");
    const [deposit, setDeposit] = useState("50000000");
    const [monthlyRent, setMonthlyRent] = useState("1000000");
    const [loanAmount, setLoanAmount] = useState("150000000");
    const [interestRate, setInterestRate] = useState("4.5");
    const [monthlyCost, setMonthlyCost] = useState("100000");

    const result = useMemo(() => {
        const price = Number(purchasePrice);
        const dep = Number(deposit);
        const rent = Number(monthlyRent);
        const loan = Number(loanAmount);
        const rate = Number(interestRate);
        const cost = Number(monthlyCost);

        if (!price || price <= 0) return null;

        const monthlyInterest = loan > 0 ? (loan * rate) / 100 / 12 : 0;
        const monthlyNetIncome = rent - monthlyInterest - cost;
        const annualNetIncome = monthlyNetIncome * 12;

        const investedCapital = price - dep - loan;
        const purchaseYield = (annualNetIncome / price) * 100;
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
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
                <Input label="매입가" value={purchasePrice} onChange={setPurchasePrice} />
                <Input label="보증금" value={deposit} onChange={setDeposit} />
                <Input label="월세" value={monthlyRent} onChange={setMonthlyRent} />
                <Input label="대출금" value={loanAmount} onChange={setLoanAmount} />
                <Input label="대출 금리(연 %)" value={interestRate} onChange={setInterestRate} />
                <Input label="월 관리비·기타비용" value={monthlyCost} onChange={setMonthlyCost} />
            </div>

            {result && (
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <h2 className="text-xl font-bold">계산 결과</h2>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <Result label="월 대출 이자" value={formatWon(result.monthlyInterest)} />
                        <Result label="월 순수익" value={formatWon(result.monthlyNetIncome)} />
                        <Result label="연 순수익" value={formatWon(result.annualNetIncome)} />
                        <Result label="실투자금" value={formatWon(result.investedCapital)} />
                        <Result label="매입가 기준 수익률" value={formatPercent(result.purchaseYield)} />
                        <Result label="자기자본 수익률" value={formatPercent(result.equityYield)} />
                    </div>
                </div>
            )}
        </div>
    );
}

function Input({
                   label,
                   value,
                   onChange,
               }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="space-y-2">
            <span className="text-sm font-medium">{label}</span>
            <input
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
        </label>
    );
}

function Result({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border bg-background p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-xl font-bold">{value}</div>
        </div>
    );
}