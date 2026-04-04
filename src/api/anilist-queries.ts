export const searchAnimeMediaQuery = `
  query SearchAnimeMedia(
    $page: Int!
    $perPage: Int!
    $search: String
    $seasonIn: [MediaSeason]
    $countryOfOriginIn: [CountryCode]
    $tagIn: [String]
    $tagRank: Int
    $genreIn: [String]
    $formatIn: [MediaFormat]
    $sourceIn: [MediaSource]
    $startDateGreater: FuzzyDateInt
    $startDateLesser: FuzzyDateInt
    $popularityGreater: Int
    $popularityLesser: Int
    $sort: [MediaSort]
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        hasNextPage
        lastPage
        perPage
        total
      }
      media(
        type: ANIME
        isAdult: false
        search: $search
        season_in: $seasonIn
        countryOfOrigin_in: $countryOfOriginIn
        tag_in: $tagIn
        tagRank: $tagRank
        genre_in: $genreIn
        format_in: $formatIn
        source_in: $sourceIn
        startDate_greater: $startDateGreater
        startDate_lesser: $startDateLesser
        popularity_greater: $popularityGreater
        popularity_lesser: $popularityLesser
        sort: $sort
      ) {
        id
        title {
          userPreferred
          romaji
          english
          native
        }
        coverImage {
          large
          medium
          extraLarge
          color
        }
        description(asHtml: false)
        season
        seasonYear
        format
        source
        genres
        tags {
          id
          name
          description
          rank
          isAdult
        }
        popularity
        averageScore
        countryOfOrigin
      }
    }
  }
`

export const fetchAniListMetadataQuery = `
  query FetchAniListMetadata {
    GenreCollection
    MediaTagCollection {
      id
      name
      description
      isAdult
    }
  }
`
