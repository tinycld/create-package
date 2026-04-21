export interface Answers {
    slug: string
    name: string
    description: string
    preset: 'full' | 'settings-only'
    icon?: string
    navOrder?: number
    navShortcut?: string
    includeServer?: boolean
    targetDir: string
}

export type PlaceholderMap = Record<string, string>

export function buildPlaceholders(answers: Answers): PlaceholderMap {
    const slug = answers.slug
    return {
        '{{PKG_SLUG}}': slug,
        '{{PKG_NAME}}': answers.name,
        '{{PKG_SCOPED}}': slug, // kept for back-compat; identical to PKG_SLUG
        '{{PKG_PASCAL}}': toPascalCase(slug),
        '{{PKG_CAMEL}}': toCamelCase(slug),
        '{{PKG_SNAKE}}': slug.replace(/-/g, '_'),
        '{{PKG_DESCRIPTION}}': answers.description,
        '{{PKG_ICON}}': answers.icon ?? 'box',
        '{{PKG_NAV_ORDER}}': String(answers.navOrder ?? 20),
        '{{PKG_NAV_SHORTCUT}}': answers.navShortcut ?? '',
        '{{GO_MODULE}}': `tinycld.org/packages/${slug}`,
    }
}

export function substitute(content: string, placeholders: PlaceholderMap): string {
    let out = content
    for (const [token, value] of Object.entries(placeholders)) {
        out = out.replaceAll(token, value)
    }
    return out
}

function toPascalCase(slug: string): string {
    return slug
        .split('-')
        .filter(Boolean)
        .map((part) => (part[0]?.toUpperCase() ?? '') + part.slice(1).toLowerCase())
        .join('')
}

function toCamelCase(slug: string): string {
    const pascal = toPascalCase(slug)
    return (pascal[0]?.toLowerCase() ?? '') + pascal.slice(1)
}
