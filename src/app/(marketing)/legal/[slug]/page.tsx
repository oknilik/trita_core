import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata, clampMetaDescription } from "@/lib/seo";
import {
  getLegalDocument,
  LEGAL_DOCUMENTS,
} from "@/lib/legal/documents";
import { LegalDocumentContent } from "./LegalDocumentContent";

interface LegalDocumentPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: LegalDocumentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getLegalDocument(slug);

  if (!document) return {};

  return {
    ...buildPageMetadata({
      path: `/legal/${document.slug}`,
      title: `${document.title.hu} | trita`,
      description: clampMetaDescription(document.description.hu),
      type: "article",
    }),
  };
}

export default async function LegalDocumentPage({ params }: LegalDocumentPageProps) {
  const { slug } = await params;
  const document = getLegalDocument(slug);

  if (!document) notFound();

  return <LegalDocumentContent document={document} />;
}
