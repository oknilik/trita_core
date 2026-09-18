import { permanentRedirect } from "next/navigation";

/** Retired personality-derived typology: old links lead to the measured catalogue. */
export default function PatternsPage() {
  permanentRedirect("/operating-patterns");
}
