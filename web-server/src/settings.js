let config = {
    webServerPort: process.env.SNOWBOARD_WEB_API_PORT || 5054,
    databaseDirectory: process.env.SNOWBOARD_DATABASE_DIR || '/home/kretst/snowboard',
    webApiUrl: process.env.SNOWBOARD_WEB_API_URL || '"http://localhost:5054/api/"',
    apiPostBodySizeLimit: '100mb',
    serverVersion: '0.0.1',
    buildDate: 'February 03, 2022',
}

console.log('Configuration read as ', { config })

module.exports = config
