"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/primitives/Card";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";
import { InlineBanner } from "@/components/ui/primitives/InlineBanner";

// Tanácsadói ügyfél-org létrehozó űrlap. A POST /api/org asConsultant ágát
// hívja — a létrehozó ORG_CONSULTANT-ként kerül a szervezetbe.

export function NewClientOrgForm({ isHu }: { isHu: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), asConsultant: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === "NOT_CONSULTANT"
            ? isHu
              ? "Nincs tanácsadói kijelölésed — a platform admin tud hozzárendelni."
              : "You are not an assigned consultant — the platform admin can assign you."
            : isHu
              ? "Nem sikerült létrehozni a szervezetet."
              : "Could not create the organization.",
        );
        return;
      }
      const { org } = await res.json();
      router.push(`/org/${org.id}`);
      router.refresh();
    } catch {
      setError(isHu ? "Hálózati hiba." : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card spacing="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label={isHu ? "Szervezet neve" : "Organization name"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isHu ? "pl. Kovács Kft." : "e.g. Acme Ltd."}
          maxLength={100}
          required
          disabled={loading}
        />
        {error && <InlineBanner variant="error">{error}</InlineBanner>}
        <div>
          <Button type="submit" disabled={!name.trim()} loading={loading} variant="primary">
            {loading
              ? isHu ? "Létrehozás..." : "Creating..."
              : isHu ? "Szervezet létrehozása" : "Create organization"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
