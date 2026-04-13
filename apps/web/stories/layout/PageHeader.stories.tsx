import type { Meta, StoryObj } from "@storybook/react";
import { ArrowUpRight, Plus } from "lucide-react";
import { Button } from "@/shared/ui";
import { PageHeader } from "@/widgets/OperatorShell";

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    title: "Оперативный список заявок",
  },
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Simple: Story = {};

export const WithPrimaryAction: Story = {
  args: {
    actions: (
      <>
        <Button variant="secondary">Экспорт</Button>
        <Button leftIcon={<Plus className="size-4" />}>Создать заявку</Button>
      </>
    ),
    backLink: {
      label: "К сводке",
      href: "#dashboard",
    },
  },
};

export const WithSubtitle: Story = {
  args: {
    subtitle:
      "Список показывает то, что уже собрано в Storybook-first контуре: статусы, базовую готовность и спокойную операторскую иерархию.",
    actions: (
      <Button rightIcon={<ArrowUpRight className="size-4" />} variant="secondary">
        Открыть регламент
      </Button>
    ),
  },
};
