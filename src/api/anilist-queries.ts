export const searchAnimeMediaQuery = `
  query SearchAnimeMedia(
    $page: Int!
    $perPage: Int!
    $search: String
    $season: MediaSeason
    $countryOfOrigin: CountryCode
    $tagIn: [String]
    $tagNotIn: [String]
    $minimumTagRank: Int
    $genreIn: [String]
    $genreNotIn: [String]
    $formatIn: [MediaFormat]
    $source: MediaSource
    $startDateGreater: FuzzyDateInt
    $startDateLesser: FuzzyDateInt
    $episodeGreater: Int
    $episodeLesser: Int
    $durationGreater: Int
    $durationLesser: Int
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
        season: $season
        countryOfOrigin: $countryOfOrigin
        tag_in: $tagIn
        tag_not_in: $tagNotIn
        minimumTagRank: $minimumTagRank
        genre_in: $genreIn
        genre_not_in: $genreNotIn
        format_in: $formatIn
        source: $source
        startDate_greater: $startDateGreater
        startDate_lesser: $startDateLesser
        episode_greater: $episodeGreater
        episode_lesser: $episodeLesser
        duration_greater: $durationGreater
        duration_lesser: $durationLesser
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
        siteUrl
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
