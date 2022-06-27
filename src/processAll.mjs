import { readFile, readdir, lstat } from 'fs/promises'
import MovingAvgSegmenter from './app/algos/MovingAvgSegmenter.mjs'
import { mean, variance, min, max } from './stats.mjs'



// get reference from ref file (as string)
let getReferece = function (refFile) {
    let retval = {}
    let lines = refFile.split('\n')
    for (let i = 1; i < lines.length; i++) {
        let cols = lines[i].split(',')
        if (cols[0] !== '')
            retval[cols[0]] = {
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
    return retval
}

let dataUsersDirs = await readdir('data/')

let errors = []

for (let i = 0; i < dataUsersDirs.length; i++) {
    let dataUserDir = 'data/' + dataUsersDirs[i]
    if ((await lstat(dataUserDir)).isDirectory()) {
        let dataModesDirs = await readdir(dataUserDir)
        for (let j = 0; j < dataModesDirs.length; j++) {
            let dataModeDir = dataUserDir + '/' + dataModesDirs[j]
            if ((await lstat(dataModeDir)).isDirectory()) {
                let refFilePath = dataModeDir + '/reference.csv'
                let refFile = await readFile(refFilePath, 'utf8')
                let references = getReferece(refFile)

                let dataFiles = await readdir(dataModeDir)
                for (let k = 0; k < dataFiles.length; k++) {
                    if (dataFiles[k].split('.')[1] == 'json' && references[dataFiles[k]]) {
                        let reference = references[dataFiles[k]]

                        let dataFilePath = dataModeDir + '/' + dataFiles[k]
                        console.log('Processing: ' + dataFilePath)
                        let testFile = await readFile(dataFilePath, 'utf8')
                        let testData = JSON.parse(testFile)
                        console.log('Test date: ' + testData.startTs.slice(0, 10))

                        MovingAvgSegmenter.reset()

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

                        let segments = MovingAvgSegmenter.getSegments()

                        let dur1 = segments.run1.endMs - segments.run1.startMs
                        let refDur1 = reference.run1.walkEnd - reference.run1.walkStart
                        let dur2 = segments.run2.endMs - segments.run2.startMs
                        let refDur2 = reference.run2.walkEnd - reference.run2.walkStart
                        let dur3 = segments.run3.endMs - segments.run3.startMs
                        let refDur3 = reference.run3.walkEnd - reference.run3.walkStart
                        let durAvg = (dur1 + dur2 + dur3) / 3
                        let refAvg = (refDur1 + refDur2 + refDur3) / 3

                        let error = Math.round(refAvg - durAvg)
                        errors.push(error)

                        console.log(`Threshold`, MovingAvgSegmenter.walkAccThre)
                        console.log(`Duration 1 ${dur1} / ${refDur1}, err ${refDur1 - dur1}`)
                        console.log(`Duration 2 ${dur2} / ${refDur2}, err ${refDur2 - dur2}`)
                        console.log(`Duration 3 ${dur3} / ${refDur3}, err ${refDur3 - dur3}`)
                        console.log(`Avg ${durAvg.toFixed(0)} / ${refAvg.toFixed(0)}, err ${error}`)
                    }
                }
            }
        }
    }
}

console.log('Mean error:', Math.round(mean(errors)))
console.log('  SD:', Math.round(Math.sqrt(variance(errors, false))))
console.log('  Min:', min(errors))
console.log('  Max:', max(errors))

console.log('Mean absolute error:', Math.round(mean(errors.map(e => Math.abs(e)))))
console.log('  SD:', Math.round(Math.sqrt(variance(errors.map(e => Math.abs(e)), false))))
console.log('  Min:', min(errors.map(e => Math.abs(e))))
console.log('  Max:', max(errors.map(e => Math.abs(e))))
