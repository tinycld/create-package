import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { confirm, isCancel, log, spinner } from '@clack/prompts'
import pc from 'picocolors'

const CORE_REPO_URL = 'git@github.com:tinycld/core.git'
const APP_REPO_URL = 'git@github.com:tinycld/tinycld.git'
const CORE_DIR_NAME = 'core'
const APP_DIR_NAME = 'tinycld'

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
 *
 * Linking happens against the tinycld **app shell** (sibling repo
 * `tinycld/tinycld`), which owns `packages:link`. The `core` library
 * sibling is also cloned because the app shell installs it via
 * `file:../core` and the package's tsconfig points at `../core/...`.
 */
export async function offerLinkCore({ packageName, targetDir, mode }: LinkCoreInput): Promise<boolean> {
    if (mode === 'skip') return false

    const parentDir = dirname(targetDir)
    const coreDir = join(parentDir, CORE_DIR_NAME)
    const appDir = join(parentDir, APP_DIR_NAME)
    const coreExists = existsSync(coreDir)
    const appExists = existsSync(appDir)

    if (mode === 'prompt') {
        const missing: string[] = []
        if (!coreExists) missing.push(CORE_DIR_NAME)
        if (!appExists) missing.push(APP_DIR_NAME)
        const prompt =
            missing.length === 0
                ? `Link ${pc.bold(packageName)} into ${pc.bold(APP_DIR_NAME)} now?`
                : `Clone ${pc.bold(missing.join(' + '))} (shallow) and link ${pc.bold(packageName)} into ${pc.bold(APP_DIR_NAME)} now?`

        const answer = await confirm({ message: prompt, initialValue: true })
        if (isCancel(answer) || answer !== true) return false
    }

    if (!coreExists) {
        if (!cloneRepo(CORE_REPO_URL, coreDir)) return true
    } else {
        log.info(`Using existing ${CORE_DIR_NAME} at ${coreDir}`)
    }

    if (!appExists) {
        if (!cloneRepo(APP_REPO_URL, appDir)) return true
    } else {
        log.info(`Using existing ${APP_DIR_NAME} at ${appDir}`)
    }

    const install = spinner()
    install.start(`Installing ${APP_DIR_NAME} dependencies (bun install)`)
    const inst = spawnSync('bun', ['install'], { cwd: appDir, stdio: 'pipe', encoding: 'utf8' })
    if (inst.status !== 0) {
        install.stop(pc.red('bun install failed'), 1)
        log.error(inst.stderr.trim() || 'bun install exited non-zero')
        return true
    }
    install.stop(`Installed ${APP_DIR_NAME} dependencies`)

    // packages:link in tinycld takes a sibling-directory locator and reads
    // the package name from the sibling's package.json. Pass a path relative
    // to the app shell so the symlink target stays portable.
    const link = spinner()
    link.start(`Linking ${packageName}`)
    const locator = relative(appDir, targetDir) || targetDir
    const linkResult = spawnSync('bun', ['run', 'packages:link', locator], {
        cwd: appDir,
        stdio: 'pipe',
        encoding: 'utf8',
    })
    if (linkResult.status !== 0) {
        link.stop(pc.red('Link failed'), 1)
        log.error(linkResult.stderr.trim() || 'packages:link exited non-zero')
        return true
    }
    link.stop(`Linked ${packageName} into ${APP_DIR_NAME}`)

    return true
}

function cloneRepo(url: string, dest: string): boolean {
    const s = spinner()
    s.start(`Cloning ${url} into ${dest}`)
    const result = spawnSync('git', ['clone', '--depth', '1', url, dest], {
        stdio: 'pipe',
        encoding: 'utf8',
    })
    if (result.status !== 0) {
        s.stop(pc.red('Clone failed'), 1)
        log.error(result.stderr.trim() || 'git clone exited non-zero')
        return false
    }
    s.stop(`Cloned ${dest}`)
    return true
}
