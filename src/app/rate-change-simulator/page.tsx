// src/app/rate-change-simulator/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import RateSimulatorCalc from "@/components/calculator/RateSimulatorCalc";

export const metadata: Metadata = buildMetadata({
  slug: "rate-change-simulator",
  title: "금리변동 시뮬레이터 — 금리 오르면 상환 부담 얼마나?",
  description:
    "변동금리 대출의 금리가 오르면 월 상환액과 총이자가 얼마나 늘어나는지 시나리오별로 계산합니다. +0.25%p·+0.5%p·+1%p 및 직접 입력.",
  keywords: ["금리변동계산기", "금리인상영향", "변동금리시뮬레이터", "대출금리계산기"],
});

const EXAMPLES: CalcExample[] = [
  {
    title: "3억 · 현재 4.0% · 30년",
    desc: "대출 3억원, 현재 금리 4.0%, 360개월, 원리금균등",
    inputs: [
      { label: "대출금액", value: "30,000만원" },
      { label: "현재 금리", value: "연 4.0%" },
      { label: "기간", value: "360개월" },
      { label: "상환방식", value: "원리금균등" },
    ],
    results: [
      { label: "현재 (4.00%)", value: "월 1,432,246원" },
      { label: "+0.25%p", value: "월 +43,574원" },
      { label: "+0.50%p", value: "월 +87,810원" },
      { label: "+1.00%p", value: "월 +178,219원", highlight: true },
    ],
    note: "금리가 1%p 오르면 월 상환액이 약 18만원, 30년 총이자로는 약 6,400만원 늘어납니다. 금리 변동 폭이 클수록 부담 증가도 커집니다.",
  },
  {
    title: "2억 · 현재 3.5% · 20년",
    desc: "대출 2억원, 현재 금리 3.5%, 240개월, 원리금균등",
    inputs: [
      { label: "대출금액", value: "20,000만원" },
      { label: "현재 금리", value: "연 3.5%" },
      { label: "기간", value: "240개월" },
      { label: "상환방식", value: "원리금균등" },
    ],
    results: [
      { label: "현재 (3.50%)", value: "월 1,159,919원" },
      { label: "+0.25%p", value: "월 +25,857원" },
      { label: "+0.50%p", value: "월 +52,041원" },
      { label: "+1.00%p", value: "월 +105,379원", highlight: true },
    ],
    note: "같은 1%p 상승이라도 대출금액과 기간에 따라 부담 증가액이 달라집니다. 자신의 조건으로 직접 확인해 보세요.",
  },
];

const FAQ = [
  {
    q: "이 계산기가 금리 상승을 예측하나요?",
    a: "아니요. 이 계산기는 금리를 예측하지 않습니다. '만약 금리가 0.25%p, 0.5%p, 1%p 오른다면 상환 부담이 얼마나 늘어날까'를 가정해 보여주는 시나리오 도구입니다. 실제 금리가 어떻게 될지는 아무도 알 수 없습니다.",
  },
  {
    q: "변동금리 대출에만 해당되나요?",
    a: "금리가 바뀔 수 있는 변동금리·혼합형·주기형 대출에서 유용합니다. 순수고정금리 대출은 만기까지 금리가 고정되므로 이 시나리오가 적용되지 않습니다.",
  },
  {
    q: "총이자 증가액이 월 상환액 증가보다 훨씬 큰 이유는?",
    a: "월 상환액 증가는 매달 늘어나는 금액이지만, 총이자 증가는 남은 기간 전체에 걸쳐 누적된 금액입니다. 기간이 길수록 작은 금리 차이도 총이자로는 크게 벌어집니다.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="금리변동 시뮬레이터"
        description="금리가 오르면 월 상환액과 총이자가 얼마나 늘어나는지 시나리오별로 확인하세요."
        icon="📈"
        slug="rate-change-simulator"
        breadcrumb={[
          { name: "홈", url: BASE_URL },
          { name: "대출 계산기", url: `${BASE_URL}/loan` },
          { name: "금리변동 시뮬레이터", url: `${BASE_URL}/rate-change-simulator` },
        ]}
        calculator={<RateSimulatorCalc />}
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">
              금리변동 시뮬레이터란?
            </h2>
            <p>
              변동금리 대출은 시장금리에 따라 적용 금리가 오르내립니다. 이
              계산기는 <strong>금리를 예측하지 않고</strong>, &lsquo;만약 금리가
              일정 폭만큼 오른다면 월 상환액과 총이자가 얼마나 늘어날까&rsquo;를
              시나리오별로 보여줍니다. 미래를 맞히는 도구가 아니라, 금리 변동에
              대한 부담을 미리 가늠해 보는 도구입니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              월 상환액과 총이자를 함께 봐야 합니다
            </h2>
            <p>
              금리가 오르면 두 가지가 함께 늘어납니다. <strong>월 상환액</strong>
              은 매달 체감하는 부담이고, <strong>총이자</strong>는 남은 기간
              전체에 걸쳐 누적되는 부담입니다. 기간이 길수록 같은 금리 상승이라도
              총이자 증가폭이 훨씬 커지므로, 두 값을 함께 확인하는 것이
              좋습니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">계산 방식</h2>
            <p>
              각 시나리오는 현재 금리에 변동 폭(%p)을 더한 금리로 원리금균등 또는
              원금균등 상환을 계산합니다. &lsquo;현재 대비&rsquo; 값은 현재 금리
              기준과의 차이입니다. 직접 입력란에 원하는 상승 폭을 넣으면 해당
              시나리오도 표에 추가됩니다.
            </p>

            <div className="rounded-2xl bg-blue-50 p-5 text-blue-900">
              <p className="font-bold">함께 확인하면 좋은 것</p>
              <p className="mt-2">
                현재 조건의 상세 상환 스케줄은 원리금상환 계산기에서, 더 낮은
                금리로 갈아탈 때의 절감액은 대환대출 계산기에서 확인할 수
                있습니다.
              </p>
            </div>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "원리금상환 계산기", href: "/amortization-calculator", icon: "📊" },
          { label: "대환대출 계산기", href: "/refinance-calculator", icon: "🔄" },
          { label: "대출이자 계산기", href: "/loan-interest-calculator", icon: "🏦" },
          { label: "DSR 계산기", href: "/dsr-calculator", icon: "📐" },
        ]}
        relatedGuides={[
          {
            label: "대출 이자 계산 방법 완벽 정리",
            href: "/blog/loan-interest-calculation",
          },
        ]}
      />
    </Suspense>
  );
}
