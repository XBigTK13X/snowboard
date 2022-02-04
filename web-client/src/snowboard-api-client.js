import axios from 'axios'
import settings from '../settings'

class ApiClient {
    constructor() {
        this.httpClient = axios.create({
            baseURL: settings.webApiUrl,
            username: null,
        })
    }

    get(url) {
        return this.httpClient.get(url).then((response) => {
            return response.data
        })
    }

    updateBoardGameGeek(userName) {
        return this.httpClient
            .post(`/board-game-geek/update`, {
                userName,
            })
            .then((response) => {
                return response.data
            })
    }
}

let instance

if (!instance) {
    instance = new ApiClient()
}

export default instance
