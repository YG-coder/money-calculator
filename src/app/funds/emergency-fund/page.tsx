// src/app/funds/emergency-fund/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import EmergencyFundCalc from "@/components/calculator/EmergencyFundCalc";

export const metadata: Metadata = buildMetadata({
  slug: "funds/emergency-fund",
  title: "비상자금 계산기 — 대비 기간별 필요 금액과 감당 기간",
  description:
    "월 필수지출과 직접 정한 대비 기간으로 필요한 비상자금을 계산하고, 반대로 지금 가진 돈으로 몇 달을 감당할 수 있는지도 확인합니다. 소득이 없는 기간의 필수지출 대비를 계산하며 적정 개월 수나 금액을 제시하지 않습니다.",
  keywords: [
    "비상자금계산기",
    "비상금계산",
    "소득공백계산",
    "생활비몇개월",
    "필수지출계산",
  ],
});

const crumbs = [
  { name: "홈", url: BASE_URL },
  { name: "자금계획", url: `${BASE_URL}/funds` },
  { name: "비상자금 계산기", url: `${BASE_URL}/funds/emergency-fund` },
];

const EXAMPLES: CalcExample[] = [
  {
    title: "월 180만원, 8개월을 대비한다면",
    desc: "대비 기간은 이용자가 직접 정한 값입니다",
    inputs: [
      { label: "월 필수지출", value: "180만원" },
      { label: "대비 기간", value: "8개월" },
      { label: "현재 자금", value: "500만원" },
    ],
    results: [
      { label: "전체 필요자금", value: "14,400,000원" },
      { label: "추가로 필요한 금액", value: "9,400,000원", highlight: true },
    ],
    note: "보유자금을 입력하지 않으면 전체 필요자금만 계산합니다.",
  },
  {
    title: "900만원으로 월 180만원을 쓴다면",
    desc: "버틸 기간 구하기 모드",
    inputs: [
      { label: "현재 자금", value: "900만원" },
      { label: "월 필수지출", value: "180만원" },
    ],
    results: [
      { label: "감당 가능한 기간", value: "5.0개월", highlight: true },
    ],
    note: "기간은 소수 첫째 자리까지 내림해 표시합니다.",
  },
];

