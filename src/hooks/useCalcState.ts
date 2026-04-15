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
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type FieldKind = "money" | "integer" | "decimal";

export type FieldDef = {
  key: string;
  defaultValue: string;
  kind?: FieldKind;
  validate?: (v: string) => string | undefined;
};

export type FieldState = {
  value: string;
  raw: string;
  error: string;
};

export type CalcState = Record<string, FieldState>;

function getKind(field: FieldDef): FieldKind {
  return field.kind ?? "decimal";
}

function sanitize(input: string, kind: FieldKind): string {
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

function toDisplay(raw: string, kind: FieldKind): string {
  if (!raw) return "";

  if (kind === "money" || kind === "integer") {
    if (isNaN(Number(raw))) return raw;
    return Number(raw).toLocaleString("ko-KR");
  }

  if (/\.$/.test(raw) || /\.\d*0$/.test(raw)) {
    const [intPart, decPart = ""] = raw.split(".");
    const formattedInt =
      intPart === "" || isNaN(Number(intPart))
        ? intPart
        : Number(intPart).toLocaleString("ko-KR");

    return raw.endsWith(".")
      ? `${formattedInt}.`
      : `${formattedInt}.${decPart}`;
  }

  if (raw.includes(".")) {
    const [intPart, decPart = ""] = raw.split(".");
    const formattedInt =
      intPart === "" || isNaN(Number(intPart))
        ? intPart
        : Number(intPart).toLocaleString("ko-KR");

    return `${formattedInt}.${decPart}`;
  }

  if (isNaN(Number(raw))) return raw;
  return Number(raw).toLocaleString("ko-KR");
}

export function useCalcState(fields: FieldDef[]) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const latestStateRef = useRef<CalcState>({});

  function buildInitialState(): CalcState {
    const result: CalcState = {};

    for (const f of fields) {
      const kind = getKind(f);
      const rawFromUrl = searchParams?.get(f.key) ?? f.defaultValue;
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

  useEffect(() => {
    setState((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const f of fields) {
        const kind = getKind(f);
        const urlRaw = sanitize(
          searchParams?.get(f.key) ?? f.defaultValue,
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
  }, [fields, searchParams]);

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

  const getWon = useCallback((key: string): number => {
    const n = Number(latestStateRef.current[key]?.raw ?? "0");
    return isNaN(n) ? 0 : n * 10_000;
  }, []);

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
