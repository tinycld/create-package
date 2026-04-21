import { describe, expect, it } from 'vitest'
import { type Answers, buildPlaceholders, substitute } from '../src/substitute.ts'

const baseAnswers: Answers = {
    slug: 'my-feature',
    name: 'My Feature',
    description: 'Does a thing.',
    preset: 'full',
    icon: 'box',
    navOrder: 20,
    navShortcut: 'f',
    includeServer: true,
    targetDir: '/tmp/my-feature',
}

describe('buildPlaceholders', () => {
    it('derives all expected placeholders for a simple slug', () => {
        const p = buildPlaceholders(baseAnswers)
        expect(p['{{PKG_SLUG}}']).toBe('my-feature')
        expect(p['{{PKG_NAME}}']).toBe('My Feature')
        expect(p['{{PKG_SCOPED}}']).toBe('my-feature')
        expect(p['{{PKG_PASCAL}}']).toBe('MyFeature')
        expect(p['{{PKG_CAMEL}}']).toBe('myFeature')
        expect(p['{{PKG_SNAKE}}']).toBe('my_feature')
        expect(p['{{PKG_DESCRIPTION}}']).toBe('Does a thing.')
        expect(p['{{PKG_ICON}}']).toBe('box')
        expect(p['{{PKG_NAV_ORDER}}']).toBe('20')
        expect(p['{{PKG_NAV_SHORTCUT}}']).toBe('f')
        expect(p['{{GO_MODULE}}']).toBe('tinycld.org/packages/my-feature')
    })

    it('handles multi-word slugs correctly', () => {
        const p = buildPlaceholders({ ...baseAnswers, slug: 'google-takeout-import' })
        expect(p['{{PKG_PASCAL}}']).toBe('GoogleTakeoutImport')
        expect(p['{{PKG_CAMEL}}']).toBe('googleTakeoutImport')
        expect(p['{{PKG_SNAKE}}']).toBe('google_takeout_import')
        expect(p['{{GO_MODULE}}']).toBe('tinycld.org/packages/google-takeout-import')
    })

    it('falls back to defaults for optional settings-only fields', () => {
        const minimal: Answers = {
            slug: 'settings-pkg',
            name: 'Settings Pkg',
            description: 'Just a settings panel.',
            preset: 'settings-only',
            targetDir: '/tmp/settings-pkg',
        }
        const p = buildPlaceholders(minimal)
        expect(p['{{PKG_ICON}}']).toBe('box')
        expect(p['{{PKG_NAV_ORDER}}']).toBe('20')
        expect(p['{{PKG_NAV_SHORTCUT}}']).toBe('')
    })
})

describe('substitute', () => {
    it('replaces all occurrences of each placeholder', () => {
        const placeholders = buildPlaceholders(baseAnswers)
        const input = 'hello {{PKG_SLUG}}! welcome to {{PKG_NAME}} ({{PKG_SLUG}})'
        const output = substitute(input, placeholders)
        expect(output).toBe('hello my-feature! welcome to My Feature (my-feature)')
    })

    it('leaves unrelated braces alone', () => {
        const placeholders = buildPlaceholders(baseAnswers)
        const input = 'const x = { y: 1 }; ${{PKG_SLUG}}'
        // ${{...}} (with dollar prefix) is not a token this substituter handles;
        // but {{PKG_SLUG}} without the $ IS. The dollar should be preserved as-is
        // since replaceAll is literal.
        const output = substitute(input, placeholders)
        expect(output).toBe('const x = { y: 1 }; $my-feature')
    })

    it('does not touch unknown placeholders', () => {
        const placeholders = buildPlaceholders(baseAnswers)
        const output = substitute('{{UNKNOWN_TOKEN}}', placeholders)
        expect(output).toBe('{{UNKNOWN_TOKEN}}')
    })
})