const FAQ = [
  {
    q: "몇 개월치를 모아야 하나요?",
    a: "이 사이트는 적정 개월 수를 제시하지 않습니다. 필요한 기간은 소득이 끊길 가능성, 재취업까지 걸리는 시간, 가족 상황처럼 사람마다 다른 조건에 달려 있기 때문입니다. 대비하고 싶은 기간을 직접 정해 입력하면 그 기간에 해당하는 금액을 계산해 드립니다.",
  },
  {
    q: "월 필수지출에는 무엇을 넣나요?",
    a: "소득이 없어도 계속 나가는 금액입니다. 주거비·식비·공과금·통신비·보험료·대출상환 등이 해당합니다. 여행이나 취미처럼 줄일 수 있는 지출은 빼고 넣으면 더 보수적인 결과가 나옵니다.",
  },
  {
    q: "자동차 수리비나 병원비도 포함되나요?",
    a: "포함되지 않습니다. 이 계산기는 소득이 없는 기간의 필수지출을 대비하는 금액만 계산합니다. 수리비·의료비처럼 사건이 생겼을 때 한 번에 나가는 지출은 금액이 기간에 비례하지 않아 이 방식으로 산정되지 않습니다.",
  },
  {
    q: "감당 가능한 기간은 어떻게 반올림하나요?",
    a: "소수 첫째 자리까지 내림합니다. 예를 들어 5.55개월은 5.5개월로 표시합니다. 남은 금액을 한 달로 부풀려 실제보다 오래 버틸 수 있다고 오해하지 않도록 올리지 않고 내립니다.",
  },
  {
    q: "실업급여나 정부지원금은 반영되나요?",
    a: "반영하지 않습니다. 수급 자격과 금액이 가입 기간·이직 사유·연령에 따라 달라지고 제도도 바뀌므로, 이 계산기는 입력한 금액만으로 계산합니다. 실제로 받을 수 있는 지원이 있다면 결과보다 여유가 생깁니다.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="비상자금 계산기"
        description="대비하고 싶은 기간의 필요 금액과, 지금 가진 돈으로 감당할 수 있는 기간을 계산합니다."
        icon="🛟"
        slug="funds/emergency-fund"
        breadcrumb={crumbs}
        calculator={<EmergencyFundCalc />}
        examples={EXAMPLES}
        faq={FAQ}
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">계산식</h2>
            <p>
              두 모드는 같은 식을 서로 반대 방향으로 푼 것입니다. 사칙연산만
              사용하며 세율·요율 같은 제도 수치를 쓰지 않습니다.
            </p>

            <div className="my-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">모드</th>
                    <th className="px-4 py-3 text-left font-semibold">계산식</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      필요 금액 구하기
                    </td>
                    <td className="px-4 py-3">
                      월 필수지출 × 대비 기간 = 전체 필요자금
                      <br />
                      전체 필요자금 − 보유자금 = 추가로 필요한 금액
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      버틸 기간 구하기
                    </td>
                    <td className="px-4 py-3">
                      보유자금 ÷ 월 필수지출 = 감당 가능한 기간
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              숫자를 어떻게 처리하나
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                금액은 <strong>만원 단위</strong>로 입력받아 원 단위로
                계산하고, 결과는 원 단위로 표시합니다.
              </li>
              <li>
                감당 가능한 기간은 <strong>소수 첫째 자리까지 내림</strong>합니다.
                올림하면 실제보다 오래 버틸 수 있다고 오해할 수 있습니다.
              </li>
              <li>
                추가로 필요한 금액은 <strong>0원 아래로 내려가지 않습니다.</strong>{" "}
                보유자금이 더 많으면 0원으로 표시합니다.
              </li>
              <li>
                보유자금을 <strong>비워 둔 것과 0원을 입력한 것은 다릅니다.</strong>{" "}
                비워 두면 전체 필요자금만 계산하고, 0원을 넣으면 가진 돈이 없다는
                뜻으로 보아 추가 필요액을 전액으로 계산합니다.
              </li>
              <li>
                월 필수지출이 0원이면 나눗셈이 성립하지 않으므로 감당 기간을
                계산하지 않고 그 이유를 표시합니다.
              </li>
            </ul>

            <h2 className="text-xl font-bold text-slate-900">
              이 계산기가 하지 않는 것
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                적정 개월 수, 적정 금액, 재무 상태 평가를 제시하지 않습니다.
              </li>
              <li>
                수리비·의료비처럼 사건별로 발생하는 지출은 계산에 포함하지
                않습니다.
              </li>
              <li>
                이자·물가 변동, 실업급여·정부지원금을 반영하지 않습니다.
              </li>
              <li>
                월 잉여자금 계산기의 지출 항목과 이 계산기의 월 필수지출은 정의가
                다릅니다. 월 잉여자금은 지금 쓰는 전체 지출이고, 여기서는 소득이
                없어도 계속 나가는 금액만 봅니다. 그래서 두 계산기는 숫자를
                자동으로 주고받지 않습니다.
              </li>
            </ul>

            <h2 className="text-xl font-bold text-slate-900">
              비상자금이라는 개념
            </h2>
            <p>
              미국 소비자금융보호국(CFPB)은 비상자금을{" "}
              <em>
                예상하지 못한 지출이나 재정적 비상 상황에 대비해 따로 떼어 둔 현금
              </em>
              으로 설명하고, 흔한 예로 차량 수리, 주택 수리, 의료비,{" "}
              <strong>소득 상실</strong>을 듭니다. 필요한 금액은 사람마다 다르므로
              과거에 겪은 예상 밖 지출을 떠올려 목표를 정하라고 안내하며, 특정
              금액이나 개월 수를 제시하지는 않습니다.
            </p>
            <p>
              이 계산기는 그 용도 가운데 <strong>소득 상실 대비</strong> 한 가지를
              계산합니다. 위 자료는 <strong>개념을 설명하는 근거</strong>일 뿐이며,
              이 페이지의 계산식은 자체적으로 구성한 것입니다. CFPB 의 공식 산식이
              아닙니다. 또한 해외 기관의 금융교육 자료이므로 한국의 법적·정책적
              기준도 아닙니다.
            </p>
            <p className="text-sm text-slate-500">
              출처: Consumer Financial Protection Bureau, “An essential guide to
              building an emergency fund” (금융교육 자료, 2026-09-16 확인)
            </p>
          </>
        }
        relatedCalcs={[
          {
            label: "월 잉여자금 계산기",
            href: "/funds/monthly-surplus",
            icon: "🧮",
          },
          { label: "목표 저축 계산기", href: "/finance/goal-savings", icon: "🎯" },
          { label: "예금 이자 계산기", href: "/finance/deposit", icon: "🏦" },
        ]}
        relatedGuides={[]}
      />
    </Suspense>
  );
}
