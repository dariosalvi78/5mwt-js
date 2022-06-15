import { readFile } from 'fs/promises'
import plotly from 'nodeplotlib'
import { WindowedRollingStats } from './app/algos/stats.mjs'
import { minAngleDiff } from './app/algos/orientation.mjs'

const FILE = './data/testresults2.json'
let file = await readFile(FILE, 'utf8')

let testData = JSON.parse(file)
console.log('Test date: ' + testData.startTs.slice(0, 10))


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



let avgSamplPeriod = 0
for (let i = 1; i < testData.motion.length; i++) {
    avgSamplPeriod += testData.motion[i].msFromStart - testData.motion[i - 1].msFromStart
}
avgSamplPeriod /= testData.motion.length

console.log('Sampling period', avgSamplPeriod)

// 1 second of samples
let statsWindow = Math.round(1000 / avgSamplPeriod)
let accStats = new WindowedRollingStats(statsWindow)
let rotStats = new WindowedRollingStats(statsWindow)

let accMod = []
let accStd = []
let accMean = []
let accMeanStd = []

let rotRateMod = []
let rotMean = []
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

    let mean = accStats.getMean()
    accMean.push({
        msFromStart: testData.motion[i].msFromStart,
        mean: mean
    })

    let meanStd = mean + std
    accMeanStd.push({
        msFromStart: testData.motion[i].msFromStart,
        meanStd: meanStd
    })

    let rotmod = Math.sqrt((testData.motion[i].rotRate.alpha ** 2) + (testData.motion[i].rotRate.beta ** 2) + (testData.motion[i].rotRate.gamma ** 2))
    rotRateMod.push({
        msFromStart: testData.motion[i].msFromStart,
        mod: rotmod
    })
    rotStats.addValue(rotmod)

    mean = rotStats.getMean()
    rotMean.push({
        msFromStart: testData.motion[i].msFromStart,
        mean: mean
    })
}


// plot the modules
plotSignals('Acceleration module', accMod, ['mod'])
plotSignals('Rotation rate module', rotRateMod, ['mod'])


// plot the stats
plotSignals('Mean of acc mod', accMean, ['mean'])
// plotSignals('SD of acc mod', accStd, ['std'])
// plotSignals('Mean + SD of acc mod', accMeanStd, ['meanStd'])
plotSignals('Mean of rot rate mod', rotMean, ['mean'])

