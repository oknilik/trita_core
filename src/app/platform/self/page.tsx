import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function PlatformSelfIndexPage() {
  redirect("/platform/self/results");
}
