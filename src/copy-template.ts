import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type Answers, buildPlaceholders, type PlaceholderMap, substitute } from './substitute.ts'

// Files copied byte-for-byte. Binary formats and anything where {{...}}
// tokens would be a false match. All other files are UTF-8 and run through
// substitute.
const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.zip', '.woff', '.woff2'])

export function copyTemplate(templatesRoot: string, answers: Answers): void {
    const placeholders = buildPlaceholders(answers)
    const target = answers.targetDir

    if (!existsSync(target)) mkdirSync(target, { recursive: true })

    // Walk shared first, then the preset directory on top. Preset files with
    // the same relative path overwrite shared ones — lets presets customize a
    // single file (e.g. a richer tests/manifest.test.ts) without cloning the
    // whole shared tree.
    const sharedDir = join(templatesRoot, 'shared')
    const presetDir = join(templatesRoot, answers.preset)

    if (existsSync(sharedDir)) copyTree(sharedDir, target, placeholders)
    if (existsSync(presetDir)) copyTree(presetDir, target, placeholders)

    if (answers.preset === 'full' && answers.includeServer === false) {
        // User declined the Go server. Strip the `server: { ... }` manifest
        // field and drop the server/ directory. Cheaper than a separate
        // sub-template that would duplicate everything else in full/.
        stripServerFromManifest(join(target, 'manifest.ts'))
        const serverDir = join(target, 'server')
        if (existsSync(serverDir) && statSync(serverDir).isDirectory()) {
            rmSync(serverDir, { recursive: true, force: true })
        }
    }
}

function copyTree(srcRoot: string, dstRoot: string, placeholders: PlaceholderMap): void {
    walk(srcRoot, (isDir, relPath) => {
        const rendered = substitute(relPath, placeholders)
        const dst = join(dstRoot, rendered)

        if (isDir) {
            if (!existsSync(dst)) mkdirSync(dst, { recursive: true })
            return
        }

        const src = join(srcRoot, relPath)
        mkdirSync(dirname(dst), { recursive: true })

        if (isBinary(src)) {
            cpSync(src, dst)
            return
        }

        const content = readFileSync(src, 'utf8')
        writeFileSync(dst, substitute(content, placeholders), 'utf8')
    })
}

function walk(root: string, visit: (isDir: boolean, relPath: string) => void): void {
    const stack: string[] = ['']
    while (stack.length > 0) {
        const rel = stack.pop()
        if (rel === undefined) break
        const abs = join(root, rel)
        const entries = readdirSync(abs, { withFileTypes: true })
        for (const entry of entries) {
            const childRel = rel ? join(rel, entry.name) : entry.name
            if (entry.isDirectory()) {
                visit(true, childRel)
                stack.push(childRel)
            } else if (entry.isFile()) {
                visit(false, childRel)
            }
        }
    }
}

function isBinary(path: string): boolean {
    const idx = path.lastIndexOf('.')
    if (idx < 0) return false
    return BINARY_EXTENSIONS.has(path.slice(idx).toLowerCase())
}

function stripServerFromManifest(manifestPath: string): void {
    if (!existsSync(manifestPath)) return
    const src = readFileSync(manifestPath, 'utf8')
    const stripped = src.replace(/^\s*server:\s*\{[^}]*\},?\s*$\n?/m, '')
    writeFileSync(manifestPath, stripped, 'utf8')
}

/**
 * Resolve templates/ relative to the compiled module. In published builds
 * `dist/copy-template.js` sits next to `templates/`; in dev `src/copy-template.ts`
 * sits under the same parent as `templates/`. Both resolve to `../templates`.
 */
export function resolveTemplatesRoot(metaUrl: string): string {
    const here = dirname(fileURLToPath(metaUrl))
    return join(here, '..', 'templates')
}
