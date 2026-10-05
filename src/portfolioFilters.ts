export type FilterableImpact = {
  usage: {
    id: string
    title: string
    assetId: string
    assetTitle: string
    territory: string
    channel: string
  }
  proposedStatus: string
  changed: boolean
  causalRights: Array<{
    id: string
    title: string
  }>
}

export type ImpactFilters = {
  search: string
  status: string
  territory: string
  channel: string
  asset: string
  causalRight: string
}

export const EMPTY_IMPACT_FILTERS: ImpactFilters = {
  search: '',
  status: 'ALL',
  territory: 'ALL',
  channel: 'ALL',
  asset: 'ALL',
  causalRight: 'ALL',
}

function normalized(value: string) {
  return value.trim().toLowerCase()
}

export function filterImpacts<T extends FilterableImpact>(
  impacts: T[],
  filters: ImpactFilters,
): T[] {
  const search = normalized(filters.search)

  return impacts.filter((impact) => {
    if (filters.status !== 'ALL' && impact.proposedStatus !== filters.status) return false
    if (filters.territory !== 'ALL' && impact.usage.territory !== filters.territory) return false
    if (filters.channel !== 'ALL' && impact.usage.channel !== filters.channel) return false
    if (filters.asset !== 'ALL' && impact.usage.assetId !== filters.asset) return false
    if (
      filters.causalRight !== 'ALL' &&
      !impact.causalRights.some((right) => right.id === filters.causalRight)
    ) return false

    if (!search) return true

    const haystack = [
      impact.usage.id,
      impact.usage.title,
      impact.usage.assetId,
      impact.usage.assetTitle,
      impact.usage.territory,
      impact.usage.channel,
      impact.proposedStatus,
      ...impact.causalRights.flatMap((right) => [right.id, right.title]),
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(search)
  })
}

export function impactFilterOptions<T extends FilterableImpact>(impacts: T[]) {
  const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b))

  return {
    statuses: unique(impacts.map((impact) => impact.proposedStatus)),
    territories: unique(impacts.map((impact) => impact.usage.territory)),
    channels: unique(impacts.map((impact) => impact.usage.channel)),
    assets: unique(
      impacts.map((impact) => `${impact.usage.assetId}::${impact.usage.assetTitle}`),
    ).map((entry) => {
      const [id, ...rest] = entry.split('::')
      return {id, title: rest.join('::')}
    }),
    causalRights: unique(
      impacts.flatMap((impact) =>
        impact.causalRights.map((right) => `${right.id}::${right.title}`),
      ),
    ).map((entry) => {
      const [id, ...rest] = entry.split('::')
      return {id, title: rest.join('::')}
    }),
  }
}
