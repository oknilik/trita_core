import Link from "next/link";

interface HiringPaywallProps {
  orgId: string;
  isHu: boolean;
  variant: "no-subscription" | "addon";
  planTier?: string;
  isAdmin?: boolean;
}

export function HiringPaywall({ isHu, variant, isAdmin = false }: HiringPaywallProps) {
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

  const isAddon = variant === "addon";

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a1814] text-2xl">
        {isAddon ? "🚀" : "🔒"}
      </div>

      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#c8410a]">
        {isAddon
          ? "// add-on"
          : isHu ? "// prémium funkció" : "// premium feature"}
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
        {isAddon
          ? isHu
            ? "A Team csomaghoz add-onként elérhető · €39 / jelölt értékelés"
            : "Available as Team add-on · €39 / candidate assessment"
          : isHu
            ? "Elérhető: trita Org csomag vagy Team add-on"
            : "Available: trita Org plan or Team add-on"}
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

      <div className="flex flex-col items-center gap-3">
        {isAddon ? (
          isAdmin ? (
            <>
              <a
                href="/billing/checkout?plan=candidate_addon"
                className="min-h-[44px] inline-flex items-center rounded-lg bg-[#c8410a] px-8 text-sm font-semibold text-white transition hover:bg-[#b53a09]"
              >
                {isHu
                  ? "Jelölt értékelés aktiválása · €39"
                  : "Activate candidate assessment · €39"}
              </a>
              <p className="text-xs text-[#a09a90]">
                {isHu
                  ? "Vagy frissíts Org csomagra a korlátlan hozzáférésért"
                  : "Or upgrade to Org plan for unlimited access"}
              </p>
              <Link
                href="/billing/checkout?plan=org_monthly"
                className="text-xs font-semibold text-[#c8410a] underline decoration-[#c8410a]/30 hover:decoration-[#c8410a]"
              >
                {isHu ? "Org csomag részletei →" : "Org plan details →"}
              </Link>
            </>
          ) : (
            <p className="max-w-sm text-center text-sm text-[#5a5650]">
              {isHu
                ? "Az add-on aktiválásához adminisztrátori jogosultság szükséges. Kérj meg egy adminisztrátort."
                : "Admin permissions are required to activate this add-on. Ask your organization admin."}
            </p>
          )
        ) : isAdmin ? (
          <Link
            href="/billing/checkout?plan=org_monthly"
            className="min-h-[44px] inline-flex items-center rounded-lg bg-[#c8410a] px-8 text-sm font-semibold text-white transition hover:bg-[#b53a09]"
          >
            {isHu ? "Előfizetés aktiválása →" : "Activate subscription →"}
          </Link>
        ) : (
          <p className="max-w-sm text-center text-sm text-[#5a5650]">
            {isHu
              ? "Az előfizetés aktiválásához adminisztrátori jogosultság szükséges."
              : "Admin permissions are required to activate the subscription."}
          </p>
        )}
      </div>
    </div>
  );
}
