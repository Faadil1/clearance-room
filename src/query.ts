export const USAGE_GRAPH_QUERY = /* groq */ `
*[_type == "usageRequest" && _id == $id][0]{
  _id,
  _rev,
  title,
  territory,
  channel,
  isPaid,
  startDate,
  endDate,
  asset->{
    _id,
    _rev,
    title,
    rights[]->{
      _id,
      _rev,
      _originalId,
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
}
`

export function usageGraphQueryFor(id: string) {
  return USAGE_GRAPH_QUERY.replace('$id', JSON.stringify(id))
}


export const ALL_USAGE_GRAPHS_QUERY = /* groq */ `
*[_type == "usageRequest"] | order(title asc){
  _id,
  _rev,
  title,
  territory,
  channel,
  isPaid,
  startDate,
  endDate,
  asset->{
    _id,
    _rev,
    title,
    rights[]->{
      _id,
      _rev,
      _originalId,
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
}
`
