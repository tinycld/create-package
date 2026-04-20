# @tinycld/create-package

Interactive scaffolder for `@tinycld` feature packages. One command produces a sibling-repo starter — manifest, CI workflow, lint/typecheck, sample screens, seed, migrations, and (optionally) a Go server — already wired to work with [`tinycld/core`](https://github.com/tinycld/core)'s generator, to pass its CI, and to build against core's `@tinycld/core/**` import convention.

Modeled after [`create-vite`](https://github.com/vitejs/vite/tree/main/packages/create-vite): tiny CLI, templates embedded in the published npm package, no runtime network fetch.

## Requirements

- **[Bun](https://bun.sh)** (recommended) or Node ≥ 20
- A local `tinycld/core` checkout (the package it scaffolds is designed to be linked into core via `bun run packages:link`). The scaffolder itself doesn't touch core.
- `git` + `gh` if you intend to use the suggested "initial push" next-step — both are optional.

## Usage

```sh
bunx @tinycld/create-package my-feature
```

You'll be walked through an interactive prompt. The positional argument (`my-feature`) is the **slug** — kebab-case, 3–40 chars, becomes `@tinycld/my-feature`, the URL segment `/a/<orgSlug>/my-feature/`, and the Go module `tinycld.org/packages/my-feature`. Leave it off to be asked for it.

### Prompts

| Prompt | Example | Notes |
|---|---|---|
| **Package slug** | `my-feature` | Skipped if given as argv. Validates kebab-case, minimum 3 chars. |
| **Human-readable name** | `My Feature` | Defaults to title-cased slug; used in the manifest's `name` + nav label. |
| **One-sentence description** | `Does a thing well.` | Used in manifest `description`, package.json, and README. |
| **Preset** | `full` / `settings-only` | See below. |
| **Lucide icon name** (full only) | `box` | Any [lucide-react-native](https://lucide.dev/icons) name. Default `box`. |
| **Nav order** (full only) | `20` | Integer 0–99, controls sidebar position. |
| **Keyboard shortcut** (full only) | `f` | Single lowercase letter, or blank. |
| **Include a Go server?** (full only) | `y` / `n` | If no, `server/` and the manifest's `server` field are omitted. |
| **Target directory** | `../my-feature` | Default puts the new repo alongside `core/`. Must not exist or must be empty. |

### Flags

Positional slug only. `--help` is not wired (yet) — if you need to inspect prompts, run `bunx @tinycld/create-package` with no argv and abort.

## Presets

The scaffolder offers two starting points, corresponding to the two shapes already present in the tinycld ecosystem.

### `full` — data package

Matches the shape of `@tinycld/contacts`, `@tinycld/mail`, `@tinycld/calendar`, `@tinycld/drive`. You get routes, a sidebar, an optional provider, pbtsdb collections, PocketBase migrations, seed data, and a Go server stub.

<details>
<summary>Generated tree (with <code>slug=my-feature</code>)</summary>

```
my-feature/
├── .github/workflows/ci.yml           # lint + typecheck + unit + e2e, clones core + links self
├── .gitignore
├── README.md                          # developer-facing onboarding for this package
├── biome.json                         # same config all tinycld siblings use
├── manifest.ts                        # name, slug, routes, nav, collections, seed, server, ...
├── package.json                       # @tinycld/my-feature, peer deps, scripts
├── tsconfig.json                      # extends core's; path aliases for @tinycld/core/*
├── pb-migrations/
│   └── 1800000000_create_my-feature.js  # creates my_feature_items collection
├── server/
│   ├── go.mod                         # module tinycld.org/packages/my-feature
│   └── register.go                    # func Register(app) wiring audit hooks
├── tests/
│   └── manifest.test.ts               # vitest smoke test of manifest shape
└── tinycld/my-feature/                # all package TypeScript lives under this prefix
    ├── collections.ts                 # registerCollections() for pbtsdb
    ├── provider.tsx                   # optional context provider
    ├── seed.ts                        # default-export async seed(pb, ctx)
    ├── sidebar.tsx                    # sidebar rendered for this package's routes
    ├── types.ts                       # {{PKG_PASCAL}}Schema + record interfaces
    └── screens/
        ├── _layout.tsx                # Stack layout for /a/[orgSlug]/my-feature/**
        ├── [id].tsx                   # detail route
        └── index.tsx                  # list route
```

</details>

The `tinycld/my-feature/` nesting mirrors core's `tinycld/core/` layout and gives the package a stable public API surface: `@tinycld/my-feature/screens/*`, `/sidebar`, `/collections`, etc.

### `settings-only` — service package

Matches `@tinycld/google-takeout-import`. The package contributes only a settings panel — no routes, no nav entry, no collections, no server. Use this for integrations or admin-style tools that live under `/a/<orgSlug>/settings/**`.

<details>
<summary>Generated tree</summary>

```
my-service/
├── .github/workflows/ci.yml
├── .gitignore
├── README.md
├── biome.json
├── manifest.ts                        # name, slug, description, settings[] only
├── package.json
├── tsconfig.json
├── tests/
│   └── manifest.test.ts
└── tinycld/my-service/
    ├── types.ts                       # public type exports (empty by default)
    └── settings/
        └── main.tsx                   # the settings panel component
```

</details>

## After scaffolding

The CLI prints the steps it didn't run on your behalf. You can copy them verbatim:

```sh
# 1. Initialize git and push to GitHub
cd my-feature
git init
git add .
git commit -m 'chore: initial scaffold'
gh repo create tinycld/my-feature --public --source=. --push

# 2. Link into core so you can develop against it
cd ../core
bun run packages:link @tinycld/my-feature ../my-feature

# 3. Verify
bun run checks
```

Once linked, core's generator wires your manifest into the app automatically: routes appear at `/a/<orgSlug>/my-feature/**`, the sidebar renders, the settings panel shows up, migrations get picked up by PocketBase, etc. No further changes in core are needed.

### Running the scaffolded package's own CI locally

The scaffolded `.github/workflows/ci.yml` reproduces the core-link-and-test dance locally. From inside the scaffolded package, with core linked:

```sh
cd my-feature
ln -s ../core/node_modules node_modules   # mimics linked-into-core state
bun run lint                               # biome
bun run typecheck                          # tsc --noEmit --skipLibCheck
rm node_modules                            # don't leave this in place
```

When you push, the workflow does the full thing: checks out core alongside your repo, links your package in, builds PocketBase, runs vitest, runs Playwright against the mounted sibling project. No secrets are needed — the test user and db-reset are ephemeral per-run.

## Import conventions the templates assume

The templates are written for core's current import convention. Sibling packages should import core utilities via the **scoped** path:

```ts
// ✓ right
import { useOrgLiveQuery } from '@tinycld/core/lib/use-org-live-query'
import { useThemeColor } from '@tinycld/core/lib/use-app-theme'
import { Modal } from '@tinycld/core/ui/modal'

// ✗ wrong (legacy; resolved in earlier core layouts but not the current one)
import { useOrgLiveQuery } from '~/lib/use-org-live-query'
```

Within the package, intra-package imports use relative paths:

```ts
import { registerCollections } from './collections'
import { ContactForm } from '../components/ContactForm'
```

`~/tinycld/<slug>/*` is also aliased to your own nested source, for cases where you want an absolute import within the package — but relative paths are usually clearer.

Cross-package dependencies are **not** supported at compile time. If your package needs data from another package (e.g. mail wanting to read contacts), use the runtime `usePackages()` helper from `@tinycld/core/lib/packages/use-packages` and do the lookup at runtime. See `mail/tinycld/mail/components/ContactSuggestionsList.tsx` or `drive/tinycld/drive/components/ContactSuggestionsSource.tsx` for the canonical pattern.

## Contributing to the templates

Templates live under `templates/`:

```
templates/
├── shared/             # files identical across presets (biome, tsconfig, CI workflow, README)
├── full/               # data-package preset
└── settings-only/      # settings-only preset
```

`shared/` is copied first; the selected preset is copied on top. A preset can override a shared file just by naming it at the same relative path.

Files contain `{{PLACEHOLDER}}` tokens that get substituted at scaffold time:

| Placeholder | Derivation |
|---|---|
| `{{PKG_SLUG}}` | user input, kebab-case |
| `{{PKG_NAME}}` | user input, human-readable |
| `{{PKG_SCOPED}}` | `@tinycld/` + slug |
| `{{PKG_PASCAL}}` | PascalCase of slug |
| `{{PKG_CAMEL}}` | camelCase of slug |
| `{{PKG_SNAKE}}` | snake_case of slug (for DB table names) |
| `{{PKG_DESCRIPTION}}` | user input |
| `{{PKG_ICON}}` | user input, lucide icon name |
| `{{PKG_NAV_ORDER}}` | user input, integer |
| `{{PKG_NAV_SHORTCUT}}` | user input, single letter or empty |
| `{{GO_MODULE}}` | `tinycld.org/packages/` + slug |

Substitution runs on both file **content** and **file/directory names** — that's how `tinycld/{{PKG_SLUG}}/**` becomes `tinycld/my-feature/**`.

Adding a new placeholder requires one line in `src/substitute.ts`'s `buildPlaceholders()` plus whatever tokens you scatter through the templates.

### Running the scaffolder tests

```sh
bun install
bun run test       # vitest: validate + substitute + end-to-end scaffold into tmpdir
bun run lint       # biome
bun run typecheck  # tsc --noEmit
bun run build      # compile src/ → dist/
```

The scaffolder tests actually invoke `copyTemplate` into a tmp directory and assert the expected tree, file contents, and placeholder substitutions for both presets.

## Publishing

The repo's `.github/workflows/ci.yml` has a `publish` job that runs on tag pushes (`v*`). Tag a release and it ships to npm under the `@tinycld` scope:

```sh
# Bump version in package.json, commit, then
git tag v0.1.1
git push --tags
```

Publishing needs an `NPM_TOKEN` repo secret (npm "automation" token scoped to `@tinycld`). Add it once at Settings → Secrets → Actions.

## Design notes

- **Templates are embedded in the npm package**, not fetched from a separate repo. `bunx` grabs them once; scaffolding is offline thereafter.
- **Direct string replacement**, no handlebars / EJS. Simpler, fewer moving parts, no runtime template compiler.
- **No destructive actions**: the CLI refuses to overwrite a non-empty target directory and never touches git, gh, or core. All of that is printed as copy-pastable next-steps.
- **Two presets, not N flags**. We have exactly two shapes of feature package in the tinycld ecosystem today (data package, settings-only); offering a fine-grained matrix of "routes y/n, server y/n, …" adds prompt-fatigue with no real benefit.
- **`@clack/prompts`** for the interactive UX: smaller and nicer than inquirer. **`picocolors`** for output, no `chalk` weight.

## License

MIT.
