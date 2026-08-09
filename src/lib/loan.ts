// ─────────────────────────────────────────────
// 포맷 함수
// ─────────────────────────────────────────────

export function formatKRW(v: number) {
  return Math.round(v).toLocaleString("ko-KR") + "원";
}

export function formatUnit(v: number) {
  const abs = Math.abs(v);

  if (abs >= 1_0000_0000) {
    const value = (v / 1_0000_0000).toFixed(1);
    return value.endsWith(".0") ? `${Number(value)}억` : `${value}억`;
  }

  if (abs >= 1_0000) {
    return (v / 1_0000).toFixed(0) + "만";
  }

  return formatKRW(v);
}

// ─────────────────────────────────────────────
// 공통
// ─────────────────────────────────────────────

export function monthlyRate(rate: number) {
  return rate / 100 / 12;
}

// ─────────────────────────────────────────────
// 1. 대출 이자 계산 (만기일시상환)
// ─────────────────────────────────────────────
export function calcLoanInterest(
  principal: number,
  rate: number,
  months: number,
) {
  const r = monthlyRate(rate);

  const monthlyInterest = principal * r;
  const totalInterest = monthlyInterest * months;
  const totalPayment = principal + totalInterest;

  return {
    monthlyInterest,
    totalInterest,
    totalPayment,
    rateSaving: 0,
    savingMessage: "※ 만기일시상환 기준 계산입니다.",
  };
}

// ─────────────────────────────────────────────
// 1-b. 마이너스통장(한도대출) 이자 계산
//   · 이자는 한도가 아니라 실제 사용금액 기준
//   · 일할(단리): 연이율/365. 연=월×12=일×365로 일관.
//   · 은행별 계산 기준·실제 사용일수에 따라 차이가 있을 수 있음(단리 기준)
// ─────────────────────────────────────────────

export interface OverdraftInput {
  usedAmount: number; // 실제 사용금액(원)
  rate: number; // 연이율(%)
  limit?: number; // 한도(원) — 사용률 표시용, 선택
  days?: number; // 사용일수 — 기간 이자 표시용, 선택
}

export interface OverdraftResult {
  dailyInterest: number; // 일 이자
  monthlyInterest: number; // 월 예상 이자
  yearlyInterest: number; // 연 예상 이자
  periodInterest: number | null; // 기간 이자 (days 입력 시)
  utilization: number | null; // 사용률 % (limit 입력 시)
}

export function calcOverdraft(input: OverdraftInput): OverdraftResult {
  const { usedAmount, rate, limit, days } = input;

  if (usedAmount <= 0 || rate <= 0) {
    return {
      dailyInterest: 0,
      monthlyInterest: 0,
      yearlyInterest: 0,
      periodInterest: null,
      utilization: null,
    };
  }

  const yearlyInterest = usedAmount * (rate / 100);
  const dailyInterest = yearlyInterest / 365;
  const monthlyInterest = yearlyInterest / 12;

  return {
    dailyInterest,
    monthlyInterest,
    yearlyInterest,
    periodInterest: days && days > 0 ? dailyInterest * days : null,
    utilization: limit && limit > 0 ? (usedAmount / limit) * 100 : null,
  };
}

// ─────────────────────────────────────────────
// 2. 원리금 계산
// ─────────────────────────────────────────────

export type RepaymentType = "equal_payment" | "equal_principal";

type AmortizationRow = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

