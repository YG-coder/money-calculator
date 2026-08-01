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
      { label: "월 임대료", value: "100만원" },
      { label: "이자율", value: "연 3.5%" },
    ],
    results: [
      { label: "전세 기회비용", value: "875,000원/월" },
      { label: "월세 실질 비용", value: "1,029,166원/월" },
      { label: "월 차이", value: "154,166원", highlight: true },
      { label: "결론", value: "전세가 유리" },
    ],
    note: "이자율 3.5% 기준으로는 전세가 월 약 15.4만원 유리합니다.",
  },
  {
    title: "전세 5억 vs 월세 150만원",
    desc: "전세 5억, 월세 보증금 3천만, 월세 150만, 이자율 4.0%",
    inputs: [
      { label: "전세 보증금", value: "5억원 (50,000만)" },
      { label: "월세 보증금", value: "3,000만원" },
      { label: "월 임대료", value: "150만원" },
      { label: "이자율", value: "연 4.0%" },
    ],
    results: [
      { label: "전세 기회비용", value: "1,666,666원/월" },
      { label: "월세 실질 비용", value: "1,600,000원/월" },
      { label: "월 차이", value: "66,666원", highlight: true },
      { label: "결론", value: "월세가 유리" },
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
    a: "보증금을 실제로 운용할 수 있는 정기예금 금리나 본인이 합리적으로 기대하는 수익률을 입력하세요. 금융상품과 기간, 우대조건에 따라 금리가 달라지므로 현재 가입 가능한 상품의 금리를 확인해 입력하는 것이 좋습니다.",
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

export default function Page() {
  const crumbs = [
    { name: "홈", url: BASE_URL },
    { name: "부동산 계산기", url: `${BASE_URL}/real-estate` },
    {
      name: "월세 vs 전세 계산기",
      url: `${BASE_URL}/real-estate/jeonse-vs-wolse-calculator`,
    },
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
                <h2 className="text-xl font-bold text-slate-900">전세 vs 월세 계산기란?</h2>
                <p>
                  전세와 월세 중 어떤 선택이 더 유리한지는 단순히 금액만 비교해서는 알 수 없습니다.
                  전세 보증금에 대한 기회비용과 월세 지출을 함께 고려해야 정확한 판단이 가능합니다.
                </p>

                <h2 className="text-xl font-bold text-slate-900">전세와 월세의 차이</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-200 p-3">구분</th>
                      <th className="border border-slate-200 p-3">전세</th>
                      <th className="border border-slate-200 p-3">월세</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                      <td className="border border-slate-200 p-3 font-semibold">초기 비용</td>
                      <td className="border border-slate-200 p-3">보증금 큼</td>
                      <td className="border border-slate-200 p-3">보증금 적음</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-3 font-semibold">월 비용</td>
                      <td className="border border-slate-200 p-3">이자 형태 비용</td>
                      <td className="border border-slate-200 p-3">월세 지속 발생</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-3 font-semibold">장점</td>
                      <td className="border border-slate-200 p-3">장기 비용 절감 가능</td>
                      <td className="border border-slate-200 p-3">현금 유동성 확보</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-3 font-semibold">단점</td>
                      <td className="border border-slate-200 p-3">자금 묶임</td>
                      <td className="border border-slate-200 p-3">장기 비용 증가</td>
                    </tr>
                    </tbody>
                  </table>
                </div>

                <h2 className="text-xl font-bold text-slate-900">계산 기준</h2>
                <div className="rounded bg-slate-100 p-4">
                  <strong>전세 월 기회비용 = 전세 보증금 × (연 이자율 ÷ 12)</strong>
                  <br />
                  <strong>
                    월세 월 실질비용 = 월세 + 월세 보증금 × (연 이자율 ÷ 12)
                  </strong>
                </div>
                <p>
                  두 값을 비교해 월세 실질비용이 전세 기회비용보다 크면 전세가, 작으면
                  월세가 유리합니다. <strong>손익분기 이자율</strong>은 두 비용이
                  같아지는 지점으로, 월세 ÷ (전세 보증금 − 월세 보증금) × 12 ×
                  100으로 구합니다. 내가 보증금을 굴려 기대하는 수익률이 손익분기 이자율보다
                  높으면 월세가, 낮으면 전세가 유리합니다. 예를 들어 전세 3억, 월세
                  보증금 1,000만, 월세 100만이면 손익분기 이자율은 약 4.14%로, 보증금을
                  그보다 높은 수익률로 운용할 수 있다면 월세가 유리해집니다.
                </p>
                <p>
                  이 비교의 결과는 <strong>입력한 연 이자율</strong>에 크게
                  좌우됩니다. 이자율을 높게 잡을수록 전세 보증금을 묶어 두는 기회비용이
                  커져 월세가 상대적으로 유리해지고, 낮게 잡을수록 전세가 유리해집니다.
                  정기예금 금리처럼 실제로 달성 가능한 수익률을 기준으로 입력하세요.
                </p>

                <h2 className="text-xl font-bold text-slate-900">주의사항</h2>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    전세는 월 비용이 낮더라도 보증금 미반환 위험을 함께 고려해야
                    합니다. 계약 전 선순위 권리관계와 시세를 확인하고, 가입 요건에
                    해당하는 경우 전세보증금 반환보증 이용 가능 여부도 검토하세요.
                  </li>
                  <li>결과는 입력한 연 이자율(기대 수익률) 가정에 따라 달라집니다.</li>
                  <li>실제 시장 월세·보증금 시세와 비교하여 판단하는 것이 중요합니다.</li>
                  <li>계산 결과는 참고용입니다.</li>
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
                label: "부동산 수익률 계산기",
                href: "/real-estate/property-yield-calculator",
                icon: "📈",
              },
              {
                label: "재건축 분담금 계산기",
                href: "/real-estate/reconstruction-contribution-calculator",
                icon: "🏗️",
              },
            ]}
            relatedGuides={[
              {
                label: "전세 vs 월세 + 보증기관·보증보험 가이드",
                href: "/blog/jeonse-vs-wolse",
              },
            ]}
        />
      </Suspense>
  );
}