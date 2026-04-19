"use client";

import { useEffect, useState, useTransition, type FormEventHandler } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Factory, MapPinned, Phone, UserRound } from "lucide-react";
import { Button, Card, InputField } from "@/shared/ui";
import { resolveSessionLandingPath, type ApiEnvelope, type LaunchWizardPayload, type SessionSummaryResponse } from "@/shared/api";

type Props = {
  session: SessionSummaryResponse;
};

export function LaunchWizardForm({ session }: Props) {
  const router = useRouter();
  const [structureMode, setStructureMode] = useState<"subdivision" | "unit">("subdivision");
  const [organizationName, setOrganizationName] = useState(session.organization.name);
  const [shortName, setShortName] = useState(session.organization.shortName ?? "");
  const [propertyType, setPropertyType] = useState(session.organization.propertyType ?? "ООО");
  const [inn, setInn] = useState(session.organization.inn ?? "");
  const [kpp, setKpp] = useState(session.organization.kpp ?? "");
  const [legalAddress, setLegalAddress] = useState(session.organization.legalAddress ?? "");
  const [contactEmail, setContactEmail] = useState(session.organization.contactEmail ?? session.account.email);
  const [contactPhone, setContactPhone] = useState(session.organization.contactPhone ?? "");
  const [subdivisionType, setSubdivisionType] = useState("Филиал");
  const [subdivisionName, setSubdivisionName] = useState("");
  const [unitType, setUnitType] = useState("Производственный юнит");
  const [unitName, setUnitName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasUnsavedChanges =
    organizationName !== session.organization.name ||
    shortName !== (session.organization.shortName ?? "") ||
    propertyType !== (session.organization.propertyType ?? "ООО") ||
    inn !== (session.organization.inn ?? "") ||
    kpp !== (session.organization.kpp ?? "") ||
    legalAddress !== (session.organization.legalAddress ?? "") ||
    contactEmail !== (session.organization.contactEmail ?? session.account.email) ||
    contactPhone !== (session.organization.contactPhone ?? "") ||
    structureMode !== "subdivision" ||
    subdivisionType !== "Филиал" ||
    subdivisionName !== "" ||
    unitType !== "Производственный юнит" ||
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
      ...(structureMode === "subdivision"
        ? {
            subdivision: {
              type: subdivisionType,
              name: subdivisionName,
            },
          }
        : {}),
    };

    const response = await fetch("/api/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as ApiEnvelope<SessionSummaryResponse>;
    if (!response.ok || !body.success || !body.data) {
      setError(body.error ?? "Не удалось завершить первичный запуск.");
      return;
    }

    router.push(resolveSessionLandingPath(body.data));
    router.refresh();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
      <Card className="gap-5" padding="lg">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Launch wizard
          </p>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Запустить организацию и первую структуру</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Сохраните базовые реквизиты организации и создайте первую рабочую структуру. После этого runtime shell
              перестанет быть пустой заготовкой и покажет уже сохраненный контур.
            </p>
          </div>
        </div>

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
            <InputField
              autoComplete="off"
              label="ОПФ"
              leftIcon={<Factory className="size-4" />}
              name="propertyType"
              onChange={(event) => setPropertyType(event.target.value)}
              placeholder="Например, ООО…"
              value={propertyType}
            />
            <InputField
              autoComplete="off"
              inputMode="numeric"
              label="ИНН"
              name="inn"
              onChange={(event) => setInn(event.target.value)}
              placeholder="Например, 1234567890…"
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
              spellCheck={false}
              value={kpp}
            />
            <InputField
              autoComplete="off"
              label="Контактный email"
              name="contactEmail"
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder="Например, admin@vrk.local…"
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
              value={legalAddress}
            />
          </div>

          <div className="grid gap-4 rounded-[var(--radius-xl)] border border-border bg-muted/60 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Первый уровень оргструктуры</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Сразу выберите, начнется ли структура с подразделения или первый юнит будет жить напрямую под
                организацией.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: "Сначала подразделение", value: "subdivision" as const },
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

            {structureMode === "subdivision" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  autoComplete="off"
                  label="Тип подразделения"
                  name="subdivisionType"
                  onChange={(event) => setSubdivisionType(event.target.value)}
                  placeholder="Например, Филиал…"
                  value={subdivisionType}
                />
                <InputField
                  autoComplete="off"
                  label="Название подразделения"
                  name="subdivisionName"
                  onChange={(event) => setSubdivisionName(event.target.value)}
                  placeholder="Например, Северный филиал…"
                  value={subdivisionName}
                />
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                autoComplete="off"
                label="Тип юнита"
                name="unitType"
                onChange={(event) => setUnitType(event.target.value)}
                placeholder="Например, Производственный юнит…"
                value={unitType}
              />
              <InputField
                autoComplete="off"
                label="Название юнита"
                leftIcon={<UserRound className="size-4" />}
                name="unitName"
                onChange={(event) => setUnitName(event.target.value)}
                placeholder="Например, Юнит 01…"
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
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">Что создается</p>
        <div className="grid gap-3">
          <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Membership</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Для {session.account.fullName} уже создан membership в организации и organization-level grant.
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Org graph</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Wizard запишет ядро организации и добавит первый {structureMode === "subdivision" ? "подразделение + юнит" : "юнит"}.
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Guardrails</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Контуры заявок, contractor execution и offline behavior в этот slice не включаются.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
