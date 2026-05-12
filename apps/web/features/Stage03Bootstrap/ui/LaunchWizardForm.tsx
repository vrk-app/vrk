"use client";

import { useEffect, useState, useTransition, type FormEventHandler } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, MapPinned, Phone, UserRound } from "lucide-react";
import { Button, Card, InputField, SelectField } from "@/shared/ui";
import { parseApiResponse, resolveSessionLandingPath, type LaunchWizardPayload, type SessionSummaryResponse } from "@/shared/api";

type Props = {
  session: SessionSummaryResponse;
};

const legalFormOptions = [
  { label: "ООО", value: "ООО" },
  { label: "АО", value: "АО" },
  { label: "ПАО", value: "ПАО" },
] as const;

const unitTypeOptions = [
  { label: "ВРД", value: "ВРД" },
  { label: "ВРЗ", value: "ВРЗ" },
  { label: "ВУ", value: "ВУ" },
  { label: "ВРП", value: "ВРП" },
] as const;

function normalizeLegalForm(value?: string) {
  switch ((value ?? "").trim().toUpperCase()) {
    case "ОАО":
      return "ПАО";
    case "ЗАО":
      return "АО";
    case "LLC":
      return "ООО";
    case "АО":
    case "ПАО":
    case "ООО":
      return (value ?? "").trim().toUpperCase();
    default:
      return "ООО";
  }
}

