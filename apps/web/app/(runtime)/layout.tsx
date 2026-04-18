import type { ReactNode } from "react";
import { RuntimeShell } from "./_components/RuntimeShell";

export default function RuntimeLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <RuntimeShell>{children}</RuntimeShell>;
}
