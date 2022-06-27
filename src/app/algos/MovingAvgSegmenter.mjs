const AVG_TIME_MS = 2000

let MovingAvgSegmenter = {
    lastEvent: 'init',
    accBuffer: [],
    accMovingAvgAccum: 0,
    accMovAvgs: [],

    // satistics and buffers for the different phases
    accWaitN: 0,
    accWaitVal: 0,
    accRunN: 0,
    accRunVal: 0,
    userRun1: {
        startMs: 0,
        endMs: 0,
    },
    userRun2: {
        startMs: 0,
        endMs: 0,
    },
    userRun3: {
        startMs: 0,
        endMs: 0,
    },

    setEvent (evt, ts) {
        this.lastEvent = evt
        if (evt === 'walk1') {
            this.userRun1.startMs = ts
        }
        if (evt === 'walk2') {
            this.userRun2.startMs = ts
        }
        if (evt === 'walk3') {
            this.userRun3.startMs = ts
        }
        if (evt == 'intro2') {
            this.userRun1.endMs = ts
        }
        if (evt == 'intro3') {
            this.userRun2.endMs = ts
        }
        if (evt == 'completion') {
            this.userRun3.endMs = ts
        }
    },

    addMotion (m) {
        // compute the module of the acceleration (without G)
        let accMod = Math.sqrt((m.acc.x ** 2) + (m.acc.y ** 2) + (m.acc.z ** 2))
        // add new acceleration to the buffer
        this.accBuffer.push({
            msFromStart: m.msFromStart,
            mod: accMod
        })
        // remove old accelerations from the buffer and compute the new moving average
        let removedAcc = 0
        let removedN = 0
        for (let i = 0; i < this.accBuffer.length; i++) {
            if (m.msFromStart - this.accBuffer[i].msFromStart > AVG_TIME_MS) {
                removedN++
                removedAcc += this.accBuffer[i].mod
            } else {
                // stop removing
                break
            }
        }
        // remove old values
        this.accBuffer.splice(0, removedN)

        // update the moving average accumulator
        this.accMovingAvgAccum = this.accMovingAvgAccum + accMod - removedAcc

        let movingAvg = this.accMovingAvgAccum / this.accBuffer.length

        if (this.lastEvent == 'wait1' || this.lastEvent == 'wait2' || this.lastEvent == 'wait3') {
            this.accWaitN++
            this.accWaitVal += movingAvg
        }
        if (this.lastEvent == 'walk1' || this.lastEvent == 'walk2' || this.lastEvent == 'walk3') {
            this.accRunN++
            this.accRunVal += movingAvg
        }
        this.accMovAvgs.push({
            msFromStart: m.msFromStart,
            mod: movingAvg
        })
    },

    addOrientation (o) {

    },

    getSegments () {
        if (this.lastEvent !== 'completion') {
            throw new Error('Segmentation can only be performed at the end of the test')
        }
        let results = {
            run1: {
                startMs: 0,
                endMs: 0
            },
            run2: {
                startMs: 0,
                endMs: 0
            },
            run3: {
                startMs: 0,
                endMs: 0
            }
        }
        let waitAccMean = this.accWaitVal / this.accWaitN
        let walkAccMean = this.accRunVal / this.accRunN
        // compute threshold for detecting walking from smoothed acceleration module
        let walkAccThre = waitAccMean + ((walkAccMean + waitAccMean) / 3)

        for (let i = 0; i < this.accMovAvgs.length; i++) {
            let timestamp = this.accMovAvgs[i].msFromStart - (AVG_TIME_MS / 2) // compensate for delay, group delay of moving average is half of its length

            if (timestamp >= this.userRun1.startMs && timestamp < this.userRun1.endMs) {
                // here we expect the walk to start and stop
                if (results.run1.startMs == 0 && this.accMovAvgs[i].mod > walkAccThre) {
                    results.run1.startMs = timestamp
                    // it can happen that one pauses, in which case endMs can be set, so we must un-sent it
                    if (results.run1.endMs != 0) results.run1.endMs = 0
                }
                if (results.run1.startMs != 0 && results.run1.endMs != 0 && this.accMovAvgs[i].mod < walkAccThre) results.run1.endMs = timestamp
            }
            if (timestamp >= results.run1.endMs && results.run1.endMs == 0) {
                // no stop has been identified, use the manual marker
                results.run1.endMs = this.userRun1.endMs
            }

            if (timestamp >= this.userRun2.startMs && timestamp < this.userRun2.endMs) {
                if (results.run2.startMs == 0 && this.accMovAvgs[i].mod > walkAccThre) {
                    results.run2.startMs = timestamp
                    if (results.run2.endMs != 0) results.run2.endMs = 0
                }
                if (results.run2.startMs != 0 && results.run2.endMs != 0 && this.accMovAvgs[i].mod < walkAccThre) results.run2.endMs = timestamp
            }
            if (timestamp >= results.run2.endMs && results.run2.endMs == 0) {
                results.run2.endMs = this.userRun2.endMs
            }

            if (timestamp >= this.userRun3.startMs && timestamp < this.userRun3.endMs) {
                if (results.run3.startMs == 0 && this.accMovAvgs[i].mod > walkAccThre) {
                    results.run3.startMs = timestamp
                    if (results.run3.endMs != 0) results.run3.endMs = 0
                }
                if (results.run3.startMs != 0 && results.run3.endMs != 0 && this.accMovAvgs[i].mod < walkAccThre) results.run3.endMs = timestamp
            }
            if (timestamp >= results.run3.endMs && results.run3.endMs == 0) {
                results.run3.endMs = this.userRun3.endMs
            }
        }
        return results
    },

    reset () {
        this.lastEvent = 'init'
        this.accBuffer = []
        this.accMovingAvg = 0
        this.accWaitN = 0
        this.accWaitVal = 0
        this.accRunN = 0
        this.accRunVal = 0
        this.userRun1.startMs = 0
        this.userRun1.endMs = 0
        this.userRun1.accRun = []
        this.userRun2.startMs = 0
        this.userRun2.endMs = 0
        this.userRun2.accRun = []
        this.userRun3.startMs = 0
        this.userRun3.endMs = 0
        this.userRun3.accRun = []
    }
}

export default MovingAvgSegmenter 