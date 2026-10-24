// src/lib/calcInput.ts
// 계산기 입력값 파싱과 "현재 렌더 기준" 상태 읽기 유틸 — 순수 함수만. React/Next 의존 없음.
//
// useCalcState 에서 분리한 이유
//   1) 훅은 react·next/navigation 을 import 하므로 단위 테스트에서 다루기 번거롭다.
//   2) 파싱 규칙(쉼표·소수점·빈 값·잘못된 입력)은 훅과 무관한 순수 규칙이라 따로 검증하는 편이 낫다.
//
// ⚠️ sanitize / toDisplay 는 useCalcState 에 있던 구현을 그대로 옮긴 것이다. 동작 변경 없음.
//    (예외: toDisplay 의 정수부 쉼표 표기는 2^53을 넘는 숫자 문자열도 자릿수가 바뀌지 않게 BigInt로 한다. 그 이하는 같은 문자열.)
//    훅은 이 모듈을 import 해 쓰고, 기존 공개 타입은 훅에서 계속 re-export 한다.

export type FieldKind = "money" | "integer" | "decimal";

export type FieldState = {
  value: string; // 화면 표시용 (천 단위 콤마 포함)
  raw: string; // 정상 입력은 계산용 숫자 문자열. URL 선택 오류는 원문을 보존하므로 error를 먼저 확인한다.
  error: string;
};

export type CalcState = Record<string, FieldState>;

export type UrlFieldDef = {
  defaultValue: string;
  kind?: FieldKind;
  validate?: (v: string) => string | undefined;
  // 선택 항목처럼 URL 원문을 검증해야 하는 필드만 사용한다.
  // 오류값을 보존해 다른 필드의 URL 갱신으로 기본값이 저장되지 않게 한다.
  preserveInvalidUrl?: boolean;
};

// ─────────────────────────────────────────────
// 입력 파싱
// ─────────────────────────────────────────────

/** 사용자 입력 → 계산용 raw 문자열. money/integer 는 숫자만, decimal 은 소수점 1개까지 허용. */
export function sanitize(input: string, kind: FieldKind): string {
  const value = input.replace(/,/g, "").trim();

  if (!value) return "";

  if (kind === "money" || kind === "integer") {
    return value.replace(/[^\d]/g, "");
  }

  const cleaned = value.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");

  if (parts.length <= 1) return cleaned;

  return `${parts[0]}.${parts.slice(1).join("")}`;
}

/** 허용하는 표기 정리 — 쉼표와 앞뒤 공백. 이것만 걷어낸 값이 사용자가 의도한 문자열이다. */
export function stripFormatting(input: string): string {
  return input.replace(/,/g, "").trim();
}

/**
 * 허용되지 않은 문자가 제거되었는지 판정한다.
 *
 * ⚠️ sanitize() 는 허용 문자만 남기므로, 붙여넣기로 들어온 값에서 의미 있는 문자가
 *    조용히 사라질 수 있다. 실제로 확인된 사례:
 *
 *      "-5000"  → "5000"   부호가 사라져 음수가 양수가 된다
 *      "1e5"    → "15"     지수 표기가 다른 숫자가 된다
 *      "abc123" → "123"    잘린 일부만 계산된다
 *      "12.5"   → "125"    금액·정수 필드에서 소수점이 사라져 10 배가 된다
 *
 *    쉼표와 앞뒤 공백은 허용하는 표기 정리이므로 "5,000" · " 5000 " 은 정상이다.
 *    그 외 문자가 제거되었다면 사용자의 의도와 다른 값이므로 계산하지 않고 알린다.
 */
export function hasDroppedChars(input: string, kind: FieldKind): boolean {
  const intended = stripFormatting(input);
  if (!intended) return false;

  return sanitize(input, kind) !== intended;
}

/** hasDroppedChars 가 true 일 때 보여 줄 문구. */
export function droppedCharsMessage(kind: FieldKind): string {
  return kind === "decimal"
    ? "숫자와 소수점만 입력할 수 있습니다"
    : "숫자만 입력할 수 있습니다";
}

