/* eslint no-undef: 0 */

let webApiUrl
let castPollMilliseconds
let debounceMilliseconds

try {
    webApiUrl = WEB_API_URL
    debounceMilliseconds = DEBOUNCE_MILLISECONDS
} catch {
    webApiUrl = 'http://192.168.1.20:5051/api/'
    castPollMilliseconds = 300
    debounceMilliseconds = 300
}
module.exports = {
    castPollMilliseconds,
    debounceMilliseconds,
    webApiUrl,
    clientVersion,
    buildDate,
}
