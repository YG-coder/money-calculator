// DSR 추정 가능액 화면 회귀 — 실제 DsrCalc를 렌더해 추정 모드에 표시된 금액을 읽고,
// 그 문자열이 뜻하는 만원 금액을 DSR 확인 모드의 신규 대출 금액에 다시 넣는다.
//
// 기대값은 앱 코드와 별개로 정한다.
//   · 표시 문자열(예: '3억 1,734만원')과 월 상환액: Python 유리수 정확 계산(검증 근거 oracle.py)으로 구한
//     '목표 DSR 이하가 되는 가장 큰 만원 정수 금액'
//   · 목표 이하·1만원 더하면 초과: 아래 정수 교차곱으로 테스트 안에서 직접 판정(앱 역산·정방향 함수 미사용)
//       주담대 원리금균등(월이율 a/b): 12·P·a·(b+a)^n ≤ (허용 − 기존)·b·((b+a)^n − b^n)
//       신용대출: P·(1/5 + (금리 + s)/100) ≤ 허용 − 기존, s는 기존 + P > 1억원일 때만 1.5 × (그 밖 1, 3~5년 고정 0.6)
//   · 스트레스 금리는 2026-H2 정책표 값을 사례에 적는다(정책 재조사 범위 아님).
// 수정 전 화면(0.1억·만 반올림)에서는 재입력 초과·축소·문구 불일치로 실패해야 한다.
import { afterEach, describe, expect, it, vi } from "vitest";
const params = vi.hoisted(() => ({ current: new URLSearchParams() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => params.current, usePathname: () => "/dsr-calculator", useRouter: () => ({ replace: () => {}, push: () => {} }) }));
import { uiHarness } from "./uiHarness.test-support";
import DsrCalc from "@/components/calculator/DsrCalc";

const browser = { location: { pathname: "/dsr-calculator", search: "", hash: "" }, history: { replaceState: () => {} }, addEventListener: () => {}, removeEventListener: () => {} };
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllTimers(); vi.useRealTimers(); });

type Case = {
  name: string; income: number; existingDebt?: number; creditBalance?: number; creditRate?: string; jeonseInterest?: number;
  loan: "mortgage" | "credit"; region?: "metro" | "local"; rateType?: "variable" | "fixed" | "hybrid"; months?: number; fixedMonths?: number;
  creditKind?: "lumpSum" | "creditLine"; creditFixed?: "other" | "fixed3to5"; rate: string; limit: 40 | 50;
  /** 주담대 적용 스트레스 금리(%p, 정책표 값) */ stress?: string;
  /** 독립 정확 계산의 기대 표시와 부가 기대 */ expected: string; monthly?: string; appliedRate?: string; note?: string;
};

