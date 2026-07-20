const LEVEL_NAMES: string[] = [
  "Explorer",
  "Apprentice",
  "Scholar",
  "Practitioner",
  "Architect",
  "Master",
  "Mentor",
  "Innovator",
  "Luminary",
  "Legend",
]

export function getLevelName(level: number): string {
  const index = Math.min(Math.max(level - 1, 0), LEVEL_NAMES.length - 1)
  return LEVEL_NAMES[index]
}