export function LaunchWizardForm({ session }: Props) {
  const router = useRouter();
  const [structureMode, setStructureMode] = useState<"division" | "unit">("division");
  const [organizationName, setOrganizationName] = useState(session.organization.name);
  const [shortName, setShortName] = useState(session.organization.shortName ?? "");
  const [propertyType, setPropertyType] = useState(normalizeLegalForm(session.organization.propertyType));
  const [inn, setInn] = useState(session.organization.inn ?? "");
  const [kpp, setKpp] = useState(session.organization.kpp ?? "");
  const [legalAddress, setLegalAddress] = useState(session.organization.legalAddress ?? "");
  const [contactEmail, setContactEmail] = useState(session.organization.contactEmail ?? session.account.email);
  const [contactPhone, setContactPhone] = useState(session.organization.contactPhone ?? "");
  const [divisionName, setDivisionName] = useState("");
  const [unitType, setUnitType] = useState("ВРД");
  const [unitName, setUnitName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasUnsavedChanges =
    organizationName !== session.organization.name ||
    shortName !== (session.organization.shortName ?? "") ||
    propertyType !== normalizeLegalForm(session.organization.propertyType) ||
    inn !== (session.organization.inn ?? "") ||
    kpp !== (session.organization.kpp ?? "") ||
    legalAddress !== (session.organization.legalAddress ?? "") ||
    contactEmail !== (session.organization.contactEmail ?? session.account.email) ||
    contactPhone !== (session.organization.contactPhone ?? "") ||
    structureMode !== "division" ||
    divisionName !== "" ||
    unitType !== "ВРД" ||
    unitName !== "";

  useEffect(() => {
    if (!hasUnsavedChanges || isPending) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isPending]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const payload: LaunchWizardPayload = {
      organizationName,
      shortName: shortName || undefined,
      propertyType,
      inn,
      kpp,
      legalAddress,
      contactEmail,
      contactPhone,
      structureMode,
      unit: {
        type: unitType,
        name: unitName,
      },
      ...(structureMode === "division"
        ? {
            division: {
              name: divisionName,
            },
          }
        : {}),
    };

    try {
      const response = await fetch("/api/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const nextSession = await parseApiResponse<SessionSummaryResponse>(
        response,
        "Не удалось завершить первичный запуск.",
      );

      router.push(resolveSessionLandingPath(nextSession));
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось завершить первичный запуск.");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
      <Card className="gap-5" padding="lg">
        <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground">
          Запустить организацию и первую структуру
        </h2>

        <form
          className="grid gap-5"
          onSubmit={(event) => {
            startTransition(() => {
              setError(null);
              void handleSubmit(event);
            });
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              autoComplete="off"
              label="Полное наименование"
              leftIcon={<Building2 className="size-4" />}
              name="organizationName"
              onChange={(event) => setOrganizationName(event.target.value)}
              placeholder="Например, ООО ВРК Север…"
              required
              value={organizationName}
            />
            <InputField
              autoComplete="off"
              label="Краткое наименование"
              leftIcon={<Building2 className="size-4" />}
              name="shortName"
              onChange={(event) => setShortName(event.target.value)}
              placeholder="Например, ВРК Север…"
              value={shortName}
            />
            <SelectField
              autoComplete="off"
              label="ОПФ"
              name="propertyType"
              onValueChange={setPropertyType}
              options={legalFormOptions}
              required
              value={propertyType}
            />
            <InputField
              autoComplete="off"
              inputMode="numeric"
              label="ИНН"
              name="inn"
              onChange={(event) => setInn(event.target.value)}
              placeholder="Например, 1234567890…"
              required
              spellCheck={false}
              value={inn}
            />
            <InputField
              autoComplete="off"
              inputMode="numeric"
              label="КПП"
              name="kpp"
              onChange={(event) => setKpp(event.target.value)}
              placeholder="Например, 123456789…"
              required
              spellCheck={false}
              value={kpp}
            />
            <InputField
              autoComplete="off"
              label="Контактный email"
              name="contactEmail"
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder="Например, admin@vrk.local…"
              required
              spellCheck={false}
              type="email"
              value={contactEmail}
            />
            <InputField
              autoComplete="off"
              inputMode="tel"
              label="Контактный телефон"
              leftIcon={<Phone className="size-4" />}
              name="contactPhone"
              onChange={(event) => setContactPhone(event.target.value)}
              placeholder="Например, +7 (999) 123-45-67…"
              required
              type="tel"
              value={contactPhone}
            />
            <InputField
              autoComplete="off"
              label="Юридический адрес"
              leftIcon={<MapPinned className="size-4" />}
              name="legalAddress"
              onChange={(event) => setLegalAddress(event.target.value)}
              placeholder="Например, г. Москва, ул. Примерная, д. 1…"
              required
              value={legalAddress}
            />
          </div>

          <div className="grid gap-4 rounded-[var(--radius-xl)] border border-border bg-muted/60 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Первый уровень оргструктуры</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Выберите, начнется ли структура с дивизиона или с юнита под организацией.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: "Сначала дивизион", value: "division" as const },
                { label: "Сразу юнит под организацией", value: "unit" as const },
              ].map((option) => (
                <label
                  className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3 text-sm text-foreground"
                  key={option.value}
                >
                  <input
                    checked={structureMode === option.value}
                    className="mt-1"
                    name="structureMode"
                    onChange={() => setStructureMode(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            {structureMode === "division" ? (
              <div className="grid gap-4">
                <InputField
                  autoComplete="off"
                  label="Название дивизиона"
                  name="divisionName"
                  onChange={(event) => setDivisionName(event.target.value)}
                  placeholder="Например, Северный дивизион…"
                  required
                  value={divisionName}
                />
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                autoComplete="off"
                label="Тип юнита"
                name="unitType"
                onValueChange={setUnitType}
                options={unitTypeOptions}
                required
                value={unitType}
              />
              <InputField
                autoComplete="off"
                label="Название юнита"
                leftIcon={<UserRound className="size-4" />}
                name="unitName"
                onChange={(event) => setUnitName(event.target.value)}
                placeholder="Например, Юнит 01…"
                required
                value={unitName}
              />
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

          <Button fullWidth loading={isPending} rightIcon={<ArrowRight className="size-4" />} type="submit">
            Завершить первичный запуск
          </Button>
        </form>
      </Card>

      <Card className="gap-4" padding="lg">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">После запуска</p>
        <div className="grid gap-3">
          <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Доступ администратора</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {session.account.fullName} сможет управлять организацией.
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Рабочая структура</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Сохраняются реквизиты организации и первый{" "}
              {structureMode === "division" ? "дивизион с юнитом" : "юнит"}.
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Следующий шаг</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              После запуска можно перейти к рабочим разделам VRK.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
