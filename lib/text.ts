export function stripMarkdown(input: string) {
  return input
    .replace(/`{1,3}[^`]+`{1,3}/g, "")
    .replace(/!\[[^\]]*\]\([^\)]+\)/g, "")
    .replace(/\[[^\]]+\]\([^\)]+\)/g, "")
    .replace(/[#>*_~`-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
