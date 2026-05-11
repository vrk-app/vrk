"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { Info, TriangleAlert, X, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "./Button";

const dialogContentVariants = cva(
  "fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] origin-center -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden overscroll-contain rounded-[var(--radius-2xl)] border border-border bg-card text-card-foreground shadow-xl transition-[opacity,transform] duration-200 data-[state=closed]:scale-[0.98] data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100 motion-reduce:transition-none sm:w-[calc(100vw-2rem)]",
  {
    variants: {
      size: {
        sm: "max-w-lg",
        md: "max-w-2xl",
        lg: "max-w-4xl",
        xl: "max-w-6xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const confirmIconVariants = cva(
  "flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)]",
  {
    variants: {
      tone: {
        default: "bg-info-soft text-info-strong",
        warning: "bg-warning-soft text-warning-strong",
        danger: "bg-destructive-soft text-destructive-strong",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

export type DialogSize = NonNullable<VariantProps<typeof dialogContentVariants>["size"]>;
export type DialogHeaderVariant = "neutral" | "muted" | "dark";

const dialogHeaderStyles = {
  neutral: {
    close:
      "border-border bg-card text-muted-foreground shadow-sm hover:border-border-strong hover:bg-muted hover:text-foreground",
    icon: "text-accent-strong",
    panel: "border-border bg-card text-foreground shadow-sm",
  },
  muted: {
    close:
      "border-border bg-muted text-muted-foreground shadow-xs hover:border-border-strong hover:bg-card hover:text-foreground",
    icon: "text-accent-strong",
    panel: "border-border bg-muted text-foreground shadow-xs",
  },
  dark: {
    close:
      "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
    icon: "text-primary-foreground",
    panel: "border-transparent bg-primary text-primary-foreground shadow-sm",
  },
} satisfies Record<DialogHeaderVariant, { close: string; icon: string; panel: string }>;

export interface DialogProps {
  badge?: ReactNode;
  bodyClassName?: string;
  children?: ReactNode;
  className?: string;
  closeLabel?: string;
  description?: ReactNode;
  dismissible?: boolean;
  footer?: ReactNode;
  headerIcon?: ReactNode;
  headerVariant?: DialogHeaderVariant;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  showClose?: boolean;
  size?: DialogSize;
  title: ReactNode;
}

export function Dialog({
  badge,
  bodyClassName,
  children,
  className,
  closeLabel = "Закрыть",
  description,
  dismissible = true,
  footer,
  headerIcon,
  headerVariant = "muted",
  onOpenChange,
  open,
  showClose = true,
  size = "md",
  title,
}: DialogProps) {
  const handleDismissAttempt = (event: Event) => {
    if (!dismissible) {
      event.preventDefault();
    }
  };
  const headerStyle = dialogHeaderStyles[headerVariant];

  return (
    <RadixDialog.Root onOpenChange={onOpenChange} open={open}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-[2px] transition-opacity duration-200 data-[state=closed]:opacity-0 data-[state=open]:opacity-100 motion-reduce:transition-none" />
        <RadixDialog.Content
          className={cn(dialogContentVariants({ size }), className)}
          onEscapeKeyDown={handleDismissAttempt}
          onInteractOutside={handleDismissAttempt}
        >
          <div className="relative shrink-0 border-b border-border px-5 pb-4 pt-20">
            <div className="absolute inset-x-5 top-0 z-10 flex items-start justify-between gap-3">
              <div
                className={cn(
                  "flex h-[3.25rem] min-w-0 items-center gap-3 rounded-b-[1.4rem] border border-t-0 px-5 py-3",
                  headerStyle.panel,
                  showClose ? "max-w-[calc(100%-4.25rem)]" : "max-w-full",
                )}
              >
                {headerIcon ? (
                  <span className={cn("flex size-5 shrink-0 items-center justify-center", headerStyle.icon)}>
                    {headerIcon}
                  </span>
                ) : null}
                <RadixDialog.Title className="min-w-0 truncate text-lg font-semibold leading-7">
                  {title}
                </RadixDialog.Title>
              </div>
              {showClose ? (
                <RadixDialog.Close
                  aria-label={closeLabel}
                  className={cn(
                    "inline-flex h-[3.25rem] w-14 shrink-0 touch-manipulation items-center justify-center rounded-b-[1.4rem] border border-t-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
                    headerStyle.close,
                  )}
                  type="button"
                >
                  <X aria-hidden="true" className="size-4" />
                </RadixDialog.Close>
              ) : null}
            </div>
            {(badge || description) ? (
              <div className="min-w-0 space-y-2">
                {badge ? <div>{badge}</div> : null}
                {description ? (
                  <RadixDialog.Description className="break-words text-sm leading-6 text-muted-foreground">
                    {description}
                  </RadixDialog.Description>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-5", bodyClassName)}>{children}</div>
          {footer ? <div className="shrink-0 border-t border-border bg-muted/40 px-5 py-4">{footer}</div> : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export type ConfirmDialogTone = NonNullable<VariantProps<typeof confirmIconVariants>["tone"]>;

export interface ConfirmDialogProps {
  cancelLabel?: string;
  confirmLabel: string;
  description: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  reasonField?: ReactNode;
  title: ReactNode;
  tone?: ConfirmDialogTone;
}

const defaultConfirmIcons = {
  default: Info,
  warning: TriangleAlert,
  danger: XCircle,
} satisfies Record<ConfirmDialogTone, typeof Info>;

export function ConfirmDialog({
  cancelLabel = "Отмена",
  confirmLabel,
  description,
  icon,
  loading = false,
  onCancel,
  onConfirm,
  open,
  reasonField,
  title,
  tone = "default",
}: ConfirmDialogProps) {
  const Icon = defaultConfirmIcons[tone];
  const confirmVariant = tone === "danger" ? "danger" : "primary";

  return (
    <Dialog
      bodyClassName="space-y-5"
      dismissible={!loading}
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <Button disabled={loading} onClick={onCancel} type="button" variant="secondary">
            {cancelLabel}
          </Button>
          <Button loading={loading} onClick={onConfirm} type="button" variant={confirmVariant}>
            {confirmLabel}
          </Button>
        </div>
      }
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) {
          onCancel();
        }
      }}
      headerVariant="muted"
      open={open}
      showClose={!loading}
      size="sm"
      title={title}
    >
      <div className="flex items-start gap-3">
        <div className={confirmIconVariants({ tone })}>
          {icon ?? <Icon aria-hidden="true" className="size-5" />}
        </div>
        <div className="min-w-0 space-y-2">
          <RadixDialog.Description className="break-words text-sm leading-6 text-muted-foreground">
            {description}
          </RadixDialog.Description>
        </div>
      </div>
      {reasonField ? <div>{reasonField}</div> : null}
    </Dialog>
  );
}
