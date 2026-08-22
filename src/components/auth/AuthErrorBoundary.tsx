"use client";

import { Component, type ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import AuthAlert from "@/components/auth/AuthAlert";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/primitives/Button";
import { t } from "@/lib/i18n";

interface BoundaryProps {
  children: ReactNode;
  message: string;
  reloadLabel: string;
}

class Boundary extends Component<BoundaryProps, { hasError: boolean }> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    try {
      window.sessionStorage.clear();
    } catch {
      // A tároló letiltása nem akadályozhatja a helyreállítást.
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <AuthPageShell panelContext="verify">
        <AuthAlert message={this.props.message} />
        <Button type="button" size="lg" fullWidth onClick={() => window.location.reload()}>
          {this.props.reloadLabel}
        </Button>
      </AuthPageShell>
    );
  }
}

export default function AuthErrorBoundary({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  return (
    <Boundary
      message={t("auth.errorBoundaryMessage", locale)}
      reloadLabel={t("auth.errorBoundaryReload", locale)}
    >
      {children}
    </Boundary>
  );
}
