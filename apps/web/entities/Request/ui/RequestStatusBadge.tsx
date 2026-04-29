import { Badge } from "@/shared/ui";
import { REQUEST_STATUSES, type RequestStatusValue } from "../model";
import {
  CircleCheckBig,
  CircleDashed,
  Clock3,
  FileClock,
  FileSignature,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from "lucide-react";

const statusIcons = {
  draft: CircleDashed,
  "on-approval": Clock3,
  approved: ShieldCheck,
  "in-work": FileClock,
  "on-signing": FileSignature,
  "awaiting-payment": Wallet,
  completed: CircleCheckBig,
  reclamation: TriangleAlert,
} as const;

export interface RequestStatusBadgeProps {
  status: RequestStatusValue;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function RequestStatusBadge({
  showIcon = true,
  size = "md",
  status,
}: RequestStatusBadgeProps) {
  const match = REQUEST_STATUSES.find((item) => item.value === status);

  if (!match) {
    return null;
  }

  const Icon = statusIcons[status];

  return (
    <Badge icon={showIcon ? <Icon className="size-4" /> : null} size={size} tone={match.tone}>
      {match.label}
    </Badge>
  );
}
