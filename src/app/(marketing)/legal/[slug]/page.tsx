import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata, clampMetaDescription } from "@/lib/seo";
import {
  getLegalReviewDocument,
  LEGAL_REVIEW_DOCUMENTS,
} from "@/lib/legal/review-documents";
import { LegalDocumentContent } from "./LegalDocumentContent";

interface LegalDocumentPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return LEGAL_REVIEW_DOCUMENTS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: LegalDocumentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getLegalReviewDocument(slug);

  if (!document) return {};

  return {
    ...buildPageMetadata({
      path: `/legal/${document.slug}`,
      title: `${document.title.hu} | trita`,
      description: clampMetaDescription(document.description.hu),
      type: "article",
    }),
    robots: { index: false, follow: true },
  };
}

export default async function LegalDocumentPage({ params }: LegalDocumentPageProps) {
  const { slug } = await params;
  const document = getLegalReviewDocument(slug);

  if (!document) notFound();

  return <LegalDocumentContent document={document} />;
}
