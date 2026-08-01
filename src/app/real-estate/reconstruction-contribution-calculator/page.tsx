import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import ReconstructionContributionCalc from "@/components/calculator/ReconstructionContributionCalc";

export const metadata: Metadata = buildMetadata({
    slug: "real-estate/reconstruction-contribution-calculator",
    title: "재건축 분담금 계산기 — 조합원 예상 분담금 계산",
    description:
        "권리가액, 종후자산가액, 비례율을 기준으로 재건축 조합원 예상 분담금을 계산합니다.",
    keywords: [
        "재건축분담금계산기",
        "조합원분담금",
        "권리가액",
        "종후자산가액",
        "비례율",
    ],
});

const EXAMPLES: CalcExample[] = [
    {
        title: "비례율 100% (사업성 보통)",
        desc: "종전자산평가액 6억, 종후자산가액 9억, 비례율 100%",
        inputs: [
            { label: "종전자산평가액", value: "6억원" },
            { label: "종후자산가액", value: "9억원" },
            { label: "비례율", value: "100%" },
        ],
        results: [
            { label: "권리가액", value: "6억원" },
            { label: "예상 분담금", value: "3억원", highlight: true },
        ],
        note: "비례율 100%는 사업성이 평균 수준일 때의 가정입니다. 실제 사업장마다 차이가 큽니다.",
    },
    {
        title: "비례율 80% (사업성 낮음)",
        desc: "같은 조건이지만 비례율이 80%로 떨어진 경우",
        inputs: [
            { label: "종전자산평가액", value: "6억원" },
            { label: "종후자산가액", value: "9억원" },
            { label: "비례율", value: "80%" },
        ],
        results: [
            { label: "권리가액", value: "4억 8,000만원" },
            { label: "예상 분담금", value: "4억 2,000만원", highlight: true },
        ],
        note: "비례율 20%p 하락만으로 분담금이 1억 2,000만원 더 늘어납니다. 사업성 검토가 핵심인 이유입니다.",
    },
];

const FAQ = [
    {
        q: "분담금은 어떻게 계산되나요?",
        a: "권리가액(= 종전자산평가액 × 비례율)을 먼저 구한 뒤, 종후자산가액에서 권리가액을 빼 예상 분담금을 계산합니다. 권리가액이 종후자산가액보다 크면 환급금이 발생합니다.",
    },
    {
        q: "권리가액과 종후자산가액은 어떻게 알 수 있나요?",
        a: "조합 사업시행계획·관리처분계획에서 산정됩니다. 조합 공지 또는 감정평가 결과를 확인하세요.",
    },
    {
        q: "비례율이 무엇이고 왜 중요한가요?",
        a: "비례율은 사업성을 나타내는 지표입니다. 비례율이 높으면 조합원이 인정받는 평가액이 커져 분담금이 줄고, 낮으면 분담금이 늘어납니다.",
    },
    {
        q: "실제 분담금과 계산 결과가 다를 수 있나요?",
        a: "네. 사업비 변동, 일반분양가, 조합원 분양가, 추가 옵션비 등에 따라 실제 금액은 달라질 수 있습니다.",
    },
];

export default function ReconstructionContributionPage() {
    const crumbs = [
        { name: "홈", url: BASE_URL },
        { name: "부동산 계산기", url: `${BASE_URL}/real-estate` },
        {
            name: "재건축 분담금 계산기",
            url: `${BASE_URL}/real-estate/reconstruction-contribution-calculator`,
        },
    ];

    return (
        <Suspense>
            <CalcShell
                title="재건축 분담금 계산기"
                description="권리가액과 종후자산가액을 기준으로 예상 재건축 조합원 분담금을 계산합니다."
                icon="🏗️"
                slug="real-estate/reconstruction-contribution-calculator"
                breadcrumb={crumbs}
                calculator={<ReconstructionContributionCalc />}
                guide={
                    <>
                        <h2 className="text-xl font-bold text-slate-900">
                            재건축 분담금 계산기란?
                        </h2>
                        <p>
                            재건축 분담금 계산기는 조합원이 새 아파트를 배정받을 때 추가로 부담해야 할 금액을 추정하는 도구입니다.
                            기존 주택의 권리가액과 재건축 후 배정받는 종후자산가액을 비교해 예상 분담금 또는 환급 가능성을 확인할 수 있습니다.
                        </p>

                        <h2 className="text-xl font-bold text-slate-900">
                            기본 계산 구조
                        </h2>
                        <div className="rounded bg-slate-100 p-4">
                            <strong>권리가액 = 종전자산평가액 × 비례율</strong>
                            <br />
                            <strong>예상 분담금 = 종후자산가액 - 권리가액</strong>
                        </div>

                        <h2 className="text-xl font-bold text-slate-900">
                            주요 용어 정리
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                <tr className="bg-slate-50">
                                    <th className="border border-slate-200 p-3">용어</th>
                                    <th className="border border-slate-200 p-3">의미</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td className="border border-slate-200 p-3 font-semibold">종전자산평가액</td>
                                    <td className="border border-slate-200 p-3">재건축 전 기존 주택과 토지의 평가 금액</td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-200 p-3 font-semibold">비례율</td>
                                    <td className="border border-slate-200 p-3">사업 수익성과 비용을 반영해 권리가액을 산정하는 비율</td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-200 p-3 font-semibold">권리가액</td>
                                    <td className="border border-slate-200 p-3">조합원이 기존 자산에 대해 인정받는 금액</td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-200 p-3 font-semibold">종후자산가액</td>
                                    <td className="border border-slate-200 p-3">재건축 후 배정받을 새 아파트의 평가 금액</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        <h2 className="text-xl font-bold text-slate-900">
                            실제 계산 예시
                        </h2>
                        <p>
                            예를 들어 종전자산평가액이 6억 원이고 비례율이 100%라면 권리가액은 6억 원입니다.
                            이때 재건축 후 배정받을 종후자산가액이 9억 원이라면 예상 분담금은 약 3억 원입니다.
                        </p>

                        <h2 className="text-xl font-bold text-slate-900">
                            분담금이 늘어나는 주요 원인
                        </h2>
                        <ul className="list-disc space-y-2 pl-5">
                            <li>공사비가 상승하는 경우</li>
                            <li>금융비용과 이주비 이자가 증가하는 경우</li>
                            <li>일반분양가가 예상보다 낮아지는 경우</li>
                            <li>사업 기간이 길어져 추가 사업비가 발생하는 경우</li>
                            <li>비례율이 하락하는 경우</li>
                        </ul>

                        <h2 className="text-xl font-bold text-slate-900">
                            계산 시 주의사항
                        </h2>
                        <ul className="list-disc space-y-2 pl-5">
                            <li>비례율은 사업 진행 과정에서 변동될 수 있습니다.</li>
                            <li>조합원 분양가와 일반분양가 차이에 따라 실제 분담금이 달라질 수 있습니다.</li>
                            <li>관리처분계획 인가 전후로 예상 금액이 크게 바뀔 수 있습니다.</li>
                            <li>계산 결과는 참고용이며 실제 금액은 조합 자료와 관리처분계획을 기준으로 확인해야 합니다.</li>
                        </ul>
                    </>
                }
                examples={EXAMPLES}
                faq={FAQ}
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
                        label: "부동산 수익률 계산기",
                        href: "/real-estate/property-yield-calculator",
                        icon: "📈",
                    },
                ]}
                relatedGuides={[
                    {
                        label: "취득세 완벽 가이드 — 매수 단계 세금",
                        href: "/blog/acquisition-tax-guide",
                    },
                ]}
            />
        </Suspense>
    );
}