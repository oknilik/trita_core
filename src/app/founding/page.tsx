"use client";

import { useState, type FormEvent, type ReactNode } from "react";

const benefitGroups = [
  [
    {
      number: "01",
      title: "Org csomag - EUR99/hó",
      desc: "Az Org csomag normál ára EUR149/hó. Alapító ügyfélként ezt örökre EUR99/hó áron kapod: korlátlan csapat, szervezeti szerepkörök, teljes platform-hozzáférés.",
    },
    {
      number: "02",
      title: "Ingyenes onboarding session",
      desc: "Egy 60 perces közös workshop, ahol értelmezzük a csapatprofilotokat, azonosítjuk a feszültségpontokat, és konkrét következő lépéseket rakunk össze.",
    },
    {
      number: "03",
      title: "3 hiring kredit ajándékba",
      desc: "Kockázat nélkül kipróbálhatod, hogyan illeszkednek a jelöltek a meglévő csapatmintázatokhoz, még azelőtt, hogy döntést hoznál.",
    },
  ],
  [
    {
      number: "04",
      title: "Prioritás a roadmapben",
      desc: "Az alapító ügyfelek visszajelzése közvetlenül alakítja a termék irányát. Amit valóban használnátok, annak nagyobb esélye van gyorsan elkészülni.",
    },
    {
      number: "05",
      title: "Korai hozzáférés",
      desc: "Az olyan funkciókhoz, mint a tension pair elemzés, a team heatmap vagy az AI-értelmezés, ti fértek hozzá elsőként.",
    },
    {
      number: "06",
      title: "Founding member státusz",
      desc: "Az alapító kedvezmény és a státusz megmarad, amíg előfizetők vagytok. Ez nem időszakos promóció, hanem belépés a legkorábbi körbe.",
    },
  ],
] as const;

const steps = [
  {
    step: "01",
    title: "Felmérés",
    desc: "A csapattagok online kitöltik a tudományosan validált személyiségtesztet, nagyjából 15 perc alatt. Opcionálisan observer visszajelzés is kérhető.",
  },
  {
    step: "02",
    title: "Mintázat",
    desc: "A platform megmutatja a csapat heatmapjét, radar chartjait és az együttműködési összképet, így gyorsan láthatóvá válik, hol van összhang és hol csúszik a működés.",
  },
  {
    step: "03",
    title: "Akció",
    desc: "Az onboarding session és a dashboard alapján közösen kijelöljük a kritikus feszültségeket, majd akciótervet építünk rájuk a következő 90 napra.",
  },
] as const;

const commitments = [
  {
    title: "Aktív használat",
    desc: "A csapatod kitölti a felmérést, te pedig a 90 nap alatt ténylegesen használod a platformot döntéselőkészítésre és csapatfejlesztésre.",
  },
  {
    title: "Két feedback beszélgetés",
    desc: "A 30. és 60. napon egy-egy 20-30 perces beszélgetésben átmegyünk azon, mi működött, mi akadt el, és mit érdemes fejlesztenünk.",
  },
  {
    title: "Testimonial és referral",
    desc: "Ha valódi értéket adtunk, egy rövid ajánlást és 1-2 releváns bemutatást kérünk hasonló cégek felé.",
  },
] as const;

const signals = [
  { value: "10", label: "nyitott hely" },
  { value: "90", label: "nap közös munka" },
  { value: "24h", label: "válaszidő" },
] as const;

