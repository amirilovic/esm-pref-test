import { chromium } from 'playwright'
import tests from './tests.js'

async function runPageTest(browser, { url, throttle }) {

    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    const page = await context.newPage()
    const client = await context.newCDPSession(page)

    await client.send('Network.enable')
    await client.send('Network.setCacheDisabled', {
        cacheDisabled: true
    })

    // fast 3G 
    // https://github.com/ChromeDevTools/devtools-frontend/blob/80c102878fd97a7a696572054007d40560dcdd21/front_end/sdk/NetworkManager.js#L252-L274
    if (throttle) {
        await client.send('Network.emulateNetworkConditions', {
            offline: false,
            downloadThroughput: 1.6 * 1024 * 1024 / 8 * 0.9,
            uploadThroughput: 750 * 1024 / 8 * 0.9,
            latency: 150 * 3.75,
        })
    }

    await page.goto(url, { waitUntil: 'load' })

    const duration = JSON.parse(
        await page.evaluate(() => {
            const durationString = document.getElementById('duration').innerHTML
            const duration = durationString.substring(0, durationString.length - 2);
            return JSON.stringify(parseInt(duration))
        })
    )

    return duration;
}

async function runTest({ url, numberOfRuns, throttle }) {
    console.log(url)
    const browser = await chromium.launch({ headless: true, devtools: false })
    const results = []
    for (let i = 0; i < numberOfRuns; i++) {
        console.log('Test run #', i + 1)
        const duration = await runPageTest(browser, { url, throttle })
        console.log('Duration: ', duration)
        results.push(duration)
    }
    await browser.close()
    const avg = Math.round(results.reduce((sum, r) => sum + r, 0) / results.length)
    const min = Math.min(...results)
    const max = Math.max(...results)
    console.log('Avg: ', avg)
    console.log('Min: ', min)
    console.log('Max: ', max)
    return { avg, min, max };
}

async function runAllTests({ baseUrl, throttle, numberOfRuns }) {

    const results = [];

    for (const test of tests) {
        const result = await runTest({ url: `${baseUrl}/${test.outputDir}/index.html`, numberOfRuns, throttle })

        results.push({
            test: test.outputDir,
            ...result
        });
    }

    return results;
}

const baseUrl = process.env.BASE_URL;

if (!baseUrl) {
    throw new Error('Please define BASE_URL env var. For example BASE_URL=http://localhost:9080.')
}

const numberOfRuns = process.env.NUMBER_OF_RUNS || 10;

const httpResults = await runAllTests({ baseUrl, throttle: false, numberOfRuns })

console.table(httpResults)



