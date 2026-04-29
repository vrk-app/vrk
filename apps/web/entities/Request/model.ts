import type { BadgeProps } from "@/shared/ui/Badge";

export const REQUEST_STATUSES = [
  { value: "draft", label: "Черновик", tone: "neutral" },
  { value: "on-approval", label: "На согласовании", tone: "interactive" },
  { value: "approved", label: "Согласована", tone: "success" },
  { value: "in-work", label: "В работе", tone: "info" },
  { value: "on-signing", label: "На подписи", tone: "violet" },
  { value: "awaiting-payment", label: "Ожидает оплаты", tone: "warning" },
  { value: "completed", label: "Завершена", tone: "success" },
  { value: "reclamation", label: "Рекламация", tone: "danger" },
] as const satisfies readonly {
  label: string;
  tone: NonNullable<BadgeProps["tone"]>;
  value: string;
}[];

export type RequestStatusValue = (typeof REQUEST_STATUSES)[number]["value"];

export type RequestListRecord = {
  requestNumber: string;
  createdAt: string;
  title: string;
  enterprise: string;
  contractor: string;
  contract: string;
  sum: number;
  status: RequestStatusValue;
  progressPercent: number;
  selected?: boolean;
  note?: string;
};
