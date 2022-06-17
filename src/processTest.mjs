import { readFile } from 'fs/promises'
import plotly from 'nodeplotlib'
import { WindowedRollingStats } from './app/algos/stats.mjs'
import { minAngleDiff } from './app/algos/orientation.mjs'

const FILE = './data/user1/normal/testresults_11.json'
let file = await readFile(FILE, 'utf8')

let testData = JSON.parse(file)
console.log('Test date: ' + testData.startTs.slice(0, 10))

const REFFILE = FILE.substring(0, FILE.lastIndexOf('/')) + '/reference.csv'
let refFile = await readFile(REFFILE, 'utf8')


const DOPLOT = true

// utility functions
Object.byString = function (o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
}

// get reference from ref file (as string)
let getReferece = function () {
    let filename = FILE.substring(FILE.lastIndexOf('/') + 1)
    let lines = refFile.split('\n')
    for (let i = 1; i < lines.length; i++) {
        let cols = lines[i].split(',')
        if (cols[0] == filename) {
            return {
                filename: filename,
                run1: {
                    walkStart: cols[1],
                    walkEnd: cols[2],
                    turnStart: cols[3],
                    turnEnd: cols[4]
                },
                run2: {
                    walkStart: cols[5],
                    walkEnd: cols[6],
                    turnStart: cols[7],
                    turnEnd: cols[8]
                },
                run3: {
                    walkStart: cols[9],
                    walkEnd: cols[10]
                }
            }
        }
    }
    throw new Error('Cannot find reference for ' + filename)
}

// plot acceleration and orientation
let getLineShape = function (x, name, min, max) {
    return {
        type: 'line',
        x0: x,
        y0: min,
        x1: x,
        yref: name,
        y1: max,
        line: {
            color: 'grey',
            width: 1.5,
            dash: 'dot'
        }
    }
}

let plotSignals = function (title, data, valNames) {

    if (!DOPLOT) return
    let minval = data.reduce((acc, valObj) => {
        let min = acc
        for (let i = 0; i < valNames.length; i++) {
            let valVal = Object.byString(valObj, valNames[i])
            if (valVal < min) min = valVal
        }
        return min
    }, 10000)
    let maxval = data.reduce((acc, valObj) => {
        let max = acc
        for (let i = 0; i < valNames.length; i++) {
            let valVal = Object.byString(valObj, valNames[i])
            if (valVal > max) max = valVal
        }
        return max
    }, -10000)
    plotly.plot(
        valNames.map(name => {
            return {
                x: data.map((m) => m.msFromStart),
                y: data.map((m) => Object.byString(m, name)),
                type: 'scatter',
                name: name
            }
        }), {
        title: title,
        xaxis: {
            autorange: true
        },
        shapes: [
            getLineShape(testData.run1.waitStartMs, 'wait 1', minval, maxval),
            getLineShape(testData.run1.walkStartMs, 'walk 1', minval, maxval),
            getLineShape(testData.run1.completionMs, 'end 1', minval, maxval),

            getLineShape(testData.run2.waitStartMs, 'wait 2', minval, maxval),
            getLineShape(testData.run2.walkStartMs, 'walk 2', minval, maxval),
            getLineShape(testData.run2.completionMs, 'end 2', minval, maxval),

            getLineShape(testData.run3.waitStartMs, 'wait 3', minval, maxval),
            getLineShape(testData.run3.walkStartMs, 'walk 3', minval, maxval),
            getLineShape(testData.run3.completionMs, 'end 3', minval, maxval)
        ]
    })
}

plotSignals('Acceleration (no g)', testData.motion, ['acc.x', 'acc.y', 'acc.z'])
plotSignals('Rotation rate', testData.motion, ['rotRate.alpha', 'rotRate.beta', 'rotRate.gamma'])
plotSignals('Orientation', testData.orientation, ['alpha', 'beta', 'gamma'])

let reference = getReferece()

console.log('Walk 1 duration', reference.run1.walkEnd - reference.run1.walkStart)
console.log('Walk 2 duration', reference.run2.walkEnd - reference.run2.walkStart)
console.log('Walk 3 duration', reference.run3.walkEnd - reference.run3.walkStart)

