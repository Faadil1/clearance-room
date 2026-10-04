import {defineField, defineType} from 'sanity'

export const clearanceDecision = defineType({
  name: 'clearanceDecision',
  title: 'Clearance Decision',
  type: 'document',
  fields: [
    defineField({name: 'usageRequest', type: 'reference', to: [{type: 'usageRequest'}], validation: (r) => r.required()}),
    defineField({name: 'perspective', type: 'string', options: {list: ['published', 'drafts']}, validation: (r) => r.required()}),
    defineField({name: 'status', type: 'string', options: {list: ['CLEAR', 'BLOCK', 'REVIEW', 'UNKNOWN']}, validation: (r) => r.required()}),
    defineField({name: 'proofJson', type: 'text'}),
    defineField({name: 'evaluatedAt', type: 'datetime'}),
  ],
})
