const log = (...args) => {
    if (typeof console !== 'undefined') {
        console.log.apply(console, args)
    }
}

module.exports = {
    log,
}
