import { permanentRedirect } from "next/navigation";

export default function LegacyPricingPage() {
  permanentRedirect("/how-we-work");
}
