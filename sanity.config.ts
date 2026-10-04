import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

if (!projectId) throw new Error('Missing SANITY_STUDIO_PROJECT_ID')

export default defineConfig({
  name: 'clearance-room',
  title: 'Clearance Room',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],
  schema: {types: schemaTypes},
})
