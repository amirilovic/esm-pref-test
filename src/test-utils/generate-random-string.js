import crypto from 'crypto'


export function mapUnit(unit) {
    switch (unit) {
        case 'kb':
            return 1024
        case 'mb':
            return 1024 * 1024
    }

    return 1
}

export function mapSize(sizeString) {
    const unit = sizeString.substring(sizeString.length - 2, sizeString.length)
    const num = parseInt(sizeString.substring(0, sizeString.length - 2))

    const multiplicator = mapUnit(unit)
    return num * multiplicator
}

export function generateRandomString(sizeString) {
    const size = mapSize(sizeString)

    if (size === 0) {
        return ''
    }

    const text = crypto.randomBytes(size / 2).toString('hex')

    return text
}