// src/app/fixed-vs-variable-calculator/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import FixedVariableCalc from "@/components/calculator/FixedVariableCalc";

export const metadata: Metadata = buildMetadata({
  slug: "fixed-vs-variable-calculator",
  title: "고정금리 vs 변동금리 계산기 — 손익분기 금리 비교",
  description:
    "고정금리와 변동금리 대출의 총이자를 비교하고, 변동금리가 얼마나 오르면 총부담이 고정과 같아지는지(손익분기 금리) 계산합니다. 판단은 하지 않습니다.",
  keywords: ["고정금리변동금리", "고정변동비교", "손익분기금리", "주택담보대출금리비교"],
});

const EXAMPLES: CalcExample[] = [
  {
    title: "3억 · 30년 · 고정 4.5% vs 변동 3.8%",
    desc: "대출 3억원, 360개월, 원리금균등, 고정 4.5% / 현재 변동 3.8%",
    inputs: [
      { label: "대출금액", value: "30,000만원" },
      { label: "기간", value: "360개월" },
      { label: "고정금리", value: "4.5%" },
      { label: "현재 변동금리", value: "3.8%" },
    ],
    results: [
      { label: "고정 총이자", value: "2.5억" },
      { label: "변동 총이자 (현재 유지)", value: "2.0억" },
      { label: "손익분기", value: "변동 평균 4.5% (+0.7%p)", highlight: true },
      { label: "현재 기준 차이", value: "변동이 4,399만 적음" },
    ],
    note: "현재 변동금리(3.8%)가 유지되면 변동의 총이자가 약 4,399만원 적습니다. 하지만 변동금리가 남은 기간 평균 4.5%(지금보다 0.7%p) 이상으로 오르면 총이자가 고정과 같아지거나 커집니다. 앞으로 금리가 어떻게 될지는 알 수 없으므로, 이 손익분기 지점을 기준으로 판단은 사용자가 하면 됩니다.",
  },
];

const FAQ = [
  {
    q: "어느 쪽이 유리한지 알려주나요?",
    a: "아니요. 미래 변동금리가 어떻게 될지는 아무도 알 수 없기 때문에, 이 계산기는 '고정이 유리하다' 또는 '변동이 유리하다'고 판단하지 않습니다. 대신 변동금리가 평균 얼마까지 오르면 총이자가 고정과 같아지는지(손익분기 금리)를 숫자로 보여주고, 판단은 사용자에게 맡깁니다.",
  },
  {
    q: "손익분기 금리는 어떻게 나오나요?",
    a: "같은 원금·기간·상환방식에서는, 변동금리의 (기간 평균) 수준이 고정금리와 같아질 때 총이자가 같아집니다. 그래서 손익분기 금리는 곧 고정금리이며, 지금보다 '고정금리 − 현재 변동금리'만큼 오르면 도달합니다. 그 아래로 유지되면 변동의 총이자가 더 적고, 넘어서면 고정이 더 적습니다.",
  },
  {
    q: "변동금리 총이자는 왜 '가정'인가요?",
    a: "변동금리는 앞으로 오르거나 내릴 수 있어 총이자가 확정되지 않습니다. 이 계산기의 변동 총이자는 '현재 금리가 그대로 유지된다면' 또는 '일정 폭 오른다면'을 가정한 값이며, 실제 금리는 기준금리·가산금리·조정 주기에 따라 달라집니다. 반면 순수고정금리는 만기까지 금리가 고정되므로 총이자가 확정됩니다.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="고정금리 vs 변동금리 계산기"
        description="고정과 변동의 총이자를 비교하고, 변동금리가 얼마나 오르면 총부담이 교차하는지 확인하세요."
        icon="⚖️"
        slug="fixed-vs-variable-calculator"
        breadcrumb={[
          { name: "홈", url: BASE_URL },
          { name: "대출 계산기", url: `${BASE_URL}/loan` },
          {
            name: "고정금리 vs 변동금리 계산기",
            url: `${BASE_URL}/fixed-vs-variable-calculator`,
          },
        ]}
        calculator={
          <>
            <FixedVariableCalc />
            <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
              <p className="mb-2 text-sm font-bold text-slate-800">
                ⚠️ 이 계산기는 예측하지 않습니다
              </p>
              <p className="text-sm text-slate-600">
                미래 변동금리가 어떻게 될지는 알 수 없습니다. &lsquo;변동금리가
                평균 몇 %까지 오르면 고정과 총부담이 같아지는가&rsquo;라는 손익분기
                지점만 보여주며, 어느 쪽이 유리한지는 판단하지 않습니다.
              </p>
            </div>
          </>
        }
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">
              고정금리와 변동금리, 무엇이 다른가
            </h2>
            <p>
              <strong>고정금리</strong>는 만기까지 금리가 그대로 유지되어 총이자가
              처음부터 확정됩니다. <strong>변동금리</strong>는 시장금리에 따라
              오르내려, 총이자가 미래 금리 경로에 따라 달라집니다. 그래서 두 방식은
              &lsquo;확정된 부담&rsquo;과 &lsquo;달라질 수 있는 부담&rsquo;을 맞바꾸는
              선택입니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              손익분기 금리로 비교합니다
            </h2>
            <p>
              어느 쪽이 유리한지는 미래 금리에 달려 있어 미리 알 수 없습니다. 대신
              이 계산기는 <strong>손익분기 금리</strong>를 보여줍니다. 같은 원금·기간·
              상환방식이라면, 변동금리의 기간 평균이 고정금리와 같아질 때 총이자가
              같아집니다. 즉 손익분기 금리는 고정금리 그 자체이며, 지금 변동금리에서
              &lsquo;고정금리 − 현재 변동금리&rsquo;만큼 올라야 도달합니다.
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>변동 평균이 손익분기 금리 아래로 유지되면 변동의 총이자가 적습니다.</li>
              <li>변동 평균이 손익분기 금리를 넘으면 고정의 총이자가 적습니다.</li>
              <li>변동금리 총이자는 &lsquo;현재 유지&rsquo;·&lsquo;일정 폭 상승&rsquo; 가정에 따른 값입니다.</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-900">
              어떻게 활용하면 좋을까
            </h2>
            <p>
              손익분기 금리와 현재 변동금리의 차이(여유 폭)를 보면, 변동금리가 앞으로
              얼마나 올라도 되는지를 가늠할 수 있습니다. 여유 폭이 클수록 변동금리
              상승을 견딜 여지가 크고, 작을수록 상승에 민감합니다. 이 폭을 자신의
              금리 전망·상환 여력과 함께 놓고 스스로 판단하면 됩니다.
            </p>

            <div className="rounded-2xl bg-blue-50 p-5 text-blue-900">
              <p className="font-bold">함께 확인하면 좋은 것</p>
              <p className="mt-2">
                변동금리가 오를 때의 월 상환액 변화는 금리변동 시뮬레이터에서, 현재
                조건의 상세 상환 스케줄은 원리금상환 계산기에서 확인할 수 있습니다.
              </p>
            </div>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "금리변동 시뮬레이터", href: "/rate-change-simulator", icon: "📈" },
          { label: "원리금상환 계산기", href: "/amortization-calculator", icon: "📊" },
          { label: "대환대출 계산기", href: "/refinance-calculator", icon: "🔄" },
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
