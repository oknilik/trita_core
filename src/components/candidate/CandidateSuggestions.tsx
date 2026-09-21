"use client";
import { CandidateWorkshopNote } from "./CandidateWorkshopNote";
import styles from "./CandidateWorkshop.module.css";
import { useState } from "react";
import { Button } from "@/components/ui/primitives/Button";
import { TextareaField } from "@/components/ui/primitives/TextareaField";
import { t, type Locale } from "@/lib/i18n";
import type { Suggestion } from "@/lib/candidate-programs/suggestions";

export function CandidateSuggestions({
  suggestions,
  locale,
  disabled,
  insert,
}: {
  suggestions: Suggestion[];
  locale: Locale;
  disabled?: boolean;
  insert: (suggestion: Suggestion, text: string) => boolean;
}) {
  const [generation, setGeneration] = useState(0);
  if (!suggestions.length) return null;
  return (
    <section className={styles.board}>
      <h3 className="font-fraunces text-heading">
        {t("candidateSuggestions.title", locale)}
      </h3>
      <p className="my-3 text-caption text-muted">
        {t("candidateSuggestions.notice", locale)}
      </p>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {suggestions.map((s) => (
          <SuggestionCard
            key={`${generation}:${s.id}`}
            suggestion={s}
            locale={locale}
            disabled={disabled}
            insert={insert}
          />
        ))}
      </div>
      <Button
        variant="secondary"
        className="mt-4"
        disabled={disabled}
        onClick={() => setGeneration((v) => v + 1)}
      >
        {t("candidateSuggestions.regenerate", locale)}
      </Button>
    </section>
  );
}
function SuggestionCard({
  suggestion,
  locale,
  disabled,
  insert,
}: {
  suggestion: Suggestion;
  locale: Locale;
  disabled?: boolean;
  insert: (s: Suggestion, text: string) => boolean;
}) {
  const [text, setText] = useState(suggestion.text),
    [editing, setEditing] = useState(false),
    [dismissed, setDismissed] = useState(false),
    [error, setError] = useState(false);
  if (dismissed) return null;
  return (
    <CandidateWorkshopNote
      label={suggestion.title}
      tone={
        suggestion.id.endsWith(":roles")
          ? "role"
          : suggestion.target === "difference"
            ? "difference"
            : suggestion.target === "connection" ||
                suggestion.target === "candidateSummary"
              ? "connection"
              : "neutral"
      }
    >
      <h4 className="font-fraunces text-heading text-ink">
        {suggestion.title}
      </h4>
      <p className="my-2 whitespace-pre-line text-note text-muted">
        {suggestion.source}
      </p>
      {editing ? (
        <TextareaField
          label={suggestion.title}
          value={text}
          disabled={disabled}
          rows={5}
          onChange={(e) => {
            setText(e.target.value);
            setError(false);
          }}
        />
      ) : (
        <p className="whitespace-pre-line text-caption text-ink-body">{text}</p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-caption">
          {t("candidateSuggestions.tooLong", locale)}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          disabled={disabled || !text.trim()}
          onClick={() => {
            if (insert(suggestion, `${text}\n\n${suggestion.source}`))
              setDismissed(true);
            else setError(true);
          }}
        >
          {t("candidateSuggestions.insert", locale)}
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          onClick={() => setEditing((v) => !v)}
        >
          {t("candidateSuggestions.edit", locale)}
        </Button>
        <Button
          variant="ghost"
          disabled={disabled}
          onClick={() => setDismissed(true)}
        >
          {t("candidateSuggestions.dismiss", locale)}
        </Button>
      </div>
    </CandidateWorkshopNote>
  );
}
