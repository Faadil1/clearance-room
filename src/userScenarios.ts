import {getServerSanity} from './serverSanity'

export type ScenarioRightInput = {
  title: string
  kind: 'talent_release' | 'music_license' | 'photo_agreement'
  current: {
    allowedTerritories: string[]
    allowedChannels: string[]
    paidAdvertisingAllowed: boolean
    validFrom: string
    validTo: string
    sourceClause: string
  }
  proposed: {
    allowedTerritories: string[]
    allowedChannels: string[]
    paidAdvertisingAllowed: boolean
    validFrom: string
    validTo: string
    sourceClause: string
  }
}

export type UserScenarioInput = {
  title: string
  assetTitle: string
  usage: {
    territory: string
    channel: string
    isPaid: boolean
    startDate: string
    endDate: string
  }
  rights: ScenarioRightInput[]
}

function cleanList(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return [...new Set(values.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean))]
}

function requiredString(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} is required`)
  }
  return value.trim()
}

function dateString(value: unknown, label: string) {
  const string = requiredString(value, label)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(string)) {
    throw new Error(`${label} must use YYYY-MM-DD`)
  }
  return string
}

function normalizeRight(input: any, index: number): ScenarioRightInput {
  const kind = input?.kind
  if (!['talent_release', 'music_license', 'photo_agreement'].includes(kind)) {
    throw new Error(`rights[${index}].kind is invalid`)
  }

  const normalizeTerms = (terms: any, label: string) => {
    const territories = cleanList(terms?.allowedTerritories)
    const channels = cleanList(terms?.allowedChannels)

    if (territories.length === 0) throw new Error(`${label}.allowedTerritories requires at least one value`)
    if (channels.length === 0) throw new Error(`${label}.allowedChannels requires at least one value`)
    if (typeof terms?.paidAdvertisingAllowed !== 'boolean') {
      throw new Error(`${label}.paidAdvertisingAllowed must be boolean`)
    }

    return {
      allowedTerritories: territories,
      allowedChannels: channels,
      paidAdvertisingAllowed: terms.paidAdvertisingAllowed,
      validFrom: dateString(terms?.validFrom, `${label}.validFrom`),
      validTo: dateString(terms?.validTo, `${label}.validTo`),
      sourceClause: requiredString(terms?.sourceClause, `${label}.sourceClause`),
    }
  }

  return {
    title: requiredString(input?.title, `rights[${index}].title`),
    kind,
    current: normalizeTerms(input?.current, `rights[${index}].current`),
    proposed: normalizeTerms(input?.proposed, `rights[${index}].proposed`),
  }
}

export function normalizeScenarioInput(input: any): UserScenarioInput {
  const rights = Array.isArray(input?.rights)
    ? input.rights.map((right: any, index: number) => normalizeRight(right, index))
    : []

  if (rights.length === 0) throw new Error('At least one governing right is required')
  if (rights.length > 6) throw new Error('A scenario can contain at most 6 governing rights')

  const usage = input?.usage || {}
  const startDate = dateString(usage.startDate, 'usage.startDate')
  const endDate = dateString(usage.endDate, 'usage.endDate')
  if (endDate < startDate) throw new Error('usage.endDate cannot be before usage.startDate')

  return {
    title: requiredString(input?.title, 'title'),
    assetTitle: requiredString(input?.assetTitle, 'assetTitle'),
    usage: {
      territory: requiredString(usage.territory, 'usage.territory'),
      channel: requiredString(usage.channel, 'usage.channel'),
      isPaid: Boolean(usage.isPaid),
      startDate,
      endDate,
    },
    rights,
  }
}

function createKey() {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 12)
}

export async function createUserScenario(raw: unknown) {
  const input = normalizeScenarioInput(raw)
  const key = createKey()
  const usageId = `usage-user-${key}`
  const assetId = `asset-user-${key}`
  const rightIds = input.rights.map((_, index) => `rights-user-${key}-${index + 1}`)
  const client = getServerSanity()

  let tx = client.transaction()

  input.rights.forEach((right, index) => {
    const rightId = rightIds[index]
    tx = tx
      .create({
        _id: rightId,
        _type: 'rightsDocument',
        title: right.title,
        kind: right.kind,
        ...right.current,
      } as any)
      .create({
        _id: `drafts.${rightId}`,
        _type: 'rightsDocument',
        title: `${right.title} — Proposed`,
        kind: right.kind,
        ...right.proposed,
      } as any)
  })

  tx = tx
    .create({
      _id: assetId,
      _type: 'mediaAsset',
      title: input.assetTitle,
      rights: rightIds.map((id) => ({
        _type: 'reference',
        _ref: id,
        _key: id,
      })),
    } as any)
    .create({
      _id: usageId,
      _type: 'usageRequest',
      title: input.title,
      asset: {_type: 'reference', _ref: assetId},
      ...input.usage,
    } as any)

  await tx.commit()

  return {
    key,
    usageId,
    assetId,
    rightIds,
    title: input.title,
    createdAt: new Date().toISOString(),
  }
}

export async function listUserScenarios() {
  const client = getServerSanity()
  return client.fetch<Array<{
    id: string
    title: string
    territory: string
    channel: string
    isPaid: boolean
    startDate: string
    endDate: string
    asset: {
      id: string
      title: string
      rights: Array<{
        id: string
        title: string
        kind: string
        allowedTerritories?: string[]
        allowedChannels?: string[]
        paidAdvertisingAllowed?: boolean
        validFrom?: string
        validTo?: string
        sourceClause?: string
      }>
    }
  }>>(
    `*[_type == "usageRequest" && _id match "usage-user-*"] | order(_createdAt desc){
      "id": _id,
      title,
      territory,
      channel,
      isPaid,
      startDate,
      endDate,
      "asset": asset->{
        "id": _id,
        title,
        "rights": rights[]->{
          "id": _id,
          title,
          kind,
          allowedTerritories,
          allowedChannels,
          paidAdvertisingAllowed,
          validFrom,
          validTo,
          sourceClause
        }
      }
    }`,
    {},
    {perspective: 'drafts'},
  )
}

function assertUserScenarioId(id: string) {
  if (!/^usage-user-[a-z0-9]+$/.test(id)) {
    throw new Error('Only user-created scenarios can be mutated here')
  }
}

export async function updateUserScenario(
  usageId: string,
  raw: {
    usage?: Partial<UserScenarioInput['usage']>
    rightId?: string
    proposed?: Partial<ScenarioRightInput['proposed']>
  },
) {
  assertUserScenarioId(usageId)
  const client = getServerSanity()
  let tx = client.transaction()
  let changed = false

  if (raw.usage) {
    const patch: Record<string, unknown> = {}
    if (typeof raw.usage.territory === 'string' && raw.usage.territory.trim()) patch.territory = raw.usage.territory.trim()
    if (typeof raw.usage.channel === 'string' && raw.usage.channel.trim()) patch.channel = raw.usage.channel.trim()
    if (typeof raw.usage.isPaid === 'boolean') patch.isPaid = raw.usage.isPaid
    if (typeof raw.usage.startDate === 'string') patch.startDate = dateString(raw.usage.startDate, 'usage.startDate')
    if (typeof raw.usage.endDate === 'string') patch.endDate = dateString(raw.usage.endDate, 'usage.endDate')

    if (Object.keys(patch).length > 0) {
      tx = tx.patch(usageId, (builder) => builder.set(patch))
      changed = true
    }
  }

  if (raw.rightId && raw.proposed) {
    if (!/^rights-user-[a-z0-9]+-\d+$/.test(raw.rightId)) {
      throw new Error('Only user-created rights can be edited in Scenario Lab')
    }

    const proposed = raw.proposed
    const patch: Record<string, unknown> = {}
    if (Array.isArray(proposed.allowedTerritories)) {
      const values = cleanList(proposed.allowedTerritories)
      if (!values.length) throw new Error('Proposed territories cannot be empty')
      patch.allowedTerritories = values
    }
    if (Array.isArray(proposed.allowedChannels)) {
      const values = cleanList(proposed.allowedChannels)
      if (!values.length) throw new Error('Proposed channels cannot be empty')
      patch.allowedChannels = values
    }
    if (typeof proposed.paidAdvertisingAllowed === 'boolean') patch.paidAdvertisingAllowed = proposed.paidAdvertisingAllowed
    if (typeof proposed.validFrom === 'string') patch.validFrom = dateString(proposed.validFrom, 'proposed.validFrom')
    if (typeof proposed.validTo === 'string') patch.validTo = dateString(proposed.validTo, 'proposed.validTo')
    if (typeof proposed.sourceClause === 'string' && proposed.sourceClause.trim()) patch.sourceClause = proposed.sourceClause.trim()

    if (Object.keys(patch).length > 0) {
      tx = tx.patch(`drafts.${raw.rightId}`, (builder) => builder.set(patch))
      changed = true
    }
  }

  if (!changed) throw new Error('No supported scenario changes were supplied')
  await tx.commit()

  return {
    usageId,
    updatedAt: new Date().toISOString(),
  }
}

export async function deleteUserScenario(usageId: string) {
  assertUserScenarioId(usageId)
  const client = getServerSanity()

  const [record, proofIds] = await Promise.all([
    client.fetch<{
      assetId: string
      rightIds: string[]
    } | null>(
      `*[_type == "usageRequest" && _id == $id][0]{
        "assetId": asset._ref,
        "rightIds": asset->rights[]._ref
      }`,
      {id: usageId},
    ),
    client.fetch<string[]>(
      `*[_type == "clearanceProof" && usageRequest._ref == $id]._id`,
      {id: usageId},
    ),
  ])

  if (!record?.assetId) throw new Error('User scenario was not found')

  let tx = client.transaction().delete(usageId)
  for (const proofId of proofIds || []) tx = tx.delete(proofId)
  tx = tx.delete(record.assetId)

  for (const rightId of record.rightIds || []) {
    tx = tx.delete(`drafts.${rightId}`).delete(rightId)
  }

  await tx.commit()

  return {
    usageId,
    deleted: true,
    deletedAt: new Date().toISOString(),
  }
}
