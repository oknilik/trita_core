interface ResultAccessFigureProps {
  locale: "hu" | "en";
}

const ROWS = {
  hu: [
    {
      role: "A résztvevő",
      description: "A saját személyiségprofilját látja.",
    },
    {
      role: "A csapat és a vezető",
      description:
        "A tanácsadó által jóváhagyott, aggregált csapatriporttal dolgozik. Más csapattag egyéni eredményét nem látják.",
    },
    {
      role: "A tanácsadó",
      description:
        "A riport elkészítéséhez hozzáférhet a védett egyéni adatokhoz, de ezeket nem adja tovább a csapatnak vagy a vezetőnek.",
    },
  ],
  en: [
    {
      role: "The participant",
      description: "Sees their own personality profile.",
    },
    {
      role: "The team and its leader",
      description:
        "Work with the aggregate team report approved by the consultant. They do not see another team member's individual result.",
    },
    {
      role: "The consultant",
      description:
        "May access protected individual data to prepare the report, but does not share those data with the team or its leader.",
    },
  ],
} as const;

export function ResultAccessFigure({ locale }: ResultAccessFigureProps) {
  return (
    <dl className="my-8 overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-surface-card">
      {ROWS[locale].map((row) => (
        <div
          key={row.role}
          className="grid gap-1 border-t border-[var(--color-border-default)] px-5 py-4 first:border-t-0 md:grid-cols-[190px_1fr] md:gap-6 md:px-6"
        >
          <dt className="font-semibold text-[var(--color-text-primary)]">{row.role}</dt>
          <dd className="m-0 text-caption leading-relaxed text-[var(--color-text-secondary)]">
            {row.description}
          </dd>
        </div>
      ))}
    </dl>
  );
}
