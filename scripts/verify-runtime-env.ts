const required = [
  'SANITY_STUDIO_PROJECT_ID',
  'SANITY_STUDIO_DATASET',
  'SANITY_API_TOKEN',
  'SANITY_ORGANIZATION_ID',
  'SANITY_CONTEXT_MCP_URL',
  'SANITY_EVIDENCE_MCP_URL',
  'SANITY_ORGANIZATION_TOKEN',
  'SANITY_KNOWLEDGE_BASE_ID',
]

const missing = required.filter((name) => !process.env[name])

if (missing.length) {
  console.error(JSON.stringify({
    result: 'FAIL',
    missing,
    note: 'Variable values are intentionally never printed.',
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  result: 'PASS',
  configured: required,
  note: 'Variable values are intentionally never printed.',
}, null, 2))
