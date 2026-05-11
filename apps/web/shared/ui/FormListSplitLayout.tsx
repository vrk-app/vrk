"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/shared/lib/cn";

const desktopMediaQuery = "(min-width: 1280px)";

type SplitStyle = CSSProperties & {
  "--form-list-split-form-height"?: string;
};

export interface FormListSplitLayoutProps extends HTMLAttributes<HTMLDivElement> {
  columnsClassName?: string;
  form: ReactNode;
  formClassName?: string;
  list: ReactNode;
  listClassName?: string;
}

export function FormListSplitLayout({
  className,
  columnsClassName,
  form,
  formClassName,
  list,
  listClassName,
  style,
  ...props
}: FormListSplitLayoutProps) {
  const formRef = useRef<HTMLDivElement | null>(null);
  const [formHeight, setFormHeight] = useState<number | null>(null);

  useEffect(() => {
    const formNode = formRef.current;

    if (!formNode || typeof window === "undefined" || typeof ResizeObserver === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(desktopMediaQuery);
    let animationFrame = 0;

    const updateFormHeight = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        if (!mediaQuery.matches) {
          setFormHeight(null);
          return;
        }

        setFormHeight(Math.ceil(formNode.getBoundingClientRect().height));
      });
    };

    const observer = new ResizeObserver(updateFormHeight);
    observer.observe(formNode);
    updateFormHeight();

    mediaQuery.addEventListener("change", updateFormHeight);
    window.addEventListener("resize", updateFormHeight);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      mediaQuery.removeEventListener("change", updateFormHeight);
      window.removeEventListener("resize", updateFormHeight);
    };
  }, []);

  const splitStyle: SplitStyle = {
    ...style,
    ...(formHeight ? { "--form-list-split-form-height": `${formHeight}px` } : {}),
  };

  return (
    <div
      className={cn(
        "grid gap-4 xl:items-start",
        columnsClassName ?? "xl:grid-cols-[0.95fr_1.05fr]",
        className,
      )}
      style={splitStyle}
      {...props}
    >
      <div className={cn("min-w-0", formClassName)} ref={formRef}>
        {form}
      </div>
      <div
        className={cn(
          "min-w-0",
          formHeight &&
            "xl:h-[var(--form-list-split-form-height)] xl:min-h-[var(--form-list-split-form-height)] xl:max-h-[var(--form-list-split-form-height)]",
          listClassName,
        )}
      >
        {list}
      </div>
    </div>
  );
}

export type FormListScrollMode = "page" | "contained";

export interface FormListScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  scrollMode?: FormListScrollMode;
}

export function FormListScrollArea({ className, scrollMode = "page", ...props }: FormListScrollAreaProps) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-visible pr-0 xl:pr-1",
        scrollMode === "contained" && "xl:overflow-y-auto xl:overscroll-auto",
        className,
      )}
      {...props}
    />
  );
}
