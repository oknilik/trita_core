import Image from "next/image";
import type { Locale } from "@/lib/i18n";

const steps = [
  { title: { hu: "Feltérképezzük", en: "Map it" }, text: { hu: "Válaszoltok az elmúlt időszak közös munkájáról. Abból indulunk ki, ami ténylegesen történik.", en: "You answer questions about your recent work together. We start with what actually happens." }, result: { hu: "Egy kép a jelenlegi működésetekről", en: "A picture of how you work today" }, tone: "bg-sage-soft text-sage-dark" },
  { title: { hu: "Megbeszéljük", en: "Discuss it" }, text: { hu: "Hol látjátok hasonlóan a csapatot? Hol más a tapasztalatotok? Mi segít, és mi nehezít?", en: "Where do you see the team similarly? Where do experiences differ? What helps, and what gets in the way?" }, result: { hu: "Közösen értelmezett tapasztalatok", en: "Experiences understood together" }, tone: "bg-bronze-soft text-bronze-dark" },
  { title: { hu: "Kipróbáljátok", en: "Try it" }, text: { hu: "Kiválasztotok egy konkrét változtatást, és megállapodtok abban, hogyan próbáljátok ki.", en: "You choose one concrete change and agree how to try it in practice." }, result: { hu: "Egy vállalható közös lépés", en: "One manageable step together" }, tone: "bg-[var(--color-layer-org-soft)] text-[var(--color-layer-org-accent)]" },
  { title: { hu: "Visszanézzük", en: "Look back" }, text: { hu: "Mi változott a gyakorlatban? Ami segített, megtartjátok. Ami nem, azon alakítotok.", en: "What changed in practice? Keep what helped and adjust what did not." }, result: { hu: "Tapasztalat arról, mi működik nálatok", en: "Evidence of what works for your team" }, tone: "bg-[var(--color-layer-team-soft)] text-[var(--color-layer-team-accent)]" },
];

export function OperatingPatternJourney({ locale, onExplore }: { locale: Locale; onExplore: () => void }) {
  const hu = locale === "hu";
  return <>
    <div className="grid items-center gap-8 pb-10 md:grid-cols-[1.2fr_1fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-sage">{hu ? "Csapatmintázatok" : "Team patterns"}</p>
        <h1 className="mt-4 font-fraunces text-4xl leading-tight tracking-tight sm:text-5xl">{hu ? "A közös munkánk mintázatai" : "Patterns of our shared work"}</h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-body">{hu ? "Mi segít benneteket a közös munkában, és min lenne érdemes változtatni? A működésetek feltérképezése jó kiindulópont a beszélgetéshez." : "What helps you work together, and what would be worth changing? Mapping how you work is a useful starting point for that conversation."}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
          <a href="#operating-process" className="inline-flex min-h-11 items-center gap-3 rounded-xl bg-sage px-5 py-3 text-sm font-medium text-[var(--color-action-primary-fg)] hover:bg-sage-dark">{hu ? "Így dolgozunk vele" : "How we use it"}<span aria-hidden="true">↓</span></a>
          <button type="button" onClick={onExplore} className="min-h-11 py-3 text-sm font-medium text-sage-dark underline underline-offset-4">{hu ? "A minták érdekelnek" : "Explore the patterns"}</button>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md rounded-t-[45%] rounded-b-2xl bg-sage-soft px-4 py-8">
        <Image src="/illustrations/operating-patterns/SOCA.svg" alt="" width={400} height={224} className="h-auto w-full" preload />
        <p className="mt-5 text-center text-xs leading-relaxed text-sage-dark">{hu ? "Megérteni egymást. Alakítani a közös munkát." : "Understand each other. Shape how you work together."}</p>
      </div>
    </div>
    <div className="flex items-center gap-4 border-y border-sand px-2 py-5 text-sm leading-relaxed text-ink-body sm:px-5">
      <span aria-hidden="true" className="h-5 w-5 shrink-0 -rotate-12 rounded-t-full rounded-bl-full bg-bronze" />
      <p><strong className="font-semibold text-ink">{hu ? "Nincs egyetlen ideális csapatminta." : "There is no single ideal team pattern."}</strong>{" "}{hu ? "Az számít, hogyan segíti a működésetek azt, amit együtt szeretnétek elérni." : "What matters is how your way of working supports what you want to achieve together."}</p>
    </div>
    <section id="operating-process" aria-labelledby="operating-process-title" className="scroll-mt-28 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-sage">{hu ? "A felismeréstől a közös gyakorlatig" : "From insight to shared practice"}</p>
      <h2 id="operating-process-title" className="mt-3 font-fraunces text-3xl tracking-tight">{hu ? "Mit kezdhettek a csapatképetekkel?" : "What can you do with your team picture?"}</h2>
      <ol className="mt-7 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => <li key={i} className="flex min-w-0 flex-col">
          <div className="flex items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-fraunces text-xl ${step.tone}`}>{i + 1}</span>{i < 3 && <span aria-hidden="true" className="h-px flex-1 bg-sand" />}</div>
          <h3 className="mt-4 font-fraunces text-xl">{step.title[locale]}</h3>
          <p className="mb-4 mt-2 text-sm leading-relaxed text-ink-body">{step.text[locale]}</p>
          <p className="mt-auto border-t border-sand pt-3 text-xs leading-relaxed text-sage-dark">{step.result[locale]}</p>
        </li>)}
      </ol>
    </section>
    <section aria-labelledby="operating-example-title" className="mb-12 rounded-2xl bg-[var(--color-layer-self-hero-mid)] p-6 text-[var(--color-text-on-inverse)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">{hu ? "Egy hétköznapi helyzetből indulva · példa" : "Starting with an everyday situation · example"}</p>
      <h2 id="operating-example-title" className="mt-3 font-fraunces text-3xl leading-tight">{hu ? "„Sokat várunk egymás döntéseire.”" : "“We spend a lot of time waiting for decisions.”"}</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {[
          [hu ? "Ezt nézzük meg" : "What we explore", hu ? "Hol születnek a döntések, és mely helyzetekben akad el a munka?" : "Where are decisions made, and when does work get stuck?"],
          [hu ? "Ezt beszéljük meg" : "What we discuss", hu ? "Mihez kell központi jóváhagyás, és miben dönthettek önállóan?" : "What needs central approval, and what can you decide independently?"],
          [hu ? "Ezt próbálhatjátok ki" : "What you could try", hu ? "Két hétig három gyakori ügytípusban előre tisztázott döntési jogokkal dolgoztok." : "For two weeks, work with decision rights agreed in advance for three common kinds of issue."],
        ].map(([title, text]) => <div key={title} className="border-t border-current/20 pt-4"><h3 className="text-xs font-semibold text-[var(--color-text-on-inverse-muted)]">{title}</h3><p className="mt-2 text-sm leading-relaxed">{text}</p></div>)}
      </div>
      <p className="mt-6 border-t border-current/20 pt-4 text-sm leading-relaxed"><span className="mr-3 text-[var(--color-text-on-inverse-muted)]">{hu ? "Utána visszanézitek:" : "Then you look back:"}</span><strong className="font-semibold">{hu ? "Kevesebb lett a várakozás? Egyértelműbb, ki dönthet?" : "Was there less waiting? Is it clearer who can decide?"}</strong></p>
    </section>
  </>;
}
