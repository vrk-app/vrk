import type { Meta, StoryObj } from "@storybook/react";
import { ArrowUpRight } from "lucide-react";
import { Button, InlineAlert } from "@/shared/ui";

const meta = {
  title: "Primitives/InlineAlert",
  component: InlineAlert,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    title: "Информация принята в работу",
    description: "Команда видит статус и следующий шаг без перехода на отдельную страницу.",
  },
  render: (args) => (
    <div className="w-full max-w-[560px]">
      <InlineAlert {...args} />
    </div>
  ),
} satisfies Meta<typeof InlineAlert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {};

export const Warning: Story = {
  args: {
    tone: "warning",
    title: "Действие временно недоступно",
    description: "Пользователь видит понятный статус и ближайший рабочий шаг.",
  },
};

export const Error: Story = {
  args: {
    tone: "error",
    title: "Не удалось сохранить изменения",
    description: "Проверьте данные и повторите действие. Если ошибка повторится, передайте ID операции поддержке.",
  },
};

export const Success: Story = {
  args: {
    tone: "success",
    title: "Изменения сохранены",
    description: "Новая настройка применена к рабочему контуру.",
  },
};

export const WithAction: Story = {
  args: {
    action: (
      <Button rightIcon={<ArrowUpRight className="size-4" />} size="sm" variant="secondary">
        Открыть задачу
      </Button>
    ),
    title: "Нужна доработка backend boundary",
    description: "Alert может содержать одно компактное действие.",
  },
};
