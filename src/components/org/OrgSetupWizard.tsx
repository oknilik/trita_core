"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { SectionHeading } from "@/components/ui/primitives/SectionHeading";
import { TextField } from "@/components/ui/primitives/TextField";

interface OrgSetupWizardProps {
  orgId: string;
  orgName: string;
  locale: string;
}

type Step = "name" | "invite";

export function OrgSetupWizard({ orgId, orgName, locale }: OrgSetupWizardProps) {
  const router = useRouter();
  const loc = locale as Locale;
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState(orgName);  const [inviteEmails, setInviteEmails] = useState(["", "", ""]);
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
          setError(t("org.setup.nameSaveError", loc));
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
      setError(t("org.setup.networkError", loc));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Progress indicator */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-sm font-bold text-white">
          {step === "name" ? "1" : "✓"}
        </div>
        <div className="h-0.5 flex-1 bg-sand">
          <div className={`h-full bg-sage transition-all ${step === "invite" ? "w-full" : "w-0"}`} />
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${step === "invite" ? "bg-sage text-white" : "bg-sand text-ink-body"}`}>
          2
        </div>
      </div>

      {step === "name" && (
        <div className="rounded-2xl border border-sand bg-white p-8 shadow-sm">
          <SectionEyebrow className="mb-1">
            {t("org.setup.step1Eyebrow", loc)}
          </SectionEyebrow>
          <SectionHeading as="h1" className="mb-2">
            {t("org.setup.step1Title", loc)}
          </SectionHeading>
          <p className="text-sm text-ink-body/70 mb-6">
            {t("org.setup.step1Subtitle", loc)}
          </p>
          <form onSubmit={handleNameNext} className="flex flex-col gap-4">
            <TextField
              label={t("org.setup.nameLabel", loc)}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <Button
              type="submit"
              disabled={!name.trim()}
              loading={loading}
              variant="primary"
            >
              {t("org.setup.next", loc)}
            </Button>
          </form>
        </div>
      )}

      {step === "invite" && (
        <div className="rounded-2xl border border-sand bg-white p-8 shadow-sm">
          <SectionEyebrow className="mb-1">
            {t("org.setup.step3Eyebrow", loc)}
          </SectionEyebrow>
          <SectionHeading as="h1" className="mb-2">
            {t("org.setup.step3Title", loc)}
          </SectionHeading>
          <p className="text-sm text-ink-body/70 mb-6">
            {t("org.setup.step3Subtitle", loc)}
          </p>
          <div className="flex flex-col gap-3 mb-6">
            {inviteEmails.map((email, i) => (
              <TextField
                key={i}
                type="email"
                value={email}
                onChange={(e) => {
                  const next = [...inviteEmails];
                  next[i] = e.target.value;
                  setInviteEmails(next);
                }}
                placeholder={`Email ${i + 1}`}
              />
            ))}
          </div>
          {error && <p className="mb-3 text-xs text-rose-600">{error}</p>}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => setStep("name")}
              variant="secondary"
            >
              {t("org.setup.back", loc)}
            </Button>
            <Button
              type="button"
              onClick={handleFinish}
              loading={loading}
              variant="primary"
              className="flex-1"
            >
              {t("org.setup.finish", loc)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
