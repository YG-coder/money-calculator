// src/app/real-estate/property-yield-calculator/page.tsx

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import PropertyYieldCalc from "@/components/calculator/PropertyYieldCalc";

export const metadata: Metadata = buildMetadata({
    slug: "real-estate/property-yield-calculator",
    title: "부동산 수익률 계산기 — 월세 수익률·대출 이자·순수익 계산",
    description:
        "매입가, 보증금, 월세, 대출금, 금리를 입력하면 월 순수익, 연 순수익, 자기자본 수익률, 매입가 기준 수익률을 계산합니다.",
    keywords: [
        "부동산 수익률 계산기",
        "월세 수익률 계산기",
        "임대수익률 계산기",
        "부동산 투자 수익률",
        "갭투자 수익률",
        "월세 순수익 계산",
    ],
});

const EXAMPLES: CalcExample[] = [
    {
        title: "월세 투자 수익률 계산",
        description: "매입가 3억, 보증금 5천만 원, 월세 100만 원 기준 수익률 계산",
    },
    {
        title: "대출 포함 부동산 수익률 계산",
        description: "대출금과 금리를 반영해 실제 월 순수익과 연 수익률 계산",
    },
    {
        title: "자기자본 대비 수익률 확인",
        description: "실제 투입한 현금 대비 연간 순수익률 계산",
    },
];

export default function Page() {
    return (
        <CalcShell
            title="부동산 수익률 계산기"
            description="매입가, 보증금, 월세, 대출금, 금리를 입력하면 월 순수익과 연 수익률을 간편하게 계산할 수 있습니다."
            examples={EXAMPLES}
        >
            <PropertyYieldCalc />

            <section className="mt-12 space-y-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        부동산 수익률 계산기란?
                    </h2>
                    <p className="mt-3 text-muted-foreground leading-7">
                        부동산 수익률 계산기는 월세 수입에서 대출 이자, 관리비, 기타 비용을
                        제외한 뒤 실제로 남는 순수익과 수익률을 계산하는 도구입니다. 단순히
                        월세가 높다고 좋은 투자가 되는 것은 아니며, 매입가와 대출 비중,
                        보증금, 금리, 유지 비용을 함께 봐야 합니다.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        어떤 수익률을 확인해야 하나요?
                    </h2>
                    <p className="mt-3 text-muted-foreground leading-7">
                        부동산 투자에서는 크게 매입가 기준 수익률과 자기자본 수익률을 함께
                        확인하는 것이 좋습니다. 매입가 기준 수익률은 부동산 전체 가격 대비
                        수익성을 보는 지표이고, 자기자본 수익률은 실제 내가 투입한 현금 대비
                        얼마나 수익이 나는지를 보는 지표입니다.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        계산 결과를 볼 때 주의할 점
                    </h2>
                    <p className="mt-3 text-muted-foreground leading-7">
                        이 계산기는 예상 수익률을 간단히 확인하기 위한 참고용 도구입니다.
                        실제 투자 판단 시에는 공실 가능성, 수선비, 취득세, 재산세, 종합부동산세,
                        중개수수료, 양도세, 지역 시세 변화 등을 함께 검토해야 합니다. 세금
                        계산은 별도 세금 계산기를 참고하거나 전문가 상담을 권장합니다.
                    </p>
                </div>
            </section>
        </CalcShell>
    );
}