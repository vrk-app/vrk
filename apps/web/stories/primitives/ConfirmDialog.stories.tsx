import type { Meta, StoryObj } from "@storybook/react";
import { Archive, SendHorizontal } from "lucide-react";
import { useState } from "react";
import { Button, ConfirmDialog, TextareaField, type ConfirmDialogProps } from "@/shared/ui";

function ConfirmDialogStorySurface({
  initialOpen = true,
  triggerLabel = "Открыть подтверждение",
  ...dialogProps
}: ConfirmDialogProps & {
  initialOpen?: boolean;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <div className="flex min-h-[420px] items-center justify-center bg-background p-6 text-foreground">
      <Button onClick={() => setOpen(true)} type="button" variant="secondary">
        {triggerLabel}
      </Button>
      <ConfirmDialog
        {...dialogProps}
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        open={open}
      />
    </div>
  );
}

const meta = {
  title: "Primitives/ConfirmDialog",
  component: ConfirmDialog,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    confirmLabel: "Подтвердить",
    description: "Действие изменит состояние записи.",
    onCancel: () => undefined,
    onConfirm: () => undefined,
    open: true,
    title: "Подтвердить действие?",
  },
  argTypes: {
    onCancel: {
      control: false,
    },
    onConfirm: {
      control: false,
    },
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  render: (args) => (
    <ConfirmDialogStorySurface
      {...args}
      confirmLabel="Отправить"
      description="Заявка уйдет на следующий этап согласования."
      icon={<SendHorizontal aria-hidden="true" className="size-5" />}
      title="Отправить заявку?"
    />
  ),
};

export const Destructive: Story = {
  render: (args) => (
    <ConfirmDialogStorySurface
      {...args}
      confirmLabel="Архивировать"
      description="Запись исчезнет из активных списков и останется доступна при включенной видимости архива."
      icon={<Archive aria-hidden="true" className="size-5" />}
      title="Архивировать запись?"
      tone="danger"
    />
  ),
};

export const WithReason: Story = {
  render: (args) => (
    <ConfirmDialogStorySurface
      {...args}
      confirmLabel="Вернуть"
      description="Исполнитель увидит причину возврата в журнале заявки."
      reasonField={
        <TextareaField
          autoComplete="off"
          label="Причина возврата"
          name="confirm-dialog-reason"
          placeholder="Укажите, что нужно исправить…"
          rows={3}
        />
      }
      title="Вернуть на доработку?"
      tone="warning"
    />
  ),
};

export const Loading: Story = {
  render: (args) => (
    <ConfirmDialogStorySurface
      {...args}
      confirmLabel="Сохраняем"
      description="Пока операция выполняется, окно нельзя закрыть через backdrop или Escape."
      loading
      title="Архивируем запись"
      tone="danger"
    />
  ),
};
