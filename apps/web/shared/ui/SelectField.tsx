"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import {
  forwardRef,
  useId,
  useState,
  type ChangeEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@/shared/lib/cn";

const CLEAR_VALUE = "__vrk_select_clear__";

export type SelectFieldOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size" | "onChange"> {
  clearable?: boolean;
  error?: string;
  hint?: string;
  label: string;
  loading?: boolean;
  loadingLabel?: string;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
  options?: readonly SelectFieldOption[];
  placeholder?: string;
}

function selectValue(value: SelectFieldProps["value"]) {
  return Array.isArray(value) ? undefined : value === undefined ? undefined : String(value);
}

function selectDefaultValue(value: SelectFieldProps["defaultValue"]) {
  return Array.isArray(value) ? undefined : value === undefined ? undefined : String(value);
}

function createChangeEvent(name: string | undefined, value: string) {
  return {
    currentTarget: { name, value },
    target: { name, value },
  } as ChangeEvent<HTMLSelectElement>;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      autoComplete,
      children,
      className,
      clearable = false,
      defaultValue,
      disabled,
      error,
      form,
      hint,
      id,
      label,
      loading = false,
      loadingLabel = "Загружаем варианты…",
      multiple,
      name,
      onChange,
      onValueChange,
      options,
      placeholder,
      required,
      value,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    const messageId = `${selectId}-message`;
    const hasMessage = Boolean(hint || error);
    const isDisabled = disabled || loading;
    const emptyValueOption = options?.find((option) => option.value === "");
    const renderableOptions = options?.filter((option) => option.value !== "");
    const hasOptions = Boolean(renderableOptions?.length);
    const resolvedPlaceholder = loading ? loadingLabel : (placeholder ?? emptyValueOption?.label);
    const [internalValue, setInternalValue] = useState(selectDefaultValue(defaultValue) ?? "");
    const selectedValue = selectValue(value);
    const isControlled = selectedValue !== undefined;
    const radixValue = selectedValue ?? internalValue;

    if (multiple || children) {
      return (
        <div className="flex w-full flex-col gap-2.5">
          <label className="text-sm font-medium text-foreground" htmlFor={selectId}>
            {label}
          </label>
          <div className="relative">
            <select
              ref={ref}
              aria-describedby={hasMessage ? messageId : undefined}
              aria-invalid={Boolean(error)}
              autoComplete={autoComplete}
              className={cn(
                "min-h-11 w-full appearance-none rounded-[var(--radius-md)] border bg-card px-3.5 pr-10 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow,background-color] duration-150",
                "hover:border-border-strong focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/15",
                "disabled:cursor-not-allowed disabled:bg-muted disabled:text-text-disabled",
                error ? "border-destructive bg-destructive-soft/30" : "border-input",
                multiple && "h-auto min-h-24 py-2 pr-3",
                className,
              )}
              defaultValue={defaultValue}
              disabled={isDisabled}
              form={form}
              id={selectId}
              multiple={multiple}
              name={name}
              onChange={onChange}
              required={required}
              value={value}
              {...props}
            >
              {(placeholder || clearable) && !multiple ? (
                <option value="">{placeholder ?? "Не выбрано"}</option>
              ) : null}
              {loading ? (
                <option disabled value="">
                  {loadingLabel}
                </option>
              ) : null}
              {options?.map((option) => (
                <option disabled={option.disabled} key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              {children as ReactNode}
            </select>
            {!multiple ? (
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
            ) : null}
          </div>
          {hasMessage ? (
            <span
              aria-live={error ? "polite" : undefined}
              className={cn("text-sm", error ? "text-destructive" : "text-muted-foreground")}
              id={messageId}
            >
              {error ?? hint}
            </span>
          ) : null}
        </div>
      );
    }

    const handleValueChange = (nextValue: string) => {
      const resolvedValue = nextValue === CLEAR_VALUE ? "" : nextValue;
      if (!isControlled) {
        setInternalValue(resolvedValue);
      }
      onValueChange?.(resolvedValue);
      onChange?.(createChangeEvent(name, resolvedValue));
    };

    return (
      <div className="flex w-full flex-col gap-2.5">
        <label className="text-sm font-medium text-foreground" htmlFor={selectId}>
          {label}
        </label>
        <RadixSelect.Root
          autoComplete={autoComplete}
          disabled={isDisabled}
          form={form}
          name={name}
          onValueChange={handleValueChange}
          required={required}
          value={radixValue}
        >
          <RadixSelect.Trigger
            aria-describedby={hasMessage ? messageId : undefined}
            aria-invalid={Boolean(error)}
            className={cn(
              "flex min-h-11 w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border bg-card px-3.5 text-left text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow,background-color] duration-150",
              "hover:border-border-strong focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/15",
              "disabled:cursor-not-allowed disabled:bg-muted disabled:text-text-disabled",
              "data-[placeholder]:text-text-tertiary",
              error ? "border-destructive bg-destructive-soft/30" : "border-input",
              className,
            )}
            id={selectId}
            {...(props as RadixSelect.SelectTriggerProps)}
          >
            <RadixSelect.Value className="min-w-0 flex-1 truncate" placeholder={resolvedPlaceholder} />
            <RadixSelect.Icon asChild>
              <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>
          <RadixSelect.Portal>
            <RadixSelect.Content
              className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--radius-md)] border border-border bg-card text-foreground shadow-lg"
              collisionPadding={12}
              position="popper"
              sideOffset={6}
            >
              <RadixSelect.Viewport className="p-1">
                {clearable ? (
                  <RadixSelect.Item
                    className="relative flex min-h-9 cursor-default select-none items-center rounded-[var(--radius-sm)] px-9 py-2 text-sm text-muted-foreground outline-none transition-colors data-[highlighted]:bg-surface-hover data-[highlighted]:text-foreground"
                    value={CLEAR_VALUE}
                  >
                    <RadixSelect.ItemText className="min-w-0 flex-1 truncate">
                      {placeholder ?? "Не выбрано"}
                    </RadixSelect.ItemText>
                  </RadixSelect.Item>
                ) : null}
                {loading ? (
                  <RadixSelect.Item
                    className="relative flex min-h-9 cursor-default select-none items-center rounded-[var(--radius-sm)] px-9 py-2 text-sm text-muted-foreground outline-none data-[disabled]:pointer-events-none"
                    disabled
                    value="__vrk_select_loading__"
                  >
                    <RadixSelect.ItemText className="min-w-0 flex-1 truncate">
                      {loadingLabel}
                    </RadixSelect.ItemText>
                  </RadixSelect.Item>
                ) : hasOptions ? (
                  renderableOptions?.map((option) => (
                    <RadixSelect.Item
                      className="relative flex min-h-9 cursor-default select-none items-center rounded-[var(--radius-sm)] px-9 py-2 text-sm text-foreground outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:text-text-disabled data-[highlighted]:bg-surface-hover data-[highlighted]:text-foreground data-[state=checked]:bg-accent-soft data-[state=checked]:font-medium"
                      disabled={option.disabled}
                      key={option.value}
                      value={option.value}
                    >
                      <RadixSelect.ItemIndicator className="absolute left-3 flex size-4 items-center justify-center text-accent">
                        <Check aria-hidden="true" className="size-4" />
                      </RadixSelect.ItemIndicator>
                      <RadixSelect.ItemText className="min-w-0 flex-1 truncate">{option.label}</RadixSelect.ItemText>
                    </RadixSelect.Item>
                  ))
                ) : (
                  <RadixSelect.Item
                    className="relative flex min-h-9 cursor-default select-none items-center rounded-[var(--radius-sm)] px-9 py-2 text-sm text-muted-foreground outline-none data-[disabled]:pointer-events-none"
                    disabled
                    value="__vrk_select_empty__"
                  >
                    <RadixSelect.ItemText className="min-w-0 flex-1 truncate">
                      Нет доступных вариантов
                    </RadixSelect.ItemText>
                  </RadixSelect.Item>
                )}
              </RadixSelect.Viewport>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </RadixSelect.Root>
        {hasMessage ? (
          <span
            aria-live={error ? "polite" : undefined}
            className={cn("text-sm", error ? "text-destructive" : "text-muted-foreground")}
            id={messageId}
          >
            {error ?? hint}
          </span>
        ) : null}
      </div>
    );
  },
);

SelectField.displayName = "SelectField";
