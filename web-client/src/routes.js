import pages from './page'

const routes = [
    {
        name: 'collection',
        url: '/collection/:userName',
        component: pages.Collection,
    },
    {
        name: 'admin',
        url: '/admin/:userName',
        component: pages.Admin,
    },
    {
        name: 'game',
        url: '/game/:gameId/:userName',
        component: pages.Game,
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
