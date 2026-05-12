import type { Meta, StoryObj } from "@storybook/react";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button, Dialog, InputField, SelectField, TextareaField, type DialogProps } from "@/shared/ui";

function DialogStorySurface({
  body,
  footer,
  initialOpen = true,
  triggerLabel = "Открыть окно",
  ...dialogProps
}: Omit<DialogProps, "children" | "onOpenChange" | "open"> & {
  body: DialogProps["children"];
  initialOpen?: boolean;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <div className="flex min-h-[520px] items-center justify-center bg-background p-6 text-foreground">
      <Button onClick={() => setOpen(true)} type="button" variant="secondary">
        {triggerLabel}
      </Button>
      <Dialog {...dialogProps} footer={footer} onOpenChange={setOpen} open={open}>
        {body}
      </Dialog>
    </div>
  );
}

const editorBody = (
  <div className="grid gap-4">
    <div className="grid gap-4 md:grid-cols-2">
      <InputField autoComplete="off" label="Наименование" name="dialog-editor-name" defaultValue="Дивизион Север" />
      <InputField autoComplete="off" label="Регион" name="dialog-editor-region" defaultValue="Санкт-Петербург" />
      <SelectField
        defaultValue="vrd-north"
        label="Ответственный юнит"
        name="dialog-editor-unit"
        options={[
          { label: "ВРД Север", value: "vrd-north" },
          { label: "ВРП Линия 3", value: "vrp-line-3" },
        ]}
      />
      <InputField
        autoComplete="off"
        defaultValue="+7 812 000-00-00"
        inputMode="tel"
        label="Телефон"
        name="dialog-editor-phone"
        type="tel"
      />
    </div>
    <TextareaField
      autoComplete="off"
      label="Комментарий"
      name="dialog-editor-comment"
      defaultValue="Используется для распределения заявок по северной площадке."
      rows={4}
    />
  </div>
);

const editorFooter = (
  <div className="flex flex-wrap justify-end gap-3">
    <Button type="button" variant="secondary">
      Отмена
    </Button>
    <Button type="button">Сохранить изменения</Button>
  </div>
);

const meta = {
  title: "Primitives/Dialog",
  component: Dialog,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    open: true,
    onOpenChange: () => undefined,
    title: "Редактировать дивизион",
  },
  argTypes: {
    onOpenChange: {
      control: false,
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DialogStorySurface
      body={<p className="text-sm leading-6 text-muted-foreground">Проверьте параметры перед сохранением изменений.</p>}
      description="Дивизион Север"
      footer={editorFooter}
      title="Редактировать дивизион"
    />
  ),
};

export const NeutralHeader: Story = {
  render: () => (
    <DialogStorySurface
      body={editorBody}
      description="Основной светлый стиль модальных редакторов."
      footer={editorFooter}
      headerIcon={<ShieldCheck aria-hidden="true" className="size-4" />}
      headerVariant="neutral"
      size="lg"
      title="Редактировать карточку площадки"
    />
  ),
};

export const MutedHeader: Story = {
  render: () => (
    <DialogStorySurface
      body={editorBody}
      description="Спокойная серая поверхность для вторичных модалок."
      footer={editorFooter}
      headerIcon={<ShieldCheck aria-hidden="true" className="size-4" />}
      headerVariant="muted"
      size="lg"
      title="Редактировать карточку площадки"
    />
  ),
};

export const DarkHeader: Story = {
  render: () => (
    <DialogStorySurface
      body={editorBody}
      description="Исходный темный стиль для акцентных и критичных модалок."
      footer={editorFooter}
      headerIcon={<ShieldCheck aria-hidden="true" className="size-4" />}
      headerVariant="dark"
      size="lg"
      title="Редактировать карточку площадки"
    />
  ),
};

export const LongContent: Story = {
  render: () => (
    <DialogStorySurface
      body={
        <div className="grid gap-4">
          {Array.from({ length: 12 }, (_, index) => (
            <InputField
              autoComplete="off"
              defaultValue={`Параметр ${index + 1}`}
              key={index}
              label={`Поле ${index + 1}`}
              name={`dialog-long-field-${index}`}
            />
          ))}
        </div>
      }
      description="Тело окна прокручивается, а заголовок и действия остаются на своих местах."
      footer={editorFooter}
      size="lg"
      title="Длинная форма"
    />
  ),
};

export const DismissDisabled: Story = {
  render: () => (
    <DialogStorySurface
      body={<p className="text-sm leading-6 text-muted-foreground">Backdrop и Escape не закрывают окно в этом состоянии.</p>}
      description="Сохранение уже запущено"
      dismissible={false}
      footer={
        <div className="flex justify-end">
          <Button loading type="button">
            Сохраняем
          </Button>
        </div>
      }
      showClose={false}
      title="Изменения сохраняются"
    />
  ),
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  render: () => (
    <DialogStorySurface
      body={editorBody}
      description="Мобильное отображение формы"
      footer={editorFooter}
      size="lg"
      title="Редактировать юнит"
    />
  ),
};
