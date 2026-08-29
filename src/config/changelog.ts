import changelogSource from '../../CHANGELOG.md?raw'

import { parseChangelog } from '@/lib/changelog'

export const changelogEntries = parseChangelog(changelogSource)

export const latestChangelogVersion = changelogEntries[0]?.version ?? null
