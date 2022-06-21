import { readFile } from 'fs/promises'
import plotly from 'nodeplotlib'

const FILE = './data/user1/normal/testresults_15.json'
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

// compute modules
let accMod = []
let rotRateMod = []

for (let i = 0; i < testData.motion.length; i++) {
    let accmod = Math.sqrt((testData.motion[i].acc.x ** 2) + (testData.motion[i].acc.y ** 2) + (testData.motion[i].acc.z ** 2))
    accMod.push({
        msFromStart: testData.motion[i].msFromStart,
        mod: accmod
    })

    let rotmod = Math.sqrt((testData.motion[i].rotRate.alpha ** 2) + (testData.motion[i].rotRate.beta ** 2) + (testData.motion[i].rotRate.gamma ** 2))
    rotRateMod.push({
        msFromStart: testData.motion[i].msFromStart,
        mod: rotmod
    })
}


// plot
plotSignals('Acceleration (no g)', testData.motion, ['acc.x', 'acc.y', 'acc.z'])
plotSignals('Rotation rate', testData.motion, ['rotRate.alpha', 'rotRate.beta', 'rotRate.gamma'])

plotSignals('Acceleration module', accMod, ['mod'])
plotSignals('Rotation rate module', rotRateMod, ['mod'])

plotSignals('Orientation', testData.orientation, ['alpha', 'beta', 'gamma'])
