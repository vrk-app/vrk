import type { Meta, StoryObj } from "@storybook/react";
import { Building2, Plus } from "lucide-react";
import { Button, InputField, IslandCard, SelectField, TextareaField } from "@/shared/ui";

function StructureFormPreview({ namePrefix = "island" }: { namePrefix?: string }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          autoComplete="organization"
          defaultValue="Дивизион Север"
          label="Наименование"
          name={`${namePrefix}Name`}
        />
        <InputField
          autoComplete="address-level1"
          defaultValue="Санкт-Петербург"
          label="Регион"
          name={`${namePrefix}Region`}
        />
        <InputField
          autoComplete="name"
          defaultValue="Анна Морозова"
          label="Руководитель"
          name={`${namePrefix}Leader`}
        />
        <InputField
          autoComplete="email"
          defaultValue="north.branch@vrk.local"
          label="Email"
          name={`${namePrefix}Email`}
          spellCheck={false}
          type="email"
        />
      </div>
      <TextareaField
        autoComplete="street-address"
        defaultValue="Площадка обслуживает заявки северного кластера."
        label="Комментарий"
        name={`${namePrefix}Comment`}
      />
      <Button leftIcon={<Plus className="size-4" />} type="button">
        Создать дивизион
      </Button>
    </>
  );
}

const meta = {
  title: "Primitives/IslandCard",
  component: IslandCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: <StructureFormPreview />,
    title: "Новый дивизион",
  },
} satisfies Meta<typeof IslandCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Form: Story = {
  render: () => (
    <div className="w-[460px] max-w-[calc(100vw-2rem)]">
      <IslandCard headingLevel={2} icon={<Building2 aria-hidden="true" className="size-4" />} title="Новый дивизион">
        <StructureFormPreview />
      </IslandCard>
    </div>
  ),
};

export const FormWithAction: Story = {
  render: () => (
    <div className="w-[460px] max-w-[calc(100vw-2rem)]">
      <IslandCard
        action={
          <button aria-label="Создать дивизион" type="button">
            <Plus aria-hidden="true" className="size-4" />
          </button>
        }
        headingLevel={2}
        icon={<Building2 aria-hidden="true" className="size-4" />}
        title="Новый дивизион"
      >
        <StructureFormPreview namePrefix="action" />
      </IslandCard>
    </div>
  ),
};

export const WithMetric: Story = {
  render: () => (
    <div className="w-[460px] max-w-[calc(100vw-2rem)]">
      <IslandCard icon={<Building2 aria-hidden="true" className="size-4" />} metric="2" title="Активные дивизионы">
        <div className="grid gap-3">
          {["Северный дивизион", "Уральский дивизион"].map((name) => (
            <div
              className="rounded-[var(--radius-lg)] border border-border bg-muted/50 px-4 py-3"
              key={name}
            >
              <div className="text-sm font-semibold text-foreground">{name}</div>
              <div className="text-sm text-muted-foreground">Ответственный контакт заполнен</div>
            </div>
          ))}
        </div>
      </IslandCard>
    </div>
  ),
};

export const LongTitle: Story = {
  render: () => (
    <div className="w-[460px] max-w-[calc(100vw-2rem)]">
      <IslandCard
        action={
          <button aria-label="Создать юнит" type="button">
            <Plus aria-hidden="true" className="size-4" />
          </button>
        }
        icon={<Building2 aria-hidden="true" className="size-4" />}
        title="Новый юнит для северного производственного контура с длинным названием"
      >
        <SelectField
          defaultValue="north"
          label="Родитель"
          name="longTitleParent"
          options={[
            { label: "Северный дивизион", value: "north" },
            { label: "Уральский дивизион", value: "ural" },
          ]}
        />
        <StructureFormPreview namePrefix="longTitle" />
      </IslandCard>
    </div>
  ),
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  render: () => (
    <div className="w-[320px] max-w-[calc(100vw-1rem)]">
      <IslandCard
        action={
          <button aria-label="Создать юнит" disabled type="button">
            <Plus aria-hidden="true" className="size-4" />
          </button>
        }
        icon={<Building2 aria-hidden="true" className="size-4" />}
        title="Новый юнит"
      >
        <StructureFormPreview namePrefix="mobile" />
      </IslandCard>
    </div>
  ),
};
