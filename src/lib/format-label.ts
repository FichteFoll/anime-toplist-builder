const specialFormatLabels: Partial<Record<string, string>> = {
  TV: 'TV',
  TV_SHORT: 'TV Short',
  OVA: 'OVA',
  ONA: 'ONA',
}

const specialThemeTypeLabels: Partial<Record<string, string>> = {
  OP: 'Opening',
  ED: 'Ending',
  IN: 'Insert',
}

export const formatAnimeFormatLabel = (value: string) =>
  specialFormatLabels[value] ??
  value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

export const formatThemeTypeLabel = (value: string) =>
  specialThemeTypeLabels[value] ?? formatAnimeFormatLabel(value)
