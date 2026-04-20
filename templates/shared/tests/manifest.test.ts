import { describe, expect, it } from 'vitest'
import manifest from '../manifest'

describe('{{PKG_SLUG}} manifest', () => {
    it('declares required identifiers', () => {
        expect(manifest.name).toBe('{{PKG_NAME}}')
        expect(manifest.slug).toBe('{{PKG_SLUG}}')
        expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/)
    })

    it('has a description', () => {
        expect(manifest.description).toBe('{{PKG_DESCRIPTION}}')
    })
})
