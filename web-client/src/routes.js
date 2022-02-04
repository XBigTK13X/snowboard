import pages from './page'

const routes = [
    {
        name: 'admin',
        url: '/',
        component: pages.Admin,
    },
]

for (let route of routes) {
    if (!route.component) {
        console.error({ route })
        throw new Error(`Route is missing component`)
    }
    if (!route.name) {
        console.error({ route })
        throw new Error(`Route is missing name`)
    }
    if (!route.url) {
        console.error({ route })
        throw new Error(`Route is missing url`)
    }
}

export default routes
