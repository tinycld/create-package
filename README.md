# @tinycld/create-package

Scaffolder for `@tinycld` feature packages. Generates a sibling-repo starter with manifest, CI workflow, lint/typecheck, sample screens, seed, migrations, and (optionally) a Go server — all wired to work with `tinycld/core`'s generator and CI.

## Usage

```sh
# From anywhere (recommended: next to ~/code/tinycld/core so the
# default target dir `../my-feature` lands right alongside core's
# other siblings).
bunx @tinycld/create-package my-feature
```

The CLI prompts for anything it can't infer from argv (human name, description, preset, icon, nav order, etc.), then writes the new package directory. It does **not** run `git init`, call the GitHub API, or touch core — those are next steps you run yourself.

## Presets

- **`full`** — data package. Routes, sidebar, provider, collections, pb-migrations, seed, optional Go server. Matches the shape of `@tinycld/contacts`, `@tinycld/mail`, `@tinycld/calendar`, `@tinycld/drive`.
- **`settings-only`** — service package that only contributes a settings panel. No routes, no server, no collections. Matches `@tinycld/google-takeout-import`.

## After scaffolding

```sh
cd my-feature
git init && git add . && git commit -m 'chore: initial scaffold'
gh repo create tinycld/my-feature --public --source=. --push   # or whatever remote you want

# Link into core
cd ../core
bun run packages:link @tinycld/my-feature ../my-feature

# Verify the generated package works
cd ../my-feature
ln -s ../core/node_modules node_modules
bun run lint
bun run typecheck
rm node_modules   # don't leave it in place when linked into core
```

The generated `.github/workflows/ci.yml` will run automatically on your first push.

## Contributing

The templates live under `templates/` in this repo and are just directories of files with `{{PLACEHOLDER}}` tokens. To tweak what a new package looks like, edit the relevant file, run `bun run test` to confirm the end-to-end scaffolder still works, then bump the version and publish.

## Publishing

Publishing is automated on tag pushes via `.github/workflows/ci.yml`. Tag a release (`git tag v0.1.1 && git push --tags`) and the workflow calls `npm publish` using the repo's `NPM_TOKEN` secret.
