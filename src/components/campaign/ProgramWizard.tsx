"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PROGRAM_KEYS, PROGRAM_LABELS, PROGRAM_DESCRIPTIONS, type ProgramKey } from "@/lib/programs/core";
import { Button } from "@/components/ui/primitives/Button";

type Team = { id: string; name: string; members: { userId: string; displayName: string }[] };
export function ProgramWizard({ orgId, teams, baselines, locale, preselectedTeamId }: {
  orgId: string; teams: Team[]; baselines: { campaignId: string; teamId: string; title: string }[];
  locale: "hu" | "en"; preselectedTeamId: string | null;
}) {
  const router = useRouter(); const hu = locale === "hu";
  const [programKey, setProgram] = useState<ProgramKey>("TEAM_SCAN");
  const [teamId, setTeam] = useState(preselectedTeamId ?? teams[0]?.id ?? "");
  const [baselineId, setBaseline] = useState(""); const [name, setName] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  const created = useRef<string | null>(null);
  const team = teams.find(t => t.id === teamId);
  const candidates = baselines.filter(b => b.teamId === teamId);
  const baseline = baselineId || candidates[0]?.campaignId;
  async function submit() {
    setBusy(true); setError(false);
    try {
      if (!created.current) {
        const res = await fetch(`/api/org/${orgId}/campaigns`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ programKey, name: name.trim() || `${team?.name} — ${PROGRAM_LABELS[programKey][locale]}`, teamIds: [teamId], ...(programKey === "FOLLOW_UP" ? { baselineCampaignId: baseline } : {}) }) });
        if (!res.ok) throw new Error();
        created.current = (await res.json()).campaign.id;
      }
      const res = await fetch(`/api/org/${orgId}/campaigns/${created.current}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userIds: team!.members.map(m => m.userId) }) });
      if (!res.ok) throw new Error();
      router.push(`/org/${orgId}/campaigns/${created.current}`); router.refresh();
    } catch { setError(true); setBusy(false); }
  }
  return <div className="space-y-6">
    <fieldset disabled={busy || Boolean(created.current)} className="space-y-6">
      <legend className="font-fraunces text-xl text-ink">{hu ? "Diagnosztikai program" : "Diagnostic program"}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{PROGRAM_KEYS.map(key => <label key={key} className="rounded-xl border border-sand bg-surface-card p-4">
        <input type="radio" name="program" checked={programKey === key} onChange={() => setProgram(key)} /> <strong>{PROGRAM_LABELS[key][locale]}</strong>
        <p className="mt-2 text-caption text-ink-body">{PROGRAM_DESCRIPTIONS[key][locale]}</p>
      </label>)}</div>
      <label className="block">{hu ? "Csapat" : "Team"}<select className="mt-2 block min-h-[44px] w-full rounded-lg border border-sand p-2" value={teamId} onChange={e => { setTeam(e.target.value); setBaseline(""); }}>{teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.members.length})</option>)}</select></label>
      <label className="block">{hu ? "Mérés neve" : "Measurement name"}<input maxLength={100} className="mt-2 block min-h-[44px] w-full rounded-lg border border-sand p-2" value={name} onChange={e => setName(e.target.value)} placeholder={`${team?.name ?? ""} — ${PROGRAM_LABELS[programKey][locale]}`} /></label>
      {programKey === "FOLLOW_UP" && <label className="block">{hu ? "Kiinduló, publikált mérés" : "Published baseline"}<select className="mt-2 block min-h-[44px] w-full rounded-lg border border-sand p-2" value={baseline ?? ""} onChange={e => setBaseline(e.target.value)}>{candidates.length === 0 && <option value="">{hu ? "Nincs kompatibilis publikált Team Scan" : "No compatible published Team Scan"}</option>}{candidates.map(b => <option key={b.campaignId} value={b.campaignId}>{b.title}</option>)}</select></label>}
      <p className="text-caption text-muted">{hu ? "A csapat tagjai résztvevőként kerülnek a vázlatba. A névsort aktiválás előtt ellenőrizheted; legalább három résztvevő szükséges." : "Team members are added to the draft. Review the roster before activation; at least three participants are required."}</p>
    </fieldset>
    {error && <p role="alert" className="text-ink">{hu ? "A mentés nem sikerült. Ellenőrizd a jogosultságot és a kiinduló mérést, majd próbáld újra." : "Could not save. Check access and the baseline, then retry."}</p>}
    <Button disabled={busy || !team || (programKey === "FOLLOW_UP" && !baseline)} onClick={submit}>{hu ? "Programvázlat létrehozása" : "Create program draft"}</Button>
  </div>;
}
