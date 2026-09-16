// src/app/funds/moving-cost/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import MovingCostCalc from "@/components/calculator/MovingCostCalc";

export const metadata: Metadata = buildMetadata({
  slug: "funds/moving-cost",
  title: "이사자금 계산기 — 보증금 차액과 부대비용 합계",
  description:
    "새 보증금과 기존 보증금 회수 예상액의 차액에 이사비·중개보수·가전가구·기타 비용을 더해 이사에 추가로 필요한 현금을 계산합니다. 중개보수는 직접 입력하며, 보증금의 실제 반환 여부와 시점은 판단하지 않습니다.",
  keywords: [
    "이사자금계산기",
    "이사비용계산",
    "보증금차액계산",
    "전세이사비용",
    "이사초기비용",
  ],
});

const crumbs = [
  { name: "홈", url: BASE_URL },
  { name: "자금계획", url: `${BASE_URL}/funds` },
  { name: "이사자금 계산기", url: `${BASE_URL}/funds/moving-cost` },
];

const EXAMPLES: CalcExample[] = [
  {
    title: "보증금이 오르는 이사",
    desc: "2억 → 새 보증금, 기존 1억 5천 회수 예상",
    inputs: [
      { label: "새 보증금", value: "20,000만원" },
      { label: "회수 예상액", value: "15,000만원" },
      { label: "부대비용", value: "450만원" },
    ],
    results: [
      { label: "보증금 차액", value: "50,000,000원" },
      { label: "총 부대비용", value: "4,500,000원" },
      { label: "추가로 필요한 자금", value: "54,500,000원", highlight: true },
    ],
    note: "부대비용은 이사비 120 · 중개보수 80 · 가전가구 200 · 기타 50만원입니다.",
  },
  {
    title: "보증금이 내려가도 현금이 필요한 경우",
    desc: "회수 예상액이 300만원 더 크지만 부대비용이 400만원",
    inputs: [
      { label: "새 보증금", value: "10,000만원" },
      { label: "회수 예상액", value: "10,300만원" },
      { label: "부대비용", value: "400만원" },
    ],
    results: [
      { label: "보증금 차액", value: "-3,000,000원" },
      { label: "추가로 필요한 자금", value: "1,000,000원", highlight: true },
    ],
    note: "보증금 차액이 음수여도 부대비용 때문에 추가 현금이 필요할 수 있습니다.",
  },
];

const FAQ = [
  {
    q: "중개보수는 왜 자동으로 계산되지 않나요?",
    a: "이 사이트가 확인한 중개보수 상한요율표는 주택 매매·교환 기준이고, 임대차는 거래금액 산정 방식부터 다릅니다. 검증하지 않은 요율로 자동 계산하면 실제와 다른 금액이 조용히 들어가므로, 중개사무소와 협의한 금액을 직접 입력받습니다.",
  },
  {
    q: "기존 보증금을 정말 돌려받을 수 있는지도 알려주나요?",
    a: "아니요. 입력하신 회수 예상액을 그대로 반영해 금액만 계산합니다. 실제 반환 여부, 반환 시점, 감액 가능성은 계약과 분쟁 상황에 따라 달라지며 이 계산기는 이를 판단하지 않습니다.",
  },
  {
    q: "기존 보증금을 받기 전에 새 보증금을 내야 하는데, 그 돈도 계산되나요?",
    a: "계산되지 않습니다. 이 계산기는 금액만 다루고 시점은 다루지 않습니다. 잔금일과 기존 계약 종료일 사이에 필요한 일시적인 현금은 별도로 확인해야 합니다.",
  },
  {
    q: "결과가 음수로 나왔습니다.",
    a: "입력하신 회수 예상액으로 보증금 차액과 부대비용을 모두 충당하고도 남는 금액이라는 뜻입니다. 계산상의 값이며 그 돈이 실제로, 제때 손에 들어온다는 의미는 아닙니다.",
  },
  {
    q: "실투자금 계산기와 무엇이 다른가요?",
    a: "실투자금 계산기는 집을 살 때 드는 돈(취득세·매매 중개보수·등기비용)을 계산합니다. 이 계산기는 임차 계약으로 이사할 때 필요한 현금을 봅니다. 두 계산기의 항목과 정의가 달라 값을 자동으로 주고받지 않습니다.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="이사자금 계산기"
        description="보증금 차액과 이사 부대비용을 더해 이사에 추가로 필요한 현금을 계산합니다."
        icon="📦"
        slug="funds/moving-cost"
        breadcrumb={crumbs}
        calculator={<MovingCostCalc />}
        examples={EXAMPLES}
        faq={FAQ}
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">계산식</h2>
            <p>
              사칙연산만 사용합니다. 세율·요율 같은 제도 수치를 쓰지 않으므로
              제도가 바뀌어도 결과가 달라지지 않습니다.
            </p>

            <div className="my-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">항목</th>
                    <th className="px-4 py-3 text-left font-semibold">계산식</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      보증금 차액
                    </td>
                    <td className="px-4 py-3">
                      새 보증금 − 기존 보증금 회수 예상액
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      총 이사 부대비용
                    </td>
                    <td className="px-4 py-3">
                      이사비 + 중개보수 + 가전·가구 + 기타
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      추가로 필요한 자금
                    </td>
                    <td className="px-4 py-3">보증금 차액 + 총 부대비용</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              부호를 나눠 보세요
            </h2>
            <p>
              보증금 차액과 전체 합계의 부호는 따로 봐야 합니다.{" "}
              <strong>
                회수 예상액이 새 보증금보다 커서 차액이 음수여도, 이사비와
                중개보수 때문에 전체로는 추가 현금이 필요할 수 있습니다.
              </strong>{" "}
              반대로 전체 합계가 음수라면 입력하신 회수 예상액으로 비용까지
              충당하고 남는다는 뜻입니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              이 계산기가 다루지 않는 것
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>보증금의 실제 반환 여부·시점·감액 가능성</strong>을
                판단하지 않습니다. 입력하신 회수 예상액을 그대로 반영합니다.
              </li>
              <li>
                기존 보증금을 받기 전에 새 보증금을 먼저 내야 하는{" "}
                <strong>시차 동안 필요한 일시적 현금</strong>은 산정하지 않습니다.
                이 계산기는 금액만 다루고 시점은 다루지 않습니다.
              </li>
              <li>
                임대차 중개보수를 요율로 자동 산정하지 않습니다. 직접 입력한
                금액을 사용합니다.
              </li>
              <li>
                보증금 반환에 관한 법률 판단이나 대출 이용을 권하지 않습니다.
              </li>
              <li>
                매매로 집을 살 때 드는 비용은{" "}
                <strong>실투자금 계산기</strong>가 다룹니다. 항목과 정의가 달라
                값을 자동으로 주고받지 않습니다.
              </li>
            </ul>
          </>
        }
        relatedCalcs={[
          {
            label: "월 잉여자금 계산기",
            href: "/funds/monthly-surplus",
            icon: "🧮",
          },
          { label: "비상자금 계산기", href: "/funds/emergency-fund", icon: "🛟" },
          {
            label: "전세대출 계산기",
            href: "/jeonse-loan-calculator",
            icon: "🏠",
          },
          {
            label: "월세 vs 전세 계산기",
            href: "/real-estate/jeonse-vs-wolse-calculator",
            icon: "⚖️",
          },
        ]}
        relatedGuides={[]}
      />
    </Suspense>
  );
}
