const database = require('./database')

const boardGameGeek = require('./board-game-geek')

const StatusFlag = {
    own: 1,
    prevowned: 2,
    fortrade: 4,
    want: 8,
    wanttoplay: 16,
    wanttobuy: 32,
    wishlist: 64,
    preordered: 128,
}
const StatusFlagNames = Object.keys(StatusFlag)

class BoardGame {
    constructor(bggJson) {
        this.bgg = {
            objectId: parseInt(bggJson._attributes.objectid, 10),
            collid: parseInt(bggJson._attributes.collid, 10),
            thumbnailUrl: bggJson.thumbnail._text,
            coverUrl: bggJson.image._text,
        }
        this.name = bggJson.name._text
        this.yearPublished = parseInt(bggJson.yearpublished._text, 10)
        this.statusFlag = 0
        for (let statusFlagName of StatusFlagNames) {
            if (bggJson.status._attributes[statusFlagName] === '1') {
                this.statusFlag += StatusFlag[statusFlagName]
            }
        }
        if (bggJson.numplays) {
            this.playCount = parseInt(bggJson.numplays._text)
        }
        this.isExpansion = bggJson._attributes.subtype === 'boardgameexpansion'
    }
}

class PlayerRecord {
    constructor(bggJson) {
        this.name = bggJson._attributes.name
        this.score = bggJson._attributes.score
        this.win = bggJson._attributes.win
    }
}

class PlayRecord {
    constructor(bggJson) {
        this.bgg = {
            id: bggJson._attributes.id,
            gameId: bggJson.item._attributes.objectid,
        }
        this.location = bggJson._attributes.location
        this.lengthMinutes = bggJson._attributes.length
        this.date = bggJson._attributes.date
        this.gameName = bggJson.item._attributes.name
        this.comments = !!bggJson.comments ? bggJson.comments._text : ''
        if (bggJson.players.player._attributes) {
            this.players = [new PlayerRecord(bggJson.players.player)]
        } else {
            this.players = bggJson.players.player.map((x) => {
                return new PlayerRecord(x)
            })
        }
    }
}

const ingestGames = (userName) => {
    return new Promise(async (resolve) => {
        let bggCollection = await boardGameGeek.getAllGames(userName)
        let games = []
        for (let game of bggCollection.games.items.item) {
            games.push(new BoardGame(game))
        }
        for (let game of bggCollection.expansions.items.item) {
            games.push(new BoardGame(game))
        }
        const db = database.getInstance(`user/${userName}/games`)
        resolve(await db.write({ games }))
    })
}

const ingestPlays = (userName) => {
    return new Promise(async (resolve) => {
        let bggPlays = await boardGameGeek.getAllPlays(userName)
        let plays = []
        for (let play of bggPlays.plays.plays.play) {
            plays.push(new PlayRecord(play))
        }
        const db = database.getInstance(`user/${userName}/plays`)
        resolve(await db.write({ plays }))
    })
}

const ingestGameInfos = (userName) => {
    return new Promise(async (resolve) => {
        resolve({})
    })
}

const ingestGameImages = (userName) => {
    return new Promise(async (resolve) => {
        resolve({})
    })
}

module.exports = {
    ingestGames,
    ingestPlays,
}
