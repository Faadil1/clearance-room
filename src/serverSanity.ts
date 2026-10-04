import {createClient} from '@sanity/client'

export function getServerSanity() {
  const projectId = process.env.SANITY_STUDIO_PROJECT_ID
  const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
  const token = process.env.SANITY_API_TOKEN

  if (!projectId) throw new Error('Missing SANITY_STUDIO_PROJECT_ID')
  if (!token) throw new Error('Missing SANITY_API_TOKEN')

  return createClient({
    projectId,
    dataset,
    apiVersion: '2026-03-01',
    token,
    useCdn: false,
  })
}
