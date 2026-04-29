"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Mail, RefreshCw, Save, ShieldCheck, UserX } from "lucide-react";
import { Badge, Button, Card, InlineAlert, SelectField } from "@/shared/ui";
import {
  isRoleScopeCompatible,
  parseApiResponse,
  roleScopeOptions,
  roleTemplateLabel,
  roleTemplateLabels,
  type EmployeeAccessResponse,
  type RoleTemplate,
  type ScopeType,
  type SessionSummaryResponse,
  type UpdateEmployeeAccessPayload,
} from "@/shared/api";
import { EmployeeInviteManager } from "./EmployeeInviteManager";

type Props = {
  session: SessionSummaryResponse;
};

type ScopeOption = {
  value: string;
  label: string;
};

type EditForm = {
  roleTemplate: RoleTemplate;
  scopeType: ScopeType;
  scopeId: string;
};

const roleTemplates = [
  { value: "organization_admin", label: roleTemplateLabels.organization_admin },
  { value: "organization_head", label: roleTemplateLabels.organization_head },
  { value: "division_head", label: roleTemplateLabels.division_head },
  { value: "division_operator", label: roleTemplateLabels.division_operator },
  { value: "unit_head", label: roleTemplateLabels.unit_head },
  { value: "unit_operator", label: roleTemplateLabels.unit_operator },
  { value: "auditor", label: roleTemplateLabels.auditor },
] as const;

const scopeTypeLabels: Record<ScopeType, string> = {
  organization: "Вся организация",
  division: "Подразделение",
  unit: "Юнит",
};

function defaultScopeForRole(roleTemplate: RoleTemplate, scopeOptions: Record<ScopeType, ScopeOption[]>): ScopeType {
  return roleScopeOptions[roleTemplate].find((scopeType) => scopeOptions[scopeType].length > 0) ?? roleScopeOptions[roleTemplate][0];
}

function makeEditForm(employee: EmployeeAccessResponse): EditForm {
  return {
    roleTemplate: employee.roleTemplate as RoleTemplate,
    scopeType: employee.scopeType,
    scopeId: employee.scopeId,
  };
}

