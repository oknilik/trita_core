"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { InlineBanner } from "@/components/ui/primitives/InlineBanner";
import { SelectField } from "@/components/ui/primitives/SelectField";
import { TextField } from "@/components/ui/primitives/TextField";
import { BulkInvitePanel } from "@/components/org/BulkInvitePanel";

type OrgRole = "ORG_ADMIN" | "ORG_MANAGER" | "ORG_MEMBER";

interface OrgInviteFormProps {
  orgId: string;
  locale: string;
  canInviteManager?: boolean; // ORG_ADMIN can set higher roles
}

export function OrgInviteForm({ orgId, locale, canInviteManager = false }: OrgInviteFormProps) {
  const router = useRouter();
  const loc = locale as Locale;
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("ORG_MEMBER");
  // Az egyelemű alak marad az alapértelmezés: a napi művelet egy-egy tag
  // felvétele. A tömeges nézet a pilot-setup (5–30 fős csapat egyben) útja.
  const [bulkMode, setBulkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"success" | "pending" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/org/${orgId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "ALREADY_MEMBER") {
          setError(t("org.forms.alreadyMember", loc));
        } else if (data.error === "ALREADY_IN_ORG") {
          setError(t("org.forms.alreadyInOrgInvite", loc));
        } else if (data.error === "SELF_INVITE") {
          setError(t("org.forms.selfInvite", loc));
        } else {
          setError(t("org.forms.inviteGenericError", loc));
        }
        return;
      }

      setResult(data.pending ? "pending" : "success");
      setEmail("");
      router.refresh();
    } catch {
      setError(t("org.forms.inviteNetworkError", loc));
    } finally {
      setLoading(false);
    }
  }

  const modeToggle = (
    <button
      type="button"
      onClick={() => setBulkMode((current) => !current)}
      className="self-start text-caption font-semibold text-[var(--color-accent-primary)] underline underline-offset-2"
    >
      {bulkMode ? t("org.forms.bulkToggleOff", loc) : t("org.forms.bulkToggleOn", loc)}
    </button>
  );

  if (bulkMode) {
    return (
      <div className="flex flex-col gap-3">
        {canInviteManager && (
          <SelectField
            label={t("org.forms.roleLabel", loc)}
            containerClassName="w-full sm:w-[220px]"
            value={role}
            onChange={(e) => setRole(e.target.value as OrgRole)}
          >
            <option value="ORG_MEMBER">{t("org.forms.roleMember", loc)}</option>
            <option value="ORG_MANAGER">{t("org.forms.roleManager", loc)}</option>
            <option value="ORG_ADMIN">Admin</option>
          </SelectField>
        )}
        <BulkInvitePanel endpoint={`/api/org/${orgId}/invite`} locale={loc} role={role} />
        {modeToggle}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <TextField
          label={t("org.forms.emailLabel", loc)}
          containerClassName="flex-1"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("org.forms.emailPlaceholder", loc)}
          required
        />
        {canInviteManager && (
          <SelectField
            label={t("org.forms.roleLabel", loc)}
            containerClassName="w-full sm:w-[220px]"
            value={role}
            onChange={(e) => setRole(e.target.value as OrgRole)}
          >
            <option value="ORG_MEMBER">{t("org.forms.roleMember", loc)}</option>
            <option value="ORG_MANAGER">{t("org.forms.roleManager", loc)}</option>
            <option value="ORG_ADMIN">Admin</option>
          </SelectField>
        )}
        <Button
          type="submit"
          disabled={loading || !email.trim()}
          className="px-6"
        >
          {loading
            ? t("org.forms.inviteLoading", loc)
            : t("org.forms.inviteButton", loc)}
        </Button>
      </form>

      {result === "success" && (
        <InlineBanner variant="success">
          {t("org.forms.memberAdded", loc)}
        </InlineBanner>
      )}
      {result === "pending" && (
        <InlineBanner variant="warning">
          {t("org.forms.inviteSent", loc)}
        </InlineBanner>
      )}
      {error ? (
        <InlineBanner variant="error">
          {error}
        </InlineBanner>
      ) : null}

      {modeToggle}
    </div>
  );
}
