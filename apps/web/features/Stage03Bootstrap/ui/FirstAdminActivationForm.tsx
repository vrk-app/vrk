"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button, Card, InputField } from "@/shared/ui";
import {
  parseApiResponse,
  resolveSessionLandingPath,
  roleTemplateLabel,
  type PublicInviteInspectionResponse,
  type SessionSummaryResponse,
} from "@/shared/api";

type Props = {
  invite: PublicInviteInspectionResponse;
  inviteToken: string;
};

function validatePasswordPolicy(value: string) {
  if (value.length < 8) {
    return "Пароль должен быть не короче 8 символов.";
  }
  return null;
}

export function FirstAdminActivationForm({ invite, inviteToken }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async () => {
    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== passwordConfirm) {
      setError("Пароли не совпадают.");
      return;
    }

    try {
      const response = await fetch(`/api/auth/invites/${inviteToken}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const session = await parseApiResponse<SessionSummaryResponse>(response, "Не удалось активировать приглашение.");

      router.push(resolveSessionLandingPath(session));
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось активировать приглашение.");
    }
  };

  return (
    <Card className="gap-5" padding="lg">
      <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground">
        {invite.inviteKind === "first_admin" ? "Задать пароль администратора" : "Задать пароль сотрудника"}
      </h2>

      <div className="grid gap-3 rounded-[var(--radius-xl)] border border-border bg-muted/60 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <UserRound aria-hidden="true" className="size-4 text-accent" />
          {invite.inviteeName}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail aria-hidden="true" className="size-4" />
          {invite.inviteEmail}
        </div>
        <div className="text-sm text-muted-foreground">
          Организация: <span className="font-medium text-foreground">{invite.organizationName}</span>
        </div>
        {invite.roleTemplate ? (
          <div className="text-sm text-muted-foreground">
            Доступ:{" "}
            <span className="font-medium text-foreground">
              {roleTemplateLabel(invite.roleTemplate)}
              {invite.scopeLabel ? ` / ${invite.scopeLabel}` : ""}
            </span>
          </div>
        ) : null}
      </div>

      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(() => {
            setError(null);
            void handleSubmit();
          });
        }}
      >
        <div className="grid gap-4">
          <InputField
            autoComplete="new-password"
            label="Пароль"
            leftIcon={<LockKeyhole className="size-4" />}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            hint="Минимум 8 символов."
            placeholder="Например, password…"
            type="password"
            value={password}
          />
          <InputField
            autoComplete="new-password"
            label="Повторите пароль"
            leftIcon={<LockKeyhole className="size-4" />}
            name="passwordConfirm"
            onChange={(event) => setPasswordConfirm(event.target.value)}
            placeholder="Повторите пароль…"
            type="password"
            value={passwordConfirm}
          />
        </div>

        {error ? (
          <div
            aria-live="polite"
            className="rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        <Button fullWidth loading={isPending} rightIcon={<ArrowRight className="size-4" />} type="submit">
          {invite.inviteKind === "first_admin" ? "Перейти к компании" : "Подключиться"}
        </Button>
      </form>
    </Card>
  );
}
