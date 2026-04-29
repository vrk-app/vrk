import type { Meta, StoryObj } from "@storybook/react";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button, ToastCenter, useToast, type ToastInput } from "@/shared/ui";
import { REQUEST_BREADCRUMBS, SHELL_USER } from "@/shared/storybook/fixtures";
import { TopBar } from "@/widgets/OperatorShell";

const successToast: ToastInput = {
  dedupeKey: "storybook-toast-success",
  title: "Профиль организации сохранен.",
  tone: "success",
};

const warningToast: ToastInput = {
  dedupeKey: "storybook-toast-warning",
  description: "Проверьте права доступа перед повторной отправкой приглашения.",
  title: "Действие требует внимания",
  tone: "warning",
};

const errorToast: ToastInput = {
  dedupeKey: "storybook-toast-error",
  description: "Сервис временно недоступен. Повторите действие позже.",
  title: "Не удалось сохранить изменения",
  tone: "error",
};

const actionToast: ToastInput = {
  action: (
    <Button rightIcon={<ArrowUpRight aria-hidden="true" className="size-4" />} size="sm" variant="secondary">
      Открыть журнал
    </Button>
  ),
  dedupeKey: "storybook-toast-action",
  description: "Журнал содержит детали операции и статус последней синхронизации.",
  title: "Экспорт готов",
  tone: "info",
};

const timerToast: ToastInput = {
  dedupeKey: "storybook-toast-timer",
  description: "Нижняя линия показывает оставшееся время и ставится на паузу при наведении или фокусе.",
  duration: 12000,
  title: "Проверка таймера автозакрытия",
  tone: "info",
};

function ToastStorySurface({ buttonLabel = "Показать уведомление", toasts }: { buttonLabel?: string; toasts: ToastInput[] }) {
  const { showToast } = useToast();
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) {
      return;
    }

    seededRef.current = true;
    toasts.forEach((toast) => showToast(toast));
  }, [showToast, toasts]);

  return (
    <div className="flex min-h-[260px] w-full items-center justify-center p-8">
      <div className="grid w-full max-w-[420px] gap-3 rounded-[var(--radius-xl)] border border-border bg-card p-5 shadow-xs">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">ToastCenter</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Краткая обратная связь по операциям появляется поверх рабочей области и не сдвигает форму.
          </p>
        </div>
        <Button onClick={() => toasts.forEach((toast) => showToast({ ...toast, dedupeKey: undefined }))} variant="secondary">
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}

function StickyHeaderOffsetSurface() {
  const { showToast } = useToast();

  useEffect(() => {
    showToast(successToast);
  }, [showToast]);

  return (
    <div className="min-h-[520px] bg-background">
      <TopBar
        breadcrumbs={REQUEST_BREADCRUMBS}
        notificationsCount={3}
        searchValue=""
        user={SHELL_USER}
      />
      <div className="px-6 py-8">
        <div className="grid w-full max-w-[420px] gap-3 rounded-[var(--radius-xl)] border border-border bg-card p-5 shadow-xs">
          <p className="text-sm leading-6 text-muted-foreground">
            Уведомление использует высоту sticky-шапки как верхнюю границу и не перекрывает header.
          </p>
          <Button onClick={() => showToast({ ...successToast, dedupeKey: undefined })} variant="secondary">
            Показать уведомление
          </Button>
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "Primitives/Toast",
  component: ToastCenter,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    items: [],
    onRemove: () => undefined,
  },
} satisfies Meta<typeof ToastCenter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {
  render: () => <ToastStorySurface toasts={[successToast]} />,
};

export const Warning: Story = {
  render: () => <ToastStorySurface toasts={[warningToast]} />,
};

export const Error: Story = {
  render: () => <ToastStorySurface toasts={[errorToast]} />,
};

export const WithAction: Story = {
  render: () => <ToastStorySurface buttonLabel="Показать с действием" toasts={[actionToast]} />,
};

export const TimerProgress: Story = {
  render: () => <ToastStorySurface buttonLabel="Показать с таймером" toasts={[timerToast]} />,
};

export const Stacked: Story = {
  render: () => (
    <ToastStorySurface
      buttonLabel="Показать стек"
      toasts={[successToast, warningToast, errorToast, actionToast]}
    />
  ),
};

export const WithStickyHeaderOffset: Story = {
  render: () => <StickyHeaderOffsetSurface />,
};
