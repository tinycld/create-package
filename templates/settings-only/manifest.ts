const manifest = {
    name: '{{PKG_NAME}}',
    slug: '{{PKG_SLUG}}',
    version: '0.1.0',
    description: '{{PKG_DESCRIPTION}}',
    settings: [
        {
            slug: '{{PKG_SLUG}}',
            component: 'tinycld/{{PKG_SLUG}}/settings/main',
            label: '{{PKG_NAME}}',
        },
    ],
}

export default manifest
