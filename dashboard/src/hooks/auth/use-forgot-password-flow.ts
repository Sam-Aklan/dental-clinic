import { useState, useEffect, useCallback, useRef } from "react";
import { useForgotPasswordMutation } from "@/hooks/auth/use-forgot-password-mutation";
import type { ForgotPasswordView, ResendCooldown, ApiErrorKey } from "@/types";

const COOLDOWN_KEY = "fp_cooldown";
const COOLDOWN_DURATION_MS = 60_000;

function readCooldown(): ResendCooldown | null {
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResendCooldown;
    if (
      typeof parsed !== "object" ||
      typeof parsed.expiresAt !== "number" ||
      typeof parsed.email !== "string"
    ) {
      localStorage.removeItem(COOLDOWN_KEY);
      return null;
    }
    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(COOLDOWN_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(COOLDOWN_KEY);
    return null;
  }
}

function writeCooldown(email: string) {
  localStorage.setItem(
    COOLDOWN_KEY,
    JSON.stringify({
      expiresAt: Date.now() + COOLDOWN_DURATION_MS,
      email,
    }),
  );
}

function clearCooldown() {
  localStorage.removeItem(COOLDOWN_KEY);
}

function computeRemainingSeconds(expiresAt: number): number {
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}

export function useForgotPasswordFlow() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(() => {
    const stored = readCooldown();
    return stored?.email ?? null;
  });

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const stored = readCooldown();
    return stored ? computeRemainingSeconds(stored.expiresAt) : 0;
  });

  const [view, setView] = useState<ForgotPasswordView>(() => {
    const stored = readCooldown();
    return stored ? "success" : "form";
  });

  const [apiErrorKey, setApiErrorKey] = useState<ApiErrorKey | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mutation = useForgotPasswordMutation(
    (email) => {
      writeCooldown(email);
      setSubmittedEmail(email);
      setRemainingSeconds(COOLDOWN_DURATION_MS / 1000);
      setView("success");
      setApiErrorKey(null);
    },
    (key) => {
      setApiErrorKey(key);
    },
  );

  const submitEmail = useCallback(
    (email: string) => {
      mutation.mutate({ email: email.trim().toLowerCase() });
    },
    [mutation],
  );

  const resend = useCallback(() => {
    if (remainingSeconds > 0 || !submittedEmail) return;
    mutation.mutate({ email: submittedEmail });
  }, [remainingSeconds, submittedEmail, mutation]);

  const cooldownActive = remainingSeconds > 0;

  useEffect(() => {
    if (!cooldownActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearCooldown();
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = Math.max(0, prev - 1);
        if (next <= 0) {
          clearCooldown();
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [cooldownActive]);

  const clearApiError = useCallback(() => {
    setApiErrorKey(null);
  }, []);

  return {
    view,
    submittedEmail,
    submitEmail,
    apiErrorKey,
    clearApiError,
    isPending: mutation.isPending,
    remainingSeconds,
    resend,
    isResending: mutation.isPending,
  } as const;
}
