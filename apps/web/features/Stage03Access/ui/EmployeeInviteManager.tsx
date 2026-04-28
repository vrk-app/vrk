"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowUpRight, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Badge, Button, Card, InputField } from "@/shared/ui";
import { parseApiResponse, type CreateEmployeeInvitePayload, type EmployeeInviteResponse, type SessionSummaryResponse } from "@/shared/api";

type Props = {
  session: SessionSummaryResponse;
};

type ScopeOption = {
  value: string;
  label: string;
};

const roleTemplates = [
  { value: "organization_admin", label: "Администратор организации" },
  { value: "subdivision_manager", label: "Руководитель подразделения" },
  { value: "unit_operator", label: "Администратор юнита" },
  { value: "observer", label: "Наблюдатель" },
] as const;

const statusToneMap: Record<EmployeeInviteResponse["status"], "neutral" | "interactive" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  sent: "interactive",
  opened: "interactive",
  accepted: "success",
  expired: "warning",
  revoked: "danger",
};

const statusLabelMap: Record<EmployeeInviteResponse["status"], string> = {
  draft: "draft",
  sent: "sent",
  opened: "opened",
  accepted: "accepted",
  expired: "expired",
  revoked: "revoked",
};

function toLocalDateTimeInput(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function formatTimestamp(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function roleTemplateLabel(value: string) {
  return roleTemplates.find((item) => item.value === value)?.label ?? value;
}

export function EmployeeInviteManager({ session }: Props) {
  const [invites, setInvites] = useState<EmployeeInviteResponse[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleTemplate, setRoleTemplate] = useState<(typeof roleTemplates)[number]["value"]>("unit_operator");
  const [scopeType, setScopeType] = useState<"organization" | "subdivision" | "unit">("unit");
  const [scopeId, setScopeId] = useState(session.units[0]?.id ?? session.organization.id);
  const [expiresAt, setExpiresAt] = useState(() => toLocalDateTimeInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const scopeOptions = useMemo<Record<typeof scopeType, ScopeOption[]>>(
    () => ({
      organization: [{ value: session.organization.id, label: session.organization.name }],
      subdivision: session.subdivisions.map((item) => ({ value: item.id, label: item.name })),
      unit: session.units.map((item) => ({ value: item.id, label: item.name })),
    }),
    [session.organization.id, session.organization.name, session.subdivisions, session.units],
  );

  useEffect(() => {
    const options = scopeOptions[scopeType];
    if (options.length === 0) {
      setScopeId("");
      return;
    }

    if (!options.some((item) => item.value === scopeId)) {
      setScopeId(options[0].value);
    }
  }, [scopeId, scopeOptions, scopeType]);

  useEffect(() => {
    void loadInvites();
  }, []);

  async function loadInvites() {
    setLoadingList(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/employee-invites", { cache: "no-store" });
      const nextInvites = await parseApiResponse<EmployeeInviteResponse[]>(
        response,
        "Не удалось загрузить lifecycle приглашений.",
      );
      setInvites(nextInvites);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось загрузить lifecycle приглашений.");
    } finally {
      setLoadingList(false);
    }
  }

  async function handleCreateDraft() {
    setFormError(null);
    setError(null);

    const expiresAtDate = new Date(expiresAt);
    if (Number.isNaN(expiresAtDate.getTime())) {
      setFormError("Укажите корректный срок действия ссылки.");
      return;
    }

    const payload: CreateEmployeeInvitePayload = {
      fullName,
      email,
      roleTemplate,
      scopeType,
      scopeId,
      expiresAt: expiresAtDate.toISOString(),
    };

    try {
      const response = await fetch("/api/auth/employee-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const createdInvite = await parseApiResponse<EmployeeInviteResponse>(
        response,
        "Не удалось создать draft приглашения.",
      );

      setFullName("");
      setEmail("");
      setRoleTemplate("unit_operator");
      setScopeType("unit");
      setScopeId(session.units[0]?.id ?? session.organization.id);
      setExpiresAt(toLocalDateTimeInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
      setInvites((current) => [createdInvite, ...current]);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Не удалось создать draft приглашения.");
    }
  }

  async function mutateInvite(path: string, fallbackMessage: string) {
    setError(null);

    try {
      const response = await fetch(path, { method: "POST" });
      const updatedInvite = await parseApiResponse<EmployeeInviteResponse>(response, fallbackMessage);

      setInvites((current) => current.map((invite) => (invite.id === updatedInvite.id ? updatedInvite : invite)));
      return updatedInvite;
    } catch (error) {
      setError(error instanceof Error ? error.message : fallbackMessage);
      return null;
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
      <Card className="gap-5" padding="lg">
        <div className="space-y-2">
          <Badge tone="interactive">People & access</Badge>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Пригласить сотрудника</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              После завершения bootstrap администратор организации выпускает employee invite с role template, scope и
              сроком действия ссылки.
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] bg-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
            <p>
              Этот экран покрывает только people/membership/access slice. Contract routing, request flow и contractor
              execution сюда не расширяются.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <InputField
            autoComplete="off"
            label="Имя сотрудника"
            leftIcon={<UserRound className="size-4" />}
            name="employeeName"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Например, Мария Кузнецова…"
            value={fullName}
          />
          <InputField
            autoComplete="off"
            label="Email приглашения"
            leftIcon={<Mail className="size-4" />}
            name="employeeEmail"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Например, m.kuznetsova@vrk.local…"
            spellCheck={false}
            type="email"
            value={email}
          />
          <label className="grid gap-2.5">
            <span className="text-sm font-medium text-foreground">Role template</span>
            <select
              className="h-10 rounded-[var(--radius-md)] border border-input bg-card px-3.5 text-sm text-foreground shadow-xs outline-none transition-colors hover:border-border-strong focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/15"
              name="roleTemplate"
              onChange={(event) => setRoleTemplate(event.target.value as (typeof roleTemplates)[number]["value"])}
              value={roleTemplate}
            >
              {roleTemplates.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2.5">
              <span className="text-sm font-medium text-foreground">Scope type</span>
              <select
                className="h-10 rounded-[var(--radius-md)] border border-input bg-card px-3.5 text-sm text-foreground shadow-xs outline-none transition-colors hover:border-border-strong focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/15"
                name="scopeType"
                onChange={(event) => setScopeType(event.target.value as "organization" | "subdivision" | "unit")}
                value={scopeType}
              >
                <option value="organization">organization</option>
                <option value="subdivision" disabled={!scopeOptions.subdivision.length}>
                  subdivision
                </option>
                <option value="unit" disabled={!scopeOptions.unit.length}>
                  unit
                </option>
              </select>
            </label>
            <label className="grid gap-2.5">
              <span className="text-sm font-medium text-foreground">Scope target</span>
              <select
                className="h-10 rounded-[var(--radius-md)] border border-input bg-card px-3.5 text-sm text-foreground shadow-xs outline-none transition-colors hover:border-border-strong focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:text-muted-foreground"
                disabled={!scopeOptions[scopeType].length}
                name="scopeId"
                onChange={(event) => setScopeId(event.target.value)}
                value={scopeId}
              >
                {scopeOptions[scopeType].map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-2.5">
            <span className="text-sm font-medium text-foreground">Срок действия ссылки до</span>
            <input
              className="h-10 rounded-[var(--radius-md)] border border-input bg-card px-3.5 text-sm text-foreground shadow-xs outline-none transition-colors hover:border-border-strong focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/15"
              autoComplete="off"
              name="expiresAt"
              onChange={(event) => setExpiresAt(event.target.value)}
              type="datetime-local"
              value={expiresAt}
            />
          </label>
        </div>

        {formError ? (
          <div
            aria-live="polite"
            className="rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
          >
            {formError}
          </div>
        ) : null}

        <Button
          fullWidth
          loading={isPending}
          onClick={() =>
            startTransition(() => {
              void handleCreateDraft();
            })
          }
          type="button"
        >
          Создать draft приглашения
        </Button>
      </Card>

      <Card className="gap-5" padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Badge tone="info">Lifecycle</Badge>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">Статусы приглашений</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Администратор видит полный lifecycle: `draft`, `sent`, `opened`, `accepted`, `expired`, `revoked`.
              </p>
            </div>
          </div>
          <Button onClick={() => void loadInvites()} type="button" variant="secondary">
            Обновить
          </Button>
        </div>

        {error ? (
          <div
            aria-live="polite"
            className="rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        {loadingList ? (
          <div
            aria-live="polite"
            className="rounded-[var(--radius-lg)] border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground"
          >
            Загружаю lifecycle приглашений…
          </div>
        ) : invites.length ? (
          <div className="grid gap-3">
            {invites.map((invite) => (
              <div className="rounded-[var(--radius-xl)] border border-border bg-card p-4 shadow-xs" key={invite.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{invite.fullName}</p>
                      <Badge tone={statusToneMap[invite.status]}>{statusLabelMap[invite.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{invite.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {roleTemplateLabel(invite.roleTemplate)} / {invite.scopeType} / {invite.scopeLabel}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>expires: {formatTimestamp(invite.expiresAt)}</div>
                    <div>opened: {formatTimestamp(invite.openedAt)}</div>
                    <div>accepted: {formatTimestamp(invite.acceptedAt)}</div>
                  </div>
                </div>

                {invite.acceptPath ? (
                  <div
                    className="mt-3 rounded-[var(--radius-lg)] border border-border bg-muted/50 px-4 py-3 font-mono text-sm text-foreground"
                    data-testid="employee-invite-path"
                  >
                    {invite.acceptPath}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-3">
                  {invite.status === "draft" ? (
                    <Button
                      onClick={() =>
                        startTransition(() => {
                          void mutateInvite(
                            `/api/auth/employee-invites/${invite.id}/send`,
                            "Не удалось отправить приглашение.",
                          );
                        })
                      }
                      type="button"
                    >
                      Отправить
                    </Button>
                  ) : null}
                  {(invite.status === "sent" || invite.status === "opened") && invite.acceptPath ? (
                    <a
                      className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      href={invite.acceptPath}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Открыть invite
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                    </a>
                  ) : null}
                  {(invite.status === "draft" || invite.status === "sent" || invite.status === "opened") ? (
                    <Button
                      onClick={() =>
                        startTransition(() => {
                          void mutateInvite(
                            `/api/auth/employee-invites/${invite.id}/revoke`,
                            "Не удалось отозвать приглашение.",
                          );
                        })
                      }
                      type="button"
                      variant="ghost"
                    >
                      Отозвать
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            После первого draft здесь появится lifecycle employee invites и их текущие статусы.
          </div>
        )}
      </Card>
    </div>
  );
}
