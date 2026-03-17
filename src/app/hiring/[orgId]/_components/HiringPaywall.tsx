import Link from "next/link";

interface HiringPaywallProps {
  orgId: string;
  isHu: boolean;
}

export function HiringPaywall({ isHu }: HiringPaywallProps) {
  const features = [
    {
      icon: "📧",
      title: isHu ? "Email meghívó" : "Email invite",
      desc: isHu
        ? "Jelölt kap egyedi linket a kitöltéshez"
        : "Candidate gets a unique link for the assessment",
    },
    {
      icon: "📊",
      title: isHu ? "HEXACO összehasonlítás" : "HEXACO comparison",
      desc: isHu
        ? "Jelölt profilja a csapat mellé"
        : "Candidate profile alongside the team",
    },
    {
      icon: "🎯",
      title: isHu ? "Role Fit elemzés" : "Role Fit analysis",
      desc: isHu
        ? "Melyik szerepet töltené be a csapatban"
        : "Which role the candidate would fill in the team",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a1814] text-2xl">
        🔒
      </div>

      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#c8410a]">
        {isHu ? "// prémium funkció" : "// premium feature"}
      </p>
      <h1 className="mb-3 font-playfair text-3xl text-[#1a1814]">
        trita Hiring
      </h1>
      <p className="mb-2 max-w-md text-sm text-[#5a5650] leading-relaxed">
        {isHu
          ? "Jelölteket hívhatsz meg HEXACO felmérésre, és összehasonlíthatod a profiljukat a meglévő csapatod személyiségtérképével."
          : "Invite candidates to a HEXACO assessment and compare their profile with your existing team's personality map."}
      </p>
      <p className="mb-8 text-xs text-[#a09a90]">
        {isHu ? "Elérhető: trita Org csomag" : "Available: trita Org plan"}
      </p>

      <div className="mb-8 grid w-full max-w-lg grid-cols-1 gap-3 text-left md:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-[#e8e4dc] bg-white p-4"
          >
            <div className="mb-2 text-xl">{f.icon}</div>
            <p className="mb-1 text-[13px] font-semibold text-[#1a1814]">{f.title}</p>
            <p className="text-[11px] text-[#a09a90] leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <Link
        href="/billing/upgrade"
        className="min-h-[44px] inline-flex items-center rounded-lg bg-[#c8410a] px-8 text-sm font-semibold text-white transition hover:bg-[#b53a09]"
      >
        {isHu ? "Előfizetés frissítése →" : "Upgrade subscription →"}
      </Link>
    </div>
  );
}
