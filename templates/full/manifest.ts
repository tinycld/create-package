const manifest = {
    name: '{{PKG_NAME}}',
    slug: '{{PKG_SLUG}}',
    version: '0.1.0',
    description: '{{PKG_DESCRIPTION}}',
    routes: { directory: 'tinycld/{{PKG_SLUG}}/screens' },
    nav: {
        label: '{{PKG_NAME}}',
        icon: '{{PKG_ICON}}',
        order: {{PKG_NAV_ORDER}},
        shortcut: '{{PKG_NAV_SHORTCUT}}',
    },
    sidebar: { component: 'tinycld/{{PKG_SLUG}}/sidebar' },
    provider: { component: 'tinycld/{{PKG_SLUG}}/provider' },
    migrations: { directory: 'pb-migrations' },
    collections: { register: 'tinycld/{{PKG_SLUG}}/collections', types: 'tinycld/{{PKG_SLUG}}/types' },
    seed: { script: 'tinycld/{{PKG_SLUG}}/seed' },
    server: { package: 'server', module: '{{GO_MODULE}}' },
}

export default manifest
