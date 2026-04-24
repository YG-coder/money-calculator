// src/app/real-estate/jeonse-vs-wolse-calculator/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import JeonseVsWolseCalc from "@/components/calculator/JeonseVsWolseCalc";

export const metadata: Metadata = buildMetadata({
  slug: "real-estate/jeonse-vs-wolse-calculator",
  title: "월세 vs 전세 계산기 — 기회비용 기준 실질 비용 비교",
  description:
    "전세 보증금의 기회비용과 월세 총 비용을 비교해 어떤 선택이 유리한지 계산합니다. 손익분기 이자율도 함께 확인하세요.",
  keywords: ["월세전세비교", "전세vs월세", "기회비용", "손익분기이자율", "부동산계산기"],
});

const EXAMPLES: CalcExample[] = [
  {
    title: "전세 3억 vs 월세 100만원",
    desc: "전세 3억, 월세 보증금 1천만, 월세 100만, 이자율 3.5%",
    inputs: [
      { label: "전세 보증금", value: "3억원 (30,000만)" },
      { label: "월세 보증금", value: "1,000만원" },
      { label: "월 임대료",   value: "100만원" },
      { label: "이자율",      value: "연 3.5%" },
    ],
    results: [
      { label: "전세 기회비용",  value: "875,000원/월" },
      { label: "월세 실질 비용", value: "1,002,917원/월" },
      { label: "월 차이",        value: "127,917원",   highlight: true },
      { label: "결론",           value: "전세가 유리" },
    ],
    note: "이자율 3.5% 기준으로는 전세가 월 약 12.8만원 유리합니다.",
  },
  {
    title: "전세 5억 vs 월세 150만원",
    desc: "전세 5억, 월세 보증금 3천만, 월세 150만, 이자율 4.0%",
    inputs: [
      { label: "전세 보증금", value: "5억원 (50,000만)" },
      { label: "월세 보증금", value: "3,000만원" },
      { label: "월 임대료",   value: "150만원" },
      { label: "이자율",      value: "연 4.0%" },
    ],
    results: [
      { label: "전세 기회비용",  value: "1,666,667원/월" },
      { label: "월세 실질 비용", value: "1,600,000원/월" },
      { label: "월 차이",        value: "66,667원",    highlight: true },
      { label: "결론",           value: "월세가 유리" },
    ],
    note: "이자율이 높을수록 전세 기회비용이 커져 월세가 상대적으로 유리해질 수 있습니다.",
  },
];

const FAQ = [
  {
    q: "기회비용이 뭔가요?",
    a: "전세 보증금을 집주인에게 맡기면 그 돈으로 정기예금이나 투자를 할 수 없게 됩니다. 이렇게 포기하는 수익을 '기회비용'이라고 합니다. 이 계산기는 그 기회비용을 기준으로 전세와 월세를 비교합니다.",
  },
  {
    q: "이자율은 어떻게 설정해야 하나요?",
    a: "현재 정기예금 금리나 본인이 기대하는 투자 수익률을 입력하세요. 일반적으로 3~4% 수준이 적용됩니다.",
  },
  {
    q: "전세가 무조건 유리한 건 아닌가요?",
    a: "맞습니다. 이자율이 높을수록 전세 보증금의 기회비용이 커지기 때문에 경우에 따라 월세가 더 유리할 수 있습니다. 전세 보증금 반환 위험, 전세보증보험 비용 등도 고려해야 합니다.",
  },
  {
    q: "손익분기 이자율이란 무엇인가요?",
    a: "전세 기회비용과 월세 비용이 같아지는 이자율입니다. 실제 이자율이 이보다 높으면 월세가, 낮으면 전세가 유리합니다.",
  },
];

export default function JeonseVsWolseCalculatorPage() {
  const crumbs = [
    { name: "홈",                 url: BASE_URL },
    { name: "부동산 계산기",       url: `${BASE_URL}/real-estate` },
    { name: "월세 vs 전세 계산기", url: `${BASE_URL}/real-estate/jeonse-vs-wolse-calculator` },
  ];

  return (
    <Suspense>
      <CalcShell
        title="월세 vs 전세 계산기"
        description="전세 보증금의 기회비용과 월세 실질 비용을 비교해 어떤 선택이 더 유리한지 계산합니다."
        icon="⚖️"
        slug="real-estate/jeonse-vs-wolse-calculator"
        breadcrumb={crumbs}
        calculator={<JeonseVsWolseCalc />}
        guide={
          <>
            <p>
              <strong>전세</strong>는 보증금이 크지만 월 비용이 없고,
              <strong>월세</strong>는 보증금이 작지만 매달 임대료를 냅니다.
            </p>
            <p>
              단순히 "전세가 싸다"는 말은 틀릴 수 있습니다. 전세 보증금에 묶인
              돈의 <strong>기회비용</strong>을 계산해야 합니다.
            </p>
            <hr className="border-slate-100" />
            <p className="text-slate-400">
              이자율을 현재 정기예금 금리(약 3~4%)로 설정하면 현실적인 비교가
              가능합니다.
            </p>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "취득세 계산기",   href: "/real-estate/acquisition-tax-calculator", icon: "🏠" },
          { label: "전세대출 계산기", href: "/jeonse-loan-calculator",                 icon: "🏠" },
          { label: "대출이자 계산기", href: "/loan-interest-calculator",               icon: "🏦" },
        ]}
        relatedGuides={[
          { label: "전세 vs 월세 어떤 게 유리한가",  href: "/blog/jeonse-vs-wolse" },
          { label: "전세보증보험 완벽 가이드",         href: "/blog/jeonse-insurance-guide" },
        ]}
      />
    </Suspense>
  );
}
