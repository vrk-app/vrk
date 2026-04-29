"use client";

import * as RadixToast from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import {
  type CSSProperties,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/shared/lib/cn";

export type ToastTone = "success" | "info" | "warning" | "error";
export type ToastPlacement = "responsive" | "top-right" | "bottom-center";

const toastDurations: Record<ToastTone, number> = {
  success: 4000,
  info: 5000,
  warning: 8000,
  error: 8000,
};

const toastExitAnimationMs = 220;

const toastVariants = cva(
  "vrk-toast-motion pointer-events-auto relative grid w-full grid-cols-[auto_1fr_auto] items-start gap-3 overflow-hidden rounded-[var(--radius-xl)] border bg-card p-4 text-sm text-foreground shadow-lg outline-none",
  {
    variants: {
      tone: {
        success: "border-success-soft",
        info: "border-info-soft",
        warning: "border-warning/30",
        error: "border-destructive/20",
      },
    },
    defaultVariants: {
      tone: "info",
    },
  },
);

const timerFillVariants = cva("block h-full origin-left rounded-full vrk-toast-timer", {
  variants: {
    tone: {
      success: "bg-success",
      info: "bg-info",
      warning: "bg-warning",
      error: "bg-destructive",
    },
  },
  defaultVariants: {
    tone: "info",
  },
});

const iconVariants = cva(
  "flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)]",
  {
    variants: {
      tone: {
        success: "bg-success-soft text-success-strong",
        info: "bg-info-soft text-info-strong",
        warning: "bg-warning-soft text-warning-strong",
        error: "bg-destructive-soft text-destructive-strong",
      },
    },
    defaultVariants: {
      tone: "info",
    },
  },
);

const viewportVariants = cva(
  "fixed z-50 flex max-h-dvh flex-col gap-3 outline-none pointer-events-none",
  {
    variants: {
      placement: {
        responsive:
          "bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 md:bottom-auto md:left-auto md:right-6 md:top-[calc(var(--vrk-sticky-header-height,0px)+max(1.5rem,env(safe-area-inset-top)))] md:w-[min(420px,calc(100vw-3rem))]",
        "top-right":
          "right-6 top-[calc(var(--vrk-sticky-header-height,0px)+max(1.5rem,env(safe-area-inset-top)))] w-[min(420px,calc(100vw-3rem))]",
        "bottom-center":
          "bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2",
      },
    },
    defaultVariants: {
      placement: "responsive",
    },
  },
);

const defaultIcons = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
  error: XCircle,
};

export type ToastInput = {
  action?: ReactNode;
  dedupeKey?: string;
  description?: ReactNode;
  dismissible?: boolean;
  duration?: number;
  title: ReactNode;
  tone?: ToastTone;
};

export type ToastItem = ToastInput & {
  dismissible: boolean;
  duration: number;
  id: string;
  tone: ToastTone;
};

export interface ToastProps extends VariantProps<typeof toastVariants> {
  className?: string;
  item: ToastItem;
  onRemove: (id: string) => void;
}

export function Toast({ className, item, onRemove }: ToastProps) {
  const Icon = defaultIcons[item.tone];
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const removeTimerRef = useRef<number | null>(null);
  const hasAutoDismissTimer = Number.isFinite(item.duration) && item.duration > 0;
  const timerStyle = {
    animationDuration: `${item.duration}ms`,
  } satisfies CSSProperties;

  const scheduleRemove = useCallback(() => {
    if (removeTimerRef.current !== null) {
      window.clearTimeout(removeTimerRef.current);
    }

    removeTimerRef.current = window.setTimeout(() => {
      removeTimerRef.current = null;
      onRemove(item.id);
    }, toastExitAnimationMs);
  }, [item.id, onRemove]);

  useEffect(() => {
    return () => {
      if (removeTimerRef.current !== null) {
        window.clearTimeout(removeTimerRef.current);
      }
    };
  }, []);

  return (
    <RadixToast.Root
      className={cn(toastVariants({ className, tone: item.tone }))}
      aria-live="polite"
      duration={item.duration}
      onPause={() => setIsTimerPaused(true)}
      onOpenChange={(open) => {
        if (open) {
          setIsTimerPaused(false);
          if (removeTimerRef.current !== null) {
            window.clearTimeout(removeTimerRef.current);
            removeTimerRef.current = null;
          }
          return;
        }

        scheduleRemove();
      }}
      onResume={() => setIsTimerPaused(false)}
    >
      <div className={iconVariants({ tone: item.tone })}>
        <Icon aria-hidden="true" className="size-5" />
      </div>

      <div className="min-w-0 space-y-2">
        <div className="space-y-1">
          <RadixToast.Title className="break-words font-semibold text-foreground">
            {item.title}
          </RadixToast.Title>
          {item.description ? (
            <RadixToast.Description className="break-words leading-6 text-muted-foreground">
              {item.description}
            </RadixToast.Description>
          ) : null}
        </div>
        {item.action ? <div className="pt-1">{item.action}</div> : null}
      </div>

      {item.dismissible ? (
        <RadixToast.Close
          aria-label="Закрыть уведомление"
          className="-mr-1 flex size-8 shrink-0 touch-manipulation items-center justify-center rounded-[var(--radius-md)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <X aria-hidden="true" className="size-4" />
        </RadixToast.Close>
      ) : (
        <span aria-hidden="true" className="size-8 shrink-0" />
      )}

      {hasAutoDismissTimer ? (
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-muted">
          <span
            className={cn(timerFillVariants({ tone: item.tone }), isTimerPaused && "vrk-toast-timer-paused")}
            style={timerStyle}
          />
        </span>
      ) : null}
    </RadixToast.Root>
  );
}

export interface ToastCenterProps {
  className?: string;
  items: readonly ToastItem[];
  onRemove: (id: string) => void;
  placement?: ToastPlacement;
}

export function ToastCenter({ className, items, onRemove, placement = "responsive" }: ToastCenterProps) {
  return (
    <>
      {items.map((item) => (
        <Toast item={item} key={item.id} onRemove={onRemove} />
      ))}
      <RadixToast.Viewport className={cn(viewportVariants({ placement }), className)} />
    </>
  );
}

type ToastContextValue = {
  dismissAllToasts: () => void;
  dismissToast: (id: string) => void;
  showToast: (toast: ToastInput) => string;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
  placement?: ToastPlacement;
}

export function ToastProvider({ children, maxToasts = 5, placement = "responsive" }: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idCounterRef = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }, []);

  const dismissAllToasts = useCallback(() => {
    setItems([]);
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const tone = toast.tone ?? "info";
      const id = `${Date.now()}-${idCounterRef.current}`;
      idCounterRef.current += 1;
      const nextItem: ToastItem = {
        ...toast,
        dismissible: toast.dismissible ?? true,
        duration: toast.duration ?? toastDurations[tone],
        id,
        tone,
      };

      setItems((currentItems) => {
        if (toast.dedupeKey) {
          const duplicateIndex = currentItems.findIndex((item) => item.dedupeKey === toast.dedupeKey);

          if (duplicateIndex >= 0) {
            return currentItems.map((item, index) => (index === duplicateIndex ? nextItem : item));
          }
        }

        return [...currentItems, nextItem].slice(-maxToasts);
      });

      return id;
    },
    [maxToasts],
  );

  const contextValue = useMemo(
    () => ({ dismissAllToasts, dismissToast, showToast }),
    [dismissAllToasts, dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        <ToastCenter items={items} onRemove={dismissToast} placement={placement} />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
