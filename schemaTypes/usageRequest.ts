import {defineField, defineType} from 'sanity'

export const usageRequest = defineType({
  name: 'usageRequest',
  title: 'Usage Request',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'asset', type: 'reference', to: [{type: 'mediaAsset'}], validation: (r) => r.required()}),
    defineField({name: 'territory', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'channel', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'isPaid', type: 'boolean', validation: (r) => r.required()}),
    defineField({name: 'startDate', type: 'date', validation: (r) => r.required()}),
    defineField({name: 'endDate', type: 'date', validation: (r) => r.required()}),
  ],
})
