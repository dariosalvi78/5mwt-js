import { readFile } from 'fs/promises'
import plotly from 'nodeplotlib'
import MovingAvgSegmenter from './app/algos/MovingAvgSegmenter.mjs'

const FILE = './data/user1/slow/testresults_16.json'
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

let state = 'completion'
for (let i = 0; i < testData.motion.length; i++) {
    let ts = testData.motion[i].msFromStart

    if (ts >= testData.run1.waitStartMs && state === 'completion') {
        state = 'wait1'
        MovingAvgSegmenter.setEvent(state, testData.run1.waitStartMs)
    } else if (ts >= testData.run1.walkStartMs && state === 'wait1') {
        state = 'walk1'
        MovingAvgSegmenter.setEvent(state, testData.run1.walkStartMs)
    } else if (ts >= testData.run1.completionMs && state === 'walk1') {
        state = 'intro2'
        MovingAvgSegmenter.setEvent(state, testData.run1.completionMs)
    } else if (ts >= testData.run2.waitStartMs && state === 'intro2') {
        state = 'wait2'
        MovingAvgSegmenter.setEvent(state, testData.run2.waitStartMs)
    } else if (ts >= testData.run2.walkStartMs && state === 'wait2') {
        state = 'walk2'
        MovingAvgSegmenter.setEvent(state, testData.run2.walkStartMs)
    } else if (ts >= testData.run2.completionMs && state === 'walk2') {
        state = 'intro3'
        MovingAvgSegmenter.setEvent(state, testData.run2.completionMs)
    } else if (ts >= testData.run3.waitStartMs && state === 'intro3') {
        state = 'wait3'
        MovingAvgSegmenter.setEvent(state, testData.run3.waitStartMs)
    } else if (ts >= testData.run3.walkStartMs && state === 'wait3') {
        state = 'walk3'
        MovingAvgSegmenter.setEvent(state, testData.run3.walkStartMs)
    } else if (ts >= testData.run3.completionMs && state === 'walk3') {
        state = 'completion'
        MovingAvgSegmenter.setEvent(state, testData.run3.completionMs)
    }
    MovingAvgSegmenter.addMotion(testData.motion[i])
}

if (state !== 'completion') {
    state = 'completion'
    MovingAvgSegmenter.setEvent(state, testData.run3.completionMs)
}

plotSignals('Filtered module', MovingAvgSegmenter.accMovAvgs, ['mod'])


let segments = MovingAvgSegmenter.getSegments()

let dur1 = segments.run1.endMs - segments.run1.startMs
let refDur1 = reference.run1.walkEnd - reference.run1.walkStart
let dur2 = segments.run2.endMs - segments.run2.startMs
let refDur2 = reference.run2.walkEnd - reference.run2.walkStart
let dur3 = segments.run3.endMs - segments.run3.startMs
let refDur3 = reference.run3.walkEnd - reference.run3.walkStart
let durAvg = (dur1 + dur2 + dur3) / 3
let refAvg = (refDur1 + refDur2 + refDur3) / 3

console.log(`Threshold: ${MovingAvgSegmenter.walkAccThre.toFixed(2)}`)
console.log(`Duration 1 ${dur1} / ${refDur1}, err ${refDur1 - dur1}`)
console.log(`Duration 2 ${dur2} / ${refDur2}, err ${refDur2 - dur2}`)
console.log(`Duration 3 ${dur3} / ${refDur3}, err ${refDur3 - dur3}`)
console.log(`Avg ${durAvg.toFixed(0)} / ${refAvg.toFixed(0)}, err ${(refAvg - durAvg).toFixed(0)}`)