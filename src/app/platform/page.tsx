import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function PlatformIndexPage() {
  redirect("/platform/home");
}
