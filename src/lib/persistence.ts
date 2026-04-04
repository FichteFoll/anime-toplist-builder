import {
  animeFormats,
  animeSeasons,
  animeTitleLanguages,
  themePreferences,
  type AnimeSelection,
  type AnimeTitleLanguage,
  type Template,
  type TemplateOrigin,
  type TemplateSelectionsMap,
  type ThemePreference,
} from '@/types'

import {
  createTemplateExportPayload,
  normalizeImportedTemplate,
  parseTemplateImportPayload,
} from '@/lib/template-validation'

const templatesStorageKey = 'anime-toplist.templates.v1'
const settingsStorageKey = 'anime-toplist.settings.v1'
const selectionsStorageKey = 'anime-toplist.selections.v1'

const templatesStorageSchemaVersion = 1 as const
const settingsStorageSchemaVersion = 1 as const
const selectionsStorageSchemaVersion = 1 as const

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

type JsonRecord = Record<string, unknown>

interface StoredTemplatesRecordV1 {
  schemaVersion: typeof templatesStorageSchemaVersion
  templates: Array<
    ReturnType<typeof createTemplateExportPayload> & {
      origin: TemplateOrigin
      remoteUrl?: string
    }
  >
}

interface LoadedTemplatesRecord {
  templates: Template[]
  remoteTemplateUrls: Record<string, string>
}

interface StoredSettingsRecordV1 {
  schemaVersion: typeof settingsStorageSchemaVersion
  themePreference: ThemePreference
  titleLanguage: AnimeTitleLanguage
  lastOpenedTemplateId?: string
}

interface StoredSelectionsRecordV1 {
  schemaVersion: typeof selectionsStorageSchemaVersion
  selections: TemplateSelectionsMap
}

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === 'string'

const isNullableString = (value: unknown): value is string | null =>
  typeof value === 'string' || value === null

const isNullableInteger = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isInteger(value))

const isNullableAnimeSeason = (
  value: unknown,
): value is (typeof animeSeasons)[number] | null =>
  value === null || (typeof value === 'string' && animeSeasons.includes(value as (typeof animeSeasons)[number]))

const isNullableAnimeFormat = (
  value: unknown,
): value is (typeof animeFormats)[number] | null =>
  value === null || (typeof value === 'string' && animeFormats.includes(value as (typeof animeFormats)[number]))

const isTemplateOrigin = (value: unknown): value is TemplateOrigin =>
  value === 'user' || value === 'imported-file' || value === 'imported-url' || value === 'predefined'

const isHttpUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false
  }

  try {
    const parsedUrl = new URL(value)

    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

const createDefaultSettingsRecord = (): StoredSettingsRecordV1 => ({
  schemaVersion: settingsStorageSchemaVersion,
  themePreference: 'system',
  titleLanguage: 'userPreferred',
})

export const getBrowserStorage = (): BrowserStorage | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

const readJsonRecord = (storage: BrowserStorage | null, key: string) => {
  if (!storage) {
    return null
  }

  const serializedValue = storage.getItem(key)

  if (!serializedValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(serializedValue) as unknown

    return isRecord(parsedValue) ? parsedValue : null
  } catch {
    return null
  }
}

const writeJsonRecord = (storage: BrowserStorage | null, key: string, value: unknown) => {
  if (!storage) {
    return
  }

  storage.setItem(key, JSON.stringify(value))
}

const parseStoredTemplate = (value: unknown): { template: Template; remoteUrl?: string } | null => {
  if (!isRecord(value) || !isTemplateOrigin(value.origin)) {
    return null
  }

  try {
    const payload = parseTemplateImportPayload(value)

    const template = normalizeImportedTemplate(payload, value.origin)
    const remoteUrl = isHttpUrl(value.remoteUrl) ? value.remoteUrl : undefined

    return {
      template,
      remoteUrl,
    }
  } catch {
    return null
  }
}

const parseStoredAnimeSelection = (value: unknown): AnimeSelection | null => {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.mediaId !== 'number' ||
    !Number.isInteger(value.mediaId) ||
    !isRecord(value.title) ||
    !isString(value.title.userPreferred) ||
    !isNullableString(value.title.romaji) ||
    !isNullableString(value.title.english) ||
    !isNullableString(value.title.native) ||
    !isRecord(value.coverImage) ||
    !isString(value.coverImage.large) ||
    !isNullableString(value.coverImage.medium) ||
    !isNullableString(value.coverImage.extraLarge) ||
    !isNullableString(value.coverImage.color)
  ) {
    return null
  }

  if (value.season !== undefined && !isNullableAnimeSeason(value.season)) {
    return null
  }

  if (value.seasonYear !== undefined && !isNullableInteger(value.seasonYear)) {
    return null
  }

  if (value.format !== undefined && !isNullableAnimeFormat(value.format)) {
    return null
  }

  return {
    mediaId: value.mediaId,
    title: {
      userPreferred: value.title.userPreferred,
      romaji: value.title.romaji ?? null,
      english: value.title.english ?? null,
      native: value.title.native ?? null,
    },
    coverImage: {
      large: value.coverImage.large,
      medium: value.coverImage.medium ?? null,
      extraLarge: value.coverImage.extraLarge ?? null,
      color: value.coverImage.color ?? null,
    },
    season: value.season === undefined ? null : value.season,
    seasonYear: value.seasonYear === undefined ? null : value.seasonYear,
    format: value.format === undefined ? null : value.format,
  }
}

