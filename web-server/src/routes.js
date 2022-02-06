const boardGameGeek = require('./board-game-geek')
const boardGames = require('./board-games')

const register = (router) => {
    router.post('/api/board-game-geek/update/collection', async (request, response) => {
        let result = await boardGameGeek.updateCollection(request.body.userName)
        response.send(result)
    })
    router.post('/api/board-game-geek/update/plays', async (request, response) => {
        let result = await boardGameGeek.updatePlays(request.body.userName)
        response.send(result)
    })
    router.post('/api/board-game-geek/update/game-details', async (request, response) => {
        let result = await boardGameGeek.updateGameDetails(request.body.userName)
        response.send(result)
    })
    router.post('/api/user/games/ingest', async (request, response) => {
        let result = await boardGames.ingestGames(request.body.userName)
        response.send(result)
    })
    router.post('/api/user/plays/ingest', async (request, response) => {
        let result = await boardGames.ingestPlays(request.body.userName)
        response.send(result)
    })
}

module.exports = {
    register,
}
