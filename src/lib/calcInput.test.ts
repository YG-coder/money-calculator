import { describe, it, expect } from "vitest";
import {
  sanitize,
  toDisplay,
  readRaw,
  readNum,
  readWon,
  isFilled,
  type CalcState,
  isValidUrlValue,
  readUrlValue,
  hasDroppedChars,
  stripFormatting,
  droppedCharsMessage,
  isRejectedField,
  hasRejectedInput,
} from "@/lib/calcInput";

const st = (entries: Record<string, string>): CalcState =>
  Object.fromEntries(
    Object.entries(entries).map(([k, raw]) => [
      k,
      { raw, value: raw, error: "" },
    ]),
  );

describe("sanitize — 입력 파싱", () => {
  it("money: 쉼표를 제거한다", () => {
    expect(sanitize("1,234,567", "money")).toBe("1234567");
  });

  it("money: 숫자가 아닌 문자를 버린다", () => {
    expect(sanitize("12a3원", "money")).toBe("123");
    expect(sanitize("-500", "money")).toBe("500"); // 음수 부호 미지원(금액은 양수만)
  });

  it("money/integer: 소수점을 허용하지 않는다", () => {
    expect(sanitize("12.9", "money")).toBe("129");
    expect(sanitize("12.9", "integer")).toBe("129");
  });

  it("decimal: 소수점 1개만 남긴다", () => {
    expect(sanitize("3.5", "decimal")).toBe("3.5");
    expect(sanitize("3.5.7", "decimal")).toBe("3.57");
  });

  it("decimal: 입력 도중의 끝 소수점을 보존한다", () => {
    expect(sanitize("3.", "decimal")).toBe("3.");
  });

  it("빈 값과 공백은 빈 문자열", () => {
    expect(sanitize("", "money")).toBe("");
    expect(sanitize("   ", "money")).toBe("");
    expect(sanitize("", "decimal")).toBe("");
  });

  it("0 은 유효한 입력이라 그대로 남는다", () => {
    expect(sanitize("0", "money")).toBe("0");
    expect(sanitize("0", "decimal")).toBe("0");
  });

  it("숫자가 하나도 없으면 빈 문자열", () => {
    expect(sanitize("abc", "money")).toBe("");
    expect(sanitize("원", "decimal")).toBe("");
  });
});

describe("toDisplay — 표시 문자열", () => {
  it("money: 천 단위 콤마", () => {
    expect(toDisplay("1234567", "money")).toBe("1,234,567");
    expect(toDisplay("0", "money")).toBe("0");
  });

  it("decimal: 정수부만 콤마, 소수부는 유지", () => {
    expect(toDisplay("1234.5", "decimal")).toBe("1,234.5");
    expect(toDisplay("1234.50", "decimal")).toBe("1,234.50");
  });

  it("decimal: 입력 도중의 끝 소수점을 유지한다", () => {
    expect(toDisplay("1234.", "decimal")).toBe("1,234.");
  });

  it("빈 값은 빈 문자열", () => {
    expect(toDisplay("", "money")).toBe("");
    expect(toDisplay("", "decimal")).toBe("");
  });
});

describe("read 유틸 — 현재 렌더의 값 읽기", () => {
  const state = st({
    price: "50000",
    rate: "0",
    empty: "",
    broken: "abc",
  });

  it("readRaw: 원본 문자열, 없으면 빈 문자열", () => {
    expect(readRaw(state, "price")).toBe("50000");
    expect(readRaw(state, "empty")).toBe("");
    expect(readRaw(state, "존재하지않음")).toBe("");
  });

  it("readNum: 숫자 변환", () => {
    expect(readNum(state, "price")).toBe(50000);
    expect(readNum(state, "rate")).toBe(0);
  });

  it("readNum: 빈 값·미존재 키·파싱 불가는 0", () => {
    expect(readNum(state, "empty")).toBe(0);
    expect(readNum(state, "존재하지않음")).toBe(0);
    expect(readNum(state, "broken")).toBe(0);
  });

  it("readWon: 만원 → 원", () => {
    expect(readWon(state, "price")).toBe(500_000_000);
    expect(readWon(state, "empty")).toBe(0);
  });

  it("isFilled: 0 은 입력된 것으로 본다 (금리 0%·수수료 0% 대응)", () => {
    expect(isFilled(state, "rate")).toBe(true);
    expect(isFilled(state, "price")).toBe(true);
    expect(isFilled(state, "empty")).toBe(false);
    expect(isFilled(state, "존재하지않음")).toBe(false);
  });
});