export const loadStoredTemplates = (storage = getBrowserStorage()): LoadedTemplatesRecord => {
  const value = readJsonRecord(storage, templatesStorageKey)

  if (!value || value.schemaVersion !== templatesStorageSchemaVersion || !Array.isArray(value.templates)) {
    return {
      templates: [],
      remoteTemplateUrls: {},
    }
  }

  const templates: Template[] = []
  const remoteTemplateUrls: Record<string, string> = {}

  for (const entry of value.templates) {
    const parsedTemplate = parseStoredTemplate(entry)

    if (!parsedTemplate) {
      continue
    }

    templates.push(parsedTemplate.template)

    if (parsedTemplate.remoteUrl && parsedTemplate.template.origin === 'imported-url') {
      remoteTemplateUrls[parsedTemplate.template.id] = parsedTemplate.remoteUrl
    }
  }

  return {
    templates,
    remoteTemplateUrls,
  }
}

export const saveStoredTemplates = (
  templates: Template[],
  remoteTemplateUrls: Record<string, string>,
  storage = getBrowserStorage(),
) => {
  const persistedTemplates: StoredTemplatesRecordV1 = {
    schemaVersion: templatesStorageSchemaVersion,
    templates: templates
      .filter((template) => template.origin !== 'predefined')
      .map((template) => ({
        ...createTemplateExportPayload(template),
        origin: template.origin,
        remoteUrl:
          template.origin === 'imported-url' ? remoteTemplateUrls[template.id] : undefined,
      })),
  }

  writeJsonRecord(storage, templatesStorageKey, persistedTemplates)
}

export const loadStoredSettings = (storage = getBrowserStorage()): StoredSettingsRecordV1 => {
  const value = readJsonRecord(storage, settingsStorageKey)

  if (!value || value.schemaVersion !== settingsStorageSchemaVersion) {
    return createDefaultSettingsRecord()
  }

  return {
    schemaVersion: settingsStorageSchemaVersion,
    themePreference: themePreferences.includes(value.themePreference as ThemePreference)
      ? (value.themePreference as ThemePreference)
      : 'system',
    titleLanguage: animeTitleLanguages.includes(value.titleLanguage as AnimeTitleLanguage)
      ? (value.titleLanguage as AnimeTitleLanguage)
      : 'userPreferred',
    lastOpenedTemplateId: isString(value.lastOpenedTemplateId) ? value.lastOpenedTemplateId : undefined,
  }
}

export const saveStoredSettings = (
  settings: Omit<StoredSettingsRecordV1, 'schemaVersion'>,
  storage = getBrowserStorage(),
) => {
  writeJsonRecord(storage, settingsStorageKey, {
    schemaVersion: settingsStorageSchemaVersion,
    ...settings,
  } satisfies StoredSettingsRecordV1)
}

export const loadStoredSelections = (storage = getBrowserStorage()): TemplateSelectionsMap => {
  const value = readJsonRecord(storage, selectionsStorageKey)

  if (!value || value.schemaVersion !== selectionsStorageSchemaVersion || !isRecord(value.selections)) {
    return {}
  }

  const selections: TemplateSelectionsMap = {}

  for (const [templateId, categorySelectionsValue] of Object.entries(value.selections)) {
    if (!isRecord(categorySelectionsValue)) {
      continue
    }

    const categorySelections: TemplateSelectionsMap[string] = {}

    for (const [categoryId, selectionValue] of Object.entries(categorySelectionsValue)) {
      if (selectionValue === null) {
        categorySelections[categoryId] = null
        continue
      }

      const selection = parseStoredAnimeSelection(selectionValue)

      if (selection) {
        categorySelections[categoryId] = selection
      }
    }

    if (Object.keys(categorySelections).length > 0) {
      selections[templateId] = categorySelections
    }
  }

  return selections
}

export const saveStoredSelections = (
  selections: TemplateSelectionsMap,
  storage = getBrowserStorage(),
) => {
  const payload: StoredSelectionsRecordV1 = {
    schemaVersion: selectionsStorageSchemaVersion,
    selections,
  }

  if (Object.keys(selections).length === 0 && storage) {
    storage.removeItem(selectionsStorageKey)
    return
  }

  writeJsonRecord(storage, selectionsStorageKey, payload)
}
