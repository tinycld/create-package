#!/usr/bin/env node
import { relative } from 'node:path'
import { intro, outro } from '@clack/prompts'
import pc from 'picocolors'
import { copyTemplate, resolveTemplatesRoot } from './copy-template.ts'
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

    const relTarget = relative(process.cwd(), answers.targetDir) || answers.targetDir
    outro(pc.green(`Scaffolded ${pc.bold(answers.slug)} at ${pc.bold(relTarget)}`))

    printNextSteps(answers.slug, relTarget)
}

function printNextSteps(slug: string, relTarget: string): void {
    const lines = [
        '',
        pc.bold('Next steps:'),
        '',
        `  ${pc.dim('# 1. Initialize git and push to GitHub')}`,
        `  cd ${relTarget}`,
        '  git init',
        '  git add .',
        "  git commit -m 'chore: initial scaffold'",
        `  gh repo create tinycld/${slug} --public --source=. --push`,
        '',
        `  ${pc.dim('# 2. Link into core')}`,
        '  cd ../core',
        `  bun run packages:link @tinycld/${slug} ../${slug}`,
        '',
        `  ${pc.dim('# 3. Verify')}`,
        '  bun run checks',
        '',
    ]
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log(lines.join('\n'))
}

main().catch((err) => {
    // biome-ignore lint/suspicious/noConsole: CLI error output
    console.error(pc.red('Error:'), err?.message ?? err)
    process.exit(1)
})
