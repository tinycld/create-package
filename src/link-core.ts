import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { confirm, isCancel, log, spinner } from '@clack/prompts'
import pc from 'picocolors'

const CORE_REPO_URL = 'git@github.com:tinycld/core.git'
const CORE_DIR_NAME = 'tinycld-core'

export type LinkMode = 'prompt' | 'accept' | 'skip'

export interface LinkCoreInput {
    packageName: string
    targetDir: string
    mode: LinkMode
}

/**
 * Returns true if the user chose to link (even if a subprocess failed —
 * the error is already logged, and we don't want to follow up with
 * "here are the manual steps" when the user already expressed intent).
 * Returns false only if linking was declined or skipped.
 */
export async function offerLinkCore({ packageName, targetDir, mode }: LinkCoreInput): Promise<boolean> {
    if (mode === 'skip') return false

    const parentDir = dirname(targetDir)
    const coreDir = join(parentDir, CORE_DIR_NAME)
    const coreExists = existsSync(coreDir)

    if (mode === 'prompt') {
        const prompt = coreExists
            ? `Link ${pc.bold(packageName)} into ${pc.bold(CORE_DIR_NAME)} now?`
            : `Clone ${pc.bold(CORE_DIR_NAME)} (shallow) and link ${pc.bold(packageName)} into it now?`

        const answer = await confirm({ message: prompt, initialValue: true })
        if (isCancel(answer) || answer !== true) return false
    }

    if (!coreExists) {
        const s = spinner()
        s.start(`Cloning ${CORE_REPO_URL} into ${coreDir}`)
        const clone = spawnSync('git', ['clone', '--depth', '1', CORE_REPO_URL, coreDir], {
            stdio: 'pipe',
            encoding: 'utf8',
        })
        if (clone.status !== 0) {
            s.stop(pc.red('Clone failed'), 1)
            log.error(clone.stderr.trim() || 'git clone exited non-zero')
            return true
        }
        s.stop(`Cloned ${CORE_DIR_NAME}`)
    } else {
        log.info(`Using existing ${CORE_DIR_NAME} at ${coreDir}`)
    }

    const install = spinner()
    install.start('Installing core dependencies (bun install)')
    const inst = spawnSync('bun', ['install'], { cwd: coreDir, stdio: 'pipe', encoding: 'utf8' })
    if (inst.status !== 0) {
        install.stop(pc.red('bun install failed'), 1)
        log.error(inst.stderr.trim() || 'bun install exited non-zero')
        return true
    }
    install.stop('Installed core dependencies')

    const link = spinner()
    link.start(`Linking ${packageName}`)
    const linkResult = spawnSync('bun', ['run', 'packages:link', packageName, targetDir], {
        cwd: coreDir,
        stdio: 'pipe',
        encoding: 'utf8',
    })
    if (linkResult.status !== 0) {
        link.stop(pc.red('Link failed'), 1)
        log.error(linkResult.stderr.trim() || 'packages:link exited non-zero')
        return true
    }
    link.stop(`Linked ${packageName} into ${CORE_DIR_NAME}`)

    return true
}
