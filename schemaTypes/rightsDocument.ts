import {defineField, defineType} from 'sanity'

export const rightsDocument = defineType({
  name: 'rightsDocument',
  title: 'Rights Document',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'kind',
      type: 'string',
      options: {list: [
        {title: 'Talent release', value: 'talent_release'},
        {title: 'Music license', value: 'music_license'},
        {title: 'Photographer agreement', value: 'photo_agreement'},
      ]},
      validation: (r) => r.required(),
    }),
    defineField({name: 'allowedTerritories', type: 'array', of: [{type: 'string'}], validation: (r) => r.min(1)}),
    defineField({name: 'allowedChannels', type: 'array', of: [{type: 'string'}], validation: (r) => r.min(1)}),
    defineField({name: 'paidAdvertisingAllowed', type: 'boolean'}),
    defineField({name: 'validFrom', type: 'date'}),
    defineField({name: 'validTo', type: 'date'}),
    defineField({name: 'sourceClause', title: 'Source clause / evidence excerpt', type: 'text', rows: 4}),
  ],
})
