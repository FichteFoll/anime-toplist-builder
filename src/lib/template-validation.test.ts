import { describe, expect, it } from 'vitest'

import { isCategoryId, isTemplateId } from '@/lib/ids'
import {
  TemplateValidationError,
  createTemplateExportPayload,
  normalizeImportedTemplate,
  parseTemplateImportJson,
  parseTemplateImportPayload,
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
        countryOfOrigin: [],
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
            countryOfOrigin: [],
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
        yearRange: undefined,
        seasons: [],
        countryOfOrigin: [],
        tags: [],
        minimumTagRank: 40,
        genres: [],
        formats: ['MOVIE', 'TV'],
        popularity: undefined,
        source: [],
        sort: undefined,
      },
      categories: [
        {
          id: 'exportpick01',
          name: 'Pick',
          description: 'Nice pacing',
          filter: {
            yearRange: undefined,
            seasons: [],
            countryOfOrigin: [],
            tags: [],
            minimumTagRank: undefined,
            genres: ['Mystery'],
            formats: [],
            popularity: undefined,
            source: [],
            sort: undefined,
          },
        },
      ],
    })
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
