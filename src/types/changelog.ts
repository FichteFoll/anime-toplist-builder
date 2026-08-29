export interface ChangelogInlineSpan {
  kind: 'text' | 'code' | 'strong' | 'emphasis' | 'link'
  text: string
  href?: string
}

export interface ChangelogItem {
  spans: Array<ChangelogInlineSpan>
}

export interface ChangelogEntry {
  version: string
  items: Array<ChangelogItem>
}
