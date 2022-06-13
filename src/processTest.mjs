import { readFile } from 'fs/promises'
import plotly from 'nodeplotlib'

const FILE = './data/test1.json'
let file = await readFile(FILE, 'utf8')

let testData = JSON.parse(file)
console.log('Test date: ' + testData.run1.startTs.slice(0, 10))

// plot acceleration and orientation
plotly.plot([
    {
        x: testData.run1.motion.map((m) => m.msFromStart),
        y: testData.run1.motion.map((m) => m.acc.x),
        type: 'scatter',
        name: "x"
    },
    {
        x: testData.run1.motion.map((m) => m.msFromStart),
        y: testData.run1.motion.map((m) => m.acc.y),
        type: 'scatter',
        name: "y"
    },
    {
        x: testData.run1.motion.map((m) => m.msFromStart),
        y: testData.run1.motion.map((m) => m.acc.z),
        type: 'scatter',
        name: "z"
    }
], {
    title: 'Acceleration',
    xaxis: {
        autorange: true
    }
})
plotly.plot([
    {
        x: testData.run1.orientation.map((m) => m.msFromStart),
        y: testData.run1.orientation.map((m) => m.alpha),
        type: 'scatter',
        name: "alpha"
    },
    {
        x: testData.run1.orientation.map((m) => m.msFromStart),
        y: testData.run1.orientation.map((m) => m.beta),
        type: 'scatter',
        name: "beta"
    },
    {
        x: testData.run1.orientation.map((m) => m.msFromStart),
        y: testData.run1.orientation.map((m) => m.gamma),
        type: 'scatter',
        name: "gamma"
    }
], {
    title: 'Orientation',
    xaxis: {
        autorange: true
    }
})



