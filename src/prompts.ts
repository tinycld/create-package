import { resolve } from 'node:path'
import { cancel, confirm, isCancel, select, text } from '@clack/prompts'
import type { Answers } from './substitute.ts'
import {
    validateDescription,
    validateIcon,
    validateName,
    validateNavOrder,
    validateShortcut,
    validateSlug,
    validateTargetDir,
} from './validate.ts'

export interface CliArgs {
    slug?: string
}

function cancelIf<T>(value: T | symbol): T {
    if (isCancel(value)) {
        cancel('Scaffolding cancelled.')
        process.exit(1)
    }
    return value
}

function titleCase(slug: string): string {
    return slug
        .split('-')
        .filter(Boolean)
        .map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1))
        .join(' ')
}

export async function runPrompts(argv: CliArgs): Promise<Answers> {
    const slug = await resolveSlug(argv.slug)

    const name = cancelIf(
        await text({
            message: 'Human-readable name',
            initialValue: titleCase(slug),
            validate: (v) => validateName(v) ?? undefined,
        })
    )

    const description = cancelIf(
        await text({
            message: 'One-sentence description',
            placeholder: `${titleCase(slug)} for your organization`,
            validate: (v) => validateDescription(v) ?? undefined,
        })
    )

    const preset = cancelIf(
        await select({
            message: 'Preset',
            options: [
                {
                    value: 'full' as const,
                    label: 'full — data package (routes, collections, migrations, seed, optional Go server)',
                },
                {
                    value: 'settings-only' as const,
                    label: 'settings-only — just a settings panel (like @tinycld/google-takeout-import)',
                },
            ],
        })
    )

    const answers: Answers = {
        slug,
        name,
        description,
        preset,
        targetDir: '', // set below
    }

    if (preset === 'full') {
        answers.icon = cancelIf(
            await text({
                message: 'Lucide icon name',
                placeholder: 'box',
                initialValue: 'box',
                validate: (v) => validateIcon(v) ?? undefined,
            })
        )
        const rawOrder = cancelIf(
            await text({
                message: 'Nav order (0–99)',
                initialValue: '20',
                validate: (v) => validateNavOrder(v) ?? undefined,
            })
        )
        answers.navOrder = Number(rawOrder)
        answers.navShortcut = cancelIf(
            await text({
                message: 'Keyboard shortcut (single letter, blank to skip)',
                placeholder: '',
                initialValue: '',
                validate: (v) => validateShortcut(v) ?? undefined,
            })
        )
        answers.includeServer = cancelIf(
            await confirm({
                message: 'Include a Go server?',
                initialValue: true,
            })
        )
    }

    const defaultTarget = `./${slug}`
    const rawTarget = cancelIf(
        await text({
            message: 'Target directory',
            initialValue: defaultTarget,
            validate: (v) => validateTargetDir(resolve(v)) ?? undefined,
        })
    )
    answers.targetDir = resolve(rawTarget)

    return answers
}

async function resolveSlug(fromArgv: string | undefined): Promise<string> {
    if (fromArgv) {
        const err = validateSlug(fromArgv)
        if (err) {
            cancel(`Invalid slug "${fromArgv}": ${err}`)
            process.exit(1)
        }
        return fromArgv
    }
    const slug = cancelIf(
        await text({
            message: 'Package slug (kebab-case, e.g. my-feature)',
            validate: (v) => validateSlug(v) ?? undefined,
        })
    )
    return slug
}
