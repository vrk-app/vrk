import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, error, hint, id, label, leftIcon, rightIcon, type = "text", ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const messageId = `${inputId}-message`;

    return (
      <label className="flex w-full flex-col gap-2.5" htmlFor={inputId}>
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span
          className={cn(
            "flex h-10 items-center gap-3 rounded-[var(--radius-md)] border bg-card px-3.5 shadow-xs transition-colors duration-150",
            error
              ? "border-destructive bg-destructive-soft/30"
              : "border-input hover:border-border-strong focus-within:border-accent focus-within:ring-2 focus-within:ring-ring/15",
            props.disabled && "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          {leftIcon ? (
            <span
              aria-hidden="true"
              className="flex size-4 items-center justify-center text-muted-foreground"
            >
              {leftIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            aria-describedby={hint || error ? messageId : undefined}
            aria-invalid={Boolean(error)}
            className={cn(
              "w-full border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:text-muted-foreground",
              className,
            )}
            id={inputId}
            type={type}
            {...props}
          />
          {rightIcon ? (
            <span
              aria-hidden="true"
              className="flex size-4 items-center justify-center text-muted-foreground"
            >
              {rightIcon}
            </span>
          ) : null}
        </span>
        {hint || error ? (
          <span
            aria-live={error ? "polite" : undefined}
            className={cn("text-sm", error ? "text-destructive" : "text-muted-foreground")}
            id={messageId}
          >
            {error ?? hint}
          </span>
        ) : null}
      </label>
    );
  },
);

InputField.displayName = "InputField";
