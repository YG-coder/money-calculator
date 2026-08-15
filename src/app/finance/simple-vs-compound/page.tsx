// src/app/finance/simple-vs-compound/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import SimpleVsCompoundCalc from "@/components/calculator/SimpleVsCompoundCalc";

export const metadata: Metadata = buildMetadata({
  slug: "finance/simple-vs-compound",
  title: "단리 vs 복리 계산기 — 같은 금리, 다른 성장",
  description:
    "같은 원금·금리·기간에서 단리와 월복리의 최종 금액 차이를 계산합니다. 기간이 길수록 복리가 얼마나 앞서는지 연차별로 확인하세요.",
  keywords: ["단리복리계산기", "단리복리비교", "복리효과", "단리복리차이"],
});

const crumbs = [
  { name: "홈", url: BASE_URL },
  { name: "금융 계산기", url: `${BASE_URL}/finance` },
  { name: "단리 vs 복리 계산기", url: `${BASE_URL}/finance/simple-vs-compound` },
];

const EXAMPLES: CalcExample[] = [
  {
    title: "1,000만원 · 5% · 10년",
    desc: "원금 1,000만원, 연 5%, 10년, 월복리 기준 비교",
    inputs: [
      { label: "원금", value: "1,000만원" },
      { label: "금리", value: "연 5.0%" },
      { label: "기간", value: "10년" },
    ],
    results: [
      { label: "단리 최종액", value: "15,000,000원" },
      { label: "복리 최종액", value: "16,470,095원", highlight: true },
      { label: "차이", value: "1,470,095원 (+9.80%)" },
    ],
    note: "10년이면 복리가 단리보다 약 147만원 많습니다. 단리는 원금에만 이자가 붙지만, 복리는 매달 쌓인 이자에 다시 이자가 붙기 때문입니다.",
  },
  {
    title: "1,000만원 · 5% · 30년",
    desc: "원금 1,000만원, 연 5%, 30년, 월복리 기준 비교",
    inputs: [
      { label: "원금", value: "1,000만원" },
      { label: "금리", value: "연 5.0%" },
      { label: "기간", value: "30년" },
    ],
    results: [
      { label: "단리 최종액", value: "25,000,000원" },
      { label: "복리 최종액", value: "44,677,443원", highlight: true },
      { label: "차이", value: "19,677,443원 (+78.71%)" },
    ],
    note: "같은 5%라도 30년이면 복리가 단리보다 약 1,968만원 많아집니다. 기간이 길수록 복리 효과가 급격히 커지는 것을 볼 수 있습니다.",
  },
];

const FAQ = [
  {
    q: "단리와 복리는 무엇이 다른가요?",
    a: "단리는 처음 원금에만 이자가 붙습니다. 복리는 그동안 쌓인 이자에도 다시 이자가 붙습니다. 그래서 초반에는 차이가 작지만, 시간이 지날수록 복리가 점점 더 앞서갑니다.",
  },
  {
    q: "왜 월복리로 계산하나요?",
    a: "이 계산기는 이자를 매달 원금에 더해 굴리는 월복리를 기준으로 합니다. 복리 주기가 짧을수록(연복리보다 월복리) 최종 금액이 조금 더 커집니다. 단리와 비교하기 위해 원금·금리·기간은 동일하게 두고 복리 방식만 다르게 적용했습니다.",
  },
  {
    q: "기간이 길수록 차이가 커지는 이유는?",
    a: "복리는 이자가 이자를 낳는 구조라 시간이 지날수록 누적 효과가 가속됩니다. 예를 들어 연 5%에서 10년이면 복리가 단리보다 약 9.8% 많지만, 30년이면 약 78.7% 많아집니다. 이것이 흔히 말하는 복리 효과입니다.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="단리 vs 복리 계산기"
        description="같은 원금·금리·기간에서 단리와 복리의 성장 차이를 확인하세요."
        icon="📈"
        slug="finance/simple-vs-compound"
        breadcrumb={crumbs}
        calculator={<SimpleVsCompoundCalc />}
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">
              단리와 복리의 차이
            </h2>
            <p>
              <strong>단리</strong>는 처음 맡긴 원금에 대해서만 이자를 계산합니다.
              매년 같은 금액의 이자가 붙습니다. <strong>복리</strong>는 이자가 붙은
              뒤 그 이자까지 포함한 금액에 다시 이자를 계산합니다. 시간이 지날수록
              이자가 이자를 낳으며 금액이 점점 빠르게 늘어납니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              시간이 만드는 격차
            </h2>
            <p>
              초반에는 단리와 복리의 차이가 작습니다. 하지만 기간이 길어질수록 복리
              쪽이 눈에 띄게 앞서갑니다. 연 5%를 예로 들면, 10년 뒤에는 복리가 단리
              보다 약 9.8% 많지만 30년 뒤에는 약 78.7%까지 벌어집니다. 이 계산기는
              연차별로 두 방식의 금액과 격차를 함께 보여줍니다.
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>단리 최종액 = 원금 + (원금 × 금리 × 기간)</li>
              <li>복리 최종액 = 원금 × (1 + 월이율)^(개월수)</li>
              <li>둘의 차이가 곧 복리 효과입니다</li>
            </ul>

            <div className="rounded-2xl bg-blue-50 p-5 text-blue-900">
              <p className="font-bold">함께 확인하면 좋은 것</p>
              <p className="mt-2">
                매달 꾸준히 납입하며 복리로 불리는 경우는 복리 계산기에서, 물가를
                감안한 실질 가치 변화는 인플레이션 계산기에서 확인할 수 있습니다.
              </p>
            </div>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "복리 계산기", href: "/finance/compound", icon: "📈" },
          { label: "예금 이자 계산기", href: "/finance/deposit", icon: "🏦" },
          { label: "인플레이션 계산기", href: "/finance/inflation", icon: "💸" },
          { label: "실질금리 계산기", href: "/finance/real-interest-rate", icon: "📉" },
        ]}
        relatedGuides={[]}
      />
    </Suspense>
  );
}
