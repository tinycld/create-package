const manifest = {
    name: '{{PKG_NAME}}',
    slug: '{{PKG_SLUG}}',
    version: '0.1.0',
    description: '{{PKG_DESCRIPTION}}',
    routes: { directory: 'screens' },
    nav: {
        label: '{{PKG_NAME}}',
        icon: '{{PKG_ICON}}',
        order: {{PKG_NAV_ORDER}},
        shortcut: '{{PKG_NAV_SHORTCUT}}',
    },
    sidebar: { component: 'sidebar' },
    provider: { component: 'provider' },
    migrations: { directory: 'pb-migrations' },
    collections: { register: 'collections', types: 'types' },
    seed: { script: 'seed' },
    server: { package: 'server', module: '{{GO_MODULE}}' },
}

export default manifest
