#!/usr/bin/env node
import { relative } from 'node:path'
import { intro, outro } from '@clack/prompts'
import pc from 'picocolors'
import { copyTemplate, resolveTemplatesRoot } from './copy-template.ts'
import { offerLinkCore } from './link-core.ts'
import { runPrompts } from './prompts.ts'

function parseArgs(argv: readonly string[]): { slug?: string } {
    const positionals = argv.filter((a) => !a.startsWith('-'))
    return { slug: positionals[0] }
}

async function main(): Promise<void> {
    intro(pc.bold(pc.cyan('@tinycld/create-package')))

    const args = parseArgs(process.argv.slice(2))
    const answers = await runPrompts(args)

    copyTemplate(resolveTemplatesRoot(import.meta.url), answers)

    const packageName = `@tinycld/${answers.slug}`
    const linked = await offerLinkCore({ packageName, targetDir: answers.targetDir })

    const relTarget = relative(process.cwd(), answers.targetDir) || answers.targetDir
    outro(pc.green(`Scaffolded ${pc.bold(answers.slug)} at ${pc.bold(relTarget)}`))

    printNextSteps({ slug: answers.slug, relTarget, linked })
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
        lines.push(`  bun run packages:link @tinycld/${slug} ../${slug}`)
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
