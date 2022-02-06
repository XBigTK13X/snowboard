const database = require('./database')
const settings = require('./settings')
const util = require('./util')
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')

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
                this[pollKey].players[pollResult._attributes.numplayers] = {
                    best: parseInt(pollResult.result[0]._attributes.numvotes, 10),
                    recommended: parseInt(pollResult.result[1]._attributes.numvotes, 10),
                    avoid: parseInt(pollResult.result[2]._attributes.numvotes, 10),
                }
            }
        }

        this.families = []
        this.mechanics = []
        for (let link of bggJson.link) {
            if (link._attributes.type === 'boardgamemechanic') {
                this.mechanics.push({
                    bggId: parseInt(link._attributes.id, 10),
                    name: link._attributes.value,
                })
            } else if (link._attributes.type === 'boardgamefamily') {
                this.families.push({
                    bggId: parseInt(link._attributes.id, 10),
                    name: link._attributes.value,
                })
            }
        }
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

const downloadImages = (games, gameIndex) => {
    return new Promise((resolve) => {
        if (gameIndex >= games.length) {
            console.log('Finished downloading game images')
            return resolve()
        }
        resolve()
        const game = games[gameIndex]
        const thumbnailPath = path.join(settings.databaseDirectory, `bgg/images/thumbnail/${game.bgg.thingId}${path.extname(game.bgg.thumbnailUrl)}`)
        const coverPath = path.join(settings.databaseDirectory, `bgg/images/cover/${game.bgg.thingId}${path.extname(game.bgg.coverUrl)}`)
        const thumbnailExists = fs.existsSync(thumbnailPath)
        const coverExists = fs.existsSync(coverPath)
        if (coverExists && thumbnailExists) {
            return downloadImages(games, gameIndex + 1)
        }
        setTimeout(() => {
            let thumbnailPromise = thumbnailExists ? Promise.resolve() : util.downloadFile(game.bgg.thumbnailUrl, thumbnailPath)
            thumbnailPromise.then(() => {
                let coverPromise = coverExists ? Promise.resolve() : util.downloadFile(game.bgg.coverUrl, coverPath)
                coverPromise.then(() => {
                    downloadImages(games, gameIndex + 1)
                })
            })
        }, settings.externalHTTPThrottleMilliseconds)
    })
}

const ingestGameImages = (userName) => {
    return new Promise(async (resolve) => {
        resolve()
        const db = database.getInstance(`user/${userName}/games`)
        const games = await db.read()
        const thumbnailDir = path.join(settings.databaseDirectory, `bgg/images/thumbnail/`)
        const coverDir = path.join(settings.databaseDirectory, `bgg/images/cover/`)
        if (!fs.existsSync(thumbnailDir)) {
            mkdirp.sync(thumbnailDir)
        }
        if (!fs.existsSync(coverDir)) {
            mkdirp.sync(coverDir)
        }
        downloadImages(games.games, 0)
    })
}

module.exports = {
    ingestGames,
    ingestPlays,
    ingestGameImages,
}
