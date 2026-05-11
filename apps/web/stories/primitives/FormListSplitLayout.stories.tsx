import type { Meta, StoryObj } from "@storybook/react";
import { Building2, Plus } from "lucide-react";
import {
  Badge,
  Button,
  FormListScrollArea,
  FormListSplitLayout,
  InputField,
  IslandCard,
  TextareaField,
} from "@/shared/ui";

const rows = Array.from({ length: 14 }, (_, index) => ({
  detail: index % 2 === 0 ? "Ответственный контакт заполнен" : "Ожидает уточнения региона",
  name: `Производственная площадка ${String(index + 1).padStart(2, "0")}`,
}));

function FormPreview() {
  return (
    <IslandCard headingLevel={2} icon={<Building2 aria-hidden="true" className="size-4" />} title="Новый дивизион">
      <div className="grid gap-4 md:grid-cols-2">
        <InputField autoComplete="organization" defaultValue="Северный дивизион" label="Наименование" name="name" />
        <InputField autoComplete="address-level1" defaultValue="Санкт-Петербург" label="Регион" name="region" />
        <InputField autoComplete="name" defaultValue="Анна Морозова" label="Руководитель" name="leader" />
        <InputField autoComplete="email" defaultValue="north@vrk.local" label="Email" name="email" type="email" />
      </div>
      <TextareaField
        autoComplete="street-address"
        defaultValue="Площадка обслуживает заявки северного производственного контура."
        label="Комментарий"
        name="comment"
      />
      <Button leftIcon={<Plus className="size-4" />} type="button">
        Создать дивизион
      </Button>
    </IslandCard>
  );
}

function ListPreview({ count = 3 }: { count?: number }) {
  return (
    <IslandCard
      bodyClassName="min-h-0 flex-1"
      className="h-full min-h-0 overflow-hidden"
      headingLevel={2}
      icon={<Building2 aria-hidden="true" className="size-4" />}
      metric={count}
      title="Активные дивизионы"
    >
      <Badge tone="info">Только активные</Badge>
      <FormListScrollArea className="grid gap-3">
        {rows.slice(0, count).map((row) => (
          <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3" key={row.name}>
            <div className="text-sm font-semibold text-foreground">{row.name}</div>
            <div className="text-sm text-muted-foreground">{row.detail}</div>
          </div>
        ))}
      </FormListScrollArea>
    </IslandCard>
  );
}

const meta = {
  title: "Primitives/FormListSplitLayout",
  component: FormListSplitLayout,
  args: {
    form: <FormPreview />,
    list: <ListPreview />,
  },
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="story-shell">
        <div className="mx-auto w-full max-w-7xl">{Story()}</div>
      </div>
    ),
  ],
} satisfies Meta<typeof FormListSplitLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DesktopShortList: Story = {
  render: () => <FormListSplitLayout form={<FormPreview />} list={<ListPreview />} />,
};

export const DesktopLongListScroll: Story = {
  render: () => <FormListSplitLayout form={<FormPreview />} list={<ListPreview count={rows.length} />} />,
};

export const MobileStacked: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  render: () => <FormListSplitLayout form={<FormPreview />} list={<ListPreview count={8} />} />,
};
