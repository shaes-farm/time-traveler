import { redirect } from "next/navigation";

/**
 * Root route — sends every visitor to the dashboard. Real auth gating
 * lands in Batch C (`proxy.ts` + #36); until then anyone reaching `/`
 * is routed into the protected shell unconditionally.
 */
export default function Home() {
  redirect("/dashboard");
}