export function EmployeeAccessWorkspace({ session }: Props) {
  const [employees, setEmployees] = useState<EmployeeAccessResponse[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAccessId, setEditingAccessId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [isPending, startTransition] = useTransition();

  const canManage = session.workspace.canManageEmployees;
  const currentAccessId = session.grant?.id;
  const scopeOptions = useMemo<Record<ScopeType, ScopeOption[]>>(
    () => ({
      organization: [{ value: session.organization.id, label: session.organization.name }],
      division: session.divisions.map((item) => ({ value: item.id, label: item.name })),
      unit: session.units.map((item) => ({ value: item.id, label: item.name })),
    }),
    [session.organization.id, session.organization.name, session.divisions, session.units],
  );

  useEffect(() => {
    void loadEmployees();
  }, []);

  useEffect(() => {
    setEditForm((current) => {
      if (!current) {
        return current;
      }

      if (!isRoleScopeCompatible(current.roleTemplate, current.scopeType)) {
        const nextScopeType = defaultScopeForRole(current.roleTemplate, scopeOptions);
        const nextScopeId = scopeOptions[nextScopeType][0]?.value ?? "";
        if (current.scopeType === nextScopeType && current.scopeId === nextScopeId) {
          return current;
        }
        return { ...current, scopeType: nextScopeType, scopeId: nextScopeId };
      }

      const options = scopeOptions[current.scopeType];
      if (!options.some((item) => item.value === current.scopeId)) {
        const nextScopeId = options[0]?.value ?? "";
        if (current.scopeId === nextScopeId) {
          return current;
        }
        return { ...current, scopeId: nextScopeId };
      }

      return current;
    });
  }, [editForm?.roleTemplate, editForm?.scopeId, editForm?.scopeType, scopeOptions]);

  async function loadEmployees() {
    setLoadingList(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/employees", { cache: "no-store" });
      const nextEmployees = await parseApiResponse<EmployeeAccessResponse[]>(response, "Не удалось загрузить сотрудников.");
      setEmployees(nextEmployees);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось загрузить сотрудников.");
    } finally {
      setLoadingList(false);
    }
  }

  async function submitAccessUpdate() {
    if (!editingAccessId || !editForm) {
      return;
    }

    setError(null);
    const payload: UpdateEmployeeAccessPayload = {
      roleTemplate: editForm.roleTemplate,
      scopeType: editForm.scopeType,
      scopeId: editForm.scopeId,
    };

    try {
      const response = await fetch(`/api/auth/employees/${editingAccessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updatedEmployee = await parseApiResponse<EmployeeAccessResponse>(response, "Не удалось сохранить доступ сотрудника.");
      setEmployees((current) =>
        current.map((employee) => (employee.accessId === updatedEmployee.accessId ? updatedEmployee : employee)),
      );
      setEditingAccessId(null);
      setEditForm(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось сохранить доступ сотрудника.");
    }
  }

  async function deactivateEmployee(employee: EmployeeAccessResponse) {
    if (!window.confirm("Доступ сотрудника будет отключен, активные сессии завершатся. Продолжить?")) {
      return;
    }

    setError(null);
    try {
      const response = await fetch(`/api/auth/employees/${employee.accessId}/deactivate`, { method: "POST" });
      await parseApiResponse<EmployeeAccessResponse>(response, "Не удалось отключить сотрудника.");
      setEmployees((current) => current.filter((item) => item.membershipId !== employee.membershipId));
      if (editingAccessId === employee.accessId) {
        setEditingAccessId(null);
        setEditForm(null);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось отключить сотрудника.");
    }
  }

  return (
    <div className="grid gap-4">
      <Card className="gap-5" padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge tone="interactive">Сотрудники</Badge>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">Сотрудники и доступ</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Активные сотрудники показаны в пределах текущей области доступа.
              </p>
            </div>
          </div>
          <Button leftIcon={<RefreshCw className="size-4" />} onClick={() => void loadEmployees()} variant="secondary">
            Обновить
          </Button>
        </div>

        {!canManage ? (
          <InlineAlert
            description="Изменение ролей, областей доступа и отключение сотрудников доступны только администратору организации."
            title="Режим просмотра"
            tone="info"
          />
        ) : null}

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
            Загружаем сотрудников…
          </div>
        ) : employees.length ? (
          <div className="grid gap-3">
            {employees.map((employee) => {
              const isEditing = editingAccessId === employee.accessId && editForm;
              const isCurrentAccess = employee.accessId === currentAccessId;
              const canSubmitEdit =
                Boolean(editForm?.scopeId) &&
                Boolean(editForm && scopeOptions[editForm.scopeType].some((item) => item.value === editForm.scopeId));

              return (
                <div className="rounded-[var(--radius-xl)] border border-border bg-card p-4 shadow-xs" key={employee.accessId}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-sm font-semibold text-foreground">{employee.fullName}</p>
                        {isCurrentAccess ? <Badge tone="info">Текущая сессия</Badge> : null}
                      </div>
                      <div className="grid gap-1 text-sm text-muted-foreground">
                        <span className="flex min-w-0 items-center gap-2">
                          <Mail aria-hidden="true" className="size-4 shrink-0" />
                          <span className="break-all">{employee.email}</span>
                        </span>
                        <span className="flex min-w-0 items-center gap-2">
                          <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
                          <span className="break-words">
                            {roleTemplateLabel(employee.roleTemplate)} / {scopeTypeLabels[employee.scopeType]} /{" "}
                            {employee.scopeLabel}
                          </span>
                        </span>
                      </div>
                    </div>

                    {canManage ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          disabled={isCurrentAccess}
                          onClick={() => {
                            setEditingAccessId(employee.accessId);
                            setEditForm(makeEditForm(employee));
                          }}
                          size="sm"
                          variant="secondary"
                        >
                          Редактировать
                        </Button>
                        <Button
                          disabled={isCurrentAccess}
                          leftIcon={<UserX className="size-4" />}
                          onClick={() =>
                            startTransition(() => {
                              void deactivateEmployee(employee);
                            })
                          }
                          size="sm"
                          variant="danger"
                        >
                          Отключить
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <div className="mt-4 grid gap-4 rounded-[var(--radius-lg)] border border-border bg-muted/40 p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <SelectField
                        label="Роль доступа"
                        name={`employee-role-${employee.accessId}`}
                        onChange={(event) =>
                          setEditForm((current) =>
                            current ? { ...current, roleTemplate: event.target.value as RoleTemplate } : current,
                          )
                        }
                        options={roleTemplates}
                        value={editForm.roleTemplate}
                      />
                      <SelectField
                        label="Уровень доступа"
                        name={`employee-scope-type-${employee.accessId}`}
                        onChange={(event) =>
                          setEditForm((current) =>
                            current ? { ...current, scopeType: event.target.value as ScopeType } : current,
                          )
                        }
                        options={[
                          {
                            disabled: !isRoleScopeCompatible(editForm.roleTemplate, "organization"),
                            label: "Вся организация",
                            value: "organization",
                          },
                          {
                            disabled:
                              !isRoleScopeCompatible(editForm.roleTemplate, "division") || !scopeOptions.division.length,
                            label: "Подразделение",
                            value: "division",
                          },
                          {
                            disabled: !isRoleScopeCompatible(editForm.roleTemplate, "unit") || !scopeOptions.unit.length,
                            label: "Юнит",
                            value: "unit",
                          },
                        ]}
                        value={editForm.scopeType}
                      />
                      <SelectField
                        disabled={!scopeOptions[editForm.scopeType].length}
                        label="Объект доступа"
                        name={`employee-scope-id-${employee.accessId}`}
                        onChange={(event) =>
                          setEditForm((current) => (current ? { ...current, scopeId: event.target.value } : current))
                        }
                        options={scopeOptions[editForm.scopeType]}
                        value={editForm.scopeId}
                      />
                      <div className="flex items-end gap-2">
                        <Button
                          disabled={!canSubmitEdit}
                          leftIcon={<Save className="size-4" />}
                          loading={isPending}
                          onClick={() =>
                            startTransition(() => {
                              void submitAccessUpdate();
                            })
                          }
                        >
                          Сохранить
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingAccessId(null);
                            setEditForm(null);
                          }}
                          variant="ghost"
                        >
                          Отменить
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            В текущей области пока нет активных сотрудников.
          </div>
        )}
      </Card>

      {session.workspace.canManageEmployeeInvites ? <EmployeeInviteManager session={session} /> : null}
    </div>
  );
}
