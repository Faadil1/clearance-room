import {defineField, defineType} from 'sanity'

export const mediaAsset = defineType({
  name: 'mediaAsset',
  title: 'Media Asset',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'rights',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'rightsDocument'}]}],
      validation: (r) => r.min(1),
    }),
  ],
})
