import { readFile } from 'fs/promises'
import plotly from 'nodeplotlib'

const FILE = './data/testresults1.json'
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
}, {
    showEditInChartStudio: true,
    plotlyServerURL: "https://chart-studio.plotly.com"
})



