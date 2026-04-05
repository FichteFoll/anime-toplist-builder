import type { Template, TemplateImportPayloadV1 } from '@/types'

import { normalizeImportedTemplate } from '@/lib/template-validation'

const predefinedTemplatePayloads: TemplateImportPayloadV1[] = [
  {
    version: 1 as const,
    id: 'cr_animeawards_202501',
    name: 'Crunchyroll Anime Awards 2025',
    description: 'My picks for the the 2025 Crunchyroll Anime Awards',
    globalFilter: {
      yearRange: { minimum: 2025, maximum: 2025 },
      sort: {
        field: 'SCORE' as const,
        direction: 'desc' as const,
      },
    },
    categories: [
      {
        id: 'animeoftheyear01',
        name: 'Anime Of The Year',
        description: 'The strongest overall anime of the year',
      },
      {
        id: 'filmoftheyear01',
        name: 'Film Of The Year',
        description: 'The strongest anime film of the year',
        filter: { formats: ['MOVIE' as const] },
      },
      {
        id: 'bestcontinuingseries01',
        name: 'Best Continuing Series',
        description: 'The strongest series that continued into the awards year',
      },
      {
        id: 'bestnewseries01',
        name: 'Best New Series',
        description: 'The strongest new series of the year',
      },
      {
        id: 'bestoriginalanime01',
        name: 'Best Original Anime',
        description: 'The strongest original anime of the year',
        filter: { source: ['ORIGINAL' as const] },
      },
      {
        id: 'bestanimation01',
        name: 'Best Animation',
        description: 'The best animation quality of the year',
      },
      {
        id: 'bestcharacterdesign01',
        name: 'Best Character Design',
        description: 'The strongest character design work of the year',
      },
      {
        id: 'bestdirector01',
        name: 'Best Director',
        description: 'The best directorial work of the year',
      },
      {
        id: 'bestbackgroundart01',
        name: 'Best Background Art',
        description: 'The best background art of the year',
      },
      {
        id: 'bestromance01',
        name: 'Best Romance',
        description: 'The strongest romance-focused anime of the year',
        filter: { genres: ['Romance'] },
      },
      {
        id: 'bestcomedy01',
        name: 'Best Comedy',
        description: 'The strongest comedy anime of the year',
        filter: { genres: ['Comedy'] },
      },
      {
        id: 'bestaction01',
        name: 'Best Action',
        description: 'The strongest action anime of the year',
        filter: { genres: ['Action'] },
      },
      {
        id: 'bestisekaianime01',
        name: 'Best Isekai Anime',
        description: 'The strongest isekai anime of the year',
        filter: { tags: ['Isekai'], minimumTagRank: 60 },
      },
      {
        id: 'bestdrama01',
        name: 'Best Drama',
        description: 'The strongest drama anime of the year',
        filter: { genres: ['Drama'] },
      },
      {
        id: 'bestsliceoflife01',
        name: 'Best Slice Of Life',
        description: 'The strongest slice of life anime of the year',
        filter: { genres: ['Slice of Life'] },
      },
      {
        id: 'bestmaincharacter01',
        name: 'Best Main Character',
        description: 'The best leading character of the year',
      },
      {
        id: 'bestsupportingcharacter01',
        name: 'Best Supporting Character',
        description: 'The best supporting character of the year',
      },
      {
        id: 'mustprotect01',
        name: '"Must Protect At All Costs" Character',
        description: 'The character everyone wants to protect',
      },
      {
        id: 'bestanimesong01',
        name: 'Best Anime Song',
        description: 'The most memorable anime song of the year',
      },
      {
        id: 'bestscore01',
        name: 'Best Score',
        description: 'The strongest soundtrack score of the year',
      },
      {
        id: 'bestopeningsequence01',
        name: 'Best Opening Sequence',
        description: 'The strongest opening sequence of the year',
      },
      {
        id: 'bestendingsequence01',
        name: 'Best Ending Sequence',
        description: 'The strongest ending sequence of the year',
      },
      {
        id: 'bestvoiceartistperformancejapanese01',
        name: 'Best Voice Artist Performance (Japanese)',
        description: 'The best Japanese voice performance of the year',
      },
      {
        id: 'bestvoiceartistperformanceenglish01',
        name: 'Best Voice Artist Performance (English)',
        description: 'The best English voice performance of the year',
      },
    ],
  },
  {
    version: 1 as const,
    id: 'favoritesalltime01',
    name: 'Favorites All Time',
    description: 'My all-time favorite anime',
    globalFilter: {
      sort: {
        field: 'SCORE' as const,
        direction: 'desc' as const,
      },
    },
    categories: [
      { id: 'bestseries01', name: 'Best Series', description: 'Your strongest long-form series picks.' },
      {
        id: 'bestmovie01',
        name: 'Best Movie',
        description: 'Your strongest feature-length anime picks',
        filter: {
          formats: ['MOVIE' as const, 'ONA' as const],
          episodes: { maximum: 1 },
          duration: { minimum: 30 },
        },
      },
      {
        id: 'bestshort01',
        name: 'Best Short',
        description: 'Your strongest brief anime picks',
        filter: {
          formats: ['TV_SHORT' as const, 'ONA' as const, 'MUSIC' as const],
          duration: { maximum: 16 },
        },
      },
      {
        id: 'bestclassic01',
        name: 'Best Classic',
        description: 'Your strongest anime from the older catalog',
        filter: { yearRange: { maximum: 2009 } },
      },
      {
        id: 'bestrecent01',
        name: 'Best Recent',
        description: 'Your strongest recent anime picks',
        filter: { yearRange: { minimum: 2020 } },
      },
      {
        id: 'mostrewatchable01',
        name: 'Most Rewatchable',
        description: 'Your most replayable anime picks',
      },
    ],
  },
  {
    version: 1 as const,
    id: 'seasonalshowcase01',
    name: 'Seasonal Showcase',
    description: 'Standout shows from recent anime seasons',
    globalFilter: {
      yearRange: { minimum: 2021 },
      sort: {
        field: 'TRENDING' as const,
        direction: 'desc' as const,
      },
    },
    categories: [
      {
        id: 'winterpick01',
        name: 'Winter Pick',
        description: 'A standout title from the winter season',
        filter: { seasons: ['WINTER' as const] },
      },
      {
        id: 'springpick01',
        name: 'Spring Pick',
        description: 'A standout title from the spring season',
        filter: { seasons: ['SPRING' as const] },
      },
      {
        id: 'summerpick01',
        name: 'Summer Pick',
        description: 'A standout title from the summer season',
        filter: { seasons: ['SUMMER' as const] },
      },
      {
        id: 'fallpick01',
        name: 'Fall Pick',
        description: 'A standout title from the fall season',
        filter: { seasons: ['FALL' as const] },
      },
      {
        id: 'breakouthit01',
        name: 'Breakout Hit',
        description: 'A title that broke out well beyond expectations',
      },
      {
        id: 'hiddengem01',
        name: 'Hidden Gem',
        description: 'A lower-profile title that deserves more attention',
        filter: { popularity: { maximum: 20000 } },
      },
    ],
  },
  {
    version: 1 as const,
    id: 'genrespotlight01',
    name: 'Genre Spotlight',
    description: 'Strong anime across major genre categories',
    globalFilter: {
      formats: ['TV' as const, 'MOVIE' as const, 'OVA' as const],
      sort: {
        field: 'POPULARITY' as const,
        direction: 'desc' as const,
      },
    },
    categories: [
      {
        id: 'actionspot01',
        name: 'Action',
        description: 'Strong anime centered on action and momentum',
        filter: { genres: ['Action'] },
      },
      {
        id: 'dramaspot01',
        name: 'Drama',
        description: 'Strong anime focused on emotional weight and conflict',
        filter: { genres: ['Drama'] },
      },
      {
        id: 'comedyspot01',
        name: 'Comedy',
        description: 'Strong anime built around humor and timing',
        filter: { genres: ['Comedy'] },
      },
      {
        id: 'scifispot01',
        name: 'Sci-Fi',
        description: 'Strong anime exploring science fiction ideas',
        filter: { genres: ['Sci-Fi'] },
      },
      {
        id: 'romancespot01',
        name: 'Romance',
        description: 'Strong anime centered on romantic relationships',
        filter: { genres: ['Romance'] },
      },
      {
        id: 'experimentaltag01',
        name: 'Experimental',
        description: 'Anime that pushes style, structure, or storytelling boundaries',
        filter: { tags: ['Experimental'] },
      },
    ],
  },
]

export const predefinedTemplates: Template[] = predefinedTemplatePayloads.map((payload) =>
  normalizeImportedTemplate(payload, 'predefined'),
)
