import {defineArrayMember, defineField, defineType} from 'sanity'

export const clearanceProof = defineType({
  name: 'clearanceProof',
  title: 'Clearance Proof',
  type: 'document',
  fields: [
    defineField({name: 'usageRequest', type: 'reference', to: [{type: 'usageRequest'}], validation: (r) => r.required()}),
    defineField({name: 'perspective', type: 'string', options: {list: ['published', 'drafts']}, validation: (r) => r.required()}),
    defineField({name: 'status', type: 'string', options: {list: ['CLEAR', 'BLOCK', 'REVIEW', 'UNKNOWN']}, validation: (r) => r.required()}),
    defineField({name: 'isStale', type: 'boolean', initialValue: false, validation: (r) => r.required()}),
    defineField({name: 'evaluatedAt', type: 'datetime', validation: (r) => r.required()}),
    defineField({name: 'intentSignature', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'findings',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'axis', type: 'string'}),
            defineField({name: 'status', type: 'string'}),
            defineField({name: 'reason', type: 'text'}),
            defineField({name: 'causedBy', type: 'array', of: [{type: 'string'}]}),
            defineField({name: 'allowedThrough', type: 'date'}),
            defineField({name: 'blockedFrom', type: 'date'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'sourceRevisions',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'documentId', type: 'string'}),
            defineField({name: 'revision', type: 'string'}),
          ],
        }),
      ],
    }),
    defineField({name: 'supersedes', type: 'reference', to: [{type: 'clearanceProof'}]}),
  ],
})
