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
import { useRouter, useSearchParams } from "next/navigation";
import {
  sanitize,
  toDisplay,
  readUrlValue,
  hasDroppedChars,
  droppedCharsMessage,
  type CalcState,
  type FieldKind,
  type FieldState,
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
} from "@/lib/calcInput";

export type FieldDef = {
  key: string;
  defaultValue: string;
  kind?: FieldKind;
  validate?: (v: string) => string | undefined;
};

function getKind(field: FieldDef): FieldKind {
  return field.kind ?? "decimal";
}

export function useCalcState(fields: FieldDef[]) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const latestStateRef = useRef<CalcState>({});

  function buildInitialState(): CalcState {
    const result: CalcState = {};

    for (const f of fields) {
      const kind = getKind(f);
      // 유효하지 않은 쿼리값(음수·문자·지수표기 등)은 무시하고 기본값을 쓴다
      const rawFromUrl = readUrlValue(
        searchParams?.get(f.key),
        f.defaultValue,
        kind,
      );
      const raw = sanitize(rawFromUrl, kind);
      const error = f.validate ? (f.validate(raw) ?? "") : "";

      result[f.key] = {
        value: toDisplay(raw, kind),
        raw,
        error,
      };
    }

    return result;
  }

  const [state, setState] = useState<CalcState>(buildInitialState);

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

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
        const kind = getKind(f);

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

        const urlRaw = sanitize(
          readUrlValue(searchParams?.get(f.key), f.defaultValue, kind),
          kind,
        );
        const error = f.validate ? (f.validate(urlRaw) ?? "") : "";
        const display = toDisplay(urlRaw, kind);

        if (
          prev[f.key]?.raw !== urlRaw ||
          prev[f.key]?.error !== error ||
          prev[f.key]?.value !== display
        ) {
          next[f.key] = {
            value: display,
            raw: urlRaw,
            error,
          };
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }

  const scheduleUrlUpdate = useCallback(() => {
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const current = latestStateRef.current;
      const params = new URLSearchParams();

      for (const f of fields) {
        const raw = current[f.key]?.raw ?? f.defaultValue;
        if (raw !== "") {
          params.set(f.key, raw);
        }
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    }, 350);
  }, [fields, router]);

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
      //   · scheduleUrlUpdate 가 빈 raw 를 건너뛰므로 URL 에도 남지 않는다
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
