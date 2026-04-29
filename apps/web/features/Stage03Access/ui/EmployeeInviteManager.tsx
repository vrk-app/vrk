"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowUpRight, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Badge, Button, Card, CopyableText, InputField, SelectField } from "@/shared/ui";
import {
  isRoleScopeCompatible,
  parseApiResponse,
  roleScopeOptions,
  roleTemplateLabel,
  roleTemplateLabels,
  type CreateEmployeeInvitePayload,
  type EmployeeInviteResponse,
  type RoleTemplate,
  type ScopeType,
  type SessionSummaryResponse,
} from "@/shared/api";

type Props = {
  session: SessionSummaryResponse;
};

type ScopeOption = {
  value: string;
  label: string;
};

const roleTemplates = [
  { value: "organization_admin", label: roleTemplateLabels.organization_admin },
  { value: "organization_head", label: roleTemplateLabels.organization_head },
  { value: "division_admin", label: roleTemplateLabels.division_admin },
  { value: "division_head", label: roleTemplateLabels.division_head },
  { value: "division_operator", label: roleTemplateLabels.division_operator },
  { value: "unit_admin", label: roleTemplateLabels.unit_admin },
  { value: "unit_head", label: roleTemplateLabels.unit_head },
  { value: "unit_operator", label: roleTemplateLabels.unit_operator },
  { value: "auditor", label: roleTemplateLabels.auditor },
] as const;

const scopeTypeLabels: Record<ScopeType, string> = {
  organization: "Вся организация",
  division: "Дивизион",
  unit: "Юнит",
};

const statusToneMap: Record<EmployeeInviteResponse["status"], "neutral" | "interactive" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  sent: "interactive",
  opened: "interactive",
  accepted: "success",
  expired: "warning",
  revoked: "danger",
};