let avgSamplPeriod = 0
for (let i = 1; i < testData.motion.length; i++) {
    avgSamplPeriod += testData.motion[i].msFromStart - testData.motion[i - 1].msFromStart
}
avgSamplPeriod /= testData.motion.length

console.log('Sampling period', avgSamplPeriod)

// 1 second of samples
let windowSizeMs = 1000
let statsWindow = Math.round(windowSizeMs / avgSamplPeriod)
let accStats = new WindowedRollingStats(statsWindow)
let rotStats = new WindowedRollingStats(statsWindow)

let accMod = []
let accStd = []
let accMean = []

let rotRateMod = []
let rotMean = []

let waitN = 0
let waitAccMean = 0
let waitRotMean = 0
let walkN = 0
let walkAccMean = 0
let walkRotMean = 0
let turnN = 0
let turnRotAvg = 0

for (let i = 0; i < testData.motion.length; i++) {
    let accmod = Math.sqrt((testData.motion[i].acc.x ** 2) + (testData.motion[i].acc.y ** 2) + (testData.motion[i].acc.z ** 2))
    accMod.push({
        msFromStart: testData.motion[i].msFromStart,
        mod: accmod
    })

    accStats.addValue(accmod)

    let std = Math.sqrt(accStats.getVariance())
    accStd.push({
        msFromStart: testData.motion[i].msFromStart,
        std: std
    })

    let meanAcc = accStats.getMean()
    accMean.push({
        msFromStart: testData.motion[i].msFromStart,
        mean: meanAcc
    })

    let rotmod = Math.sqrt((testData.motion[i].rotRate.alpha ** 2) + (testData.motion[i].rotRate.beta ** 2) + (testData.motion[i].rotRate.gamma ** 2))

    rotRateMod.push({
        msFromStart: testData.motion[i].msFromStart,
        mod: rotmod
    })
    rotStats.addValue(rotmod)

    let meanRot = rotStats.getMean()
    rotMean.push({
        msFromStart: testData.motion[i].msFromStart,
        mean: meanRot
    })


    if ((testData.motion[i].msFromStart >= testData.run1.waitStartMs && testData.motion[i].msFromStart < testData.run1.walkStartMs) ||
        (testData.motion[i].msFromStart >= testData.run2.waitStartMs && testData.motion[i].msFromStart < testData.run2.walkStartMs) ||
        (testData.motion[i].msFromStart >= testData.run3.waitStartMs && testData.motion[i].msFromStart < testData.run3.walkStartMs)) {
        waitAccMean += meanAcc
        waitRotMean += meanRot
        waitN++
    }

    if ((testData.motion[i].msFromStart >= testData.run1.walkStartMs && testData.motion[i].msFromStart < testData.run1.completionMs) ||
        (testData.motion[i].msFromStart >= testData.run2.walkStartMs && testData.motion[i].msFromStart < testData.run2.completionMs) ||
        (testData.motion[i].msFromStart >= testData.run3.walkStartMs && testData.motion[i].msFromStart < testData.run3.completionMs)) {
        walkAccMean += meanAcc
        walkRotMean += meanRot
        walkN++
    }

    if ((testData.motion[i].msFromStart >= testData.run1.completionMs && testData.motion[i].msFromStart < testData.run2.waitStartMs) ||
        (testData.motion[i].msFromStart >= testData.run2.completionMs && testData.motion[i].msFromStart < testData.run3.waitStartMs)) {
        turnRotAvg += meanRot
        turnN++
    }
}

waitAccMean /= waitN
walkAccMean /= walkN
waitRotMean /= waitN
walkRotMean /= walkN
turnRotAvg /= turnN

console.log('Mean of acc mod during WAIT', waitAccMean)
console.log('Mean of acc mod during WALK', walkAccMean)

console.log('Mean of rot mod during WAIT', waitRotMean)
console.log('Mean of rot mod during WALK', walkRotMean)

console.log('Mean of rot mod during TURN', turnRotAvg)


// plot the modules
plotSignals('Acceleration module', accMod, ['mod'])
plotSignals('Rotation rate module', rotRateMod, ['mod'])


// plot the stats
plotSignals('Mean of acc mod', accMean, ['mean'])
// plotSignals('SD of acc mod', accStd, ['std'])
plotSignals('Mean of rot rate mod', rotMean, ['mean'])


