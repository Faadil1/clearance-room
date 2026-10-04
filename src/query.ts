export const USAGE_GRAPH_QUERY = /* groq */ `
*[_type == "usageRequest" && _id == $id][0]{
  _id,
  title,
  territory,
  channel,
  isPaid,
  startDate,
  endDate,
  asset->{
    _id,
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
