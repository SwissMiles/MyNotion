/** "1 week", "3 weeks" — simple s-pluralization. */
export function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
