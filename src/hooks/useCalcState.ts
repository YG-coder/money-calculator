"use client";

/**
 * useCalcState
 * URL searchParams ↔ 로컬 상태 동기화 훅
 *
 * 지원 기능
 * - money: 금액 입력용 (정수만, 천 단위 콤마 표시)
 * - integer: 정수 입력용
 * - decimal: 소수 입력용
 * - URL searchParams 동기화
 * - 빠른 연속 입력에도 stale state 방지
 *
 * ⚠️ 값 읽기 주의
 *   getWon()/getNum() 은 useEffect 로 갱신되는 latestStateRef 를 읽는다. 디바운스된
 *   URL 쓰기(350ms 뒤)에는 적합하지만, 렌더 중 실행되는 useMemo 안에서는 한 박자 늦은
 *   값이 잡힌다. 계산 결과를 만들 때는 @/lib/calcInput 의 readNum/readWon/isFilled 를
 *   쓸 것. (하위호환을 위해 getWon/getNum 은 그대로 남겨둔다.)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  sanitize,
  toDisplay,
  readFieldFromUrl,
  hasDroppedChars,
  droppedCharsMessage,
  buildCalcSearchParams,
  type CalcState,
  type FieldKind,
  type FieldState,
  type UrlFieldDef,
} from "@/lib/calcInput";

// 기존 사용처 호환을 위한 re-export (파싱·읽기 유틸의 정본은 @/lib/calcInput)
export type { CalcState, FieldKind, FieldState };
export {
  readRaw,
  readNum,
  readWon,
  isFilled,
  isValidUrlValue,
  hasDroppedChars,
  stripFormatting,
  isRejectedField,
  hasRejectedInput,
  hasFieldError,
  hasFieldErrorIn,
} from "@/lib/calcInput";

export type FieldDef = UrlFieldDef & {
  key: string;
};

function getKind(field: FieldDef): FieldKind {
  return field.kind ?? "decimal";
}

export function useCalcState(fields: FieldDef[]) {
  const searchParams = useSearchParams();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const latestStateRef = useRef<CalcState>({});

  function buildInitialState(): CalcState {
    const result: CalcState = {};

    for (const f of fields) {
      result[f.key] = readFieldFromUrl(searchParams?.get(f.key), f);
    }

    return result;
  }

  const [state, setState] = useState<CalcState>(buildInitialState);

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  useEffect(() => {
    const cancelUpdate = () => clearTimeout(debounceRef.current);
    window.addEventListener("popstate", cancelUpdate);
    return () => {
      cancelUpdate();
      window.removeEventListener("popstate", cancelUpdate);
    };
  }, [fields]);

  // URL(searchParams)이 바뀌면 렌더 중에 상태를 맞춘다.
  // effect 안에서 setState 하면 값이 한 프레임 늦게 반영되고 리렌더가 한 번 더 발생한다.
  const [syncKey, setSyncKey] = useState<{
    params: typeof searchParams;
    fields: FieldDef[];
  }>({ params: searchParams, fields });

  if (syncKey.params !== searchParams || syncKey.fields !== fields) {
    setSyncKey({ params: searchParams, fields });
    setState((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const f of fields) {
        // 거부된 입력을 들고 있는 필드는 URL 동기화로 덮지 않는다.
        //
        // 거부 상태는 raw 가 비어 있는데 화면 값은 남아 있는 상태다.
        // (정상 필드는 raw 가 "" 이면 value 도 "" 다 — toDisplay("") === "")
        // 이 필드는 URL 에 키가 없으므로, 덮어쓰면 방금 표시한 오류가 사라진다.
        const prevField = prev[f.key];
        const isRejected =
          prevField !== undefined &&
          prevField.raw === "" &&
          prevField.value !== "";

        if (isRejected && searchParams?.get(f.key) == null) continue;

        const fieldState = readFieldFromUrl(searchParams?.get(f.key), f);

        if (
          prev[f.key]?.raw !== fieldState.raw ||
          prev[f.key]?.error !== fieldState.error ||
          prev[f.key]?.value !== fieldState.value
        ) {
          next[f.key] = fieldState;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }

  const scheduleUrlUpdate = useCallback(() => {
    clearTimeout(debounceRef.current);
    const sourcePath = window.location.pathname;
    const sourceSearch = window.location.search;

    debounceRef.current = setTimeout(() => {
      // 입력 직후 다른 페이지로 이동하면 그 페이지의 URL을 덮어쓰지 않는다.
      if (window.location.pathname !== sourcePath || window.location.search !== sourceSearch) return;

      const params = buildCalcSearchParams(
        window.location.search,
        fields,
        latestStateRef.current,
      );
      const query = params.toString();
      const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;

      // Next.js의 브라우저 이력 연동으로 입력마다 서버 요청을 보내지 않는다.
      window.history.replaceState(null, "", nextUrl);
    }, 350);
  }, [fields]);

  const setValue = useCallback(
    (key: string, inputValue: string) => {
      const field = fields.find((f) => f.key === key);
      if (!field) return;

      const kind = getKind(field);

      // 붙여넣기·타이핑으로 허용되지 않은 문자가 제거되면 값이 조용히 달라진다.
      // ("-5000"→5000, "1e5"→15, 금액 필드의 "12.5"→125 등)
      //
      // 이때 정리된 숫자를 raw 에 넣으면 그 값으로 계산되고 URL 에도 저장되어,
      // 새로고침하면 오류가 사라진 정상값으로 되살아난다.
      // 그래서 **원문은 화면에 그대로 두고 raw 는 비운다.**
      //   · raw 가 "" 이므로 계산에 쓰이지 않고 (isFilled=false)
      //   · buildCalcSearchParams가 거부된 필드의 키를 지우므로 URL에도 남지 않는다
      if (hasDroppedChars(inputValue, kind)) {
        setState((prev) => ({
          ...prev,
          [key]: {
            value: inputValue,
            raw: "",
            error: droppedCharsMessage(kind),
          },
        }));

        scheduleUrlUpdate();
        return;
      }

      const raw = sanitize(inputValue, kind);
      const error = field.validate ? (field.validate(raw) ?? "") : "";
      const display = toDisplay(raw, kind);

      setState((prev) => ({
        ...prev,
        [key]: {
          value: display,
          raw,
          error,
        },
      }));

      scheduleUrlUpdate();
    },
    [fields, scheduleUrlUpdate],
  );

  /** @deprecated 렌더 중(useMemo)에는 한 박자 늦다. @/lib/calcInput 의 readWon 을 쓸 것. */
  const getWon = useCallback((key: string): number => {
    const n = Number(latestStateRef.current[key]?.raw ?? "0");
    return isNaN(n) ? 0 : n * 10_000;
  }, []);

  /** @deprecated 렌더 중(useMemo)에는 한 박자 늦다. @/lib/calcInput 의 readNum 을 쓸 것. */
  const getNum = useCallback((key: string): number => {
    const n = Number(latestStateRef.current[key]?.raw ?? "0");
    return isNaN(n) ? 0 : n;
  }, []);

  const hasError = Object.values(state).some((s) => s.error !== "");

  return {
    state,
    setValue,
    getWon,
    getNum,
    hasError,
  };
}
