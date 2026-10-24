// 금리 변동 시뮬레이터·고정 vs 변동 화면 회귀 — 실제 두 컴포넌트를 렌더해 화면 글자를 확인한다.
// 기대값은 앱 코드와 별개로 정수 교차곱(Python)으로 계산한 정확값에 기존 화면 규칙을 표시 시점에 한 번 적용한 결과다.
//   월이율 = 연이율 ÷ 1,200 / 원리금균등 M = P·r·(1+r)^n ÷ ((1+r)^n − 1), 총이자 = M·n − P / 0%: M = P÷n
//   원금균등 첫 달 = P÷n + P·r, 총이자 = P·r·(n+1)÷2
import { afterEach, expect, it, vi } from "vitest";
const params = vi.hoisted(() => new URLSearchParams());
vi.mock("next/navigation", () => ({ useSearchParams: () => params, usePathname: () => "/", useRouter: () => ({ replace: () => {}, push: () => {} }) }));
import { uiHarness } from "./uiHarness.test-support";
import RateSimulatorCalc from "@/components/calculator/RateSimulatorCalc";
import FixedVariableCalc from "@/components/calculator/FixedVariableCalc";

const browser = { location: { pathname: "/", search: "", hash: "" }, history: { replaceState: () => {} }, addEventListener: () => {}, removeEventListener: () => {} };
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllTimers(); vi.useRealTimers(); });