export function equalPaymentMonthly(principal: number, r: number, n: number) {
  if (n <= 0) return 0;
  if (r === 0) return principal / n;

  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calcEqualPrincipalTotalInterest(
  principal: number,
  r: number,
  months: number,
) {
  const principalPay = principal / months;
  let balance = principal;
  let totalInterest = 0;

  for (let i = 0; i < months; i++) {
    const interest = balance * r;
    totalInterest += interest;
    balance -= principalPay;
  }

  return totalInterest;
}

export function calcAmortization(
  principal: number,
  rate: number,
  months: number,
  type: RepaymentType,
) {
  const r = monthlyRate(rate);

  let monthlyPayment = 0;
  let totalInterest = 0;
  const schedule: AmortizationRow[] = [];

  if (type === "equal_payment") {
    monthlyPayment = equalPaymentMonthly(principal, r, months);

    let balance = principal;

    for (let i = 1; i <= months; i++) {
      const interest = balance * r;
      const principalPay = monthlyPayment - interest;
      balance -= principalPay;

      totalInterest += interest;

      schedule.push({
        month: i,
        payment: monthlyPayment,
        principal: principalPay,
        interest,
        balance: Math.max(0, balance),
      });
    }
  } else {
    const principalPay = principal / months;
    let balance = principal;

    for (let i = 1; i <= months; i++) {
      const interest = balance * r;
      const payment = principalPay + interest;
      balance -= principalPay;

      totalInterest += interest;

      schedule.push({
        month: i,
        payment,
        principal: principalPay,
        interest,
        balance: Math.max(0, balance),
      });
    }

    monthlyPayment = schedule[0]?.payment ?? 0;
  }

  const totalPayment = principal + totalInterest;

  const r2 = monthlyRate(Math.max(0, rate - 1));

  let reducedTotalInterest = 0;

  if (type === "equal_payment") {
    const mp2 = equalPaymentMonthly(principal, r2, months);
    reducedTotalInterest = mp2 * months - principal;
  } else {
    reducedTotalInterest = calcEqualPrincipalTotalInterest(
      principal,
      r2,
      months,
    );
  }

  const rateSaving = totalInterest - reducedTotalInterest;

  return {
    monthlyPayment,
    totalInterest,
    totalPayment,
    schedule,
    rateSaving,
    savingMessage:
      "금리가 1%p 낮아지면 약 " + formatUnit(rateSaving) + " 절약됩니다.",
  };
}

// ─────────────────────────────────────────────
// 2-b. 원리금균등 역산 (월 상환액 → 대출원금)
//   equalPaymentMonthly 의 역함수. DSR 기준 추정 가능액 계산에 사용.
//   PV = payment × ((1+r)^n − 1) / ( r(1+r)^n )
// ─────────────────────────────────────────────

export function principalFromPayment(payment: number, r: number, n: number) {
  if (payment <= 0 || n <= 0) return 0;
  if (r === 0) return payment * n;

  return (payment * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
}

// ─────────────────────────────────────────────
// 3. 전세 대출 계산
// ─────────────────────────────────────────────

export function calcJeonseLoan(
  deposit: number,
  rate: number,
  months: number,
  income: number,
  ltv: number,
) {
  const loanAmount = deposit * (ltv / 100);
  const r = monthlyRate(rate);

  const monthlyInterest = loanAmount * r;
  const totalInterest = monthlyInterest * months;
  const selfFunding = deposit - loanAmount;

  let interestRatio = 0;
  if (income > 0) {
    interestRatio = (monthlyInterest / income) * 100;
  }

  return {
    loanAmount,
    monthlyInterest,
    totalInterest,
    selfFunding,
    interestRatio,
    savingMessage:
      "※ 전세대출은 만기일시상환 기준이며 실제 상품과 차이가 있을 수 있습니다.",
  };
}

// ─────────────────────────────────────────────
// 4. 중도상환 계산
// ─────────────────────────────────────────────

export function calcPrepayment(
  remainingPrincipal: number,
  prepaymentAmount: number,
  rate: number,
  remainingMonths: number,
  feeRate: number,
) {
  const r = monthlyRate(rate);

  const mpBefore = equalPaymentMonthly(remainingPrincipal, r, remainingMonths);

  const mpAfter = equalPaymentMonthly(
    remainingPrincipal - prepaymentAmount,
    r,
    remainingMonths,
  );

  const totalBefore = mpBefore * remainingMonths;
  const totalAfter = mpAfter * remainingMonths;

  const interestSaving = totalBefore - totalAfter - prepaymentAmount;
  const prepaymentFee = prepaymentAmount * (feeRate / 100);
  const netProfit = interestSaving - prepaymentFee;

  const monthlySaving =
    remainingMonths > 0 ? interestSaving / remainingMonths : 0;

  const breakEvenMonths =
    monthlySaving > 0 ? Math.ceil(prepaymentFee / monthlySaving) : 0;

  const isProfit = netProfit > 0;

  return {
    interestSaving,
    prepaymentFee,
    netProfit,
    breakEvenMonths,
    isProfit,
    rateSaving: 0,
    savingMessage: isProfit
      ? "중도상환 시 약 " + formatUnit(netProfit) + " 절약됩니다."
      : "수수료로 인해 약 " + formatUnit(netProfit) + " 손해입니다.",
  };
}
