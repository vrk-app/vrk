"use client";

import { useId } from "react";
import type { ChangeEvent, ChangeEventHandler, InputHTMLAttributes, LabelHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type ConsentLink = {
  label: string;
  href: string;
};

type ConsentInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "checked"
  | "children"
  | "defaultChecked"
  | "disabled"
  | "id"
  | "name"
  | "onChange"
  | "required"
  | "size"
  | "type"
>;

export interface ConsentRowProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  label: string;
  error?: string;
  links?: ConsentLink[];
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  inputProps?: ConsentInputProps;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onCheckedChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
  "aria-describedby"?: string;
}

export function ConsentRow({
  checked,
  className,
  defaultChecked,
  disabled = false,
  error,
  id,
  label,
  links = [],
  name = "consent",
  inputProps,
  onChange,
  onCheckedChange,
  required = false,
  "aria-describedby": ariaDescribedBy,
  ...labelProps
}: ConsentRowProps) {
  const generatedId = useId();
  const inputId = id ?? `consent-${generatedId}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const { className: inputClassName, "aria-describedby": inputAriaDescribedBy, ...restInputProps } =
    inputProps ?? {};
  const describedBy = [inputAriaDescribedBy, ariaDescribedBy, errorId].filter(Boolean).join(" ") || undefined;
  const selectionProps = checked !== undefined ? { checked } : defaultChecked !== undefined ? { defaultChecked } : {};

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    onChange?.(event);
    onCheckedChange?.(event.currentTarget.checked, event);
  };

  return (
    <div className={cn("grid gap-2", disabled && "cursor-not-allowed opacity-70", className)}>
      <label aria-disabled={disabled || undefined} htmlFor={inputId} {...labelProps}>
        <span className="flex items-start gap-3">
          <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
            <input
              {...restInputProps}
              {...selectionProps}
              aria-describedby={describedBy}
              aria-invalid={Boolean(error)}
              className={cn(
                "peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed",
                inputClassName,
              )}
              disabled={disabled}
              id={inputId}
              name={name}
              onChange={handleChange}
              required={required}
              type="checkbox"
            />
            <span
              aria-hidden="true"
              className={cn(
                "flex size-5 items-center justify-center rounded-[0.45rem] border transition-colors",
                error
                  ? "border-destructive bg-destructive-soft text-destructive"
                  : "border-border bg-card text-transparent peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-ring/25 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                "peer-disabled:border-border peer-disabled:bg-muted peer-disabled:text-muted-foreground/60",
              )}
            >
              <Check className="size-3.5" />
            </span>
          </span>
          <span className="text-sm leading-6 text-muted-foreground">
            <span className="text-foreground">{label}</span>
            {links.length ? " " : null}
            {links.map((link, index) => (
              <span key={`${link.label}-${index}`}>
                <a
                  className="font-medium text-accent transition-colors hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  href={link.href}
                  onClick={(event) => event.stopPropagation()}
                >
                  {link.label}
                </a>
                {index < links.length - 1 ? <span>, </span> : null}
              </span>
            ))}
          </span>
        </span>
      </label>
      {error ? (
        <span aria-live="polite" className="pl-8 text-sm text-destructive" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
