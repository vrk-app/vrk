import type { Meta, StoryObj } from "@storybook/react";
import { Badge, Button, Card } from "@/shared/ui";

function CardPreview({
  bordered,
  elevated,
  padding,
  tone,
}: {
  bordered?: boolean;
  elevated?: boolean;
  padding?: "dense" | "md" | "lg";
  tone?: "default" | "muted";
}) {
  return (
    <div className="w-[380px]">
      <Card bordered={bordered} elevated={elevated} padding={padding} tone={tone}>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Карточка заявки
              </p>
              <h3 className="text-xl font-semibold text-foreground">
                Поверка расходомера теплового узла
              </h3>
            </div>
            <Badge tone="interactive" size="sm">
              На согласовании
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Базовая поверхность для KPI, списков, форм входа и сводных блоков.
          </p>
          <div className="flex gap-3">
            <Button size="sm">Открыть</Button>
            <Button size="sm" variant="secondary">
              История
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

const meta = {
  title: "Primitives/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Base: Story = {
  render: () => <CardPreview bordered={false} />,
};

export const Bordered: Story = {
  render: () => <CardPreview bordered />,
};

export const Elevated: Story = {
  render: () => <CardPreview bordered elevated />,
};

export const Dense: Story = {
  render: () => <CardPreview bordered padding="dense" tone="muted" />,
};