describe("stale 입력 재현 — 왜 read 유틸이 필요한가", () => {
  // useCalcState 의 getWon/getNum 은 useEffect 로 갱신되는 ref 를 읽는다.
  // useMemo 는 렌더 중, effect 는 커밋 후에 실행되므로 입력 직후 렌더에서 ref 는
  // 아직 이전 상태를 들고 있다. React 없이 그 타이밍만 흉내내 차이를 고정한다.
  function makeRefReader() {
    const ref: { current: CalcState } = { current: {} };
    return {
      // effect 단계 (커밋 후)
      commit: (s: CalcState) => {
        ref.current = s;
      },
      // 렌더 단계에서의 읽기 — getNum 과 같은 구현
      readDuringRender: (key: string) => {
        const n = Number(ref.current[key]?.raw ?? "0");
        return isNaN(n) ? 0 : n;
      },
    };
  }

  it("ref 방식은 마지막 입력을 한 박자 놓친다", () => {
    const r = makeRefReader();
    const first = st({ price: "1000" });
    r.commit(first); // 첫 렌더 커밋 완료

    const second = st({ price: "2000" }); // 사용자가 값을 바꿈 → 렌더 시작
    expect(r.readDuringRender("price")).toBe(1000); // ❌ 이전 값
    expect(readNum(second, "price")).toBe(2000); // ✅ 현재 렌더 값
  });

  it("첫 렌더에서 ref 는 비어 있어 0 을 돌려준다", () => {
    const r = makeRefReader();
    const initial = st({ price: "1000" });
    expect(r.readDuringRender("price")).toBe(0); // ❌
    expect(readNum(initial, "price")).toBe(1000); // ✅
  });
});

describe("isValidUrlValue — 잘못된 쿼리값 무시", () => {
  it("정상 숫자는 통과한다", () => {
    expect(isValidUrlValue("5000", "money")).toBe(true);
    expect(isValidUrlValue("5,000", "money")).toBe(true);
    expect(isValidUrlValue(" 5000 ", "money")).toBe(true);
    expect(isValidUrlValue("0", "money")).toBe(true);
  });

  it("음수는 무시한다 — sanitize 만으로는 부호가 떨어져 양수가 된다", () => {
    expect(sanitize("-5000", "money")).toBe("5000"); // 기존 동작 확인
    expect(isValidUrlValue("-5000", "money")).toBe(false);
  });

  it("문자·지수표기·특수값은 무시한다", () => {
    for (const bad of ["abc", "1e5", "NaN", "Infinity", "5000원", "", "  "]) {
      expect(isValidUrlValue(bad, "money")).toBe(false);
    }
  });

  it("소수 필드는 소수를 허용하고 정수 필드는 허용하지 않는다", () => {
    expect(isValidUrlValue("4.5", "decimal")).toBe(true);
    expect(isValidUrlValue("4.5", "money")).toBe(false);
    expect(isValidUrlValue("4.5", "integer")).toBe(false);
    expect(isValidUrlValue("4.5.6", "decimal")).toBe(false);
  });
});

describe("readUrlValue — 무시할 때 기본값으로 되돌린다", () => {
  it("유효하면 그 값을, 아니면 fallback 을 준다", () => {
    expect(readUrlValue("5000", "0", "money")).toBe("5000");
    expect(readUrlValue("-5000", "0", "money")).toBe("0");
    expect(readUrlValue("abc", "", "money")).toBe("");
  });

  it("파라미터 자체가 없으면 fallback", () => {
    expect(readUrlValue(null, "0", "money")).toBe("0");
    expect(readUrlValue(undefined, "", "money")).toBe("");
  });
});

// ─────────────────────────────────────────────
// 붙여넣기로 문자가 사라지는 경우 판정
// ─────────────────────────────────────────────

