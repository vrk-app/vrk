"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowUpRight, Building2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button, Card, CopyableText, InputField, SelectField, buttonVariants } from "@/shared/ui";
import { parseApiResponse, type OrganizationShellResponse } from "@/shared/api";

const roleOptions = [
  { label: "Заказчик", value: "customer" },
  { label: "Подрядчик", value: "contractor" },
] as const;

export function PlatformAdminInviteForm() {
  const [organizationName, setOrganizationName] = useState("");
  const [firstAdminName, setFirstAdminName] = useState("");
  const [firstAdminEmail, setFirstAdminEmail] = useState("");
  const [organizationRole, setOrganizationRole] = useState<(typeof roleOptions)[number]["value"]>("customer");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<OrganizationShellResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  const invitePath = success ? `/register/${success.inviteToken}` : null;
  const inviteUrl =
    invitePath && typeof window !== "undefined" ? new URL(invitePath, window.location.origin).toString() : null;

  const handleSubmit = async (form: HTMLFormElement) => {
    setError(null);
    setSuccess(null);
    const formData = new FormData(form);

    const payload = {
      organizationName: String(formData.get("organizationName") ?? ""),
      organizationRole: String(formData.get("organizationRole") ?? "customer"),
      firstAdminName: String(formData.get("firstAdminName") ?? ""),
      firstAdminEmail: String(formData.get("firstAdminEmail") ?? ""),
    };

    try {
      const response = await fetch("/api/platform/organization-shells", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const shell = await parseApiResponse<OrganizationShellResponse>(response, "Не удалось выдать приглашение.");

      setSuccess(shell);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось выдать приглашение.");
    }
  };

  return (
    <Card className="gap-5" padding="lg">
      <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground">Выдать приглашение</h2>

      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          startTransition(() => {
            void handleSubmit(form);
          });
        }}
      >
        <div className="grid gap-4">
          <InputField
            autoComplete="off"
            label="Название организации"
            leftIcon={<Building2 className="size-4" />}
            name="organizationName"
            onChange={(event) => setOrganizationName(event.target.value)}
            placeholder="Например, ООО ВРК Север…"
            required
            value={organizationName}
          />
          <SelectField
            label="Роль организации"
            name="organizationRole"
            onChange={(event) => setOrganizationRole(event.target.value as (typeof roleOptions)[number]["value"])}
            options={roleOptions}
            required
            value={organizationRole}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              autoComplete="off"
              label="Первый администратор"
              leftIcon={<UserRound className="size-4" />}
              name="firstAdminName"
              onChange={(event) => setFirstAdminName(event.target.value)}
              placeholder="Например, Анна Волкова…"
              required
              value={firstAdminName}
            />
            <InputField
              autoComplete="off"
              label="Email приглашения"
              leftIcon={<Mail className="size-4" />}
              name="firstAdminEmail"
              onChange={(event) => setFirstAdminEmail(event.target.value)}
              placeholder="Например, admin@vrk.local…"
              required
              spellCheck={false}
              type="email"
              value={firstAdminEmail}
            />
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] bg-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
          <div className="flex items-start gap-2">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
            <p>Ссылка действует один раз. После активации администратор задаст пароль и продолжит настройку.</p>
          </div>
        </div>

        {error ? (
          <div
            aria-live="polite"
            className="rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        {success && inviteUrl ? (
          <div
            aria-atomic="true"
            aria-live="polite"
            className="grid gap-3 rounded-[var(--radius-xl)] border border-border bg-muted/60 p-4"
          >
            <p className="text-sm font-semibold text-foreground">Приглашение выпущено</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Передайте ссылку первому администратору, чтобы он задал пароль и вошел в систему.
            </p>
            <CopyableText data-testid="first-admin-invite-path" value={inviteUrl} />
            <div className="flex flex-wrap gap-3">
              <Link
                className={buttonVariants({
                  variant: "primary",
                  className: "text-primary-foreground hover:text-primary-foreground",
                })}
                href={inviteUrl}
              >
                <span>Открыть ссылку</span>
                <span aria-hidden="true">
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>
            </div>
          </div>
        ) : null}

        {!success ? (
          <Button fullWidth loading={isPending} type="submit">
            Выдать приглашение
          </Button>
        ) : null}
      </form>
    </Card>
  );
}
