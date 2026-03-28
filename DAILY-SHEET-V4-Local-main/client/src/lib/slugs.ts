/** Build a URL-friendly slug from a name: "Lenny Kravitz" → "lenny-kravitz" */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untitled";
}

/** Build a project path: "/project/7/lenny-kravitz" */
export function projectPath(id: number, name: string, query?: string): string {
  const base = `/project/${id}/${slugify(name)}`;
  return query ? `${base}?${query}` : base;
}
