import type { Template, TemplateImportPayloadV1 } from '@/types'

import { normalizeImportedTemplate } from '@/lib/template-validation'

const predefinedTemplatePayloads: TemplateImportPayloadV1[] = [
  {
    version: 1 as const,
    id: 'tpl_cr_animeawards_202601',
    name: 'Crunchyroll Anime Awards 2026',
    description: '',
    globalFilter: {
      yearRange: { minimum: 2026, maximum: 2026 },
      sort: {
        field: 'SCORE' as const,
        direction: 'desc' as const,
      },
    },
    categories: [
      {
        id: 'cat_animeoftheyear01',
        name: 'Anime Of The Year',
        description: 'The strongest overall anime of the year.',
      },
      {
        id: 'cat_filmoftheyear01',
        name: 'Film Of The Year',
        description: 'The strongest anime film of the year.',
        filter: { formats: ['MOVIE' as const] },
      },
      {
        id: 'cat_bestcontinuingseries01',
        name: 'Best Continuing Series',
        description: 'The strongest series that continued into the awards year.',
      },
      {
        id: 'cat_bestnewseries01',
        name: 'Best New Series',
        description: 'The strongest new series of the year.',
      },
      {
        id: 'cat_bestoriginalanime01',
        name: 'Best Original Anime',
        description: 'The strongest original anime of the year.',
        filter: { source: ['ORIGINAL' as const] },
      },
      {
        id: 'cat_bestanimation01',
        name: 'Best Animation',
        description: 'The best animation quality of the year.',
      },
      {
        id: 'cat_bestcharacterdesign01',
        name: 'Best Character Design',
        description: 'The strongest character design work of the year.',
      },
      {
        id: 'cat_bestdirector01',
        name: 'Best Director',
        description: 'The best directorial work of the year.',
      },
      {
        id: 'cat_bestbackgroundart01',
        name: 'Best Background Art',
        description: 'The best background art of the year.',
      },
      {
        id: 'cat_bestromance01',
        name: 'Best Romance',
        description: 'The strongest romance-focused anime of the year.',
        filter: { genres: ['Romance'] },
      },
      {
        id: 'cat_bestcomedy01',
        name: 'Best Comedy',
        description: 'The strongest comedy anime of the year.',
        filter: { genres: ['Comedy'] },
      },
      {
        id: 'cat_bestaction01',
        name: 'Best Action',
        description: 'The strongest action anime of the year.',
        filter: { genres: ['Action'] },
      },
      {
        id: 'cat_bestisekaianime01',
        name: 'Best Isekai Anime',
        description: 'The strongest isekai anime of the year.',
        filter: { tags: ['Isekai'], minimumTagRank: 60 },
      },
      {
        id: 'cat_bestdrama01',
        name: 'Best Drama',
        description: 'The strongest drama anime of the year.',
        filter: { genres: ['Drama'] },
      },
      {
        id: 'cat_bestsliceoflife01',
        name: 'Best Slice Of Life',
        description: 'The strongest slice of life anime of the year.',
        filter: { genres: ['Slice of Life'] },
      },
      {
        id: 'cat_bestmaincharacter01',
        name: 'Best Main Character',
        description: 'The best leading character of the year.',
      },
      {
        id: 'cat_bestsupportingcharacter01',
        name: 'Best Supporting Character',
        description: 'The best supporting character of the year.',
      },
      {
        id: 'cat_mustprotect01',
        name: '"Must Protect At All Costs" Character',
        description: 'The character everyone wants to protect.',
      },
      {
        id: 'cat_bestanimesong01',
        name: 'Best Anime Song',
        description: 'The most memorable anime song of the year.',
      },
      {
        id: 'cat_bestscore01',
        name: 'Best Score',
        description: 'The strongest soundtrack score of the year.',
      },
      {
        id: 'cat_bestopeningsequence01',
        name: 'Best Opening Sequence',
        description: 'The strongest opening sequence of the year.',
      },
      {
        id: 'cat_bestendingsequence01',
        name: 'Best Ending Sequence',
        description: 'The strongest ending sequence of the year.',
      },
      {
        id: 'cat_bestvoiceartistperformancejapanese01',
        name: 'Best Voice Artist Performance (Japanese)',
        description: 'The best Japanese voice performance of the year.',
      },
      {
        id: 'cat_bestvoiceartistperformanceenglish01',
        name: 'Best Voice Artist Performance (English)',
        description: 'The best English voice performance of the year.',
      },
    ],
  },
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
      { id: 'cat_experimentaltag01', name: 'Experimental', filter: { tags: ['Experimental'] } },
    ],
  },
]

export const predefinedTemplates: Template[] = predefinedTemplatePayloads.map((payload) =>
  normalizeImportedTemplate(payload, 'predefined'),
)
