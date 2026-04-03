export const LEGACY_AUTHOR_TYPE_MAP: Record<string, string> = {
  writer: "Escritor",
  poet: "Poeta",
  researcher: "Investigador",
  journalist: "Jornalista",
  other: "Outro",
}

export const AUTHOR_TYPE_OPTIONS = ["Escritor", "Poeta", "Investigador", "Jornalista", "Outro"]
export const AUTHOR_GENDER_OPTIONS = ["male", "female"] as const
export const CUSTOM_AUTHOR_TYPE_VALUE = "__custom"

const FEMININE_AUTHOR_TYPE_MAP: Record<string, string> = {
  Escritor: "Escritora",
  Investigador: "Investigadora",
}

export type AuthorGender = (typeof AUTHOR_GENDER_OPTIONS)[number]

export function normalizeAuthorType(value: string | null | undefined) {
  if (!value) return ""
  return LEGACY_AUTHOR_TYPE_MAP[value] ?? value
}

export function isPresetAuthorType(value: string) {
  return AUTHOR_TYPE_OPTIONS.includes(value)
}

export function normalizeAuthorGender(value: string | null | undefined): AuthorGender | null {
  if (value === "male" || value === "female") return value
  return null
}

export function getAuthorNoun(gender: string | null | undefined) {
  return normalizeAuthorGender(gender) === "female" ? "Autora" : "Autor"
}

export function getFeaturedAuthorLabel(gender: string | null | undefined) {
  return normalizeAuthorGender(gender) === "female" ? "Autora em destaque" : "Autor em destaque"
}

export function getAccountOfAuthorLabel(gender: string | null | undefined) {
  return normalizeAuthorGender(gender) === "female" ? "Conta de Autora" : "Conta de Autor"
}

export function getAboutAuthorLabel(gender: string | null | undefined) {
  return normalizeAuthorGender(gender) === "female" ? "Sobre a autora" : "Sobre o autor"
}

export function getGenderedAuthorType(type: string | null | undefined, gender: string | null | undefined) {
  const normalizedType = normalizeAuthorType(type)
  if (!normalizedType) return ""
  if (normalizeAuthorGender(gender) !== "female") return normalizedType
  return FEMININE_AUTHOR_TYPE_MAP[normalizedType] ?? normalizedType
}
