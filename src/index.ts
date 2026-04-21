#!/usr/bin/env node
import { relative } from 'node:path'
import { intro, outro } from '@clack/prompts'
import pc from 'picocolors'
import { ArgParseError, parseArgs } from './args.ts'
import { copyTemplate, resolveTemplatesRoot } from './copy-template.ts'
import { offerLinkCore } from './link-core.ts'
import { runPrompts } from './prompts.ts'

async function main(): Promise<void> {
    intro(pc.bold(pc.cyan('@tinycld/create-package')))

    let args: ReturnType<typeof parseArgs>
    try {
        args = parseArgs(process.argv.slice(2))
    } catch (err) {
        if (err instanceof ArgParseError) {
            // biome-ignore lint/suspicious/noConsole: CLI error output
            console.error(pc.red('Bad arguments:'))
            for (const issue of err.issues) {
                // biome-ignore lint/suspicious/noConsole: CLI error output
                console.error(`  --${issue.flag}: ${issue.reason}`)
            }
            process.exit(2)
        }
        throw err
    }

    const answers = await runPrompts(args)

    copyTemplate(resolveTemplatesRoot(import.meta.url), answers)

    const linked = await offerLinkCore({
        packageName: answers.slug,
        targetDir: answers.targetDir,
        mode: resolveLinkMode(args),
    })

    const relTarget = relative(process.cwd(), answers.targetDir) || answers.targetDir
    outro(pc.green(`Scaffolded ${pc.bold(answers.slug)} at ${pc.bold(relTarget)}`))

    printNextSteps({ slug: answers.slug, relTarget, linked })
}

function resolveLinkMode(args: ReturnType<typeof parseArgs>): 'prompt' | 'accept' | 'skip' {
    if (args.link === false) return 'skip'
    if (args.link === true) return 'accept'
    if (args.yes === true) return 'accept'
    return 'prompt'
}

interface NextStepsInput {
    slug: string
    relTarget: string
    linked: boolean
}

function printNextSteps({ slug, relTarget, linked }: NextStepsInput): void {
    const lines: string[] = ['', pc.bold('Next steps:'), '']
    let step = 1

    lines.push(`  ${pc.dim(`# ${step++}. Initialize git and push to GitHub`)}`)
    lines.push(`  cd ${relTarget}`)
    lines.push('  git init')
    lines.push('  git add .')
    lines.push("  git commit -m 'chore: initial scaffold'")
    lines.push(`  gh repo create tinycld/${slug} --public --source=. --push`)
    lines.push('')

    if (!linked) {
        lines.push(`  ${pc.dim(`# ${step++}. Link into core`)}`)
        lines.push('  cd ../tinycld-core')
        lines.push(`  bun run packages:link ${slug} ../${slug}`)
        lines.push('')
    }

    lines.push(`  ${pc.dim(`# ${step++}. Verify`)}`)
    lines.push('  bun run checks')
    lines.push('')

    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log(lines.join('\n'))
}

main().catch((err) => {
    // biome-ignore lint/suspicious/noConsole: CLI error output
    console.error(pc.red('Error:'), err?.message ?? err)
    process.exit(1)
})