describe("hasDroppedChars — 허용 표기와 잘못된 입력 구분", () => {
  it("쉼표·앞뒤 공백은 허용 표기이므로 false", () => {
    expect(hasDroppedChars("5,000", "money")).toBe(false);
    expect(hasDroppedChars(" 5000 ", "money")).toBe(false);
    expect(hasDroppedChars("1,234,567", "money")).toBe(false);
    expect(hasDroppedChars("5000", "money")).toBe(false);
  });

  it("빈 값은 false", () => {
    expect(hasDroppedChars("", "money")).toBe(false);
    expect(hasDroppedChars("   ", "money")).toBe(false);
  });

  it("음수 부호가 사라지면 true", () => {
    expect(hasDroppedChars("-5000", "money")).toBe(true);
  });

  it("지수 표기는 true", () => {
    expect(hasDroppedChars("1e5", "money")).toBe(true);
  });

  it("문자가 섞이면 true", () => {
    expect(hasDroppedChars("abc123", "money")).toBe(true);
    expect(hasDroppedChars("12a3원", "money")).toBe(true);
  });

  it("금액·정수 필드의 소수점은 true (10 배 오차를 막는다)", () => {
    expect(hasDroppedChars("12.5", "money")).toBe(true);
    expect(hasDroppedChars("12.5", "integer")).toBe(true);
  });

  it("소수 필드의 소수점은 정상 입력이므로 false", () => {
    expect(hasDroppedChars("3.5", "decimal")).toBe(false);
    expect(hasDroppedChars("3.", "decimal")).toBe(false);
    expect(hasDroppedChars("0.25", "decimal")).toBe(false);
  });

  it("소수 필드에서도 문자·부호는 true", () => {
    expect(hasDroppedChars("-3.5", "decimal")).toBe(true);
    expect(hasDroppedChars("3.5%", "decimal")).toBe(true);
    expect(hasDroppedChars("3.5.7", "decimal")).toBe(true);
  });
});

describe("stripFormatting", () => {
  it("쉼표와 앞뒤 공백만 제거한다", () => {
    expect(stripFormatting(" 1,234 ")).toBe("1234");
    expect(stripFormatting("-5,000")).toBe("-5000");
    expect(stripFormatting("abc")).toBe("abc");
  });
});

describe("droppedCharsMessage", () => {
  it("필드 종류에 따라 문구가 다르다", () => {
    expect(droppedCharsMessage("money")).toContain("숫자만");
    expect(droppedCharsMessage("decimal")).toContain("소수점");
  });
});

// ─────────────────────────────────────────────
// 거부된 입력 상태 — 2026-09-16 회귀 방지
//
// 붙여넣기·타이핑으로 허용되지 않은 문자가 섞이면 useCalcState 가
// 원문을 화면에 남기고 raw 를 비운다. 이 상태를 "정상적인 미입력"과
// 반드시 구분해야 한다. 아래는 그때 확인된 동작을 고정한 것이다.
// ─────────────────────────────────────────────

const rejected = (value: string): CalcState => ({
  amount: { value, raw: "", error: "숫자만 입력할 수 있습니다" },
});
const empty: CalcState = { amount: { value: "", raw: "", error: "" } };
const filled: CalcState = { amount: { value: "5,000", raw: "5000", error: "" } };

describe("isRejectedField — 미입력과 오류 상태 구분", () => {
  it("원문이 남아 있고 raw 가 비면 거부 상태", () => {
    for (const v of ["-5000", "1e5", "abc123", "12.5"]) {
      expect(isRejectedField(rejected(v), "amount"), v).toBe(true);
    }
  });

  it("정상적인 미입력은 거부 상태가 아니다", () => {
    expect(isRejectedField(empty, "amount")).toBe(false);
  });

  it("정상 입력은 거부 상태가 아니다", () => {
    expect(isRejectedField(filled, "amount")).toBe(false);
  });

  it("없는 키는 false", () => {
    expect(isRejectedField(empty, "nope")).toBe(false);
  });
});

describe("hasRejectedInput — 선택 입력도 결과를 차단한다", () => {
  it("필드 하나라도 거부 상태면 true", () => {
    expect(
      hasRejectedInput({ ...filled, extra: rejected("abc").amount }),
    ).toBe(true);
  });

  it("전부 미입력이면 false (선택 입력은 0 으로 계산해도 된다)", () => {
    expect(hasRejectedInput({ a: empty.amount, b: empty.amount })).toBe(false);
  });

  it("빈 상태는 false", () => {
    expect(hasRejectedInput({})).toBe(false);
  });
});

describe("거부 상태에서의 읽기 유틸 — 0 으로 계산되면 안 되는 이유", () => {
  it("readNum 은 0 을 돌려주고 isFilled 는 false 다", () => {
    const state = rejected("-5000");
    expect(readNum(state, "amount")).toBe(0);
    expect(isFilled(state, "amount")).toBe(false);
  });

  it("그래서 미입력과 값이 같아진다 — hasRejectedInput 로 구분해야 한다", () => {
    const state = rejected("-5000");
    expect(readNum(state, "amount")).toBe(readNum(empty, "amount"));
    expect(hasRejectedInput(state)).toBe(true);
    expect(hasRejectedInput(empty)).toBe(false);
  });

  it("거부된 값은 URL 에 저장되지 않는다 (raw 가 비어 있음)", () => {
    expect(rejected("-5000").amount.raw).toBe("");
  });
});
