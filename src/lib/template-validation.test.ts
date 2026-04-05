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
import { templateSchemaVersion, type TemplateImportPayloadV1 } from '@/types'

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
        seasons: [],
        countryOfOrigin: 'CN',
        tags: ['Cyberpunk'],
        minimumTagRank: 70,
        genres: ['Action', 'Drama'],
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
            seasons: ['SPRING', 'WINTER'],
            countryOfOrigin: undefined,
            tags: [],
            minimumTagRank: undefined,
            genres: [],
            formats: [],
            popularity: undefined,
            source: [],
            sort: undefined,
          },
        },
      ],
    })
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
      'imported-file',
    )

    expect(isTemplateId(template.id)).toBe(true)
    expect(template.origin).toBe('imported-file')
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
          formats: ['TV', 'MOVIE'],
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
      'user',
    )

    expect(createTemplateExportPayload(template)).toEqual({
      version: templateSchemaVersion,
      id: 'exportcase01',
      name: 'Export me',
      description: 'Export context',
      globalFilter: {
        minimumTagRank: 40,
        formats: ['MOVIE', 'TV'],
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
      'user',
    )

    expect(stringifyTemplateExportPayload(template)).not.toContain('"seasons": []')
    expect(stringifyTemplateExportPayload(template)).not.toContain('"tags": []')
    expect(stringifyTemplateExportPayload(template)).not.toContain('"genres": []')
    expect(stringifyTemplateExportPayload(template)).not.toContain('"formats": []')
    expect(stringifyTemplateExportPayload(template)).not.toContain('"source": []')
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
})
