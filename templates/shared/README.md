# {{PKG_SCOPED}}

{{PKG_DESCRIPTION}}

Feature package for the [tinycld](https://github.com/tinycld/core) ecosystem. Lives as a standalone git repo alongside other siblings (`contacts`, `mail`, `calendar`, `drive`, `google-takeout-import`) and is linked into `core` via `bun run packages:link`.

## Development

```sh
# Clone core and this package as siblings
cd ~/code/tinycld
git clone git@github.com:tinycld/core.git
git clone git@github.com:tinycld/{{PKG_SLUG}}.git

# Link this package into core
cd core
bun install
bun run packages:link {{PKG_SCOPED}} ../{{PKG_SLUG}}

# Run the full stack
bun run dev
```

## Standalone checks

From this directory (linked into core, or with `node_modules` symlinked to
`../core/node_modules`):

```sh
bun run lint        # biome
bun run typecheck   # tsc --noEmit
bun run checks      # both
```

## CI

`.github/workflows/ci.yml` runs lint, typecheck, vitest, and Playwright e2e on every push to `main` and every PR. It clones `tinycld/core@main` into a sibling directory and links this package in — exactly what a developer does locally.

## Package anatomy

- `manifest.ts` — the single source of truth for this package's capabilities
- `package.json` — name, exports map, peer deps
- `biome.json`, `tsconfig.json` — lint / typecheck config
- `tests/` — vitest unit tests (run via core's vitest glob) + Playwright e2e specs (run via core's playwright sibling-project discovery)

See the core repo's `docs/packages.md` for the full manifest reference and how the generator wires sibling packages into the app.
