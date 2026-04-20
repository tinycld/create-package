import { existsSync, readdirSync, statSync } from 'node:fs'

const SLUG_RE = /^[a-z][a-z0-9-]*[a-z0-9]$/
const RESERVED_SLUGS = new Set(['core', 'main', 'test', 'tests', 'node_modules', 'packages'])
const SHORTCUT_RE = /^[a-z]$/
const ICON_RE = /^[a-z][a-z0-9-]*$/

export function validateSlug(slug: string): string | null {
    if (!slug || slug.length < 3) return 'Slug must be at least 3 characters'
    if (slug.length > 40) return 'Slug must be 40 characters or fewer'
    if (!SLUG_RE.test(slug)) {
        return 'Slug must be kebab-case (lowercase letters, digits, hyphens; no leading/trailing hyphen)'
    }
    if (RESERVED_SLUGS.has(slug)) return `"${slug}" is reserved`
    return null
}

export function validateName(name: string): string | null {
    if (!name || name.trim().length === 0) return 'Name is required'
    if (name.length > 60) return 'Name must be 60 characters or fewer'
    return null
}

export function validateDescription(desc: string): string | null {
    if (!desc || desc.trim().length === 0) return 'Description is required'
    if (desc.length > 200) return 'Description must be 200 characters or fewer'
    return null
}

export function validateIcon(icon: string): string | null {
    if (!icon || icon.length === 0) return null // optional
    if (!ICON_RE.test(icon)) return 'Icon must be a lucide-react-native name (lowercase, hyphens)'
    return null
}

export function validateNavOrder(raw: string): string | null {
    const n = Number(raw)
    if (!Number.isInteger(n)) return 'Nav order must be an integer'
    if (n < 0 || n > 99) return 'Nav order must be between 0 and 99'
    return null
}

export function validateShortcut(s: string): string | null {
    if (!s || s.length === 0) return null // optional
    if (!SHORTCUT_RE.test(s)) return 'Shortcut must be a single lowercase letter'
    return null
}

export function validateTargetDir(dir: string): string | null {
    if (!existsSync(dir)) return null
    const stat = statSync(dir)
    if (!stat.isDirectory()) return `${dir} exists and is not a directory`
    const entries = readdirSync(dir).filter((n) => n !== '.DS_Store')
    if (entries.length > 0) return `${dir} exists and is not empty`
    return null
}
