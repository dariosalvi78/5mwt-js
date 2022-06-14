import { readFile } from 'fs/promises'
import plotly from 'nodeplotlib'
import { WindowedRollingStats } from './app/algos/stats.mjs'

const FILE = './data/testresults2.json'
let file = await readFile(FILE, 'utf8')

let testData = JSON.parse(file)
console.log('Test date: ' + testData.startTs.slice(0, 10))

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
plotly.plot([
    {
        x: testData.motion.map((m) => m.msFromStart),
        y: testData.motion.map((m) => m.acc.x),
        type: 'scatter',
        name: "x"
    },
    {
        x: testData.motion.map((m) => m.msFromStart),
        y: testData.motion.map((m) => m.acc.y),
        type: 'scatter',
        name: "y"
    },
    {
        x: testData.motion.map((m) => m.msFromStart),
        y: testData.motion.map((m) => m.acc.z),
        type: 'scatter',
        name: "z"
    }
], {
    title: 'Acceleration',
    xaxis: {
        autorange: true
    },
    shapes: [
        getLineShape(testData.run1.waitStartMs, 'wait 1', -6, 6),
        getLineShape(testData.run1.walkStartMs, 'walk 1', -6, 6),
        getLineShape(testData.run1.completionMs, 'end 1', -6, 6),

        getLineShape(testData.run2.waitStartMs, 'wait 2', -6, 6),
        getLineShape(testData.run2.walkStartMs, 'walk 2', -6, 6),
        getLineShape(testData.run2.completionMs, 'end 2', -6, 6),

        getLineShape(testData.run3.waitStartMs, 'wait 3', -6, 6),
        getLineShape(testData.run3.walkStartMs, 'walk 3', -6, 6),
        getLineShape(testData.run3.completionMs, 'end 3', -6, 6)
    ]
})
plotly.plot([
    {
        x: testData.orientation.map((m) => m.msFromStart),
        y: testData.orientation.map((m) => m.alpha),
        type: 'scatter',
        name: "alpha"
    },
    {
        x: testData.orientation.map((m) => m.msFromStart),
        y: testData.orientation.map((m) => m.beta),
        type: 'scatter',
        name: "beta"
    },
    {
        x: testData.orientation.map((m) => m.msFromStart),
        y: testData.orientation.map((m) => m.gamma),
        type: 'scatter',
        name: "gamma"
    }
], {
    title: 'Orientation',
    xaxis: {
        autorange: true
    },
    shapes: [
        getLineShape(testData.run1.waitStartMs, 'wait 1', 0, 360),
        getLineShape(testData.run1.walkStartMs, 'walk 1', 0, 360),
        getLineShape(testData.run1.completionMs, 'end 1', 0, 360),

        getLineShape(testData.run2.waitStartMs, 'wait 2', 0, 360),
        getLineShape(testData.run2.walkStartMs, 'walk 2', 0, 360),
        getLineShape(testData.run2.completionMs, 'end 2', 0, 360),

        getLineShape(testData.run3.waitStartMs, 'wait 3', 0, 360),
        getLineShape(testData.run3.walkStartMs, 'walk 3', 0, 360),
        getLineShape(testData.run3.completionMs, 'end 3', 0, 360),
    ]
})

let avgSamplPeriod = 0
for (let i = 1; i < testData.motion.length; i++) {
    avgSamplPeriod += testData.motion[i].msFromStart - testData.motion[i - 1].msFromStart
}
avgSamplPeriod /= testData.motion.length

console.log('Sampling period', avgSamplPeriod)

// half second of samples
let statsWindow = Math.round(500 / avgSamplPeriod)
let stats = new WindowedRollingStats(statsWindow)

let accMod = []
let accVariance = []
let maxVariance = 0
for (let i = 0; i < testData.motion.length; i++) {
    let mod = Math.sqrt((testData.motion[i].acc.x ** 2) + (testData.motion[i].acc.y ** 2) + (testData.motion[i].acc.z ** 2))
    accMod.push({
        msFromStart: testData.motion[i].msFromStart,
        mod: mod
    })
    stats.addValue(mod)
    let variance = stats.getVariance()
    if (variance > maxVariance) maxVariance = variance
    accVariance.push({
        msFromStart: testData.motion[i].msFromStart,
        var: variance
    })
}


// plot the variance
plotly.plot([
    {
        x: accVariance.map((m) => m.msFromStart),
        y: accVariance.map((m) => m.var),
        type: 'scatter',
        name: "variance"
    }
], {
    title: 'Variance',
    xaxis: {
        autorange: true
    },
    shapes: [
        getLineShape(testData.run1.waitStartMs, 'wait 1', 0, maxVariance),
        getLineShape(testData.run1.walkStartMs, 'walk 1', 0, maxVariance),
        getLineShape(testData.run1.completionMs, 'end 1', 0, maxVariance),

        getLineShape(testData.run2.waitStartMs, 'wait 2', 0, maxVariance),
        getLineShape(testData.run2.walkStartMs, 'walk 2', 0, maxVariance),
        getLineShape(testData.run2.completionMs, 'end 2', 0, maxVariance),

        getLineShape(testData.run3.waitStartMs, 'wait 3', 0, maxVariance),
        getLineShape(testData.run3.walkStartMs, 'walk 3', 0, maxVariance),
        getLineShape(testData.run3.completionMs, 'end 3', 0, maxVariance),
    ]
})