const clean = (s: string) => s.replace(/<!--.*?-->/g, "").replace(/&amp;/g, "&");
const texts = (cell: string) => [...cell.matchAll(/>([^<>]+)</g)].map((m) => m[1].replace(/\s+/g, " ").trim()).filter(Boolean);
const rowsOf = (html: string) => {
  const m = /<tbody[^>]*>([\s\S]*?)<\/tbody>/.exec(clean(html));
  return m ? m[1].split(/<tr\b/).slice(1).map((tr) => tr.split(/<td\b/).slice(1).map((td) => texts("<td" + td).join(" "))) : [];
};
const sentence = (html: string) => {
  const m = /border-brand-200 bg-brand-50 p-4[^"]*"[^>]*>\s*<p>([\s\S]*?)<\/p>/.exec(clean(html));
  return m ? m[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : null;
};
function open(Comp: () => unknown) {
  vi.useFakeTimers();
  vi.stubGlobal("window", browser);
  const view = uiHarness(Comp);
  const set = (name: string, value: string) => {
    const node = view.nodes().find((n) => n.props.name === name && typeof n.props.onChange === "function");
    expect(node, name).toBeDefined();
    (node!.props.onChange as (v: string) => void)(value);
  };
  const repay = (label: string) => {
    const b = view.nodes().find((n) => n.type === "button" && String(n.props.children).includes(label));
    (b!.props.onClick as () => void)();
  };
  const cards = () => view.nodes().filter((n) => typeof n.type === "function" && (n.type as { name: string }).name === "ResultCard").map((n) => [String(n.props.value), String(n.props.sub ?? "")]);
  return { view, set, repay, cards, rows: () => rowsOf(view.html()), sentence: () => sentence(view.html()), html: () => view.html() };
}
const rate = (p: string, r: string, m: string, c = "") => { const s = open(RateSimulatorCalc); s.set("principal", p); s.set("rate", r); s.set("months", m); s.set("customDelta", c); return s; };
const fixed = (p: string, m: string, f: string, v: string) => { const s = open(FixedVariableCalc); s.set("principal", p); s.set("months", m); s.set("fixedRate", f); s.set("variableRate", v); return s; };

it("시뮬레이터: 1만원·50%·1,200개월 원리금균등 현재 총이자는 49만(정확값 490,000원 + 약 2.7×10^-16원)", () => {
  expect(rate("1", "50", "1200").rows()).toEqual([
    ["현재 (50.00%)", "417원 기준", "49만 기준"],
    ["+0.25%p (50.25%)", "419원 +2원", "49만 +2,500원"],
    ["+0.5%p (50.50%)", "421원 +4원", "50만 +5,000원"],
    ["+1%p (51.00%)", "425원 +8원", "50만 +10,000원"],
  ]);
});

it("고정 vs 변동: 고정·변동 모두 50%면 두 카드·현재 행이 49만이고 동일", () => {
  const s = fixed("1", "1200", "50", "50");
  expect(s.cards()).toEqual([["49만", "총이자 · 월 417원"], ["49만", "총이자 · 월 417원"]]);
  expect(s.sentence()).toBe("고정금리와 현재 변동금리가 같아, 금리가 그대로 유지되면 총이자도 같습니다.");
  expect(s.rows()).toEqual([
    ["현재 (50%)", "49만", "동일"],
    ["+0.5%p (50.5%)", "50만", "5,000원 많음"],
    ["+1%p (51%)", "50만", "10,000원 많음"],
    ["+1.5%p (51.5%)", "51만", "1만 많음"],
  ]);
});

it("원금균등: 명시적 0%의 +1%p 총이자 4,512.5만 → 4513만(첫 달 기준 월 상환액 유지)", () => {
  const s = rate("30000", "0", "360");
  s.repay("원금균등");
  expect(s.rows()).toEqual([
    ["현재 (0.00%)", "833,333원 기준", "0원 기준"],
    ["+0.25%p (0.25%)", "895,833원 +62,500원", "1128만 +1128만"],
    ["+0.5%p (0.50%)", "958,333원 +125,000원", "2256만 +2256만"],
    ["+1%p (1.00%)", "1,083,333원 +250,000원", "4513만 +4513만"],
  ]);
  expect(s.html()).toContain("첫 달(가장 큰 달) 기준");
});

it("월 상환 0.5원 경계: 1만원·0.06%·1개월 → 10,001원·총이자 1원(정확 10,000.5원·0.5원)", () => {
  expect(rate("1", "0.06", "1").rows()[0]).toEqual(["현재 (0.06%)", "10,001원 기준", "1원 기준"]);
  const s = fixed("1", "1", "0.06", "0.06");
  expect(s.cards()).toEqual([["1원", "총이자 · 월 10,001원"], ["1원", "총이자 · 월 10,001원"]]);
});

it("직접 입력: 0.25와 아주 가까운 값은 별도 행, 작은 값은 지수 표기 없이 그대로", () => {
  expect(rate("30000", "4.5", "360", "0.25000000000000001").rows().map((r) => r[0])).toEqual([
    "현재 (4.50%)", "+0.25%p (4.75%)", "+0.25000000000000001%p (4.75%)", "+0.5%p (5.00%)", "+1%p (5.50%)",
  ]);
  expect(rate("30000", "4.5", "360", "0.0000001").rows()[1]).toEqual(["+0.0000001%p (4.50%)", "1,520,056원 +0원", "2.5억 +6원"]);
});

it("직접 입력 빈칸·0·기본값 중복(0.25·0.250·.5)은 기본 4행 유지", () => {
  for (const c of ["", "0", "0.25", "0.250", ".5"]) {
    expect(rate("30000", "4.5", "360", c).rows(), c).toEqual([
      ["현재 (4.50%)", "1,520,056원 기준", "2.5억 기준"],
      ["+0.25%p (4.75%)", "1,564,942원 +44,886원", "2.6억 +1616만"],
      ["+0.5%p (5.00%)", "1,610,465원 +90,409원", "2.8억 +3255만"],
      ["+1%p (5.50%)", "1,703,367원 +183,311원", "3.1억 +6599만"],
    ]);
  }
});

it("금리 표시 경계: 1.005% → 1.01%(시뮬레이터 toFixed(2)·고정 vs 변동 손익분기 문장)", () => {
  expect(rate("30000", "1.005", "360").rows()[0]).toEqual(["현재 (1.01%)", "965,608원 기준", "4762만 기준"]);
  expect(fixed("30000", "360", "1.005", "0.995").sentence()).toBe(
    "변동금리가 평균 1.01%(지금보다 약 0.01%p 이상) 수준으로 오르면, 변동의 총이자가 고정과 같아지거나 커집니다. 그 아래로 유지되면 변동의 총이자가 더 적습니다.",
  );
});

it("고정 vs 변동 분기: 변동 + 0.5%p가 고정과 정확히 같으면 동일", () => {
  expect(fixed("30000", "360", "1.1", "0.6").rows()).toEqual([
    ["현재 (0.6%)", "2788만", "2447만 적음"],
    ["+0.5%p (1.1%)", "5235만", "동일"],
    ["+1%p (1.6%)", "7793만", "2558만 많음"],
    ["+1.5%p (2.1%)", "1억", "5226만 많음"],
  ]);
});

it("고정 vs 변동 분기: 고정이 1e-16%p 높으면 같다고 보지 않는다", () => {
  const s = fixed("30000", "360", "4.5000000000000001", "4.5");
  expect(s.sentence()).toBe("변동금리가 평균 4.5%(지금보다 약 0%p 이상) 수준으로 오르면, 변동의 총이자가 고정과 같아지거나 커집니다. 그 아래로 유지되면 변동의 총이자가 더 적습니다.");
  expect(s.rows()[0]).toEqual(["현재 (4.5%)", "2.5억", "0원 적음"]);
});

it("총 납입 2^1024원 이상이면 결과 대신 안내", () => {
  for (const s of [rate("1" + "0".repeat(305), "4.5", "360"), fixed("1" + "0".repeat(305), "360", "4.5", "3.8")]) {
    expect(s.rows()).toEqual([]);
    expect(s.html()).toContain("총 납입액이 계산 범위(2^1024원, 약 1.8×10^308원)를 넘어");
  }
});

it("기존 결과 보존: 일반 대출·0%·결과 없음 조건·잘못된 입력 후 복구", () => {
  expect(rate("30000", "0", "360").rows()[0]).toEqual(["현재 (0.00%)", "833,333원 기준", "0원 기준"]);
  expect(rate("30000", "", "360").rows()).toEqual([]);
  expect(rate("30000", "4.5", "").rows()).toEqual([]);
  const s = rate("30000", "4.5a", "360");
  expect(s.rows()).toEqual([]);
  s.set("rate", "4.5");
  expect(s.rows()[0]).toEqual(["현재 (4.50%)", "1,520,056원 기준", "2.5억 기준"]);
  const f = fixed("30000", "360", "4.5", "3.8");
  expect(f.cards()).toEqual([["2.5억", "총이자 · 월 1,520,056원"], ["2억", "총이자 · 월 1,397,872원"]]);
  f.set("variableRate", "");
  expect(f.cards()).toEqual([]);
  f.set("variableRate", "3.8");
  expect(f.rows()[0]).toEqual(["현재 (3.8%)", "2억", "4399만 적음"]);
});
