import { describe, expect, it } from 'vitest'

import { isCategoryId, isTemplateId } from '@/lib/ids'
import {
  TemplateValidationError,
  createTemplateExportPayload,
  normalizeImportedTemplate,
  parseTemplateImportJson,
  parseTemplateImportPayload,
  stringifyTemplateExportPayload,
} from '@/lib/template-validation'
import {
  AnimeFormat,
  CategoryEntityKind,
  CharacterRole,
  TemplateOrigin,
  ThemeType,
  templateSchemaVersion,
  type TemplateImportPayloadV1,
} from '@/types'

describe('template validation', () => {
  it('parses and normalizes imported payload fields', () => {
    const payload = parseTemplateImportPayload({
      version: templateSchemaVersion,
      id: 'validationcase01',
      name: '  Favorites  ',
      description: '  Template context  ',
      globalFilter: {
        genres: ['Drama', 'Action', 'Drama'],
        countryOfOrigin: ['JP', 'CN'],
        tags: ['Cyberpunk', 'Cyberpunk'],
        minimumTagRank: 70,
      },
        categories: [
          {
            id: 'bestpick01',
            name: '  Best Pick  ',
            description: '  A focused choice  ',
            filter: {
              seasons: ['SPRING', 'WINTER', 'SPRING'],
            },
        },
      ],
    })

    expect(payload).toEqual({
      version: templateSchemaVersion,
      id: 'validationcase01',
      name: 'Favorites',
      description: 'Template context',
      globalFilter: {
        yearRange: undefined,
        episodes: undefined,
        duration: undefined,
        seasons: [],
        countriesOfOrigin: ['CN', 'JP'],
        tags: ['Cyberpunk'],
        excludedTags: [],
        minimumTagRank: 70,
        genres: ['Action', 'Drama'],
        excludedGenres: [],
        formats: [],
        popularity: undefined,
        source: [],
        sort: undefined,
      },
      categories: [
        {
          id: 'bestpick01',
          name: 'Best Pick',
          description: 'A focused choice',
          filter: {
            yearRange: undefined,
            episodes: undefined,
            duration: undefined,
            seasons: ['SPRING', 'WINTER'],
            countriesOfOrigin: [],
            tags: [],
            excludedTags: [],
            minimumTagRank: undefined,
            genres: [],
            excludedGenres: [],
            formats: [],
            popularity: undefined,
            source: [],
            sort: undefined,
          },
          entityKind: 'anime',
          songFilter: {
            types: [],
          },
          characterFilter: {
            roles: [],
          },
          voiceActorFilter: {
            languages: [],
          },
        },
      ],
    })
  })

  it('imports the legacy scalar country of origin key', () => {
    const payload = parseTemplateImportPayload({
      version: templateSchemaVersion,
      id: 'legacycountry01',
      name: 'Legacy country',
      globalFilter: {
        countryOfOrigin: 'JP',
      },
      categories: [],
    })

    expect(payload.globalFilter?.countriesOfOrigin).toEqual(['JP'])
  })

  it('rejects unsupported versions and duplicate category ids', () => {
    expect(() =>
      parseTemplateImportPayload({
        version: 99,
        name: 'Broken',
        categories: [],
      }),
    ).toThrowError(TemplateValidationError)

    expect(() =>
      parseTemplateImportPayload({
        version: templateSchemaVersion,
        name: 'Duplicate ids',
        categories: [
          {
            id: 'duplicate01',
            name: 'First',
            description: '',
          },
          {
            id: 'duplicate01',
            name: 'Second',
            description: '',
          },
        ],
      }),
    ).toThrowError(/Duplicate category id detected/)
  })

  it('normalizes imported templates by generating missing ids', () => {
    const template = normalizeImportedTemplate(
      {
        version: templateSchemaVersion,
        name: 'Generated ids',
        description: '  Shared context  ',
        globalFilter: {
        },
        categories: [
          {
            name: 'Opener',
            description: '  Short context  ',
          },
        ],
      },
      TemplateOrigin.ImportedFile,
    )

    expect(isTemplateId(template.id)).toBe(true)
    expect(template.origin).toBe(TemplateOrigin.ImportedFile)
    expect(template.description).toBe('Shared context')
    expect(template.categories).toHaveLength(1)
    expect(isCategoryId(template.categories[0]?.id)).toBe(true)
    expect(template.categories[0]?.description).toBe('Short context')
  })

  it('creates an export payload with stable ids and validated filters', () => {
    const template = normalizeImportedTemplate(
      {
        version: templateSchemaVersion,
        id: 'exportcase01',
        name: 'Export me',
        description: 'Export context',
        globalFilter: {
          formats: [AnimeFormat.Tv, AnimeFormat.Movie],
          minimumTagRank: 40,
        },
        categories: [
          {
            id: 'exportpick01',
            name: 'Pick',
            description: 'Nice pacing',
            filter: {
              genres: ['Mystery'],
            },
          },
        ],
      },
      TemplateOrigin.User,
    )

    expect(createTemplateExportPayload(template)).toEqual({
      version: templateSchemaVersion,
      id: 'exportcase01',
      name: 'Export me',
      description: 'Export context',
      globalFilter: {
        minimumTagRank: 40,
        formats: [AnimeFormat.Movie, AnimeFormat.Tv],
      },
      categories: [
        {
          id: 'exportpick01',
          name: 'Pick',
          description: 'Nice pacing',
          filter: {
            genres: ['Mystery'],
          },
          entityKind: 'anime',
          songFilter: {
            types: [],
          },
          characterFilter: {
            roles: [],
          },
          voiceActorFilter: {
            languages: [],
          },
        },
      ],
    })
  })

  it('omits empty list filters from export JSON', () => {
    const template = normalizeImportedTemplate(
      {
        version: templateSchemaVersion,
        id: 'emptyfilters01',
        name: 'Empty filters',
        categories: [
          {
            id: 'emptycat01',
            name: 'Empty Category',
            description: '',
            filter: {
              tags: [],
              genres: [],
              formats: [],
              source: [],
              seasons: [],
            },
          },
        ],
        globalFilter: {
          tags: [],
          genres: [],
          formats: [],
          source: [],
          seasons: [],
        },
      },
      TemplateOrigin.User,
    )

    expect(stringifyTemplateExportPayload(template)).not.toContain('"seasons": []')
    expect(stringifyTemplateExportPayload(template)).not.toContain('"tags": []')
    expect(stringifyTemplateExportPayload(template)).not.toContain('"genres": []')
    expect(stringifyTemplateExportPayload(template)).not.toContain('"formats": []')
    expect(stringifyTemplateExportPayload(template)).not.toContain('"source": []')
  })

  it('exports the countries of origin under the current key', () => {
    const template = normalizeImportedTemplate(
      {
        version: templateSchemaVersion,
        id: 'countryexport01',
        name: 'Country export',
        globalFilter: {
          countriesOfOrigin: ['JP', 'CN'],
        },
        categories: [],
      },
      TemplateOrigin.User,
    )

    const payload = createTemplateExportPayload(template)

    expect(payload.globalFilter.countriesOfOrigin).toEqual(['CN', 'JP'])
    expect(payload.globalFilter).not.toHaveProperty('countryOfOrigin')
  })

  it('rejects invalid JSON imports early', () => {
    expect(() => parseTemplateImportJson('{oops')).toThrowError(/not valid JSON/)
  })

  it('accepts the documented import payload shape', () => {
    const payload: TemplateImportPayloadV1 = {
      version: templateSchemaVersion,
      id: 'documentedshape01',
      name: 'Documented Shape',
      description: 'Documented context',
      categories: [
        {
          id: 'documentedshape01',
          name: 'Documented Category',
          description: 'Context',
        },
      ],
    }

    expect(parseTemplateImportPayload(payload).id).toBe('documentedshape01')
  })

  it('defaults template descriptions when omitted', () => {
    const payload = parseTemplateImportPayload({
      version: templateSchemaVersion,
      name: 'No description',
      categories: [],
    })

    expect(payload.description).toBe('')
  })

  it('parses song category fields and exports them', () => {
    const payload = parseTemplateImportPayload({
      version: templateSchemaVersion,
      id: 'songtemplate01',
      name: 'Song Template',
      categories: [
        {
          id: 'songpick0001',
          name: 'Best Opening',
          entityKind: 'song',
          songFilter: {
            types: ['ED', 'OP'],
          },
        },
      ],
    })

    expect(payload.categories[0]).toMatchObject({
      entityKind: 'song',
      songFilter: {
        types: ['ED', 'OP'],
      },
    })

    const normalized = normalizeImportedTemplate(payload, TemplateOrigin.User)

    expect(createTemplateExportPayload(normalized).categories[0]).toMatchObject({
      entityKind: 'song',
      songFilter: {
        types: ['ED', 'OP'],
      },
    })
  })

  it('parses character category roles as deduplicated and sorted', () => {
    const payload = parseTemplateImportPayload({
      version: templateSchemaVersion,
      id: 'charactertpl01',
      name: 'Character Template',
      categories: [
        {
          id: 'characterpick1',
          name: 'Best Girl',
          entityKind: 'character',
          characterFilter: {
            roles: ['SUPPORTING', 'BACKGROUND', 'MAIN', 'SUPPORTING'],
          },
        },
      ],
    })

    expect(payload.categories[0]).toMatchObject({
      entityKind: 'character',
      characterFilter: {
        roles: [CharacterRole.Background, CharacterRole.Main, CharacterRole.Supporting],
      },
      voiceActorFilter: {
        languages: [],
      },
    })
  })

  it('parses voice actor languages as trimmed and sorted', () => {
    const payload = parseTemplateImportPayload({
      version: templateSchemaVersion,
      id: 'voiceactortpl1',
      name: 'Voice Actor Template',
      categories: [
        {
          id: 'voiceactorpk1',
          name: 'Best Voice Artist Performance',
          entityKind: 'voice-actor',
          voiceActorFilter: {
            languages: [' Japanese ', 'English'],
          },
        },
      ],
    })

    expect(payload.categories[0]).toMatchObject({
      entityKind: 'voice-actor',
      characterFilter: {
        roles: [],
      },
      voiceActorFilter: {
        languages: ['English', 'Japanese'],
      },
    })
  })

  it('defaults the relation filters when both are absent', () => {
    const payload = parseTemplateImportPayload({
      version: templateSchemaVersion,
      id: 'norelation001',
      name: 'No relation filters',
      categories: [
        {
          id: 'norelationct1',
          name: 'Plain Category',
        },
      ],
    })

    expect(payload.categories[0]).toMatchObject({
      characterFilter: { roles: [] },
      voiceActorFilter: { languages: [] },
    })
  })

  it('rejects unsupported entity kinds and character roles', () => {
    expect(() =>
      parseTemplateImportPayload({
        version: templateSchemaVersion,
        name: 'Staff kind',
        categories: [
          {
            name: 'Best Staff',
            entityKind: 'staff',
          },
        ],
      }),
    ).toThrowError(TemplateValidationError)

    const importBadRole = () =>
      parseTemplateImportPayload({
        version: templateSchemaVersion,
        name: 'Bad role',
        categories: [
          {
            name: 'Best Girl',
            entityKind: 'character',
            characterFilter: {
              roles: ['LEAD'],
            },
          },
        ],
      })

    expect(importBadRole).toThrowError(TemplateValidationError)
    expect(importBadRole).toThrowError(/Invalid value: LEAD/)
  })

  it('round-trips every entity kind and its relation filters', () => {
    const template = normalizeImportedTemplate(
      {
        version: templateSchemaVersion,
        id: 'allkinds00001',
        name: 'All kinds',
        categories: [
          { id: 'kindanime0001', name: 'Best Anime', entityKind: CategoryEntityKind.Anime },
          {
            id: 'kindsong00001',
            name: 'Best Opening',
            entityKind: CategoryEntityKind.Song,
            songFilter: { types: [ThemeType.OP] },
          },
          {
            id: 'kindcharacter',
            name: 'Best Girl',
            entityKind: CategoryEntityKind.Character,
            characterFilter: { roles: [CharacterRole.Main] },
          },
          {
            id: 'kindvoiceact1',
            name: 'Best Voice Artist Performance',
            entityKind: CategoryEntityKind.VoiceActor,
            voiceActorFilter: { languages: ['Japanese'] },
          },
        ],
      },
      TemplateOrigin.User,
    )

    const exported = createTemplateExportPayload(template)
    const reimported = parseTemplateImportPayload(JSON.parse(JSON.stringify(exported)))

    expect(reimported.categories.map((category) => category.entityKind)).toEqual([
      CategoryEntityKind.Anime,
      CategoryEntityKind.Song,
      CategoryEntityKind.Character,
      CategoryEntityKind.VoiceActor,
    ])
    expect(reimported.categories[2]).toMatchObject({
      characterFilter: { roles: [CharacterRole.Main] },
      voiceActorFilter: { languages: [] },
    })
    expect(reimported.categories[3]).toMatchObject({
      characterFilter: { roles: [] },
      voiceActorFilter: { languages: ['Japanese'] },
    })
  })
})