export default function FoundingPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", size: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/founding-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="bg-cream text-ink selection:bg-bronze/20">
      <section className="border-b border-sand">
        <div className="mx-auto max-w-[1120px] px-7 pb-14 pt-12 md:pb-20 md:pt-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_380px] lg:items-start">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px w-8 bg-bronze" />
                <span className="font-dm-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-bronze">
                  Founding program
                </span>
              </div>

              <div className="mb-6 inline-flex items-center rounded-full border border-bronze/15 bg-bronze/8 px-4 py-1.5 text-sm font-medium text-bronze">
                10 hely · Alapító ügyfél program
              </div>

              <h1 className="max-w-[11ch] font-fraunces text-[clamp(3rem,8vw,5.2rem)] leading-[0.98] tracking-tight text-ink">
                Tedd láthatóvá, hogyan <em className="not-italic text-bronze">működik a csapatod.</em>
              </h1>

              <p className="mt-6 max-w-[620px] text-lg leading-[1.8] text-ink-body md:text-[19px]">
                A trita csapatdiagnosztikai platform segít felismerni a rejtett mintázatokat,
                feszültségeket és potenciált a csapatodban validált személyiséglélektani adatok
                alapján. Az első 10 ügyfélnek különleges feltételekkel.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="#jelentkezes"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-xl bg-bronze px-7 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-bronze-dark hover:shadow-lg"
                >
                  Jelentkezem a programba
                </a>
                <a
                  href="#mit-kapsz"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-xl border border-sand bg-white px-7 py-3.5 text-base font-semibold text-ink transition-colors hover:border-sage/25 hover:text-sage"
                >
                  Mit kapsz pontosan?
                </a>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <MetaChip>90 nap teljes hozzáférés</MetaChip>
                <MetaChip>Örökös EUR99/hó ár</MetaChip>
                <MetaChip>Személyes onboarding</MetaChip>
              </div>
            </div>

            <aside className="overflow-hidden rounded-[24px] border border-sand bg-white shadow-[0_24px_60px_rgba(26,26,46,0.06)]">
              <div className="border-b border-sand bg-warm px-6 py-6">
                <p className="font-dm-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze">
                  Miért most
                </p>
                <p className="mt-3 font-fraunces text-[28px] leading-tight text-ink">
                  Nem még egy kérdőív, hanem egy közös pilot a csapatműködésre.
                </p>
                <p className="mt-3 text-sm leading-7 text-ink-body">
                  Olyan cégeket keresek, akik nemcsak kipróbálni akarják a platformot, hanem
                  tényleg szeretnék érteni, mi zajlik a csapatukban.
                </p>
              </div>

              <div className="grid gap-3 p-5">
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {signals.map((signal) => (
                    <div key={signal.label} className="rounded-2xl border border-sand bg-cream px-4 py-4">
                      <div className="font-fraunces text-4xl leading-none text-bronze">{signal.value}</div>
                      <div className="mt-2 text-sm leading-6 text-ink-body">{signal.label}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-sage/15 bg-sage-soft px-5 py-5">
                  <p className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-sage-dark/70">
                    Mire jó ez a 90 nap
                  </p>
                  <p className="mt-2 text-sm leading-7 text-ink-body">
                    Látni fogjátok, hogy milyen mintázatok támogatják a csapatot, hol vannak
                    a súrlódások, és hogyan lehet ezt a hiringben vagy a mindennapi együttműködésben
                    is használni.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <EditorialSection
        id="mit-kapsz"
        eyebrow="Mit kapsz"
        title="90 nap teljes hozzáféréssel, személyes támogatással."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {benefitGroups.map((group, columnIndex) => (
            <div key={columnIndex} className="grid gap-5">
              {group.map((item) => (
                <FeatureCard key={item.number} {...item} />
              ))}
            </div>
          ))}
        </div>
      </EditorialSection>

      <EditorialSection
        eyebrow="Hogyan működik"
        title="Három lépés a jobb csapatdöntésekig."
      >
        <div className="grid gap-5">
          {steps.map((item) => (
            <StepCard key={item.step} {...item} />
          ))}
        </div>
      </EditorialSection>

      <EditorialSection
        eyebrow="Mit kérünk cserébe"
        title="Őszinte visszajelzést, valódi használat mellett."
      >
        <div className="grid gap-4">
          {commitments.map((item) => (
            <CommitmentCard key={item.title} {...item} />
          ))}
        </div>
      </EditorialSection>

      <section id="jelentkezes" className="border-t border-sand">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-14 md:py-20 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-bronze" />
              <span className="font-dm-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-bronze">
                Jelentkezés
              </span>
            </div>
            <h2 className="font-fraunces text-[clamp(2.1rem,4.5vw,3.4rem)] leading-[1.02] tracking-tight text-ink">
              Foglald le a helyed a korai körben.
            </h2>
            <p className="mt-5 max-w-[28rem] text-base leading-8 text-ink-body">
              Töltsd ki az alábbi formot, és 24 órán belül visszajelzek. Egy rövid beszélgetéssel
              kezdünk, kötelezettség nélkül.
            </p>
            <div className="mt-7 rounded-2xl border border-sand bg-warm px-5 py-5">
              <p className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-sage-dark/70">
                Jó fit akkor, ha
              </p>
              <p className="mt-2 text-sm leading-7 text-ink-body">
                van legalább egy kisebb csapatod, nyitott vagy a viselkedésminták feltárására,
                és érdekel, hogyan lehet ezt felvételben vagy fejlesztésben használni.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-sand bg-white p-6 shadow-[0_24px_60px_rgba(26,26,46,0.06)] md:p-8">
            {status === "sent" ? (
              <div className="rounded-[22px] border border-sage/15 bg-sage-soft px-6 py-10 text-center">
                <div className="font-fraunces text-5xl leading-none text-bronze">+</div>
                <h3 className="mt-4 font-fraunces text-3xl leading-tight text-ink">
                  Köszönöm a jelentkezést.
                </h3>
                <p className="mt-3 text-base leading-8 text-ink-body">
                  24 órán belül személyesen kereslek az általad megadott email címen.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-5">
                  <div>
                    <p className="font-fraunces text-[28px] leading-tight text-ink">Rövid jelentkezés</p>
                    <p className="mt-1 text-sm leading-6 text-ink-body">
                      2 perc alatt kitölthető, és elég egy mondat is, ha most ennyi fér bele.
                    </p>
                  </div>
                  <span className="rounded-full border border-bronze/15 bg-bronze/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-bronze">
                    10 helyből indulunk
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField label="Név" required>
                      <input
                        required
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Vezetéknév Keresztnév"
                        className="w-full rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink placeholder:text-ink-body/45 transition-all focus:border-bronze/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bronze/15"
                      />
                    </FormField>

                    <FormField label="Email" required>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="nev@ceg.hu"
                        className="w-full rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink placeholder:text-ink-body/45 transition-all focus:border-bronze/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bronze/15"
                      />
                    </FormField>
                  </div>

                  <FormField label="Cég neve" required>
                    <input
                      required
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Pl. Innovate Kft."
                      className="w-full rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink placeholder:text-ink-body/45 transition-all focus:border-bronze/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bronze/15"
                    />
                  </FormField>

                  <FormField label="Csapatméret">
                    <select
                      value={form.size}
                      onChange={(e) => setForm({ ...form, size: e.target.value })}
                      className="w-full rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink transition-all focus:border-bronze/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bronze/15"
                    >
                      <option value="">Válassz...</option>
                      <option value="5-10">5-10 fő</option>
                      <option value="11-25">11-25 fő</option>
                      <option value="26-50">26-50 fő</option>
                      <option value="51-80">51-80 fő</option>
                      <option value="80+">80+ fő</option>
                    </select>
                  </FormField>

                  <FormField label="Mi a legfontosabb kérdésed a csapatoddal kapcsolatban?">
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={4}
                      placeholder="Opcionális, de sokat segít az első beszélgetéshez."
                      className="w-full resize-none rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink placeholder:text-ink-body/45 transition-all focus:border-bronze/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bronze/15"
                    />
                  </FormField>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="inline-flex min-h-[54px] items-center justify-center rounded-xl bg-bronze px-8 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-bronze-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === "sending" ? "Küldés..." : "Jelentkezem az alapító programba"}
                    </button>
                    <p className="text-sm leading-6 text-ink-body">
                      Inkább emailben?{" "}
                      <a href="mailto:hello@trita.io" className="font-medium text-sage transition-colors hover:text-sage-dark">
                        hello@trita.io
                      </a>
                    </p>
                  </div>

                  {status === "error" && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      Hiba történt. Kérlek próbáld újra, vagy írj közvetlenül a hello@trita.io címre.
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function EditorialSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-t border-sand">
      <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-14 md:py-20 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <p className="font-dm-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-bronze">
            {eyebrow}
          </p>
        </div>
        <div>
          <h2 className="max-w-[13ch] font-fraunces text-[clamp(2.1rem,4.5vw,3.4rem)] leading-[1.02] tracking-tight text-ink">
            {title}
          </h2>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-sand bg-white px-3 py-1.5 text-sm text-ink-body">
      {children}
    </span>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-1 text-bronze">*</span>}
      </span>
      {children}
    </label>
  );
}

function FeatureCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <article className="rounded-[24px] border border-sand bg-white p-6 shadow-[0_16px_40px_rgba(26,26,46,0.04)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="font-dm-sans text-xs font-semibold uppercase tracking-[0.2em] text-bronze/70">
          {number}
        </span>
        <div className="h-px flex-1 bg-sand" />
      </div>
      <h3 className="font-fraunces text-[27px] leading-tight text-ink">{title}</h3>
      <p className="mt-3 text-base leading-8 text-ink-body">{desc}</p>
    </article>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <article className="grid gap-5 rounded-[24px] border border-sand bg-white p-6 shadow-[0_16px_40px_rgba(26,26,46,0.04)] md:grid-cols-[88px_minmax(0,1fr)] md:items-start">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bronze/10 font-fraunces text-2xl text-bronze">
        {step}
      </div>
      <div>
        <h3 className="font-fraunces text-[30px] leading-tight text-ink">{title}</h3>
        <p className="mt-3 max-w-[56rem] text-base leading-8 text-ink-body">{desc}</p>
      </div>
    </article>
  );
}

function CommitmentCard({ title, desc }: { title: string; desc: string }) {
  return (
    <article className="rounded-[24px] border border-sand bg-warm px-6 py-6">
      <p className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-sage-dark/70">
        Elvárás
      </p>
      <h3 className="mt-2 font-fraunces text-[28px] leading-tight text-ink">{title}</h3>
      <p className="mt-3 text-base leading-8 text-ink-body">{desc}</p>
    </article>
  );
}
