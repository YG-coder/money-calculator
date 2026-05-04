// src/app/real-estate/property-yield-calculator/page.tsx

import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
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
        desc: "매입가 3억 원, 보증금 5천만 원, 월세 100만 원인 경우",
        inputs: [
            { label: "매입가", value: "30,000만원" },
            { label: "보증금", value: "5,000만원" },
            { label: "월세", value: "100만원" },
            { label: "월 비용", value: "10만원" },
        ],
        results: [
            { label: "월 순수익", value: "90만원", highlight: true },
            { label: "연 순수익", value: "1,080만원" },
            { label: "매입가 기준 수익률", value: "3.60%" },
        ],
    },
    {
        title: "대출 포함 수익률 계산",
        desc: "대출 1억 5천만 원, 연 금리 4.5%를 반영한 경우",
        inputs: [
            { label: "매입가", value: "30,000만원" },
            { label: "보증금", value: "5,000만원" },
            { label: "대출금", value: "15,000만원" },
            { label: "연 금리", value: "4.5%" },
        ],
        results: [
            { label: "월 대출 이자", value: "약 56만원" },
            { label: "월 순수익", value: "약 34만원", highlight: true },
            { label: "자기자본 수익률", value: "약 4.13%" },
        ],
    },
];

const GUIDE = (
    <section className="space-y-8">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">
                부동산 수익률 계산기란?
            </h2>
            <p className="mt-3 text-slate-600 leading-7">
                부동산 수익률 계산기는 월세 수입에서 대출 이자, 관리비, 기타 비용을
                제외한 뒤 실제로 남는 순수익과 수익률을 계산하는 도구입니다. 단순히
                월세가 높다고 좋은 투자가 되는 것은 아니며, 매입가와 대출 비중,
                보증금, 금리, 유지 비용을 함께 봐야 정확한 수익성을 판단할 수
                있습니다.
            </p>
        </div>

        <div>
            <h2 className="text-2xl font-bold tracking-tight">
                매입가 기준 수익률 vs 자기자본 수익률
            </h2>
            <p className="mt-3 text-slate-600 leading-7">
                부동산 투자에서는 두 가지 수익률을 함께 봐야 합니다.
                <strong> 매입가 기준 수익률</strong>은 부동산 전체 가격 대비 연
                순수익을 계산한 값으로, 레버리지 효과를 배제한 자산 자체의
                수익성을 보여줍니다. <strong>자기자본 수익률</strong>은 실제로
                투입한 현금(매입가 − 보증금 − 대출금) 대비 연 순수익을 계산한
                값입니다. 대출을 활용하면 자기자본 수익률은 높아질 수 있지만,
                금리 상승 시 변동성도 함께 커진다는 점을 함께 고려해야 합니다.
            </p>
        </div>

        <div>
            <h2 className="text-2xl font-bold tracking-tight">
                결과를 해석할 때 주의할 점
            </h2>
            <p className="mt-3 text-slate-600 leading-7">
                이 계산기는 예상 수익률을 빠르게 확인하기 위한 참고용 도구입니다.
                실제 투자 판단 시에는 공실 가능성, 수선비, 취득세, 재산세,
                종합부동산세, 양도소득세, 중개수수료, 지역 시세 변화 등을 함께
                검토해야 합니다. 특히 대출 비중이 높은 경우 금리 상승 시 월
                순수익이 빠르게 줄어들 수 있으므로, 금리 변동에 대한 민감도도
                함께 따져보는 것이 좋습니다.
            </p>
        </div>
    </section>
);

export default function Page() {
    return (
        <Suspense>
            <CalcShell
                title="부동산 수익률 계산기"
                description="매입가, 보증금, 월세, 대출금, 금리를 입력하면 월 순수익과 연 수익률을 간편하게 계산할 수 있습니다."
                icon="🏠"
                slug="real-estate/property-yield-calculator"
                calculator={<PropertyYieldCalc />}
                guide={GUIDE}
                examples={EXAMPLES}
                breadcrumb={[
                    { name: "홈", url: BASE_URL },
                    { name: "부동산 계산기", url: `${BASE_URL}/real-estate` },
                    {
                        name: "부동산 수익률 계산기",
                        url: `${BASE_URL}/real-estate/property-yield-calculator`,
                    },
                ]}
                relatedCalcs={[
                    {
                        label: "취득세 계산기",
                        href: "/real-estate/acquisition-tax-calculator",
                        icon: "🏠",
                    },
                    {
                        label: "월세 vs 전세 계산기",
                        href: "/real-estate/jeonse-vs-wolse-calculator",
                        icon: "⚖️",
                    },
                    {
                        label: "대출이자 계산기",
                        href: "/loan-interest-calculator",
                        icon: "🏦",
                    },
                ]}
                relatedGuides={[
                    {
                        label: "부동산 수익률 계산 방법 완벽 정리",
                        href: "/blog/property-yield-guide",
                    },
                    {
                        label: "취득세 완벽 가이드",
                        href: "/blog/acquisition-tax-guide",
                    },
                ]}
            />
        </Suspense>
    );
}