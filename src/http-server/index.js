import express from 'express'
import http2Express from 'http2-express-bridge'
import http2 from 'http2'
import http from 'http'
import { readFileSync } from 'fs'
import path from 'path'

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import glob from 'glob'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = http2Express(express)

const distPath = path.resolve(`${__dirname}/../../dist`)

app.use(express.static(distPath))

const options = {
    key: readFileSync(path.resolve(`${__dirname}/selfsigned.key`)),
    cert: readFileSync(path.resolve(`${__dirname}/selfsigned.crt`))
}

const entriesRelative = glob.sync(`${distPath}/**/index.html`).map(entry =>
    entry.substring(distPath.length)
);

const HTTPS_PORT = 9443;

http2.createSecureServer(options, app).listen(HTTPS_PORT, function () {
    console.log(`HTTPS Server listening on ${HTTPS_PORT}.`)

    const baseUrl = `https://localhost:${HTTPS_PORT}`;

    console.log('Available Tests:')

    entriesRelative.map(entry => console.log(`${baseUrl}${entry}`))
})



const HTTP_PORT = 9080;

http.createServer(app).listen(HTTP_PORT, function () {
    console.log('\n')
    console.log(`HTTP Server listening on ${HTTP_PORT}.`)

    const baseUrl = `http://localhost:${HTTP_PORT}`;

    console.log('Available Tests:')

    entriesRelative.map(entry => console.log(`${baseUrl}${entry}`))
})