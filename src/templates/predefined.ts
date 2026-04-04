import type { Template } from '@/types'

import { normalizeImportedTemplate } from '@/lib/template-validation'

const predefinedTemplatePayloads = [
  {
    version: 1 as const,
    id: 'tpl_favoritesalltime01',
    name: 'Favorites All Time',
    globalFilter: {
      sort: {
        field: 'SCORE' as const,
        direction: 'desc' as const,
      },
    },
    categories: [
      { id: 'cat_bestseries01', name: 'Best Series' },
      { id: 'cat_bestmovie01', name: 'Best Movie', filter: { formats: ['MOVIE' as const] } },
      { id: 'cat_bestshort01', name: 'Best Short', filter: { formats: ['TV_SHORT' as const, 'ONA' as const, 'MUSIC' as const] } },
      { id: 'cat_bestclassic01', name: 'Best Classic', filter: { yearRange: { maximum: 2009 } } },
      { id: 'cat_bestrecent01', name: 'Best Recent', filter: { yearRange: { minimum: 2020 } } },
      { id: 'cat_mostrewatchable01', name: 'Most Rewatchable' },
    ],
  },
  {
    version: 1 as const,
    id: 'tpl_seasonalshowcase01',
    name: 'Seasonal Showcase',
    globalFilter: {
      yearRange: { minimum: 2021 },
      sort: {
        field: 'TRENDING' as const,
        direction: 'desc' as const,
      },
    },
    categories: [
      { id: 'cat_winterpick01', name: 'Winter Pick', filter: { seasons: ['WINTER' as const] } },
      { id: 'cat_springpick01', name: 'Spring Pick', filter: { seasons: ['SPRING' as const] } },
      { id: 'cat_summerpick01', name: 'Summer Pick', filter: { seasons: ['SUMMER' as const] } },
      { id: 'cat_fallpick01', name: 'Fall Pick', filter: { seasons: ['FALL' as const] } },
      { id: 'cat_breakouthit01', name: 'Breakout Hit' },
      { id: 'cat_hiddengem01', name: 'Hidden Gem', filter: { popularity: { maximum: 20000 } } },
    ],
  },
  {
    version: 1 as const,
    id: 'tpl_genrespotlight01',
    name: 'Genre Spotlight',
    globalFilter: {
      formats: ['TV' as const, 'MOVIE' as const, 'OVA' as const],
      sort: {
        field: 'POPULARITY' as const,
        direction: 'desc' as const,
      },
    },
    categories: [
      { id: 'cat_actionspot01', name: 'Action', filter: { genres: ['Action'] } },
      { id: 'cat_dramaspot01', name: 'Drama', filter: { genres: ['Drama'] } },
      { id: 'cat_comedyspot01', name: 'Comedy', filter: { genres: ['Comedy'] } },
      { id: 'cat_scifispot01', name: 'Sci-Fi', filter: { genres: ['Sci-Fi'] } },
      { id: 'cat_romancespot01', name: 'Romance', filter: { genres: ['Romance'] } },
      { id: 'cat_experimentaltag01', name: 'Experimental', filter: { tags: [{ name: 'Experimental' }] } },
    ],
  },
]

export const predefinedTemplates: Template[] = predefinedTemplatePayloads.map((payload) =>
  normalizeImportedTemplate(payload, 'predefined'),
)
