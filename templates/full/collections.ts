import type { createCollection } from 'pbtsdb/core'
import { BasicIndex } from 'pbtsdb/core'
import type { CoreStores } from '~/lib/pocketbase'
import type { Schema } from '~/types/pbSchema'
import type { {{PKG_PASCAL}}Schema } from './types'

type MergedSchema = Schema & {{PKG_PASCAL}}Schema

// Collections contributed by this package. Core calls this during pbtsdb
// bootstrap; the returned object's keys become top-level keys on the app's
// MergedSchema (accessible via `useStore('...')`).
export function registerCollections(
    newCollection: ReturnType<typeof createCollection<MergedSchema>>,
    _core: CoreStores
) {
    const {{PKG_SNAKE}}_items = newCollection('{{PKG_SNAKE}}_items', {
        omitOnInsert: ['created', 'updated'] as const,
        collectionOptions: {
            autoIndex: 'eager' as const,
            defaultIndexType: BasicIndex,
        },
    })

    return {
        {{PKG_SNAKE}}_items,
    }
}
