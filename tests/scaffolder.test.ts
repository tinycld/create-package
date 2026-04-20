import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { copyTemplate, resolveTemplatesRoot } from '../src/copy-template.ts'
import type { Answers } from '../src/substitute.ts'

const templatesRoot = resolveTemplatesRoot(import.meta.url).replace('/tests/..', '')

let tmpRoot: string
beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'tcpkg-scaffolder-'))
})
afterEach(() => {
    rmSync(tmpRoot, { recursive: true, force: true })
})

function scaffold(overrides: Partial<Answers> = {}): string {
    const target = join(tmpRoot, 'generated')
    const answers: Answers = {
        slug: 'my-feature',
        name: 'My Feature',
        description: 'Does a thing.',
        preset: 'full',
        icon: 'box',
        navOrder: 20,
        navShortcut: 'f',
        includeServer: true,
        targetDir: target,
        ...overrides,
    }
    copyTemplate(templatesRoot, answers)
    return target
}

describe('copyTemplate — full preset', () => {
    it('writes all expected files', () => {
        const target = scaffold()
        const expected = [
            'package.json',
            'manifest.ts',
            'tsconfig.json',
            'biome.json',
            '.gitignore',
            'README.md',
            'types.ts',
            'collections.ts',
            'sidebar.tsx',
            'provider.tsx',
            'seed.ts',
            'screens/_layout.tsx',
            'screens/index.tsx',
            'screens/[id].tsx',
            'pb-migrations/1800000000_create_my-feature.js',
            'server/go.mod',
            'server/register.go',
            'tests/manifest.test.ts',
            '.github/workflows/ci.yml',
        ]
        for (const path of expected) {
            expect(existsSync(join(target, path)), `missing ${path}`).toBe(true)
        }
    })

    it('substitutes placeholders in package.json', () => {
        const target = scaffold()
        const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'))
        expect(pkg.name).toBe('@tinycld/my-feature')
        expect(pkg.description).toBe('Does a thing.')
    })

    it('substitutes placeholders in manifest.ts', () => {
        const target = scaffold()
        const src = readFileSync(join(target, 'manifest.ts'), 'utf8')
        expect(src).toContain("name: 'My Feature'")
        expect(src).toContain("slug: 'my-feature'")
        expect(src).toContain("icon: 'box'")
        expect(src).toContain('order: 20')
        expect(src).toContain("shortcut: 'f'")
        expect(src).toContain("module: 'tinycld.org/packages/my-feature'")
        // No leftover placeholder tokens.
        expect(src).not.toMatch(/\{\{[A-Z_]+\}\}/)
    })

    it('substitutes the migration filename', () => {
        const target = scaffold()
        expect(existsSync(join(target, 'pb-migrations', '1800000000_create_my-feature.js'))).toBe(true)
    })

    it('generates a ci.yml that references the slug and scoped name', () => {
        const target = scaffold()
        const yml = readFileSync(join(target, '.github/workflows/ci.yml'), 'utf8')
        expect(yml).toContain('path: my-feature')
        expect(yml).toContain('packages:link @tinycld/my-feature ../my-feature')
        expect(yml).toContain('--project "@tinycld/my-feature"')
        expect(yml).not.toMatch(/\{\{[A-Z_]+\}\}/)
    })

    it('omits server/ when includeServer is false', () => {
        const target = scaffold({ includeServer: false })
        expect(existsSync(join(target, 'server'))).toBe(false)
        const manifest = readFileSync(join(target, 'manifest.ts'), 'utf8')
        expect(manifest).not.toContain('server:')
    })

    it('derives casing variants correctly in component identifiers', () => {
        const target = scaffold()
        const sidebar = readFileSync(join(target, 'sidebar.tsx'), 'utf8')
        expect(sidebar).toContain('MyFeatureSidebar')
        const provider = readFileSync(join(target, 'provider.tsx'), 'utf8')
        expect(provider).toContain('MyFeatureProvider')
    })
})

describe('copyTemplate — settings-only preset', () => {
    const base: Partial<Answers> = {
        preset: 'settings-only',
        icon: undefined,
        navOrder: undefined,
        navShortcut: undefined,
        includeServer: undefined,
    }

    it('writes a minimal file tree (no screens, no server, no pb-migrations)', () => {
        const target = scaffold(base)
        const shouldExist = [
            'package.json',
            'manifest.ts',
            'tsconfig.json',
            'biome.json',
            '.gitignore',
            'README.md',
            'types.ts',
            'settings/main.tsx',
            'tests/manifest.test.ts',
            '.github/workflows/ci.yml',
        ]
        for (const p of shouldExist) {
            expect(existsSync(join(target, p)), `missing ${p}`).toBe(true)
        }
        const shouldNotExist = ['screens', 'pb-migrations', 'server', 'sidebar.tsx', 'provider.tsx', 'collections.ts']
        for (const p of shouldNotExist) {
            expect(existsSync(join(target, p)), `unexpected ${p}`).toBe(false)
        }
    })

    it('omits routes and server fields from the manifest', () => {
        const target = scaffold(base)
        const manifest = readFileSync(join(target, 'manifest.ts'), 'utf8')
        expect(manifest).not.toContain('routes:')
        expect(manifest).not.toContain('server:')
        expect(manifest).toContain('settings: [')
        expect(manifest).toContain("component: 'settings/main'")
    })
})
