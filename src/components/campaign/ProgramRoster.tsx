"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function ProgramRoster({
  orgId,
  campaignId,
  participants,
  editable,
  locale,
}: {
  orgId: string;
  campaignId: string;
  participants: { id: string; name: string }[];
  editable: boolean;
  locale: "hu" | "en";
}) {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  async function remove(id: string) {
    setBusy(true);
    setError(false);
    try {
      const r = await fetch(
        `/api/org/${orgId}/campaigns/${campaignId}/participants/${id}`,
        { method: "DELETE" },
      );
      if (!r.ok) throw new Error();
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h2 className="font-fraunces text-xl">
        {locale === "hu" ? "Résztvevők" : "Participants"}
      </h2>
      {participants.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between border-b border-sand py-2"
        >
          <span>{p.name}</span>
          {editable && (
            <button
              className="min-h-[44px] px-3"
              disabled={busy}
              onClick={() => remove(p.id)}
            >
              {locale === "hu" ? "Eltávolítás" : "Remove"}
            </button>
          )}
        </div>
      ))}
      {error && (
        <p role="alert">
          {locale === "hu"
            ? "Nem sikerült módosítani a névsort."
            : "Could not update the roster."}
        </p>
      )}
    </section>
  );
}
