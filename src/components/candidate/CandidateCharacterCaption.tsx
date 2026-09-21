import Link from "next/link";
import {
  personalityNoun,
  resolvePersonalityTypeLabel,
} from "@/lib/personality-type";
import { t, type Locale } from "@/lib/i18n";

export function CandidateCharacterCaption({
  artwork,
  locale,
}: {
  artwork: {
    primaryCode: string;
    secondaryCode: string;
    secondaryUncertain: boolean;
  };
  locale: Locale;
}) {
  const label = artwork.secondaryUncertain
    ? personalityNoun(artwork.primaryCode, locale)
    : resolvePersonalityTypeLabel(
        artwork.primaryCode,
        artwork.secondaryCode,
        locale,
      );
  if (!label) return null;
  return (
    <div className="mt-2 space-y-1">
      <p className="text-caption font-semibold text-ink">{label}</p>
      <Link
        href="/character-glyphs"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center text-caption text-sage underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {t("candidateProgram.artworkExplanation", locale)}
      </Link>
    </div>
  );
}
