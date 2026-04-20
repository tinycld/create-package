/// <reference path="../pb_data/types.d.ts" />

// Initial migration for {{PKG_SCOPED}}. Creates a single `{{PKG_SNAKE}}_items`
// collection matching the shape declared in types.ts / collections.ts.
// Replace or extend this as you build out the package.

migrate(
    app => {
        const collection = new Collection({
            type: 'base',
            name: '{{PKG_SNAKE}}_items',
            fields: [
                {
                    name: 'name',
                    type: 'text',
                    required: true,
                    min: 1,
                    max: 200,
                },
                {
                    name: 'created',
                    type: 'autodate',
                    onCreate: true,
                    onUpdate: false,
                },
                {
                    name: 'updated',
                    type: 'autodate',
                    onCreate: true,
                    onUpdate: true,
                },
            ],
        })
        app.save(collection)
    },
    app => {
        const collection = app.findCollectionByNameOrId('{{PKG_SNAKE}}_items')
        app.delete(collection)
    }
)
