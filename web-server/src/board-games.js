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

const pollKeys = {
    suggested_numplayers: 'suggestedPlayerCounts',
}

class BoardGame {
    constructor(bggJson) {
        this.bgg = {
            thingId: parseInt(bggJson._attributes.objectid, 10),
            collectionId: parseInt(bggJson._attributes.collid, 10),
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

    parseDetails(bggJson) {
        this.description = bggJson.description._text
        this.minAge = parseInt(bggJson.minage._attributes.value, 10)
        this.minPlayers = parseInt(bggJson.minplayers._attributes.value, 10)
        this.maxPlayers = parseInt(bggJson.maxplayers._attributes.value, 10)
        this.minPlayTimeMinutes = parseInt(bggJson.minplaytime._attributes.value, 10)
        this.maxPlayTimeMinutes = parseInt(bggJson.maxplaytime._attributes.value, 10)
        this.playTimeMinutes = parseInt(bggJson.playingtime._attributes.value, 10)
        this.averageWeight = parseInt(bggJson.statistics.ratings.averageweight._attributes.value, 10)
        this.weightRatings = parseInt(bggJson.statistics.ratings.numweights, 10)

        for (let poll of bggJson.poll) {
            let pollKey = pollKeys[poll._attributes.name]
            if (!pollKey) {
                continue
            }
            this[pollKey] = {
                title: poll._attributes.title,
                totalVotes: poll._attributes.totalvotes,
                players: {},
            }
            for (let pollResult of poll.results) {
                // TODO Make this an int and handle the 10+
                this[pollKey].players[pollResult._attributes.numplayers] = {
                    best: parseInt(pollResult.result[0]._attributes.numvotes, 10),
                    recommended: parseInt(pollResult.result[1]._attributes.numvotes, 10),
                    avoid: parseInt(pollResult.result[2]._attributes.numvotes, 10),
                }
            }
        }

        // Mechanics / Family
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
            thingId: bggJson._attributes.id,
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
        let detailsLookup = {}
        for (let detail of bggCollection.details.items.item) {
            detailsLookup[parseInt(detail._attributes.id)] = detail
        }
        let games = []
        for (let game of bggCollection.games.items.item) {
            let boardGame = new BoardGame(game)
            if (detailsLookup[boardGame.bgg.thingId]) {
                boardGame.parseDetails(detailsLookup[boardGame.bgg.thingId])
            }
            games.push(boardGame)
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
