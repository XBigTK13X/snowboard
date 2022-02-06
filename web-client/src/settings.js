/* eslint no-undef: 0 */

let webApiUrl
let debounceMilliseconds

try {
    webApiUrl = WEB_API_URL
    debounceMilliseconds = DEBOUNCE_MILLISECONDS
} catch {
    webApiUrl = 'http://localhost:5054/api/'
    debounceMilliseconds = 300
}
module.exports = {
    debounceMilliseconds,
    webApiUrl,
}