const statusLabelMap: Record<EmployeeInviteResponse["status"], string> = {
  draft: "Черновик",
  sent: "Отправлено",
  opened: "Открыто",
  accepted: "Принято",
  expired: "Истекло",
  revoked: "Отозвано",
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

function toAbsoluteInviteUrl(path?: string) {
  if (!path || typeof window === "undefined") {
    return null;
  }

  try {
    return new URL(path, window.location.origin).toString();
  } catch {
    return null;
  }
}

function defaultScopeForRole(roleTemplate: RoleTemplate, scopeOptions: Record<ScopeType, ScopeOption[]>): ScopeType {
  return roleScopeOptions[roleTemplate].find((scopeType) => scopeOptions[scopeType].length > 0) ?? roleScopeOptions[roleTemplate][0];
}

export function EmployeeInviteManager({ session }: Props) {
  const [invites, setInvites] = useState<EmployeeInviteResponse[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleTemplate, setRoleTemplate] = useState<RoleTemplate>("auditor");
  const [scopeType, setScopeType] = useState<ScopeType>("organization");
  const [scopeId, setScopeId] = useState(session.organization.id);
  const [expiresAt, setExpiresAt] = useState(() => toLocalDateTimeInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const scopeOptions = useMemo<Record<ScopeType, ScopeOption[]>>(
    () => ({
      organization:
        session.workspace.scopeType === "organization"
          ? [{ value: session.organization.id, label: session.organization.name }]
          : [],
      division: session.divisions.map((item) => ({ value: item.id, label: item.name })),
      unit: session.units.map((item) => ({ value: item.id, label: item.name })),
    }),
    [session.organization.id, session.organization.name, session.divisions, session.units, session.workspace.scopeType],
  );

  useEffect(() => {
    if (!isRoleScopeCompatible(roleTemplate, scopeType)) {
      setScopeType(defaultScopeForRole(roleTemplate, scopeOptions));
      return;
    }

    const options = scopeOptions[scopeType];
    if (options.length === 0) {
      setScopeId("");
      return;
    }

    if (!options.some((item) => item.value === scopeId)) {
      setScopeId(options[0].value);
    }
  }, [roleTemplate, scopeId, scopeOptions, scopeType]);

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
        "Не удалось загрузить приглашения.",
      );
      setInvites(nextInvites);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось загрузить приглашения.");
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
        "Не удалось создать черновик приглашения.",
      );

      setFullName("");
      setEmail("");
      setRoleTemplate("auditor");
      {
        const nextScopeType = defaultScopeForRole("auditor", scopeOptions);
        setScopeType(nextScopeType);
        setScopeId(scopeOptions[nextScopeType][0]?.value ?? "");
      }
      setExpiresAt(toLocalDateTimeInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
      setInvites((current) => [createdInvite, ...current]);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Не удалось создать черновик приглашения.");
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
          <Badge tone="interactive">Сотрудники и доступ</Badge>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Пригласить сотрудника</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Укажите роль, область доступа и срок действия ссылки.
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
          <SelectField
            label="Роль доступа"
            name="roleTemplate"
            onChange={(event) => setRoleTemplate(event.target.value as RoleTemplate)}
            options={roleTemplates}
            value={roleTemplate}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Уровень доступа"
              name="scopeType"
              onChange={(event) => setScopeType(event.target.value as ScopeType)}
              options={[
                {
                  disabled: !isRoleScopeCompatible(roleTemplate, "organization"),
                  label: "Вся организация",
                  value: "organization",
                },
                {
                  disabled: !isRoleScopeCompatible(roleTemplate, "division") || !scopeOptions.division.length,
                  label: "Дивизион",
                  value: "division",
                },
                {
                  disabled: !isRoleScopeCompatible(roleTemplate, "unit") || !scopeOptions.unit.length,
                  label: "Юнит",
                  value: "unit",
                },
              ]}
              value={scopeType}
            />
            <SelectField
              disabled={!scopeOptions[scopeType].length}
              label="Объект доступа"
              name="scopeId"
              onChange={(event) => setScopeId(event.target.value)}
              options={scopeOptions[scopeType]}
              value={scopeId}
            />
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

        <div className="rounded-[var(--radius-lg)] bg-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
          <div className="flex items-start gap-2">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
            <p>Проверьте параметры доступа перед отправкой приглашения.</p>
          </div>
        </div>

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
          Создать черновик приглашения
        </Button>
      </Card>

      <Card className="gap-5" padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Badge tone="info">История приглашений</Badge>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">Статусы приглашений</h2>
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
            Загружаем приглашения…
          </div>
        ) : invites.length ? (
          <div className="grid gap-3">
            {invites.map((invite) => {
              const inviteUrl = toAbsoluteInviteUrl(invite.acceptPath);

              return (
                <div className="rounded-[var(--radius-xl)] border border-border bg-card p-4 shadow-xs" key={invite.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-sm font-semibold text-foreground">{invite.fullName}</p>
                        <Badge tone={statusToneMap[invite.status]}>{statusLabelMap[invite.status]}</Badge>
                      </div>
                      <p className="break-all text-sm text-muted-foreground">{invite.email}</p>
                      <p className="break-words text-sm text-muted-foreground">
                        {roleTemplateLabel(invite.roleTemplate)} / {scopeTypeLabels[invite.scopeType]} /{" "}
                        {invite.scopeLabel}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Действует до: {formatTimestamp(invite.expiresAt)}</div>
                      <div>Открыто: {formatTimestamp(invite.openedAt)}</div>
                      <div>Принято: {formatTimestamp(invite.acceptedAt)}</div>
                    </div>
                  </div>

                  {inviteUrl ? (
                    <CopyableText className="mt-3" data-testid="employee-invite-path" value={inviteUrl} />
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
                    {(invite.status === "sent" || invite.status === "opened") && inviteUrl ? (
                      <a
                        className="inline-flex min-h-10 touch-manipulation items-center gap-2 rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        href={inviteUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Открыть приглашение
                        <ArrowUpRight aria-hidden="true" className="size-4" />
                      </a>
                    ) : null}
                    {invite.status === "draft" || invite.status === "sent" || invite.status === "opened" ? (
                      <Button
                        onClick={() =>
                          startTransition(() => {
                            if (!window.confirm("Приглашение будет отозвано. Продолжить?")) {
                              return;
                            }

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
              );
            })}
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            После первого черновика здесь появится список приглашений сотрудников и их текущие статусы.
          </div>
        )}
      </Card>
    </div>
  );
}