/**
 * URL 쿼리로 들어온 값이 이 필드에 넣어도 되는 값인지 판정한다.
 *
 * ⚠️ sanitize() 는 "입력 도중"을 다루는 함수라서 허용 문자만 남긴다.
 *    그래서 URL 로 "-5000" 이 들어오면 부호가 떨어져 나가 5000 이 된다.
 *    사용자가 타이핑으로는 만들 수 없는 값이지만 URL 로는 만들 수 있고,
 *    음수를 양수로 바꿔 계산하는 것은 조용한 오답이다.
 *
 *    따라서 URL 에서 읽을 때는 sanitize 전에 이 검사를 먼저 통과시키고,
 *    통과하지 못하면 그 파라미터를 **무시**한다(=필드 기본값을 쓴다).
 *
 * 허용: "5000", "5,000", " 5000 ", 소수 필드의 "4.5" · ".5" · "4."
 * 무시: "-5000", "abc", "1e5", "NaN", "Infinity", "4.5"(정수 필드), ""
 */
export function isValidUrlValue(input: string, kind: FieldKind): boolean {
  const value = input.replace(/,/g, "").trim();
  if (!value) return false;

  const pattern = kind === "decimal" ? /^(?:\d+(?:\.\d*)?|\.\d+)$/ : /^\d+$/;
  if (!pattern.test(value)) return false;

  return Number.isFinite(Number(value));
}

/**
 * URL 파라미터 하나를 읽는다. 값이 없거나 유효하지 않으면 fallback 을 돌려준다.
 * 명시적인 빈 값(key=)은 사용자가 지운 입력이므로 기본값으로 되돌리지 않는다.
 * 반환값은 아직 sanitize 전 문자열이다.
 */
export function readUrlValue(
  urlValue: string | null | undefined,
  fallback: string,
  kind: FieldKind,
): string {
  if (urlValue == null) return fallback;
  if (urlValue === "") return "";
  return isValidUrlValue(urlValue, kind) ? urlValue : fallback;
}

/** URL에서 필드 상태를 만든다. 초기화와 이후 주소 이동에 같은 규칙을 쓴다. */
export function readFieldFromUrl(
  urlValue: string | null | undefined,
  field: UrlFieldDef,
): FieldState {
  if (field.preserveInvalidUrl && urlValue != null) {
    const error = field.validate?.(urlValue);
    if (error) return { value: urlValue, raw: urlValue, error };
  }

  const kind = field.kind ?? "decimal";
  const raw = sanitize(readUrlValue(urlValue, field.defaultValue, kind), kind);
  return { value: toDisplay(raw, kind), raw, error: field.validate?.(raw) ?? "" };
}

/** 계산기 필드만 갱신하고 다른 쿼리값은 유지한다. */
export function buildCalcSearchParams(
  search: string,
  fields: ReadonlyArray<{ key: string; defaultValue: string }>,
  state: CalcState,
): URLSearchParams {
  const params = new URLSearchParams(search);

  for (const field of fields) {
    const value = state[field.key];
    if (!value) continue;

    if (isRejectedField(state, field.key)) {
      params.delete(field.key);
    } else if (value.raw !== "" || field.defaultValue !== "") {
      // 기본값이 있는 필드는 빈 문자열도 저장해야 지운 값이 되살아나지 않는다.
      params.set(field.key, value.raw);
    } else {
      params.delete(field.key);
    }
  }

  return params;
}

/**
 * 숫자만 있는 정수 부분을 ko-KR 쉼표 표기로 바꾼다.
 * Number를 거치면 2^53을 넘는 자릿수가 반올림되어(예: 12345678901234567890 → 12,345,678,901,234,570,000)
 * 타이핑 중 다음 키가 바뀐 표시값 뒤에 붙고 raw 자체가 달라진다. 숫자 문자열은 BigInt로 쉼표만 넣는다.
 * 2^53 이하에서는 기존 `Number(x).toLocaleString("ko-KR")`과 같은 문자열이다.
 */
function groupIntDigits(intPart: string): string {
  return /^\d+$/.test(intPart)
    ? BigInt(intPart).toLocaleString("ko-KR")
    : Number(intPart).toLocaleString("ko-KR");
}

/** raw 문자열 → 화면 표시 문자열. 입력 도중의 "1234." / "1234.50" 형태를 보존한다. */
export function toDisplay(raw: string, kind: FieldKind): string {
  if (!raw) return "";

  if (kind === "money" || kind === "integer") {
    if (isNaN(Number(raw))) return raw;
    return groupIntDigits(raw);
  }

  if (/\.$/.test(raw) || /\.\d*0$/.test(raw)) {
    const [intPart, decPart = ""] = raw.split(".");
    const formattedInt =
      intPart === "" || isNaN(Number(intPart))
        ? intPart
        : groupIntDigits(intPart);

    return raw.endsWith(".")
      ? `${formattedInt}.`
      : `${formattedInt}.${decPart}`;
  }

  if (raw.includes(".")) {
    const [intPart, decPart = ""] = raw.split(".");
    const formattedInt =
      intPart === "" || isNaN(Number(intPart))
        ? intPart
        : groupIntDigits(intPart);

    return `${formattedInt}.${decPart}`;
  }

  if (isNaN(Number(raw))) return raw;
  return groupIntDigits(raw);
}

