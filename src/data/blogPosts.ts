export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  description: string;
  date: string;
  content: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "loan-interest-calculation",
    category: "대출 기초",
    title: "대출 이자 계산 방법 완벽 정리",
    description:
      "대출 이자가 어떻게 계산되는지 쉽게 이해할 수 있도록 정리했습니다.",
    date: "2026.04.15",
    content: [
      "대출 이자는 돈을 빌린 대가로 금융기관에 지급하는 비용입니다.",
      "총이자 = 대출원금 × 금리 × 기간으로 기본 계산이 가능합니다.",
      "하지만 실제 대출은 상환 방식에 따라 결과가 크게 달라집니다.",
      "따라서 단순 계산이 아니라 구조를 이해하는 것이 중요합니다.",
      "결론적으로 원금, 금리, 기간이 핵심 요소입니다.",
    ],
  },

  {
    slug: "interest-rate-difference-impact",
    category: "금리 절약",
    title: "금리 0.5%p 차이, 대출 총이자는 얼마나 달라질까?",
    description:
      "금리 차이가 실제 이자 부담에 얼마나 영향을 주는지 정리했습니다.",
    date: "2026.04.15",
    content: [
      "금리 차이는 생각보다 큰 영향을 줍니다.",
      "특히 대출 기간이 길수록 차이는 커집니다.",
      "0.5% 차이도 수백만 원 이상 차이 날 수 있습니다.",
      "그래서 반드시 총이자 기준으로 비교해야 합니다.",
      "결론적으로 금리는 가장 중요한 요소입니다.",
    ],
  },

  {
    slug: "equal-payment-vs-equal-principal",
    category: "상환 방식",
    title: "원리금균등 vs 원금균등, 뭐가 더 유리할까?",
    description: "두 상환 방식의 차이를 쉽게 비교했습니다.",
    date: "2026.04.15",
    content: [
      "상환 방식은 총이자에 큰 영향을 줍니다.",
      "원리금균등은 매달 동일 금액을 납부합니다.",
      "원금균등은 초반 부담이 크지만 총이자가 적습니다.",
      "각 방식은 상황에 따라 장단점이 있습니다.",
      "결론적으로 개인 상황에 따라 선택해야 합니다.",
    ],
  },

  {
    slug: "prepayment-fee-timing",
    category: "중도상환",
    title: "중도상환 수수료, 언제 갚아야 이득일까?",
    description: "중도상환 시 실제 이득 여부를 계산하는 방법을 설명합니다.",
    date: "2026.04.15",
    content: [
      "중도상환은 항상 이득이 아닙니다.",
      "수수료와 절약 이자를 비교해야 합니다.",
      "면제 시점도 중요한 요소입니다.",
      "금리가 높을수록 효과가 큽니다.",
      "결론적으로 계산 후 판단해야 합니다.",
    ],
  },

  {
    slug: "jeonse-loan-hug-hf-sgi",
    category: "전세 대출",
    title: "전세대출 HUG · HF · SGI 보증, 뭐가 다를까?",
    description: "보증기관별 차이와 선택 기준을 정리했습니다.",
    date: "2026.04.15",
    content: [
      "전세대출은 보증기관에 따라 달라집니다.",
      "HUG는 안정적인 구조입니다.",
      "HF는 정책금융 중심입니다.",
      "SGI는 한도가 높은 편입니다.",
      "결론적으로 조건별 선택이 중요합니다.",
    ],
  },

  {
    slug: "jeonse-loan-limit-calculation",
    category: "전세 대출",
    title: "전세대출 한도는 어떻게 결정될까?",
    description: "전세대출 한도 계산 구조를 설명합니다.",
    date: "2026.04.15",
    content: [
      "전세대출 한도는 다양한 요소로 결정됩니다.",
      "소득과 신용이 중요한 기준입니다.",
      "보증기관에 따라 차이가 있습니다.",
      "조건별로 결과가 달라집니다.",
      "결론적으로 사전 계산이 중요합니다.",
    ],
  },

  {
    slug: "loan-refinancing-strategy",
    category: "금리 절약",
    title: "대출 갈아타기, 언제 하는 게 가장 유리할까?",
    description: "대출 갈아타기 전략을 정리했습니다.",
    date: "2026.04.15",
    content: [
      "대출 갈아타기는 금리를 낮추는 방법입니다.",
      "금리 차이가 중요합니다.",
      "수수료도 반드시 고려해야 합니다.",
      "타이밍이 핵심입니다.",
      "결론적으로 비교 후 결정해야 합니다.",
    ],
  },

  {
    slug: "how-to-reduce-loan-interest",
    category: "금리 절약",
    title: "대출 이자 줄이는 5가지 현실적인 방법",
    description: "실전에서 사용할 수 있는 절약 방법을 정리했습니다.",
    date: "2026.04.15",
    content: [
      "이자 절약 방법은 다양합니다.",
      "우대금리를 활용해야 합니다.",
      "갈아타기도 중요합니다.",
      "신용 관리가 핵심입니다.",
      "결론적으로 여러 방법을 조합해야 합니다.",
    ],
  },

  {
    slug: "credit-score-interest-rate",
    category: "금리 절약",
    title: "신용점수가 금리에 미치는 영향, 얼마나 클까?",
    description: "신용점수와 금리 관계를 설명합니다.",
    date: "2026.04.15",
    content: [
      "신용점수는 금리에 영향을 줍니다.",
      "높을수록 낮은 금리를 받습니다.",
      "차이는 생각보다 큽니다.",
      "관리 습관이 중요합니다.",
      "결론적으로 신용이 핵심입니다.",
    ],
  },

  {
    slug: "dsr-dti-difference",
    category: "대출 기초",
    title: "DSR과 DTI 차이, 대출 한도에 어떻게 영향을 줄까?",
    description: "DSR과 DTI 차이를 쉽게 설명합니다.",
    date: "2026.04.15",
    content: [
      "DSR과 DTI는 대출 기준입니다.",
      "DTI는 주담대 중심입니다.",
      "DSR은 전체 부채 기준입니다.",
      "최근에는 DSR이 더 중요합니다.",
      "결론적으로 DSR 중심으로 봐야 합니다.",
    ],
  },
];
