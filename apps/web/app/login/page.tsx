"use client";

import { useEffect, useState, useTransition, type FormEventHandler } from "react";
import { useRouter } from "next/navigation";
import { AuthIllustration } from "@/app/_components/AuthIllustration";
import { AuthSplitLayout, ConsentRow, LoginForm, type LoginWorkspaceHint } from "@/widgets/Auth";
import { parseApiResponse, resolveSessionLandingPath, type SessionSummaryResponse } from "@/shared/api";

const WORKSPACE_HINT_STORAGE_PREFIX = "vrk:last-workspace:";
const ACTIVE_LOGIN_MEMORY_KEY = "vrk:active-login-memory";

type StoredWorkspaceHint = LoginWorkspaceHint & {
  savedAt: string;
};

type ActiveLoginMemory = {
  emailHash: string;
  rememberSession: boolean;
};

function normalizeLoginEmail(email: string) {
  return email.trim().toLowerCase();
}

async function hashLoginEmail(email: string) {
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function workspaceHintKey(emailHash: string) {
  return `${WORKSPACE_HINT_STORAGE_PREFIX}${emailHash}`;
}

function readWorkspaceHint(emailHash: string): StoredWorkspaceHint | null {
  try {
    const value = window.localStorage.getItem(workspaceHintKey(emailHash));
    if (!value) {
      return null;
    }

    const parsed = JSON.parse(value) as Partial<StoredWorkspaceHint>;
    if (
      typeof parsed.organizationName !== "string" ||
      typeof parsed.scopeType !== "string" ||
      typeof parsed.scopeName !== "string" ||
      typeof parsed.landingPath !== "string" ||
      typeof parsed.savedAt !== "string"
    ) {
      window.localStorage.removeItem(workspaceHintKey(emailHash));
      return null;
    }

    return parsed as StoredWorkspaceHint;
  } catch {
    window.localStorage.removeItem(workspaceHintKey(emailHash));
    return null;
  }
}

async function syncWorkspaceHint(email: string, rememberSession: boolean, session: SessionSummaryResponse) {
  const normalizedEmail = normalizeLoginEmail(email);
  if (!normalizedEmail || !window.crypto.subtle) {
    return;
  }

  const emailHash = await hashLoginEmail(normalizedEmail);
  const key = workspaceHintKey(emailHash);
  const activeMemory: ActiveLoginMemory = { emailHash, rememberSession };
  window.sessionStorage.setItem(ACTIVE_LOGIN_MEMORY_KEY, JSON.stringify(activeMemory));

  if (!rememberSession) {
    window.localStorage.removeItem(key);
    return;
  }

  const hint: StoredWorkspaceHint = {
    organizationName: session.organization.name,
    scopeType: session.workspace.scopeType,
    scopeName: session.workspace.scopeName,
    landingPath: session.workspace.landingPath || resolveSessionLandingPath(session),
    savedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(key, JSON.stringify(hint));
}

function applyLogoutHintPolicy() {
  try {
    const value = window.sessionStorage.getItem(ACTIVE_LOGIN_MEMORY_KEY);
    if (!value) {
      return;
    }

    const parsed = JSON.parse(value) as Partial<ActiveLoginMemory>;
    if (typeof parsed.emailHash === "string" && parsed.rememberSession === false) {
      window.localStorage.removeItem(workspaceHintKey(parsed.emailHash));
    }
  } catch {
    // Ignore malformed local browser state; logout must still complete.
  } finally {
    window.sessionStorage.removeItem(ACTIVE_LOGIN_MEMORY_KEY);
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLogoutPending, setIsLogoutPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [workspaceHint, setWorkspaceHint] = useState<LoginWorkspaceHint | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("logout") !== "1") {
      return;
    }

    setIsLogoutPending(true);
    applyLogoutHintPolicy();

    void fetch("/api/auth/session/current", { method: "DELETE" })
      .catch(() => null)
      .finally(() => {
        window.history.replaceState(null, "", "/login");
        setIsLogoutPending(false);
      });
  }, []);

  useEffect(() => {
    const normalizedEmail = normalizeLoginEmail(loginEmail);
    if (!normalizedEmail || !window.crypto.subtle) {
      setWorkspaceHint(null);
      return;
    }

    let isStale = false;

    void hashLoginEmail(normalizedEmail)
      .then((emailHash) => {
        if (isStale) {
          return;
        }

        setWorkspaceHint(readWorkspaceHint(emailHash));
      })
      .catch(() => {
        if (!isStale) {
          setWorkspaceHint(null);
        }
      });

    return () => {
      isStale = true;
    };
  }, [loginEmail]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (isLogoutPending) {
      return;
    }

    setFormError(null);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("username") ?? "");
    const rememberSession = formData.get("remember-session") === "on";

    startTransition(() => {
      void fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: String(formData.get("password") ?? ""),
          rememberSession,
        }),
      })
        .then(async (response) => {
          const session = await parseApiResponse<SessionSummaryResponse>(response, "Не удалось выполнить вход.");
          await syncWorkspaceHint(email, rememberSession, session);
          router.push(resolveSessionLandingPath(session));
          router.refresh();
        })
        .catch((error: unknown) => {
          setFormError(error instanceof Error ? error.message : "Не удалось выполнить вход.");
        });
    });
  };

  return (
    <AuthSplitLayout
      formSlot={
        <LoginForm
          consent={
            <ConsentRow
              defaultChecked
              label="Я принимаю политику доступа VRK."
              links={[{ label: "политикой доступа", href: "/access-policy" }]}
            />
          }
          formError={formError ?? undefined}
          loading={isPending || isLogoutPending}
          onLoginChange={(event) => setLoginEmail(event.currentTarget.value)}
          onSubmit={handleSubmit}
          submitLabel="Войти"
          workspaceHint={workspaceHint}
        />
      }
      fullBleedIllustration
      illustrationSlot={<AuthIllustration />}
      showAuthBadge={false}
      subtitle="Используйте корпоративную почту и пароль, выданные для работы в VRK."
      title="Вход в VRK"
    />
  );
}
