"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Tooltip, type TooltipVariant } from "./Tooltip";

export interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: string;
  hintTitle?: ReactNode;
  hintVariant?: TooltipVariant;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  hidePasswordLabel?: string;
  showPasswordLabel?: string;
  showPasswordToggle?: boolean;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      className,
      disabled,
      error,
      hidePasswordLabel = "Скрыть пароль",
      hint,
      hintTitle,
      hintVariant = "dark",
      id,
      label,
      leftIcon,
      rightIcon,
      showPasswordLabel = "Показать пароль",
      showPasswordToggle = true,
      type = "text",
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const messageId = `${inputId}-message`;
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const shouldShowPasswordToggle = type === "password" && showPasswordToggle;
    const resolvedType = shouldShowPasswordToggle && isPasswordVisible ? "text" : type;
    const passwordToggleLabel = isPasswordVisible ? hidePasswordLabel : showPasswordLabel;

    return (
      <div className="flex w-full flex-col gap-2.5">
        <div className="flex min-h-5 min-w-0 items-center gap-1.5">
          <label
            className="min-w-0 break-words text-sm font-medium text-foreground"
            htmlFor={inputId}
          >
            {label}
          </label>
          {hint ? (
            <Tooltip
              aria-label={`Справка: ${label}`}
              description={hint}
              title={hintTitle}
              variant={hintVariant}
            />
          ) : null}
        </div>
        <span
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border bg-card px-3.5 shadow-xs transition-colors duration-150",
            error
              ? "border-destructive bg-destructive-soft/30"
              : "border-input hover:border-border-strong focus-within:border-accent focus-within:ring-2 focus-within:ring-ring/15",
            disabled && "cursor-not-allowed bg-muted text-text-disabled",
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
            aria-describedby={error ? messageId : undefined}
            aria-invalid={Boolean(error)}
            className={cn(
              "min-w-0 flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed disabled:text-text-disabled",
              className,
            )}
            disabled={disabled}
            id={inputId}
            type={resolvedType}
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
          {shouldShowPasswordToggle ? (
            <button
              aria-controls={inputId}
              aria-label={passwordToggleLabel}
              aria-pressed={isPasswordVisible}
              className="flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:text-text-disabled"
              disabled={disabled}
              onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
              title={passwordToggleLabel}
              type="button"
            >
              {isPasswordVisible ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          ) : null}
        </span>
        {error ? (
          <span
            aria-live="polite"
            className="text-sm text-destructive"
            id={messageId}
          >
            {error}
          </span>
        ) : null}
      </div>
    );
  },
);

InputField.displayName = "InputField";
