import type { ReportChapterId } from "@/lib/profile-report-view-model";

/** One registry per document (or persona report), never shared between exports. */
export function createChapterPageNumbers(coverPages = 1) {
  const pages: Partial<Record<ReportChapterId, number>> = {};
  return {
    record(chapter: ReportChapterId, pageNumber: number) {
      pages[chapter] = Math.max(1, pageNumber - coverPages);
    },
    read(chapter: ReportChapterId) {
      return pages[chapter];
    },
  };
}

export type ChapterPageNumbers = ReturnType<typeof createChapterPageNumbers>;
