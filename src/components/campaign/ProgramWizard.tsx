"use client";
import { t } from "@/lib/i18n";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PROGRAM_KEYS,
  PROGRAM_LABELS,
  PROGRAM_DESCRIPTIONS,
  type ProgramKey,
} from "@/lib/programs/core";
import { SelectField } from "@/components/ui/primitives/SelectField";
import { TextField } from "@/components/ui/primitives/TextField";
import { Button } from "@/components/ui/primitives/Button";

type Team = {
  id: string;
  name: string;
  members: { userId: string; displayName: string }[];
};
export function ProgramWizard({
  orgId,
  teams,
  baselines,
  locale,
  preselectedTeamId,
}: {
  orgId: string;
  teams: Team[];
  baselines: { campaignId: string; teamId: string; title: string }[];
  locale: "hu" | "en";
  preselectedTeamId: string | null;
}) {
  const router = useRouter();
  const [programKey, setProgram] = useState<ProgramKey>("TEAM_SCAN");
  const [includeTrustNetwork, setIncludeTrustNetwork] = useState(false);
  const [teamId, setTeam] = useState(preselectedTeamId ?? teams[0]?.id ?? "");
  const [baselineId, setBaseline] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const created = useRef<string | null>(null);
  const team = teams.find((t) => t.id === teamId);
  const candidates = baselines.filter((b) => b.teamId === teamId);
  const baseline = baselineId || candidates[0]?.campaignId;
  async function submit() {
    setBusy(true);
    setError(false);
    try {
      if (!created.current) {
        const res = await fetch(`/api/org/${orgId}/campaigns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            programKey,
            includeTrustNetwork,
            name:
              name.trim() ||
              `${team?.name} — ${PROGRAM_LABELS[programKey][locale]}`,
            teamIds: [teamId],
            ...(programKey === "FOLLOW_UP"
              ? { baselineCampaignId: baseline }
              : {}),
          }),
        });
        if (!res.ok) throw new Error();
        created.current = (await res.json()).campaign.id;
      }
      const res = await fetch(
        `/api/org/${orgId}/campaigns/${created.current}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: team!.members.map((m) => m.userId) }),
        },
      );
      if (!res.ok) throw new Error();
      router.push(`/org/${orgId}/campaigns/${created.current}`);
      router.refresh();
    } catch {
      setError(true);
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <fieldset
        disabled={busy || Boolean(created.current)}
        className="space-y-6"
      >
        <legend className="font-fraunces text-heading text-ink">
          {t("programUi.wizardTitle", locale)}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROGRAM_KEYS.map((key) => (
            <label
              key={key}
              className="rounded-xl border border-sand bg-surface-card p-4"
            >
              <input
                type="radio"
                name="program"
                checked={programKey === key}
                onChange={() => setProgram(key)}
              />{" "}
              <strong>{PROGRAM_LABELS[key][locale]}</strong>
              <p className="mt-2 text-caption text-ink-body">
                {PROGRAM_DESCRIPTIONS[key][locale]}
              </p>
            </label>
          ))}
        </div>
        <SelectField
          label={t("programUi.team", locale)}
          value={teamId}
          onChange={(e) => {
            setTeam(e.target.value);
            setBaseline("");
          }}
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.members.length})
            </option>
          ))}
        </SelectField>
        <TextField
          label={t("programUi.measurementName", locale)}
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${team?.name ?? ""} — ${PROGRAM_LABELS[programKey][locale]}`}
        />
        {programKey === "FOLLOW_UP" && (
          <SelectField
            label={t("programUi.publishedBaseline", locale)}
            value={baseline ?? ""}
            onChange={(e) => setBaseline(e.target.value)}
          >
            {candidates.length === 0 && (
              <option value="">{t("programUi.noBaseline", locale)}</option>
            )}
            {candidates.map((b) => (
              <option key={b.campaignId} value={b.campaignId}>
                {b.title}
              </option>
            ))}
          </SelectField>
        )}
        <label className="block rounded-xl border border-sand p-4">
          <span className="flex min-h-[44px] items-center gap-3">
            <input
              type="checkbox"
              aria-label={t("programTrust.title", locale)}
              aria-describedby="trust-description"
              checked={includeTrustNetwork}
              onChange={(e) => setIncludeTrustNetwork(e.target.checked)}
            />
            {t("programTrust.title", locale)}
          </span>
          <span
            id="trust-description"
            className="mt-2 block text-caption text-muted"
          >
            {t("programTrust.description", locale)}
          </span>
        </label>
        <p className="text-caption text-muted">
          {t("programUi.rosterHelp", locale)}
        </p>
      </fieldset>
      {error && (
        <p role="alert" className="text-ink">
          {t("programUi.saveError", locale)}
        </p>
      )}
      <Button
        disabled={busy || !team || (programKey === "FOLLOW_UP" && !baseline)}
        onClick={submit}
      >
        {t("programUi.createDraft", locale)}
      </Button>
    </div>
  );
}