// do a simple detection based on thresholds

let walkAccThre = waitAccMean + ((walkAccMean + waitAccMean) / 3)
let turnRotThre = waitRotMean + ((turnRotAvg + waitRotMean) / 3)

console.log('Walk acc threshold', walkAccThre)
console.log('Turn rot threshold', turnRotThre)

let walk1StartMs = 0
let walk1StopMs = 0
let walk2StartMs = 0
let walk2StopMs = 0
let walk3StartMs = 0
let walk3StopMs = 0
let turn1StartMs = 0
let turn1StopMs = 0
let turn2StartMs = 0
let turn2StopMs = 0
for (let i = 0; i < accMean.length; i++) {
    let timestamp = accMean[i].msFromStart - (windowSizeMs / 2) // compensate for filtering
    if (timestamp >= testData.run1.walkStartMs && timestamp < testData.run1.completionMs) {
        // here we expect the walk to start and stop
        if (walk1StartMs == 0 && accMean[i].mean > walkAccThre) walk1StartMs = timestamp
        if (walk1StartMs != 0 && accMean[i].mean < walkAccThre) walk1StopMs = timestamp
    }
    if (timestamp >= testData.run2.walkStartMs && timestamp < testData.run2.completionMs) {
        // here we expect the walk to start and stop
        if (walk2StartMs == 0 && accMean[i].mean > walkAccThre) walk2StartMs = timestamp
        if (walk2StartMs != 0 && accMean[i].mean < walkAccThre) walk2StopMs = timestamp
    }
    if (timestamp >= testData.run3.walkStartMs && timestamp < testData.run3.completionMs) {
        // here we expect the walk to start and stop
        if (walk3StartMs == 0 && accMean[i].mean > walkAccThre) walk3StartMs = timestamp
        if (walk3StartMs != 0 && accMean[i].mean < walkAccThre) walk3StopMs = timestamp
    }

    if (timestamp >= testData.run1.completionMs && timestamp < testData.run2.waitStartMs) {
        // here is the turn around
        if (turn1StartMs == 0 && rotMean[i].mean > turnRotThre) turn1StartMs = timestamp
        if (turn1StartMs != 0 && turn1StopMs == 0 && rotMean[i].mean < turnRotThre) turn1StopMs = timestamp
    }

    if (timestamp >= testData.run2.completionMs && timestamp < testData.run3.waitStartMs) {
        // here is the turn around
        if (turn2StartMs == 0 && rotMean[i].mean > turnRotThre) turn2StartMs = timestamp
        if (turn2StartMs != 0 && turn2StopMs == 0 && rotMean[i].mean < turnRotThre) turn2StopMs = timestamp
    }
}

let walkDur = walk1StopMs - walk1StartMs
let refDur = reference.run1.walkEnd - reference.run1.walkStart
console.log(`Walk 1 start: ${walk1StartMs} vs ${reference.run1.walkStart}, stop ${walk1StopMs} vs ${reference.run1.walkEnd}, duration ${walkDur} vs ${refDur}, err: ${refDur - walkDur}`)

walkDur = walk2StopMs - walk2StartMs
refDur = reference.run2.walkEnd - reference.run2.walkStart
console.log(`Walk 2 start: ${walk2StartMs} vs ${reference.run2.walkStart}, stop ${walk2StopMs} vs ${reference.run2.walkEnd}, duration ${walkDur} vs ${refDur}, err: ${refDur - walkDur}`)

walkDur = walk3StopMs - walk3StartMs
refDur = reference.run3.walkEnd - reference.run3.walkStart
console.log(`Walk 3 start: ${walk3StartMs} vs ${reference.run3.walkStart}, stop ${walk3StopMs} vs ${reference.run3.walkEnd}, duration ${walkDur} vs ${refDur}, err: ${refDur - walkDur}`)


console.log(`Turn 1 start: ${turn1StartMs} vs ${reference.run1.turnStart}, stop ${turn1StopMs} vs ${reference.run1.turnEnd}`)
console.log(`Turn 2 start: ${turn2StartMs} vs ${reference.run2.turnStart}, stop ${turn2StopMs} vs ${reference.run2.turnEnd}`)

