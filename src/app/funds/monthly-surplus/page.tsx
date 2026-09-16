// src/app/funds/monthly-surplus/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import MonthlySurplusCalc from "@/components/calculator/MonthlySurplusCalc";

export const metadata: Metadata = buildMetadata({
  slug: "funds/monthly-surplus",
  title: "월 잉여자금 계산기 — 매달 남는 돈과 연간 환산",
  description:
    "월 소득과 주거·식비·교통·통신·보험·대출상환·기타 7개 지출을 입력하면 월 총지출과 월 잉여자금, 연간 환산 금액을 계산합니다. 소득에서 이미 공제된 항목을 다시 빼지 않도록 입력 기준을 안내하며, 지출 수준을 평가하지 않습니다.",
  keywords: [
    "월잉여자금계산기",
    "잉여자금계산",
    "월생활비계산",
    "가계수지계산",
    "소득지출계산기",
    "연간저축여력",
  ],
});

const crumbs = [
  { name: "홈", url: BASE_URL },
  { name: "자금계획", url: `${BASE_URL}/funds` },
  { name: "월 잉여자금 계산기", url: `${BASE_URL}/funds/monthly-surplus` },
];

const EXAMPLES: CalcExample[] = [
  {
    title: "월 소득 400만원, 지출 250만원",
    desc: "주거 80 · 식비 50 · 교통 15 · 통신 7 · 보험 20 · 대출상환 60 · 기타 18",
    inputs: [
      { label: "월 소득", value: "400만원" },
      { label: "월 총지출", value: "250만원" },
    ],
    results: [
      { label: "월 잉여자금", value: "1,500,000원", highlight: true },
      { label: "연간 환산", value: "18,000,000원" },
      { label: "소득 대비 지출", value: "62.5%" },
    ],
    note: "연간 환산은 같은 소득·지출이 12개월 유지된다는 가정입니다.",
  },
  {
    title: "월 소득 200만원, 지출 230만원",
    desc: "주거 150 · 식비 80. 지출이 소득을 넘는 경우입니다",
    inputs: [
      { label: "월 소득", value: "200만원" },
      { label: "월 총지출", value: "230만원" },
    ],
    results: [
      { label: "월 잉여자금", value: "-300,000원" },
      { label: "연간 환산", value: "-3,600,000원" },
      { label: "소득 대비 지출", value: "115.0%" },
    ],
    note: "부족액을 음수 그대로 표시합니다. 계산기는 이 상태를 평가하지 않습니다.",
  },
];

