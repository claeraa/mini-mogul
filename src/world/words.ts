/** Small word-matching helpers shared by the world rules. No AI, no DOM. */

/** Lower-case words, with accents and punctuation removed. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z]+/)
    .filter(Boolean)
}

/** A trailing * matches any ending; otherwise the word, or its plural. */
export function matches(token: string, keyword: string): boolean {
  if (keyword.endsWith('*')) return token.startsWith(keyword.slice(0, -1))
  return token === keyword || token === `${keyword}s` || token === `${keyword}es`
}

/** How many of the keywords appear among the tokens. */
export const hits = (tokens: string[], keywords: string[]) =>
  keywords.filter((keyword) => tokens.some((token) => matches(token, keyword))).length
