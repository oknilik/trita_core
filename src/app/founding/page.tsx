"use client";

import { useState } from "react";
import { Footer } from "@/components/Footer";

export default function FoundingPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", size: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
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
    <>
      <div className="bg-founding-bg pb-16 text-founding-text selection:bg-founding-accent/20">
        {/* Mini nav */}
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-12">
          <a
            href="/"
            aria-label="trita"
            className="font-playfair inline-flex items-baseline text-2xl font-black tracking-[-0.03em] text-[#1a1814]"
          >
            {"trit"}<span className="text-[#c8410a]">a</span>
          </a>
          <a
            href="#jelentkezes"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-founding-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-founding-accent-hover"
          >
            Jelentkezem
          </a>
        </nav>

        {/* Hero */}
        <header className="mx-auto max-w-4xl px-6 pb-16 pt-16 md:px-12 md:pt-28">
          <div className="mb-8 inline-block rounded-full bg-founding-accent/10 px-4 py-1.5 text-sm font-medium tracking-wide text-founding-accent">
            10 hely · Alapító ügyfél program
          </div>
          <h1 className="mb-8 font-serif text-4xl font-normal leading-[1.08] text-founding-heading md:text-6xl lg:text-7xl">
            Lásd, ami a csapatodban
            <br />
            <span className="text-founding-accent">nem látszik.</span>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-founding-muted md:text-xl">
            A Trita HEXACO-alapú csapatdiagnosztikai platform és tanácsadási szolgáltatás
            segít felismerni a rejtett mintázatokat, feszültségeket és potenciált a csapatodban.
            Az első 10 ügyfélnek különleges feltételekkel.
          </p>
        </header>

        <Divider />

        {/* Mit kapsz */}
        <section className="mx-auto max-w-4xl px-6 py-20 md:px-12">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-founding-accent">
            Mit kapsz alapító ügyfélként
          </p>
          <h2 className="mb-14 font-serif text-3xl font-normal text-founding-heading md:text-4xl">
            90 nap. Teljes hozzáférés. Személyes támogatás.
          </h2>

          <div className="grid gap-10 md:grid-cols-2 md:gap-14">
            <div className="space-y-6">
              <FeatureBlock
                number="01"
                title="Advisory csomag – €99/hó"
                desc="Az Advisory csomag (normál ár: €149/hó + €400/negyedév) 33%-os kedvezménnyel, örökre. Teljes platform-hozzáférés + negyedéves személyes tanácsadói konzultáció."
              />
              <FeatureBlock
                number="02"
                title="Első konzultáció ingyenes"
                desc="90 perces online session, ahol áttekintjük a csapatod HEXACO-profilját, a feszültségpontokat, és konkrét lépéseket tervezünk."
              />
              <FeatureBlock
                number="03"
                title="3 jelölt-kredit ajándékba"
                desc="Teszteld a hiring fit funkciót: hasonlítsd össze a jelöltek személyiségprofilját a csapat mintázataival, mielőtt döntesz."
              />
            </div>
            <div className="space-y-6">
              <FeatureBlock
                number="04"
                title="Prioritás a fejlesztésben"
                desc="Alapító ügyfelek igényei közvetlen hatással vannak a termék irányára. Amit kérsz, az épül."
              />
              <FeatureBlock
                number="05"
                title="Korai hozzáférés"
                desc="Minden új funkció — tension pair elemzés, team heatmap, AI-értelmezés — hozzád jut el először."
              />
              <FeatureBlock
                number="06"
                title="Founding member badge"
                desc="Az alapító státusz a fiókodon örökre megmarad. A kedvezményes ár nem változik, amíg előfizető vagy."
              />
            </div>
          </div>
        </section>

        <Divider />

        {/* Hogyan működik */}
        <section className="mx-auto max-w-4xl px-6 py-20 md:px-12">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-founding-accent">
            Hogyan működik
          </p>
          <h2 className="mb-14 font-serif text-3xl font-normal text-founding-heading md:text-4xl">
            Három lépés a jobb csapatdöntésekig.
          </h2>

          <div className="space-y-12">
            <StepBlock
              step="1"
              title="Felmérés"
              desc="A csapattagok kitöltik a 60 kérdéses HEXACO személyiségkérdőívet — online, 12-15 perc alatt. Opcionálisan observerek (kollégák, vezetők) is értékelnek."
            />
            <StepBlock
              step="2"
              title="Mintázat"
              desc="A platform azonnal megjeleníti a csapat heatmap-jét, radar chartokat, tension pair-eket és kompatibilitási mátrixot. Látod, hol van összhang — és hol csúszik."
            />
            <StepBlock
              step="3"
              title="Akció"
              desc="A negyedéves tanácsadói konzultáción személyesen értelmezzük az eredményeket, feltárjuk a feszültségek okait, és konkrét akcióterveket dolgozunk ki."
            />
          </div>
        </section>

        <Divider />

        {/* Mit kérünk */}
        <section className="mx-auto max-w-4xl px-6 py-20 md:px-12">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-founding-accent">
            Mit kérünk cserébe
          </p>
          <h2 className="mb-10 font-serif text-3xl font-normal text-founding-heading md:text-4xl">
            Őszinte visszajelzést.
          </h2>
          <div className="space-y-5 rounded-2xl bg-founding-card p-8 text-founding-muted md:p-12">
            <p className="leading-relaxed">
              <strong className="text-founding-text">Aktív használat</strong> — A csapatod kitölti a felmérést, és te rendszeresen használod a platformot a 90 napos program alatt.
            </p>
            <p className="leading-relaxed">
              <strong className="text-founding-text">Két feedback-beszélgetés</strong> — A 30. és 60. napon 20-30 perces interjú arról, mi működik, mi nem, és mit fejlesszünk.
            </p>
            <p className="leading-relaxed">
              <strong className="text-founding-text">Testimonial + referral</strong> — Ha elégedett vagy, egy rövid ajánlás és 1-2 bemutatkozás hasonló cégeknek.
            </p>
          </div>
        </section>

        <Divider />

        {/* Jelentkezési form */}
        <section id="jelentkezes" className="mx-auto max-w-4xl px-6 py-20 md:px-12">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-founding-accent">
            Jelentkezés
          </p>
          <h2 className="mb-4 font-serif text-3xl font-normal text-founding-heading md:text-4xl">
            Foglald le a helyed.
          </h2>
          <p className="mb-10 max-w-xl text-founding-muted">
            Töltsd ki az alábbi formot, és 24 órán belül visszajelzek. Nincs kötelezettség — egy rövid beszélgetéssel kezdünk.
          </p>

          {status === "sent" ? (
            <div className="rounded-2xl bg-founding-card p-8 text-center md:p-12">
              <div className="mb-4 font-serif text-4xl text-founding-accent">✦</div>
              <h3 className="mb-3 font-serif text-2xl font-normal text-founding-heading">
                Köszönöm a jelentkezést!
              </h3>
              <p className="text-founding-muted">24 órán belül személyesen kereslek az általad megadott email címen.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
              <FormField label="Név" required>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Vezetéknév Keresztnév"
                  className="w-full rounded-xl border border-founding-text/15 bg-white px-4 py-3 text-founding-text placeholder:text-founding-text/30 transition-all focus:border-founding-accent/50 focus:outline-none focus:ring-2 focus:ring-founding-accent/30"
                />
              </FormField>

              <FormField label="Email" required>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nev@ceg.hu"
                  className="w-full rounded-xl border border-founding-text/15 bg-white px-4 py-3 text-founding-text placeholder:text-founding-text/30 transition-all focus:border-founding-accent/50 focus:outline-none focus:ring-2 focus:ring-founding-accent/30"
                />
              </FormField>

              <FormField label="Cég neve" required>
                <input
                  required
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Pl. Innovate Kft."
                  className="w-full rounded-xl border border-founding-text/15 bg-white px-4 py-3 text-founding-text placeholder:text-founding-text/30 transition-all focus:border-founding-accent/50 focus:outline-none focus:ring-2 focus:ring-founding-accent/30"
                />
              </FormField>

              <FormField label="Csapatméret">
                <select
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  className="w-full rounded-xl border border-founding-text/15 bg-white px-4 py-3 text-founding-text transition-all focus:border-founding-accent/50 focus:outline-none focus:ring-2 focus:ring-founding-accent/30"
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
                  rows={3}
                  placeholder="Opcionális — de segít felkészülni az első beszélgetésre."
                  className="w-full resize-none rounded-xl border border-founding-text/15 bg-white px-4 py-3 text-founding-text placeholder:text-founding-text/30 transition-all focus:border-founding-accent/50 focus:outline-none focus:ring-2 focus:ring-founding-accent/30"
                />
              </FormField>

              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex min-h-[44px] items-center rounded-lg bg-founding-accent px-10 py-3.5 text-base font-semibold text-white transition-all hover:bg-founding-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "sending" ? "Küldés..." : "Jelentkezem az Alapító Programba"}
              </button>

              {status === "error" && (
                <p className="text-sm text-red-600">
                  Hiba történt. Kérlek próbáld újra, vagy írj közvetlenül a{" "}
                  <a href="mailto:hello@trita.io" className="underline">hello@trita.io</a>{" "}
                  címre.
                </p>
              )}
            </form>
          )}
        </section>
      </div>

      <Footer />
    </>
  );
}

function Divider() {
  return (
    <div className="mx-auto max-w-6xl px-6 md:px-12">
      <div className="h-px bg-founding-text/10" />
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-founding-text">
        {label}
        {required && <span className="ml-0.5 text-founding-accent"> *</span>}
      </label>
      {children}
    </div>
  );
}

function FeatureBlock({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-3">
        <span className="tabular-nums text-sm font-medium text-founding-accent/50">{number}</span>
        <h3 className="text-lg font-semibold text-founding-heading">{title}</h3>
      </div>
      <p className="pl-9 leading-relaxed text-founding-muted">{desc}</p>
    </div>
  );
}

function StepBlock({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-6">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-founding-accent/10 font-serif text-xl font-normal text-founding-accent">
        {step}
      </div>
      <div>
        <h3 className="mb-2 font-serif text-xl font-normal text-founding-heading">{title}</h3>
        <p className="leading-relaxed text-founding-muted">{desc}</p>
      </div>
    </div>
  );
}