const FAQ = [
  {
    q: "월 소득에는 어떤 금액을 넣나요?",
    a: "실제로 손에 들어오는 금액을 넣습니다. 급여소득자라면 세금과 4대보험이 공제된 실수령액입니다. 중요한 것은 보험의 종류가 아니라 그 금액이 입력한 소득에서 이미 빠졌는지 여부입니다. 이미 빠진 항목은 지출에 다시 넣지 않고, 따로 납부하는 금액만 지출에 포함하세요.",
  },
  {
    q: "건강보험료는 지출에 넣어야 하나요?",
    a: "급여에서 원천공제된다면 실수령액에서 이미 빠졌으므로 넣지 않습니다. 반대로 지역가입자로 고지서를 받아 따로 납부한다면 지출에 포함합니다. 같은 보험이라도 납부 방식에 따라 달라집니다.",
  },
  {
    q: "프리랜서나 사업소득자는 어떻게 입력하나요?",
    a: "실제 입금액을 소득으로 넣고, 따로 납부하는 종합소득세·지역가입자 건강보험료·국민연금은 지출에 포함하세요. 연 단위로 내는 금액은 12로 나눠 넣거나, 넣지 않고 결과를 해석할 때 감안하면 됩니다.",
  },
  {
    q: "연간 환산 금액은 실제 1년 저축 가능액인가요?",
    a: "아닙니다. 같은 소득과 지출이 12개월 그대로 유지된다는 가정으로 12를 곱한 참고값입니다. 상여금, 연말정산 환급·추가납부, 명절이나 휴가처럼 특정 달에만 생기는 지출은 반영되지 않습니다.",
  },
  {
    q: "이 결과를 대출 한도 계산에 그대로 쓸 수 있나요?",
    a: "쓸 수 없습니다. 여기서 계산한 잉여자금은 생활 현금흐름이고, DSR 같은 대출 규제는 연소득을 별도 기준으로 정의해 계산합니다. 두 값은 계산 방식이 다르므로 이 계산기는 결과를 대출 계산기로 자동 전달하지 않습니다.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="월 잉여자금 계산기"
        description="월 소득과 7개 지출 항목을 입력하면 매달 남는 금액과 연간 환산 금액을 계산합니다."
        icon="🧮"
        slug="funds/monthly-surplus"
        breadcrumb={crumbs}
        calculator={<MonthlySurplusCalc />}
        examples={EXAMPLES}
        faq={FAQ}
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">
              계산식
            </h2>
            <p>
              이 계산기는 사칙연산만 사용합니다. 세율·요율 같은 제도 수치를 쓰지
              않으므로 제도가 바뀌어도 결과가 달라지지 않습니다.
            </p>

            <div className="my-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">항목</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      계산식
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      월 총지출
                    </td>
                    <td className="px-4 py-3">7개 항목의 합</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      월 잉여자금
                    </td>
                    <td className="px-4 py-3">월 소득 − 월 총지출</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      연간 환산
                    </td>
                    <td className="px-4 py-3">월 잉여자금 × 12</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      소득 대비 지출
                    </td>
                    <td className="px-4 py-3">
                      월 총지출 ÷ 월 소득 × 100 (소득이 0이면 표시하지 않음)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              같은 금액을 두 번 빼지 않으려면
            </h2>
            <p>
              가장 흔한 오차는 이미 공제된 금액을 지출에 또 넣는 것입니다.
              기준은 항목의 이름이 아니라{" "}
              <strong>입력한 소득에서 그 금액이 이미 빠졌는지</strong>입니다.
              급여명세서에서 공제 항목으로 잡혀 실수령액이 줄어든 금액이라면
              지출에 넣지 않고, 통장에서 따로 빠져나가는 금액이라면 지출에
              넣습니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              이 계산기가 하지 않는 것
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                지출 수준이나 잉여자금 규모를 좋다·나쁘다로 평가하지 않습니다.
                적정 저축률이나 소비 비율도 제시하지 않습니다.
              </li>
              <li>
                7개 지출 항목은 입력 편의를 위한 자체 구분이며, 공식 통계의 지출
                분류가 아닙니다.
              </li>
              <li>
                통계에서 쓰는 <strong>처분가능소득</strong>은 세금·사회보험료에
                더해 다른 가구로의 이전지출까지 뺀 개념이라, 이 계산기에 넣는
                실수령액과 같지 않습니다. 두 값을 같은 것으로 보지 마세요.
              </li>
              <li>
                결과를 대출 한도 계산으로 자동 전달하지 않습니다. 대출 규제의
                소득 기준과 계산 방식이 다르기 때문입니다.
              </li>
            </ul>
          </>
        }
        relatedCalcs={[
          { label: "비상자금 계산기", href: "/funds/emergency-fund", icon: "🛟" },
          { label: "이사자금 계산기", href: "/funds/moving-cost", icon: "📦" },
          { label: "목표 저축 계산기", href: "/funds/goal-savings", icon: "🎯" },
          { label: "DSR 계산기", href: "/dsr-calculator", icon: "📊" },
          {
            label: "원리금상환 계산기",
            href: "/amortization-calculator",
            icon: "🏦",
          },
          { label: "적금 이자 계산기", href: "/finance/installment-savings", icon: "🪙" },
        ]}
        relatedGuides={[]}
      />
    </Suspense>
  );
}
