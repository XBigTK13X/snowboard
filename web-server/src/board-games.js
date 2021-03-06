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
let imageLookup
if (!imageLookup) {
    imageLookup = {
        thumbnail: {},
        cover: {},
    }
}

class BoardGame {
    constructor(bggJson) {
        this.bgg = {
            thingId: parseInt(bggJson._attributes.objectid, 10),
            collectionId: parseInt(bggJson._attributes.collid, 10),
            thumbnailUrl: bggJson.thumbnail ? bggJson.thumbnail._text : null,
            coverUrl: bggJson.image ? bggJson.image._text : null,
        }
        this.metadataKey = '' + this.bgg.thingId
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
        let rankings = await database.getInstance(`user/${userName}/rankings`).read()
        let games = []
        for (let game of bggCollection.games.items.item) {
            let boardGame = new BoardGame(game)
            if (detailsLookup[boardGame.bgg.thingId]) {
                boardGame.parseDetails(detailsLookup[boardGame.bgg.thingId])
            }
            boardGame.rankings = rankings[boardGame.name]
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
        const thumbnailExists = !!imageLookup.thumbnail[game.bgg.thingId]
        const coverExists = imageLookup.cover[game.bgg.thingId]
        if (coverExists && thumbnailExists) {
            return downloadImages(games, gameIndex + 1)
        }
        const thumbnailPath = path.join(settings.databaseDirectory, `bgg/images/thumbnail/${game.bgg.thingId}${path.extname(game.bgg.thumbnailUrl)}`)
        const coverPath = path.join(settings.databaseDirectory, `bgg/images/cover/${game.bgg.thingId}${path.extname(game.bgg.coverUrl)}`)
        setTimeout(() => {
            let thumbnailPromise = Promise.resolve()
            if (!thumbnailExists && game.bgg.thumbnailUrl !== null) {
                thumbnailPromise = util.downloadFile(game.bgg.thumbnailUrl, thumbnailPath)
            }
            thumbnailPromise.then(() => {
                let coverPromise = Promise.resolve()
                if (!coverExists && game.bgg.coverUrl !== null) {
                    util.downloadFile(game.bgg.coverUrl, coverPath)
                }
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
        downloadImages(games.games, 0)
    })
}

const buildImageLookup = () => {
    const thumbnailDir = path.join(settings.databaseDirectory, `bgg/images/thumbnail/`)
    const coverDir = path.join(settings.databaseDirectory, `bgg/images/cover/`)
    if (!fs.existsSync(thumbnailDir)) {
        mkdirp.sync(thumbnailDir)
    } else {
        const entries = fs.readdirSync(thumbnailDir)
        for (let entry of entries) {
            imageLookup.thumbnail[parseInt(entry.split('.')[0], 10)] = entry
        }
    }
    if (!fs.existsSync(coverDir)) {
        mkdirp.sync(coverDir)
    } else {
        const entries = fs.readdirSync(coverDir)
        for (let entry of entries) {
            imageLookup.cover[parseInt(entry.split('.')[0], 10)] = entry
        }
    }
}

const getCollection = (userName, filters) => {
    return new Promise(async (resolve) => {
        const db = database.getInstance(`user/${userName}/games`)
        const games = await db.read()
        const metadata = await database.getInstance(`user/${userName}/metadata`).read()
        let results = []
        for (let game of games.games) {
            if (game.isExpansion) {
                if (!filters || !filters.showExpansions) {
                    continue
                }
            }
            if (!(game.statusFlag & StatusFlag.own)) {
                if (!filters || !filters.gameStatus & StatusFlag.own) {
                    continue
                }
            }
            let result = { ...game }
            result.coverUrl = `${settings.webServerUrl}asset/bgg-image/cover/${imageLookup.cover[game.bgg.thingId]}`
            result.thumbnailUrl = `${settings.webServerUrl}asset/bgg-image/thumbnail/${imageLookup.thumbnail[game.bgg.thingId]}`
            if (metadata.lookup && metadata.lookup[game.metadataKey]) {
                result.metadata = metadata.lookup[game.metadataKey]
            } else {
                result.metadata = {}
            }
            if (!result.metadata.isHidden) {
                results.push(result)
            }
        }
        resolve({ collection: results })
    })
}

const getGame = async (gameId, userName) => {
    gameId = parseInt(gameId, 10)
    const db = database.getInstance(`user/${userName}/games`)
    const games = await db.read()
    const metadata = await database.getInstance(`user/${userName}/metadata`).read()
    for (let game of games.games) {
        if (game.bgg.thingId === gameId) {
            game.coverUrl = `${settings.webServerUrl}asset/bgg-image/cover/${imageLookup.cover[game.bgg.thingId]}`
            game.thumbnailUrl = `${settings.webServerUrl}asset/bgg-image/thumbnail/${imageLookup.thumbnail[game.bgg.thingId]}`
            if (metadata.lookup && metadata.lookup[game.metadataKey]) {
                game.metadata = metadata.lookup[game.metadataKey]
            } else {
                game.metadata = {}
            }
            return { game }
        }
    }
    return { game: null }
}

const toggleHidden = async (gameId, userName) => {
    gameId = parseInt(gameId, 10)
    const db = database.getInstance(`user/${userName}/metadata`)
    const metadata = await db.read()
    if (!metadata.lookup) {
        metadata.lookup = {}
    }
    if (!metadata.lookup[gameId]) {
        metadata.lookup[gameId] = {}
    }
    if (!metadata.lookup[gameId].isHidden) {
        metadata.lookup[gameId].isHidden = true
    } else {
        metadata.lookup[gameId].isHidden = false
    }
    let result = { gameHidden: metadata.lookup[gameId].isHidden }
    await db.write(metadata)
    return result
}

module.exports = {
    ingestGames,
    ingestPlays,
    ingestGameImages,
    buildImageLookup,
    getCollection,
    getGame,
    toggleHidden,
}