const SEL = { region: ["metro", "local"], rate: ["variable", "fixed", "hybrid", "periodic"], credit: ["lumpSum", "creditLine", "installment"], fixed: ["other", "fixed3to5", "fixed5plus"] };
function query(c: Case, mode: "check" | "estimate", amount?: bigint) {
  const p = new URLSearchParams({
    dsrMode: mode === "check" ? "0" : "1", dsrLoan: c.loan === "mortgage" ? "0" : "1", dsrRegion: String(SEL.region.indexOf(c.region ?? "metro")),
    dsrRate: String(SEL.rate.indexOf(c.rateType ?? "variable")), dsrRepayment: "0", dsrCredit: String(SEL.credit.indexOf(c.creditKind ?? "lumpSum")),
    dsrCreditFixed: String(SEL.fixed.indexOf(c.creditFixed ?? "other")), dsrJeonse: c.jeonseInterest !== undefined ? "4" : "1", dsrLimit: c.limit === 40 ? "0" : "1",
    income: String(c.income), existingDebt: String(c.existingDebt ?? 0), creditBalance: String(c.creditBalance ?? 0), creditLineLimit: "0", creditInstallmentBalance: "0", rate: c.rate,
  });
  if (c.creditRate) p.set("creditRate", c.creditRate);
  if (c.jeonseInterest !== undefined) p.set("jeonseInterest", String(c.jeonseInterest));
  if (c.loan === "mortgage") p.set("months", String(c.months));
  if (c.fixedMonths !== undefined) p.set("fixedMonths", String(c.fixedMonths));
  if (amount !== undefined) p.set("amount", amount.toString());
  return p;
}
function render(p: URLSearchParams) {
  vi.useFakeTimers({ now: new Date("2026-10-25T03:00:00Z"), toFake: ["Date", "setTimeout", "clearTimeout"] });
  vi.stubGlobal("window", browser);
  params.current = p;
  const view = uiHarness(DsrCalc);
  const html = view.html().replace(/<!--.*?-->/g, "");
  const cards = view.nodes().filter((n) => typeof n.type === "function" && (n.type as { name: string }).name === "ResultCard")
    .map((n) => ({ label: String(n.props.label), value: String(n.props.value), sub: String(n.props.sub ?? ""), danger: !!n.props.danger }));
  const text = html.replace(/<[^>]*>/g, " ").replace(/&#x27;/g, "'").replace(/&lsquo;|&rsquo;/g, "'").replace(/\s+/g, " ");
  return { cards, text };
}

/** 화면 금액 → 만원 정수(테스트 자체 해석). 수정 전 표기('3.2억'·'7723만')도 읽는다. 만원 입력칸에 넣을 수 없으면 null. */
function manwonOf(v: string): bigint | null {
  const d = (s: string) => BigInt(s.replace(/,/g, ""));
  let m: RegExpExecArray | null;
  if ((m = /^([\d,]+)억 ([\d,]+)만원$/.exec(v))) return d(m[1]) * BigInt(10000) + d(m[2]);
  if ((m = /^([\d,]+)억원$/.exec(v))) return d(m[1]) * BigInt(10000);
  if ((m = /^([\d,]+)만원?$/.exec(v))) return d(m[1]);
  if ((m = /^(\d+)(?:\.(\d))?억$/.exec(v))) return BigInt(m[1]) * BigInt(10000) + BigInt(m[2] ?? "0") * BigInt(1000);
  return null;
}

// ── 테스트 안의 정수 교차곱 판정 ──
type Q = { n: bigint; d: bigint };
const B = (x: number | string) => BigInt(x);
function dec(s: string): Q { const [i, f = ""] = s.split("."); return { n: B(i + f), d: B(10) ** B(f.length) }; }
const add = (a: Q, b: Q): Q => ({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
const le = (a: Q, b: Q) => a.n * b.d <= b.n * a.d;
const MAN = B(10000), GATE = B(100000000);
function within(c: Case, P: bigint): boolean {
  const allowed: Q = { n: B(c.income) * MAN * B(c.limit), d: B(100) };
  const serviced = B(c.creditBalance ?? 0) * MAN;
  let existing: Q = { n: B(c.existingDebt ?? 0) * MAN + B(c.jeonseInterest ?? 0) * MAN, d: B(1) };
  if (serviced > 0) { const cr = dec(c.creditRate!); existing = add(existing, { n: serviced * (B(20) * cr.d + cr.n), d: B(100) * cr.d }); } // 잔액·(1/5 + 금리/100)
  const room = add(allowed, { n: -existing.n, d: existing.d });
  if (c.loan === "credit") {
    const s = serviced + P > GATE ? (c.creditFixed === "fixed3to5" ? dec("0.9") : dec("1.5")) : dec("0");
    const r = add(dec(c.rate), s); // %
    const annual: Q = { n: P * (B(20) * r.d + r.n), d: B(100) * r.d };
    return le(annual, room);
  }
  const r = add(dec(c.rate), dec(c.stress!)); // 월이율 = r / 1200
  const a = r.n, b = r.d * B(1200), n = B(c.months!);
  const pow = (x: bigint) => x ** n;
  // 12·P·a·(b+a)^n · room.d ≤ room.n · b · ((b+a)^n − b^n)
  return B(12) * P * a * pow(b + a) * room.d <= room.n * b * (pow(b + a) - pow(b));
}

const CASES: Case[] = [
  { name: "주담대 수도권 변동 4.92%·480개월·50% (과거 0.1억 반올림 초과 50.42%)", income: 5250, loan: "mortgage", months: 480, rate: "4.92", limit: 50, stress: "3.0", expected: "3억 1,734만원", monthly: "1,513,427원", appliedRate: "7.92" },
  { name: "주담대 순수고정·기존 부채 754만원", income: 4986, existingDebt: 754, loan: "mortgage", rateType: "fixed", months: 360, rate: "2.26", limit: 50, stress: "0", expected: "3억 7,861만원", monthly: "1,449,154원" },
  { name: "주담대 지방 혼합형 고정 180/360개월(비중 50%)", income: 7000, loan: "mortgage", region: "local", rateType: "hybrid", months: 360, fixedMonths: 180, rate: "4.2", limit: 40, stress: "0.15", expected: "4억 6,871만원", monthly: "2,292,072원", appliedRate: "4.35" },
  { name: "주담대 1주택 수도권 전세 이자 300만원 반영", income: 6000, jeonseInterest: 300, loan: "mortgage", months: 360, rate: "4.3", limit: 50, stress: "3.0", expected: "3억 2,819만원", monthly: "1,624,119원" },
  { name: "연 상환여력 1만원만 남은 경우(과거 '13만' 초과)", income: 5000, existingDebt: 1999, loan: "mortgage", months: 360, rate: "4", limit: 40, stress: "3.0", expected: "12만원", monthly: "573원" },
  { name: "억·만원 전환: 정확 원금 100,010,572원 → 1억 1만원(과거 '1억'으로 1만원 축소)", income: 1946, loan: "mortgage", months: 360, rate: "3.75", limit: 40, stress: "3.0", expected: "1억 1만원", monthly: "463,162원" },
  { name: "억·만원 전환: 정확 원금 99,994,371원 → 9,999만원", income: 1629, loan: "mortgage", months: 360, rate: "4.2", limit: 50, stress: "3.0", expected: "9,999만원", monthly: "488,968원" },
  { name: "신용 3~5년 고정: 스트레스 구간 1억 38만원(과거 '1억'+적용금리 5.9% 모순)", income: 6500, loan: "credit", creditFixed: "fixed3to5", rate: "5", limit: 40, expected: "1억 38만원", appliedRate: "5.9" },
  { name: "마이너스통장 그 밖: 1억원 경계에서 멈춤", income: 6500, loan: "credit", creditKind: "creditLine", rate: "5", limit: 40, expected: "1억원", appliedRate: "5", note: "1억원을 넘는 순간 스트레스 금리가 붙어" },
  { name: "기존 신용 9,999만원 + 신규: 만원 반올림 7723만 초과 → 7,722만원", income: 9000, creditBalance: 9999, creditRate: "5", loan: "credit", creditFixed: "fixed3to5", rate: "5", limit: 50, expected: "7,722만원", appliedRate: "5.9" },
];

describe("DSR 추정 가능액: 화면 금액을 그대로 재입력해도 목표 DSR 이하", () => {
  for (const c of CASES) {
    it(c.name, () => {
      const est = render(query(c, "estimate"));
      const main = est.cards.find((x) => x.label.startsWith("DSR 기준 추정 가능"));
      expect(main, "추정 금액 카드").toBeDefined();
      const manwon = manwonOf(main!.value);
      expect(manwon, `만원 입력칸에 넣을 수 있는 표시여야 함: ${main!.value}`).not.toBeNull();

      // 1) 같은 조건의 DSR 확인 모드에 재입력 — 화면에 초과 문구가 없어야 하고, 정확 판정도 목표 이하
      const chk = render(query(c, "check", manwon!));
      expect(chk.text, `재입력 ${manwon}만원`).toContain("남은 연간 상환여력");
      expect(chk.text).not.toContain("초과합니다");
      expect(chk.cards.find((x) => x.label === "스트레스 DSR")?.danger).toBe(false);
      expect(within(c, manwon! * MAN), "정확 판정: 표시 금액 목표 이하").toBe(true);

      // 2) 불필요한 축소 없음 — 1만원 더하면 정확 판정으로 초과
      expect(within(c, (manwon! + BigInt(1)) * MAN), "정확 판정: 1만원 더하면 초과").toBe(false);

      // 3) 표시 문자열·보조 금액·문구가 같은 금액을 가리킨다
      expect(main!.value).toBe(c.expected);
      if (c.appliedRate) expect(main!.sub).toContain(`${c.loan === "mortgage" ? "스트레스 금리" : "적용금리"} ${c.appliedRate}% 기준`);
      if (c.monthly) expect(est.cards.find((x) => x.label === "참고 · 월 상환액")?.value).toBe(c.monthly);
      if (c.note) expect(est.text).toContain(c.note);
      expect(est.text).toContain("최대 대출 가능액을 보장하지 않습니다");
      expect(est.text).toContain("실제 승인 한도는 금융회사 심사");
    });
  }
});

describe("양수 추정액이 1만원보다 작으면 '1만원 미만'으로 구분", () => {
  for (const c of [
    { name: "주담대 연소득 1만원·12개월(정확 원금 3,852원)", income: 1, loan: "mortgage", months: 12, rate: "4", limit: 40, stress: "3.0", expected: "1만원 미만" },
    { name: "신용 연소득 1만원·50%(정확 원금 5,714원)", income: 1, loan: "credit", rate: "50", limit: 40, expected: "1만원 미만" },
  ] as Case[]) {
    it(c.name, () => {
      const est = render(query(c, "estimate"));
      const main = est.cards.find((x) => x.label.startsWith("DSR 기준 추정 가능"));
      expect(main?.value).toBe("1만원 미만");
      expect(within(c, MAN), "정확 판정: 1만원은 초과").toBe(false);
      expect(est.text).not.toContain("기존 부채가 이미 목표 DSR");
      expect(est.text).not.toContain("이 조건은 계산하지 않습니다");
      expect(est.cards.some((x) => x.label === "참고 · 월 상환액")).toBe(false);
    });
  }
});
