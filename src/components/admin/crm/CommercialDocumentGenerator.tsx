"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CommercialDocumentForm,
  CommercialDocumentKind,
} from "@/lib/crm/commercial-document-schema";
import {
  CRM_FIELD_LABEL_CLASS,
  CRM_INPUT_CLASS,
  CRM_TEXTAREA_CLASS,
  crmRequest,
  formatDateTime,
} from "@/components/admin/crm/crm-ui";
import { Button } from "@/components/ui/primitives/Button";
import { StatusChip } from "@/components/ui/primitives/StatusChip";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";

interface ExistingDocument {
  id: string;
  kind: string;
  version: number;
  status: string;
  generatedAt: string;
  documentNumber: string;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={CRM_FIELD_LABEL_CLASS}>{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={CRM_INPUT_CLASS}
      />
    </label>
  );
}

export function CommercialDocumentGenerator({
  quoteId,
  quoteStatus,
  initialForm,
  documents,
}: {
  quoteId: string;
  quoteStatus: string;
  initialForm: CommercialDocumentForm;
  documents: ExistingDocument[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const patch = <K extends keyof CommercialDocumentForm>(
    key: K,
    value: CommercialDocumentForm[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const patchTeam = (
    index: number,
    changes: Partial<CommercialDocumentForm["teams"][number]>,
  ) =>
    patch(
      "teams",
      form.teams.map((team, teamIndex) =>
        teamIndex === index ? { ...team, ...changes } : team,
      ),
    );

  async function generate(kind: CommercialDocumentKind) {
    setBusy(kind);
    setError(null);
    const response = await crmRequest<{ document: { id: string } }>(
      `/api/admin/crm/quotes/${quoteId}/documents`,
      { method: "POST", body: { kind, form } },
    );
    setBusy(null);
    if (!response.ok) {
      setError(response.error);
      return;
    }
    window.open(
      `/api/admin/crm/documents/${response.data.document.id}/pdf`,
      "_blank",
      "noopener,noreferrer",
    );
    router.refresh();
  }

  async function markStatus(documentId: string, status: "SENT" | "SIGNED") {
    setBusy(documentId);
    setError(null);
    const response = await crmRequest(
      `/api/admin/crm/documents/${documentId}`,
      { method: "PATCH", body: { status } },
    );
    setBusy(null);
    if (!response.ok) {
      setError(response.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-5">
        <DashboardPanel className="p-5">
          <SectionEyebrow>szerződő fél</SectionEyebrow>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Cégnév" value={form.companyName} required onChange={(value) => patch("companyName", value)} />
            <Field label="Székhely" value={form.registeredSeat} onChange={(value) => patch("registeredSeat", value)} />
            <Field label="Cégjegyzékszám" value={form.registrationNumber} onChange={(value) => patch("registrationNumber", value)} />
            <Field label="Adószám" value={form.taxNumber} onChange={(value) => patch("taxNumber", value)} />
            <Field label="Képviselő neve" value={form.representativeName} required onChange={(value) => patch("representativeName", value)} />
            <Field label="Képviselő beosztása" value={form.representativeTitle} onChange={(value) => patch("representativeTitle", value)} />
            <Field label="Kapcsolattartási e-mail" type="email" value={form.contactEmail} required onChange={(value) => patch("contactEmail", value)} />
            <label className="flex flex-col gap-1">
              <span className={CRM_FIELD_LABEL_CLASS}>Elfogadás módja</span>
              <select
                value={form.acceptanceMethod}
                onChange={(event) => patch("acceptanceMethod", event.target.value as CommercialDocumentForm["acceptanceMethod"])}
                className={CRM_INPUT_CLASS}
              >
                <option value="email">E-mailes elfogadás</option>
                <option value="electronic">Elektronikus aláírás</option>
                <option value="paper">Papíralapú aláírás</option>
              </select>
            </label>
          </div>
        </DashboardPanel>

        <DashboardPanel className="p-5">
          <SectionEyebrow>számlázás</SectionEyebrow>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Számlázási név" value={form.billingName} onChange={(value) => patch("billingName", value)} />
            <Field label="Számlázási cím" value={form.billingAddress} onChange={(value) => patch("billingAddress", value)} />
            <Field label="Számlázási adószám" value={form.billingTaxNumber} onChange={(value) => patch("billingTaxNumber", value)} />
            <Field label="Számlázási e-mail" type="email" value={form.billingEmail} onChange={(value) => patch("billingEmail", value)} />
            <Field label="PO / megrendelési szám" value={form.poNumber} onChange={(value) => patch("poNumber", value)} />
            <Field label="Fizetési határidő" type="number" value={form.paymentDueDays} onChange={(value) => patch("paymentDueDays", Number(value))} />
            <div className="md:col-span-2">
              <Field label="Számlázási esemény" value={form.paymentEvent} required onChange={(value) => patch("paymentEvent", value)} />
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel className="p-5">
          <SectionEyebrow>csapatok és időzítés</SectionEyebrow>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            A csapatok darabszámának és összlétszámának pontosan egyeznie kell
            az elfogadott kalkulációval.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {form.teams.map((team, index) => (
              <div key={index} className="grid grid-cols-1 gap-3 rounded-xl border border-sand bg-cream/60 p-3 md:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)]">
                <Field label={`${index + 1}. csapat neve`} value={team.name} required onChange={(value) => patchTeam(index, { name: value })} />
                <Field label="Létszám" type="number" value={team.headcount} onChange={(value) => patchTeam(index, { headcount: Number(value) })} />
                <Field label="Csapatvezető" value={team.leader} onChange={(value) => patchTeam(index, { leader: value })} />
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Tervezett kezdés" type="date" value={form.serviceStart} required onChange={(value) => patch("serviceStart", value)} />
            <Field label="Tervezett zárás" type="date" value={form.serviceEnd} required onChange={(value) => patch("serviceEnd", value)} />
            <Field label="Platform-hozzáférés vége" type="date" value={form.platformAccessEnd} required onChange={(value) => patch("platformAccessEnd", value)} />
          </div>
        </DashboardPanel>

        <DashboardPanel className="p-5">
          <SectionEyebrow>alkalmak</SectionEyebrow>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className={CRM_FIELD_LABEL_CLASS}>Workshop formája</span>
              <select
                value={form.workshopMode}
                onChange={(event) => patch("workshopMode", event.target.value as CommercialDocumentForm["workshopMode"])}
                className={CRM_INPUT_CLASS}
              >
                <option value="in_person">Személyes</option>
                <option value="online">Online</option>
                <option value="hybrid">Hibrid</option>
              </select>
            </label>
            <Field label="Workshop óra / nap" type="number" value={form.workshopHoursPerDay} onChange={(value) => patch("workshopHoursPerDay", Number(value))} />
            <Field label="Indító egyeztetés (perc)" type="number" value={form.kickoffMinutes} onChange={(value) => patch("kickoffMinutes", Number(value))} />
            <Field label="Vezetői feldolgozás (perc)" type="number" value={form.leaderDebriefMinutes} onChange={(value) => patch("leaderDebriefMinutes", Number(value))} />
            <Field label="Kísérési alkalmak" type="number" value={form.consultingSessions} onChange={(value) => patch("consultingSessions", Number(value))} />
            <Field label="Kísérési alkalom (perc)" type="number" value={form.consultingMinutes} onChange={(value) => patch("consultingMinutes", Number(value))} />
            <Field label="Záró értékelés (perc)" type="number" value={form.closingMinutes} onChange={(value) => patch("closingMinutes", Number(value))} />
            <Field label="Szolgáltatói telefonszám" value={form.providerPhone} onChange={(value) => patch("providerPhone", value)} />
          </div>
        </DashboardPanel>

        <DashboardPanel className="p-5">
          <SectionEyebrow>engedélyek és egyedi feltételek</SectionEyebrow>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={CRM_FIELD_LABEL_CLASS}>Referencia</span>
              <select
                value={form.referencePermission}
                onChange={(event) => patch("referencePermission", event.target.value as CommercialDocumentForm["referencePermission"])}
                className={CRM_INPUT_CLASS}
              >
                <option value="none">Nem engedélyezett</option>
                <option value="anonymous">Anonim referencia</option>
                <option value="named">Nevesített referencia és logó</option>
              </select>
            </label>
            <label className="flex min-h-[44px] items-center gap-3 rounded-[10px] border border-border-default bg-surface-card px-3 text-sm text-ink-body">
              <input
                type="checkbox"
                checked={form.researchPermission}
                onChange={(event) => patch("researchPermission", event.target.checked)}
                className="h-4 w-4 accent-sage"
              />
              Anonim, összesített módszertani felhasználás
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className={CRM_FIELD_LABEL_CLASS}>Egyedi feltételek és eltérések</span>
              <textarea
                rows={6}
                maxLength={5000}
                value={form.specialTerms}
                onChange={(event) => patch("specialTerms", event.target.value)}
                className={CRM_TEXTAREA_CLASS}
              />
            </label>
          </div>
        </DashboardPanel>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
        <DashboardPanel className="p-5">
          <SectionEyebrow>generálás</SectionEyebrow>
          <p className="mt-2 text-sm leading-relaxed text-ink-body">
            Minden generálás új, immutábilis verziót készít. A PDF a mentett
            ajánlati pillanatképből számol, nem az aktuális díjtáblából.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              loading={busy === "PROPOSAL"}
              onClick={() => void generate("PROPOSAL")}
            >
              Ajánlat PDF generálása
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={busy === "ORDER_FORM"}
              disabled={quoteStatus !== "ACCEPTED"}
              onClick={() => void generate("ORDER_FORM")}
            >
              Egyedi Megrendelőlap generálása
            </Button>
          </div>
          {quoteStatus !== "ACCEPTED" && (
            <p className="mt-2 text-xs text-muted">
              A megrendelőlap az ajánlat elfogadása után generálható.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-state-error-bg px-3 py-2 text-sm text-state-error-fg">
              {error}
            </p>
          )}
        </DashboardPanel>

        <DashboardPanel className="p-5">
          <SectionEyebrow>elkészült dokumentumok</SectionEyebrow>
          {documents.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Még nincs generált dokumentum.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {documents.map((document) => (
                <div key={document.id} className="rounded-xl border border-sand bg-surface-card p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-ink">
                      {document.documentNumber}
                    </span>
                    <StatusChip variant={document.status === "SIGNED" ? "success" : document.status === "SENT" ? "info" : "neutral"}>
                      {document.status === "SIGNED" ? "Aláírva" : document.status === "SENT" ? "Kiküldve" : "Elkészült"}
                    </StatusChip>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {document.kind === "PROPOSAL" ? "Ajánlat" : "Egyedi Megrendelőlap"} · {formatDateTime(document.generatedAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`/api/admin/crm/documents/${document.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[40px] items-center rounded-lg border border-sand px-3 text-sm font-semibold text-ink-body hover:bg-cream"
                    >
                      PDF
                    </a>
                    {document.status === "GENERATED" && (
                      <Button size="sm" variant="secondary" loading={busy === document.id} onClick={() => void markStatus(document.id, "SENT")}>
                        Kiküldve
                      </Button>
                    )}
                    {document.status !== "SIGNED" && (
                      <Button size="sm" variant="secondary" loading={busy === document.id} onClick={() => void markStatus(document.id, "SIGNED")}>
                        Aláírva
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardPanel>
      </aside>
    </div>
  );
}
