"use client";

import { useState, useEffect } from "react";

type Locale = "hu" | "en" | "de";

const texts = {
  tag: { hu: "KÖVETKEZŐ FÁZIS", en: "COMING NEXT", de: "NÄCHSTE PHASE" },
  title: {
    hu: "Mi érdekelne a következő fázisból?",
    en: "What interests you for the next phase?",
    de: "Was interessiert dich für die nächste Phase?",
  },
  subtitle: {
    hu: "Segíts meghatározni, mire fókuszáljunk. Kattints arra, ami számodra releváns lenne.",
    en: "Help us decide what to build next. Click anything that would be relevant to you.",
    de: "Hilf uns zu entscheiden, was wir als Nächstes bauen. Klick, was für dich relevant wäre.",
  },
  thanks: {
    hu: "Köszönjük! Értesítünk, ha elindul.",
    en: "Thank you! We'll let you know when it launches.",
    de: "Danke! Wir melden uns, wenn es startet.",
  },
  features: {
    hu: [
      { key: "team", icon: "👥", label: "Csapatdinamikai elemzés" },
      { key: "comm", icon: "💬", label: "Kommunikációs gap-ek feltárása" },
      { key: "360", icon: "🔄", label: "360°-os visszajelzés munkahelyen" },
    ],
    en: [
      { key: "team", icon: "👥", label: "Team dynamics analysis" },
      { key: "comm", icon: "💬", label: "Communication gap discovery" },
      { key: "360", icon: "🔄", label: "360° feedback at work" },
    ],
    de: [
      { key: "team", icon: "👥", label: "Teamdynamik-Analyse" },
      { key: "comm", icon: "💬", label: "Kommunikationslücken aufdecken" },
      { key: "360", icon: "🔄", label: "360°-Feedback am Arbeitsplatz" },
    ],
  },
};

export function UpcomingFeaturesCTA({ locale }: { locale: string }) {
  const l = (["hu", "en", "de"].includes(locale) ? locale : "en") as Locale;
  const [clicked, setClicked] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/features/interest")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.keys)) {
          setClicked(new Set(data.keys));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const handleClick = (key: string) => {
    // Optimistic toggle
    setClicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

    fetch("/api/features/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureKey: key }),
    }).catch(() => {});
  };

  const features = texts.features[l];

  return (
    <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-pink-50/30 p-6 md:p-8">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
        {texts.tag[l]}
      </div>
      <h2 className="mb-2 text-xl font-bold text-gray-900">{texts.title[l]}</h2>
      <p className="mb-6 text-sm text-gray-500">{texts.subtitle[l]}</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {features.map((f) => {
          const isClicked = clicked.has(f.key);
          return (
            <button
              key={f.key}
              onClick={() => handleClick(f.key)}
              disabled={!loaded}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all disabled:opacity-50 ${
                isClicked
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
              }`}
            >
              <span className="text-base">{f.icon}</span>
              <span className="flex-1">{f.label}</span>
              {isClicked && <span className="text-indigo-500">✓</span>}
            </button>
          );
        })}
      </div>

      {clicked.size > 0 && (
        <p className="mt-4 text-sm font-medium text-indigo-600">
          {texts.thanks[l]}
        </p>
      )}
    </section>
  );
}
