"use client";

import { forwardRef, useId, useState, type ChangeEvent, type TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export interface TextareaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  autoResize?: boolean;
  error?: string;
  hint?: string;
  label: string;
  showCounter?: boolean;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ autoResize = false, className, disabled, error, hint, id, label, maxLength, onChange, showCounter = false, ...props }, ref) => {
    const autoId = useId();
    const textareaId = id ?? autoId;
    const messageId = `${textareaId}-message`;
    const hasMessage = Boolean(hint || error);
    const initialLength =
      typeof props.value === "string"
        ? props.value.length
        : typeof props.defaultValue === "string"
          ? props.defaultValue.length
          : 0;
    const [uncontrolledValueLength, setUncontrolledValueLength] = useState(initialLength);
    const valueLength = typeof props.value === "string" ? props.value.length : uncontrolledValueLength;
    const showFooter = hasMessage || showCounter;

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      if (typeof props.value !== "string") {
        setUncontrolledValueLength(event.currentTarget.value.length);
      }

      if (autoResize) {
        event.currentTarget.style.height = "auto";
        event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
      }

      onChange?.(event);
    };

    return (
      <div className="flex w-full flex-col gap-2.5">
        <label className="text-sm font-medium text-foreground" htmlFor={textareaId}>
          {label}
        </label>
        <textarea
          ref={ref}
          aria-describedby={hasMessage ? messageId : undefined}
          aria-invalid={Boolean(error)}
          className={cn(
            "min-h-24 w-full rounded-[var(--radius-md)] border bg-card px-3.5 py-3 text-sm leading-6 text-foreground shadow-xs outline-none transition-[border-color,box-shadow,background-color] duration-150",
            "placeholder:text-text-tertiary hover:border-border-strong focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/15",
            "disabled:cursor-not-allowed disabled:bg-muted disabled:text-text-disabled",
            error ? "border-destructive bg-destructive-soft/30" : "border-input",
            className,
          )}
          disabled={disabled}
          id={textareaId}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
        />
        {showFooter ? (
          <div className="flex items-start justify-between gap-3 text-sm">
            {hasMessage ? (
              <span
                aria-live={error ? "polite" : undefined}
                className={cn(error ? "text-destructive" : "text-muted-foreground")}
                id={messageId}
              >
                {error ?? hint}
              </span>
            ) : (
              <span />
            )}
            {showCounter ? (
              <span className="shrink-0 text-text-tertiary">
                {maxLength ? `${valueLength}/${maxLength}` : valueLength}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  },
);

TextareaField.displayName = "TextareaField";
