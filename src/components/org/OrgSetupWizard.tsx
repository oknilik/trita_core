"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OrgSetupWizardProps {
  orgId: string;
  orgName: string;
  locale: string;
}

type Step = "name" | "invite";

export function OrgSetupWizard({ orgId, orgName, locale }: OrgSetupWizardProps) {
  const router = useRouter();
  const isHu = locale !== "en";
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState(orgName);
  const [inviteEmails, setInviteEmails] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNameNext(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (name.trim() !== orgName) {
        const res = await fetch(`/api/org/${orgId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });
        if (!res.ok) {
          setError(isHu ? "Hiba a névmentésnél." : "Failed to save name.");
          return;
        }
      }
      setStep("invite");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish() {
    setLoading(true);
    setError(null);
    try {
      // Send invites for non-empty emails
      const emails = inviteEmails.map((e) => e.trim().toLowerCase()).filter(Boolean);
      await Promise.allSettled(
        emails.map((email) =>
          fetch(`/api/org/${orgId}/invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, role: "ORG_MEMBER" }),
          })
        )
      );

      // Mark org as ACTIVE
      await fetch(`/api/org/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      router.push(`/org/${orgId}`);
      router.refresh();
    } catch {
      setError(isHu ? "Hálózati hiba." : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Progress indicator */}
      <div className="mb-8 flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === "name" ? "bg-[#c8410a] text-white" : "bg-[#c8410a] text-white"}`}>
          {step === "name" ? "1" : "✓"}
        </div>
        <div className="h-0.5 flex-1 bg-[#e8e4dc]">
          <div className={`h-full bg-[#c8410a] transition-all ${step === "invite" ? "w-full" : "w-0"}`} />
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === "invite" ? "bg-[#c8410a] text-white" : "bg-[#e8e4dc] text-[#3d3a35]"}`}>
          2
        </div>
      </div>

      {step === "name" && (
        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-8 shadow-sm">
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
            {isHu ? "// 1. lépés" : "// step 1"}
          </p>
          <h1 className="font-playfair text-xl text-[#1a1814] mb-2">
            {isHu ? "Szervezet neve" : "Organization name"}
          </h1>
          <p className="text-sm text-[#3d3a35]/70 mb-6">
            {isHu ? "Erősítsd meg vagy módosítsd a szervezet nevét." : "Confirm or update your organization name."}
          </p>
          <form onSubmit={handleNameNext} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-semibold text-[#1a1814]">
              {isHu ? "Szervezet neve" : "Name"}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                className="min-h-[44px] rounded-lg border border-[#e8e4dc] bg-white px-3 text-sm font-normal text-[#1a1814] focus:border-[#c8410a] focus:outline-none"
              />
            </label>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="min-h-[44px] rounded-lg bg-[#c8410a] px-6 text-sm font-semibold text-white transition hover:bg-[#a8340a] disabled:opacity-50"
            >
              {loading ? "..." : isHu ? "Tovább" : "Next"}
            </button>
          </form>
        </div>
      )}

      {step === "invite" && (
        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-8 shadow-sm">
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
            {isHu ? "// 2. lépés" : "// step 2"}
          </p>
          <h1 className="font-playfair text-xl text-[#1a1814] mb-2">
            {isHu ? "Tagok meghívása" : "Invite members"}
          </h1>
          <p className="text-sm text-[#3d3a35]/70 mb-6">
            {isHu
              ? "Hívj meg tagokat az induláshoz (opcionális). Emailcímek, akik még nem regisztráltak, meghívót kapnak."
              : "Invite members to get started (optional). Unregistered emails will receive an invite."}
          </p>
          <div className="flex flex-col gap-3 mb-6">
            {inviteEmails.map((email, i) => (
              <input
                key={i}
                type="email"
                value={email}
                onChange={(e) => {
                  const next = [...inviteEmails];
                  next[i] = e.target.value;
                  setInviteEmails(next);
                }}
                placeholder={`${isHu ? "Email" : "Email"} ${i + 1}`}
                className="min-h-[44px] rounded-lg border border-[#e8e4dc] bg-white px-3 text-sm font-normal text-[#1a1814] focus:border-[#c8410a] focus:outline-none"
              />
            ))}
          </div>
          {error && <p className="mb-3 text-xs text-rose-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("name")}
              className="min-h-[44px] rounded-lg border border-[#e8e4dc] px-5 text-sm font-semibold text-[#3d3a35] transition hover:bg-[#faf9f6]"
            >
              {isHu ? "Vissza" : "Back"}
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 min-h-[44px] rounded-lg bg-[#c8410a] px-6 text-sm font-semibold text-white transition hover:bg-[#a8340a] disabled:opacity-50"
            >
              {loading ? "..." : isHu ? "Befejezés" : "Finish setup"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
