export const BLOG_TOPIC_QUERY_KEY = "topic";

export function toBlogTopicParam(tag: string): string {
  return tag
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveBlogTopic(
  param: string | null,
  availableTags: readonly string[],
): string | null {
  if (!param) return null;
  return (
    availableTags.find((tag) => toBlogTopicParam(tag) === param.toLowerCase()) ??
    null
  );
}
