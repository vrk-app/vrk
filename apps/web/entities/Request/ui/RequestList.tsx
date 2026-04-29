import { useEffect, type HTMLAttributes } from "react";
import { Inbox, LoaderCircle } from "lucide-react";
import { Button, Card, useToast } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type { RequestListRecord } from "../model";
import { RequestListItem } from "./RequestListItem";

export interface RequestListProps extends HTMLAttributes<HTMLDivElement> {
  items: RequestListRecord[];
  loading?: boolean;
  error?: string;
  empty?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange?: (page: number) => void;
  onResetFilters?: () => void;
}

export function RequestList({
  className,
  empty = false,
  error,
  items,
  loading = false,
  onPageChange,
  onResetFilters,
  page,
  pageSize,
  total,
  ...props
}: RequestListProps) {
  const { showToast } = useToast();
  const safeTotal = Math.max(0, total);
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const showErrorState = !loading && Boolean(error);
  const showEmptyState = !showErrorState && !loading && (empty || safeTotal === 0);
  const pageStart = safeTotal === 0 ? 0 : (currentPage - 1) * safePageSize + 1;
  const pageEnd = safeTotal === 0 ? 0 : Math.min(currentPage * safePageSize, safeTotal);
  const canGoBack = !loading && currentPage > 1 && Boolean(onPageChange);
  const canGoForward = !loading && currentPage < totalPages && Boolean(onPageChange);
  const summaryText = loading
    ? "Загружаем список заявок…"
    : safeTotal === 0
      ? "Показаны заявки 0 из 0"
      : `Показаны заявки ${pageStart}-${pageEnd} из ${safeTotal}`;

  useEffect(() => {
    if (!onPageChange || page === currentPage) {
      return;
    }

    onPageChange(currentPage);
  }, [currentPage, onPageChange, page]);

  useEffect(() => {
    if (!showErrorState) {
      return;
    }

    showToast({
      dedupeKey: `request-list-error:${error}`,
      description: error,
      title: "Не удалось загрузить заявки",
      tone: "error",
    });
  }, [error, showErrorState, showToast]);

  const handlePageChange = (nextPage: number) => {
    if (!onPageChange) {
      return;
    }

    const clampedPage = Math.min(Math.max(nextPage, 1), totalPages);

    if (clampedPage === currentPage) {
      return;
    }

    onPageChange(clampedPage);
  };

  return (
    <div className={cn("grid gap-4", className)} {...props}>
      <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-card px-5 py-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Оперативный список
          </p>
          <p className="text-base font-semibold text-foreground">{summaryText}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            aria-label="Показать предыдущую страницу заявок"
            disabled={!canGoBack}
            onClick={() => handlePageChange(currentPage - 1)}
            variant="secondary"
          >
            Назад
          </Button>
          <div className="rounded-[var(--radius-lg)] bg-muted px-3 py-2 text-sm font-medium text-foreground">
            {currentPage} / {totalPages}
          </div>
          <Button
            aria-label="Показать следующую страницу заявок"
            disabled={!canGoForward}
            onClick={() => handlePageChange(currentPage + 1)}
            variant="secondary"
          >
            Вперёд
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card className="gap-4" key={index} padding="md">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                <span>Загружаем заявки…</span>
              </div>
              <div className="grid gap-3">
                <div className="h-5 rounded-full bg-muted" />
                <div className="h-4 rounded-full bg-muted/80" />
                <div className="h-4 rounded-full bg-muted/70" />
              </div>
            </Card>
          ))}
        </div>
      ) : showErrorState ? null : showEmptyState ? (
        <Card className="items-center gap-4 py-10 text-center" padding="lg">
          <div className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Inbox aria-hidden="true" className="size-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">Список заявок пока пуст</h3>
            <p className="max-w-lg text-sm leading-6 text-muted-foreground">
              Заявки появятся здесь после создания или после изменения фильтров.
            </p>
          </div>
          {onResetFilters ? (
            <Button onClick={onResetFilters} variant="secondary">
              Сбросить фильтры
            </Button>
          ) : null}
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <RequestListItem key={item.requestNumber} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}
