import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/shared/api";
import { fetchSessionSummary } from "@/shared/api/session-server";

export const dynamic = "force-dynamic";

export default async function CompanySetupPage() {
  const cookieStore = await cookies();
  const session = await fetchSessionSummary(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/login");
  }

  redirect("/company");
}