// ─────────────────────────────────────────────
// 현재 렌더의 상태를 읽는 유틸
//
// ⚠️ 왜 필요한가
//   useCalcState 가 돌려주는 getWon()/getNum() 은 useEffect 로 갱신되는 latestStateRef 를
//   읽는다. useMemo 는 렌더 중에 실행되고 effect 는 커밋 후에 실행되므로, 입력 직후의
//   렌더에서는 ref 가 아직 이전 상태를 들고 있다 → 마지막 입력이 결과에 반영되지 않는다.
//   (같은 버그로 fix(dsr)/fix(calc) 커밋이 세 번 나갔다.)
//
//   아래 유틸은 ref 가 아니라 인자로 받은 state 를 읽으므로 렌더 시점 값과 항상 일치한다.
//   신규·수정 계산기는 useMemo 안에서 getWon/getNum 대신 반드시 이 유틸을 사용할 것.
// ─────────────────────────────────────────────

/**
 * 이 필드가 "거부된 입력"을 들고 있는지 판정한다.
 *
 * 거부 상태는 허용되지 않은 문자가 섞여 계산에 쓸 수 없는 값이다.
 * useCalcState 가 원문을 화면에 남기고 raw 만 비우므로 이렇게 나타난다.
 *
 *   raw === ""  &&  value !== ""
 *
 * ⚠️ 정상적인 미입력과 구분해야 한다. 미입력은 raw 와 value 가 모두 "" 이고,
 *    선택 입력이라면 0 으로 계산해도 된다. 반면 거부 상태는 사용자가 무언가를
 *    입력했지만 그 값을 쓸 수 없는 상태이므로 **0 으로 계산하면 안 된다.**
 */
export function isRejectedField(state: CalcState, key: string): boolean {
  const field = state[key];
  if (field === undefined) return false;

  return field.raw === "" && field.value !== "";
}

/**
 * 필드에 표시 중인 오류가 하나라도 있으면 true.
 *
 * 거부된 입력(hasRejectedInput)뿐 아니라 각 계산기의 validate 가 만든 오류
 * (상한 초과 등)도 포함한다. 오류 문구와 계산 결과가 함께 보이면
 * 사용자가 어느 쪽을 믿어야 할지 알 수 없다.
 */
export function hasFieldError(state: CalcState): boolean {
  return Object.values(state).some((field) => !!field?.error);
}

/** 하나라도 거부된 입력이 있으면 true. 계산기는 이때 결과를 내지 않는다. */
export function hasRejectedInput(state: CalcState): boolean {
  return Object.keys(state).some((key) => isRejectedField(state, key));
}

/**
 * 지정한 키들 중 하나라도 오류가 있으면 true.
 *
 * 모드가 있는 계산기에서 쓴다. 화면에 보이지 않는 비활성 모드의 입력 오류가
 * 현재 모드의 정상 계산을 막으면 안 되기 때문이다.
 * (예: 대비기간에 오류를 낸 뒤 그 입력이 없는 모드로 전환한 경우)
 */
export function hasFieldErrorIn(state: CalcState, keys: string[]): boolean {
  return keys.some((key) => !!state[key]?.error);
}

/** 현재 렌더 기준 raw 문자열. 미입력이면 "". */
export function readRaw(state: CalcState, key: string): string {
  return state[key]?.raw ?? "";
}

/** 현재 렌더 기준 숫자. 빈 값·파싱 불가는 0. */
export function readNum(state: CalcState, key: string): number {
  const n = Number(readRaw(state, key) || "0");
  return isNaN(n) ? 0 : n;
}

/** 현재 렌더 기준 원 단위 금액. 입력 단위(만원) × 10,000. */
export function readWon(state: CalcState, key: string): number {
  return readNum(state, key) * 10_000;
}

/**
 * 값이 입력되었는지 여부.
 * 0 은 유효한 입력이므로(금리 0%, 수수료 0%) truthy 검사 대신 이 함수를 쓸 것.
 */
export function isFilled(state: CalcState, key: string): boolean {
  return readRaw(state, key) !== "";
}

/** 적용되는 기존 금액은 빈칸을 0으로 추정하지 않는다. */
export function hasMissingInput(state: CalcState, keys: readonly string[]): boolean {
 return keys.some(key => !isFilled(state, key));
}
