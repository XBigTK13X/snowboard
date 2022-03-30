const boardGameGeek = require('./board-game-geek')
const boardGames = require('./board-games')

const register = (router) => {
    router.post('/api/board-game-geek/update/collection', async (request, response) => {
        response.send(await boardGameGeek.updateCollection(request.body.userName))
    })
    router.post('/api/board-game-geek/update/plays', async (request, response) => {
        response.send(await boardGameGeek.updatePlays(request.body.userName))
    })
    router.post('/api/board-game-geek/update/game-details', async (request, response) => {
        response.send(await boardGameGeek.updateGameDetails(request.body.userName))
    })
    router.post('/api/user/games/ingest', async (request, response) => {
        response.send(await boardGames.ingestGames(request.body.userName))
    })
    router.post('/api/user/plays/ingest', async (request, response) => {
        response.send(await boardGames.ingestPlays(request.body.userName))
    })
    router.post('/api/user/images/ingest', async (request, response) => {
        //TODO Host these images with nginx to avoid the restart
        console.log('Snowboard will need a restart to load new images!')
        response.send(await boardGames.ingestGameImages(request.body.userName))
    })

    router.get('/api/user/collection', async (request, response) => {
        response.send(await boardGames.getCollection(request.query.userName))
    })

    router.get('/api/user/game', async (request, response) => {
        response.send(await boardGames.getGame(request.query.gameId, request.query.userName))
    })

    router.post('/api/user/game/hidden/toggle', async (request, response) => {
        response.send(await boardGames.toggleHidden(request.query.gameId, request.query.userName))
    })
}

module.exports = {
    register,
}
