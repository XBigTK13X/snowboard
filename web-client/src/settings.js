/* eslint no-undef: 0 */

let webApiUrl
let castPollMilliseconds
let debounceMilliseconds

try {
    webApiUrl = WEB_API_URL
    debounceMilliseconds = DEBOUNCE_MILLISECONDS
} catch {
    webApiUrl = 'http://localhost:5054/api/'
    castPollMilliseconds = 300
    debounceMilliseconds = 300
}
module.exports = {
    castPollMilliseconds,
    debounceMilliseconds,
    webApiUrl,
}
