"use client";

import { HowYouWorkSection } from "@/components/results/HowYouWorkSection";
import { IdealEnvironmentSection } from "@/components/results/IdealEnvironmentSection";
import { RoleFitSection } from "@/components/results/RoleFitSection";

// A munkastílus három szekciója egy csomagban.
//
// Miért külön komponens: a szekciók kliens-oldaliak (locale-kontextus), a
// `/workstyle` oldal viszont szerver-komponens. Ez a burkoló a határ — és
// egyben egy helyen tartja a sorrendet: narratíva → környezet → szerep.

interface WorkstyleSectionsProps {
  isUnlocked: boolean;
  howYouWork: string[];
  envItems: { label: string; value: string }[];
  roleFit: {
    strong: string;
    might: string;
    prep: string;
    strongRoles?: string[];
    mightRoles?: string[];
    prepRoles?: string[];
  };
}

export function WorkstyleSections({
  isUnlocked,
  howYouWork,
  envItems,
  roleFit,
}: WorkstyleSectionsProps) {
  return (
    <div className="flex flex-col gap-10 md:gap-14">
      <HowYouWorkSection paragraphs={howYouWork} isUnlocked={isUnlocked} />
      <IdealEnvironmentSection items={envItems} isUnlocked={isUnlocked} />
      <RoleFitSection
        strongFit={roleFit.strong}
        mightWork={roleFit.might}
        needsPrep={roleFit.prep}
        strongRoles={roleFit.strongRoles}
        mightRoles={roleFit.mightRoles}
        prepRoles={roleFit.prepRoles}
        isUnlocked={isUnlocked}
      />
    </div>
  );
}
