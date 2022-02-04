const boardGameGeek = require('./board-game-geek')
const register = (router) => {
    router.get('/api/board-game-geek/update', async (request, response) => {
        let result = await request.body.userName
        response.send(result)
    })
}

module.exports = {
    register,
}
