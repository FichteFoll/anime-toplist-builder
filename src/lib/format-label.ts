const specialFormatLabels: Partial<Record<string, string>> = {
  TV: 'TV',
  TV_SHORT: 'TV Short',
  OVA: 'OVA',
  ONA: 'ONA',
}

export const formatAnimeFormatLabel = (value: string) =>
  specialFormatLabels[value] ??
  value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
