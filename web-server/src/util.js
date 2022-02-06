const stream = require('stream')
//import * as stream from 'stream'
const promisify = require('util').promisify
//import { promisify } from 'util'
const fs = require('fs')

const axios = require('axios')
const finished = promisify(stream.finished)

const downloadFile = async (sourceURL, destinationPath) => {
    const writer = fs.createWriteStream(destinationPath)
    return axios({
        method: 'get',
        url: sourceURL,
        responseType: 'stream',
    }).then(async (response) => {
        response.data.pipe(writer)
        return finished(writer)
    })
}

const log = (...args) => {
    if (typeof console !== 'undefined') {
        console.log.apply(console, args)
    }
}

module.exports = {
    downloadFile,
    log,
}
