const axios = require('axios')
const convert = require('xml-js')

const database = require('./database')

// https://boardgamegeek.com/wiki/page/BGG_XML_API2

var client = axios.create({
    baseURL: 'https://boardgamegeek.com/xmlapi2/',
})

const responseToJson = (response) => {
    return JSON.parse(convert.xml2json(response.data, { compact: true, spaces: 4 }))
}

const getCollectionDatabase = (userName, includeExpansion) => {
    return database.getInstance(`bgg/user/${userName}/collection-${includeExpansion ? 'expansion' : 'base'}`)
}

const getCollection = (userName, includeExpansion) => {
    return new Promise(async (resolve) => {
        var db = getCollectionDatabase(userName, includeExpansion)
        let url = `collection?username=${userName}`
        if (includeExpansion) {
            url += '&subtype=boardgameexpansion&brief=0'
        } else {
            url += '&excludesubtype=boardgameexpansion&brief=0'
        }
        const response = await client.get(url)
        if (response.status === 202) {
            return resolve({
                error: 'Collection is being prepared for API response',
            })
        }
        const collection = responseToJson(response)
        await db.write(collection)
        resolve(collection)
    })
}

const updateCollection = (userName) => {
    return new Promise(async (resolve) => {
        let baseGames = await getCollection(userName, false)
        let expansions = await getCollection(userName, true)
        resolve({
            baseGames,
            expansions,
        })
    })
}

const updatePlays = (userName) => {
    return new Promise(async (resolve) => {
        const db = database.getInstance(`bgg/user/${userName}/plays`)
        let url = `plays?username=${userName}`
        const response = await client.get(url)
        if (response.status !== 200) {
            return resolve({ response })
        }
        const plays = responseToJson(response)
        await db.write(plays)
        resolve(plays)
    })
}

const updateGameDetails = (userName) => {
    return new Promise(async (resolve) => {
        const db = database.getInstance(`bgg/user/${userName}/game-details`)
        const games = await getAllGames(userName)
        const gameIds = games.games.items.item
            .map((x) => {
                return x._attributes.objectid
            })
            .join(',')
        const url = `thing?id=${gameIds}&stats=1&versions=0&videos=0&historical=0&marketplace=0&comments=0&ratingcomments=0`
        const response = await client.get(url)
        if (response.status !== 200) {
            return resolve({ response })
        }
        const gameDetails = responseToJson(response)
        await db.write(gameDetails)
        resolve(gameDetails)
    })
}

const getAllGames = (userName) => {
    return new Promise(async (resolve) => {
        resolve({
            games: await getCollectionDatabase(userName, false).read(),
            expansions: await getCollectionDatabase(userName, true).read(),
            details: await database.getInstance(`bgg/user/${userName}/game-details`).read(),
        })
    })
}

const getAllPlays = (userName) => {
    return new Promise(async (resolve) => {
        const db = database.getInstance(`bgg/user/${userName}/plays`)
        resolve({
            plays: await db.read(),
        })
    })
}

module.exports = {
    updateCollection,
    updatePlays,
    updateGameDetails,
    getAllGames,
    getAllPlays,
}
