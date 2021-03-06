import axios from 'axios'
import settings from './settings'

class ApiClient {
    constructor() {
        this.httpClient = axios.create({
            baseURL: settings.webApiUrl,
        })
    }

    get(url) {
        return this.httpClient.get(url).then((response) => {
            return response.data
        })
    }

    post(url, payload) {
        return this.httpClient.post(url, payload).then((response) => {
            return response.data
        })
    }

    updateCollection(userName) {
        return this.post(`/board-game-geek/update/collection`, {
            userName,
        })
    }

    updatePlays(userName) {
        return this.post(`/board-game-geek/update/plays`, {
            userName,
        })
    }

    updateGameDetails(userName) {
        return this.post(`/board-game-geek/update/game-details`, {
            userName,
        })
    }

    ingestGames(userName) {
        return this.post(`/user/games/ingest`, {
            userName,
        })
    }

    ingestPlays(userName) {
        return this.post(`/user/plays/ingest`, {
            userName,
        })
    }

    ingestGameImages(userName) {
        return this.post(`/user/images/ingest`, {
            userName,
        })
    }

    getCollection(userName) {
        return this.get(`/user/collection?userName=${userName}`)
    }

    getGame(gameId, userName) {
        return this.get(`/user/game?gameId=${gameId}&userName=${userName}`)
    }

    toggleGameHidden(gameId, userName) {
        return this.post(`/user/game/hidden/toggle?gameId=${gameId}&userName=${userName}`)
    }
}

let instance

if (!instance) {
    instance = new ApiClient()
}

export default instance
