"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AVATAR_OPTIONS, AVATARS_INITIAL_COUNT } from "@/lib/avatars";

interface OrgSetupWizardProps {
  orgId: string;
  orgName: string;
  locale: string;
}

type Step = "name" | "avatar" | "invite";

export function OrgSetupWizard({ orgId, orgName, locale }: OrgSetupWizardProps) {
  const router = useRouter();
  const isHu = locale !== "en";
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState(orgName);
  const [avatarUrl, setAvatarUrl] = useState<string>(AVATAR_OPTIONS[0] ?? "");
  const [avatarsShown, setAvatarsShown] = useState(AVATARS_INITIAL_COUNT);
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
      setStep("avatar");
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarNext() {
    setLoading(true);
    setError(null);
    try {
      await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });
      window.dispatchEvent(new CustomEvent("profile-updated"));
      setStep("invite");
    } catch {
      setError(isHu ? "Hiba az avatar mentésekor." : "Failed to save avatar.");
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
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${step === "name" ? "bg-sage text-white" : "bg-sage text-white"}`}>
          {step === "name" ? "1" : "✓"}
        </div>
        <div className="h-0.5 flex-1 bg-sand">
          <div className={`h-full bg-sage transition-all ${step === "avatar" || step === "invite" ? "w-full" : "w-0"}`} />
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${step === "avatar" ? "bg-sage text-white" : step === "invite" ? "bg-sage text-white" : "bg-sand text-ink-body"}`}>
          {step === "invite" ? "✓" : "2"}
        </div>
        <div className="h-0.5 flex-1 bg-sand">
          <div className={`h-full bg-sage transition-all ${step === "invite" ? "w-full" : "w-0"}`} />
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${step === "invite" ? "bg-sage text-white" : "bg-sand text-ink-body"}`}>
          3
        </div>
      </div>

      {step === "name" && (
        <div className="rounded-2xl border border-sand bg-white p-8 shadow-sm">
          <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-1">
            {isHu ? "// 1. lépés" : "// step 1"}
          </p>
          <h1 className="font-fraunces text-xl text-ink mb-2">
            {isHu ? "Szervezet neve" : "Organization name"}
          </h1>
          <p className="text-sm text-ink-body/70 mb-6">
            {isHu ? "Erősítsd meg vagy módosítsd a szervezet nevét." : "Confirm or update your organization name."}
          </p>
          <form onSubmit={handleNameNext} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
              {isHu ? "Szervezet neve" : "Name"}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                className="min-h-[44px] rounded-lg border border-sand bg-white px-3 text-sm font-normal text-ink focus:border-sage focus:outline-none"
              />
            </label>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="min-h-[44px] rounded-lg bg-sage px-6 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:opacity-50"
            >
              {loading ? "..." : isHu ? "Tovább" : "Next"}
            </button>
          </form>
        </div>
      )}

      {step === "avatar" && (
        <div className="rounded-2xl border border-sand bg-white p-8 shadow-sm">
          <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-1">
            {isHu ? "// 2. lépés" : "// step 2"}
          </p>
          <h1 className="font-fraunces text-xl text-ink mb-2">
            {isHu ? "Válassz avatart" : "Choose an avatar"}
          </h1>
          <p className="text-sm text-ink-body/70 mb-6">
            {isHu ? "Ez jelenik meg a profilodban." : "This will appear on your profile."}
          </p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {AVATAR_OPTIONS.slice(0, avatarsShown).map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setAvatarUrl(src)}
                className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${
                  avatarUrl === src
                    ? "border-sage ring-2 ring-sage/30"
                    : "border-sand hover:border-sage/40"
                }`}
              >
                <Image
                  src={src}
                  alt="avatar option"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </button>
            ))}
          </div>
          {AVATAR_OPTIONS.length > avatarsShown && (
            <button
              type="button"
              onClick={() => setAvatarsShown(AVATAR_OPTIONS.length)}
              className="mb-6 text-xs font-medium text-bronze hover:underline"
            >
              {isHu
                ? `+ Összes megjelenítése (${AVATAR_OPTIONS.length})`
                : `+ Show all (${AVATAR_OPTIONS.length})`}
            </button>
          )}
          {error && <p className="mb-3 text-xs text-rose-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("name")}
              className="min-h-[44px] rounded-lg border border-sand px-5 text-sm font-semibold text-ink-body transition hover:bg-cream"
            >
              {isHu ? "Vissza" : "Back"}
            </button>
            <button
              type="button"
              onClick={handleAvatarNext}
              disabled={loading}
              className="flex-1 min-h-[44px] rounded-lg bg-sage px-6 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:opacity-50"
            >
              {loading ? "..." : isHu ? "Tovább" : "Next"}
            </button>
          </div>
        </div>
      )}

      {step === "invite" && (
        <div className="rounded-2xl border border-sand bg-white p-8 shadow-sm">
          <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-1">
            {isHu ? "// 3. lépés" : "// step 3"}
          </p>
          <h1 className="font-fraunces text-xl text-ink mb-2">
            {isHu ? "Tagok meghívása" : "Invite members"}
          </h1>
          <p className="text-sm text-ink-body/70 mb-6">
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
                className="min-h-[44px] rounded-lg border border-sand bg-white px-3 text-sm font-normal text-ink focus:border-sage focus:outline-none"
              />
            ))}
          </div>
          {error && <p className="mb-3 text-xs text-rose-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("avatar")}
              className="min-h-[44px] rounded-lg border border-sand px-5 text-sm font-semibold text-ink-body transition hover:bg-cream"
            >
              {isHu ? "Vissza" : "Back"}
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 min-h-[44px] rounded-lg bg-sage px-6 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:opacity-50"
            >
              {loading ? "..." : isHu ? "Befejezés" : "Finish setup"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
