import type { Meta, StoryObj } from "@storybook/react";
import { ArrowDownRight, ArrowUpRight, CircleCheckBig, TriangleAlert } from "lucide-react";
import { REQUEST_STATUSES } from "@/shared/storybook/fixtures";
import { Badge } from "@/shared/ui";

const badgeToneMatrix = [
  { tone: "neutral", label: "Нейтрально" },
  { tone: "interactive", label: "На согласовании" },
  { tone: "success", label: "Активно" },
  { tone: "warning", label: "Требует внимания" },
  { tone: "danger", label: "Рекламация" },
  { tone: "info", label: "Информация" },
  { tone: "violet", label: "На подписи" },
] as const;

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "Черновик",
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Success: Story = {
  args: {
    tone: "success",
    children: "Согласована",
  },
};

export const Warning: Story = {
  args: {
    tone: "warning",
    children: "Ожидает оплаты",
  },
};

export const Danger: Story = {
  args: {
    tone: "danger",
    children: "Рекламация",
  },
};

export const WithIcon: Story = {
  args: {
    tone: "success",
    icon: <CircleCheckBig className="size-4" />,
    children: "Принято без замечаний",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    tone: "interactive",
    children: "На подписи",
  },
};

export const TrendUp: Story = {
  args: {
    tone: "success",
    icon: <ArrowUpRight className="size-4" />,
    children: "+12% к SLA",
  },
};

export const TrendDown: Story = {
  args: {
    tone: "warning",
    icon: <ArrowDownRight className="size-4" />,
    children: "-8% по закрытию",
  },
};

export const StatusMatrix: Story = {
  render: () => (
    <div className="flex max-w-xl flex-wrap gap-3 rounded-[var(--radius-xl)] border border-border bg-card p-4">
      {REQUEST_STATUSES.map((status) => (
        <Badge
          key={status.value}
          icon={status.value === "reclamation" ? <TriangleAlert className="size-4" /> : undefined}
          tone={status.tone}
        >
          {status.label}
        </Badge>
      ))}
    </div>
  ),
};

export const BorderedTones: Story = {
  render: () => (
    <div className="grid max-w-xl gap-3 rounded-[var(--radius-xl)] border border-border bg-card p-4 sm:grid-cols-2">
      {badgeToneMatrix.map((item) => (
        <Badge className="w-fit" key={item.tone} tone={item.tone}>
          {item.label}
        </Badge>
      ))}
    </div>
  ),
};
