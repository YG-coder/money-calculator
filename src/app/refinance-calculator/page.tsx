// src/app/refinance-calculator/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import RefinanceCalc from "@/components/calculator/RefinanceCalc";

export const metadata: Metadata = buildMetadata({
  slug: "refinance-calculator",
  title: "대환대출 계산기 — 절감액·손익분기 계산",
  description:
    "기존 대출과 새 대출 조건, 중도상환수수료를 입력하면 총이자 절감액, 순절감액, 손익분기 개월수를 계산합니다. 대출 갈아타기 전 확인하세요.",
  keywords: ["대환대출계산기", "대출갈아타기", "대환대출절감", "중도상환수수료손익분기"],
});

const EXAMPLES: CalcExample[] = [
  {
    title: "금리만 갈아타기 · 기간 유지",
    desc: "남은 원금 2억, 5.5%→4.0%, 남은 기간 240개월 유지, 수수료 1.2%, 기타 50만원",
    inputs: [
      { label: "남은 원금", value: "20,000만원" },
      { label: "금리", value: "5.5% → 4.0%" },
      { label: "기간", value: "240개월 유지" },
      { label: "비용", value: "수수료 1.2% + 50만원" },
    ],
    results: [
      { label: "순절감액", value: "3,642만", highlight: true },
      { label: "이자 절감액", value: "3,932만" },
      { label: "전환비용", value: "290만" },
      { label: "손익분기", value: "18개월" },
    ],
    note: "기간을 그대로 두고 금리만 낮추면 월 상환액도 총이자도 함께 줄어, 약 18개월 뒤 전환비용을 회수하는 구조입니다.",
  },
  {
    title: "기간을 늘려 갈아타기",
    desc: "남은 원금 2억, 5.5%/240개월 → 4.0%/360개월, 수수료 1.2%",
    inputs: [
      { label: "남은 원금", value: "20,000만원" },
      { label: "금리", value: "5.5% → 4.0%" },
      { label: "기간", value: "240개월 → 360개월" },
      { label: "비용", value: "수수료 1.2%" },
    ],
    results: [
      { label: "월 상환액", value: "137만 → 95만" },
      { label: "총이자", value: "1.3억 → 1.4억" },
      { label: "순절감액", value: "-1,595만" },
      { label: "손익분기", value: "6개월" },
    ],
    note: "같은 금리라도 기간을 120개월 늘리면 월 상환액은 크게 줄지만(손익분기 6개월) 총이자는 오히려 늘어 순절감액은 마이너스가 됩니다. 손익분기(월 기준)와 순절감액(총이자 기준)을 반드시 함께 봐야 하는 이유입니다.",
  },
];

const FAQ = [
  {
    q: "손익분기 개월수는 무엇을 의미하나요?",
    a: "월 상환액이 줄어든 금액으로 전환비용(중도상환수수료 + 기타 비용)을 회수하는 데 걸리는 개월수입니다. 예를 들어 월 상환액이 16만원 줄고 전환비용이 290만원이면 약 18개월이 걸립니다. 다만 이는 월 상환액 기준이므로, 총이자 관점의 순절감액과 함께 확인하는 것이 좋습니다.",
  },
  {
    q: "월 상환액이 줄었는데 왜 순절감액이 마이너스인가요?",
    a: "새 대출의 기간을 기존보다 늘리면 매달 갚는 금액은 줄어들지만, 더 오래 이자를 내기 때문에 총이자는 늘어날 수 있습니다. 이 계산기는 월 상환액 절감과 총이자 절감을 따로 보여주므로, 두 값을 함께 비교하면 됩니다.",
  },
  {
    q: "중도상환수수료는 어떻게 계산되나요?",
    a: "이 계산기는 기존 대출을 전액 상환하고 갈아탄다고 가정하므로, 남은 원금 전체에 수수료율을 곱해 계산합니다. 실제 수수료는 대출 실행 후 경과 기간에 따라 낮아지는 경우가 많으니, 정확한 요율은 금융회사에 확인하세요.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="대환대출 계산기"
        description="대출을 갈아탈 때 총이자 절감액과 손익분기를 확인하세요. 중도상환수수료 반영."
        icon="🔄"
        slug="refinance-calculator"
        breadcrumb={[
          { name: "홈", url: BASE_URL },
          { name: "대출 계산기", url: `${BASE_URL}/loan` },
          { name: "대환대출 계산기", url: `${BASE_URL}/refinance-calculator` },
        ]}
        calculator={
          <>
            <RefinanceCalc />
            <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
              <p className="mb-2 text-sm font-bold text-slate-800">
                ⚠️ 손익분기만 보지 마세요
              </p>
              <p className="text-sm text-slate-600">
                기간을 늘려 갈아타면 월 상환액이 줄어 손익분기가 짧게 나올 수
                있지만, 총이자는 오히려 늘 수 있습니다. 순절감액(총이자 기준)을 함께
                확인하세요.
              </p>
            </div>
          </>
        }
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">
              대환대출이란?
            </h2>
            <p>
              대환대출은 기존 대출을 갚고 조건이 더 나은 새 대출로 갈아타는
              것입니다. 보통 금리를 낮추기 위해 이용하지만, 기존 대출을 중간에
              상환하면 <strong>중도상환수수료</strong>가 발생하기 때문에, 절감되는
              이자와 수수료를 함께 따져봐야 실제 이득 여부를 알 수 있습니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              두 가지 관점으로 봐야 합니다
            </h2>
            <p>
              대환의 효과는 <strong>월 상환액</strong>과 <strong>총이자</strong>
              두 관점에서 달라질 수 있습니다. 금리만 낮추고 기간을 그대로 두면 둘 다
              줄어듭니다. 하지만 기간을 늘리면 월 상환액은 줄어도 총이자는 늘어날 수
              있습니다. 그래서 이 계산기는 판단을 내리지 않고, 두 관점의 숫자를
              모두 보여줍니다.
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>이자 절감액 = 기존 총이자 − 새 총이자</li>
              <li>전환비용 = 중도상환수수료(남은 원금 × 요율) + 기타 비용</li>
              <li>순절감액 = 이자 절감액 − 전환비용</li>
              <li>손익분기 = 전환비용 ÷ 월 상환액 절감</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-900">
              중도상환수수료와 손익분기
            </h2>
            <p>
              중도상환수수료는 대출을 미리 갚을 때 내는 비용으로, 보통 남은 원금에
              일정 요율을 곱해 계산합니다(대출 실행 후 경과 기간에 따라 낮아지는
              경우가 많습니다). 손익분기는 이 수수료를 월 상환액 절감으로 회수하는
              데 걸리는 기간이며, 남은 상환 기간이 손익분기보다 충분히 길수록 전환의
              여지가 커집니다. 다만 최종 판단은 총이자 관점의 순절감액과 함께
              내리는 것이 안전합니다.
            </p>

            <div className="rounded-2xl bg-blue-50 p-5 text-blue-900">
              <p className="font-bold">함께 확인하면 좋은 것</p>
              <p className="mt-2">
                갈아탄 뒤의 실제 월 상환 스케줄은 원리금상환 계산기에서, 갈아타지
                않고 일부만 미리 갚는 경우는 중도상환 계산기에서 비교해 볼 수
                있습니다.
              </p>
            </div>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "중도상환 계산기", href: "/prepayment-calculator", icon: "💸" },
          { label: "원리금상환 계산기", href: "/amortization-calculator", icon: "📊" },
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
