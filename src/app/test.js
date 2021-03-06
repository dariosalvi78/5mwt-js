import motion from './phone/motion.js'
import orientation from './phone/orientation.js'

let startButton = document.getElementById('startBtn')
let mainText = document.getElementById('mainText')
let subText = document.getElementById('subText')

// current state of the test
let state = 'init'

// object containing the data of the test
let testData = {}
// initialization of an empty test data
let initData = function () {
    testData = {
        startTs: '',
        endTs: '',
        motion: [],
        orientation: [],
        run1: {
            waitStartMs: 0,
            walkStartMs: 0,
            completionMs: 0,
            duration: 0
        },
        run2: {
            waitStartMs: 0,
            walkStartMs: 0,
            completionMs: 0,
            duration: 0
        },
        run3: {
            waitStartMs: 0,
            walkStartMs: 0,
            completionMs: 0,
            duration: 0
        }
    }
}


// the state machine of the test is implemented in the callback of the button
let testMachine = async () => {
    let startCountdown = function () {
        // countdown
        let secs = 4
        let timer = setInterval(() => {
            mainText.innerHTML = `Please wait ${secs}s`
            secs--
            if (secs == 0) {
                // walk phase started
                clearInterval(timer)

                if (navigator.vibrate) {
                    navigator.vibrate(200)
                }
                // go to the next state
                testMachine()
            }
        }, 1000)
    }

    if (state == 'init') {

        try {
            await motion.requestPermission()
            state = 'completion'
            testMachine()
        } catch (err) {
            console.error(err)
            state = 'init'
            subText.innerHTML = 'Motion sensor needs permission'
            startButton.innerHTML = 'Grant permission'
            startButton.style.visibility = 'visible'
            startButton.disabled = false
        }

        try {
            await orientation.requestPermission()
            state = 'completion'
            testMachine()

        } catch (err) {
            console.error(err)
            state = 'init'
            subText.innerHTML = 'Orientation sensor needs permission'
            startButton.innerHTML = 'Grant permission'
            startButton.style.visibility = 'visible'
            startButton.disabled = false
        }

    } else if (state == 'completion') {
        state = 'intro1'

        initData()

        mainText.innerHTML = 'Position yourself over the marked starting point and press "Start" when ready'
        subText.innerHTML = ''
        startButton.innerHTML = 'Start'
        startButton.disabled = false
    } else if (state == 'intro1') {
        state = 'wait1'

        testData.startTs = new Date()
        // start acquiring signals
        motion.startNotifications((data) => {
            testData.motion.push(data)
        })
        orientation.startNotifications((data) => {
            testData.orientation.push(data)
        })
        testData.run1.waitStartMs = Date.now() - testData.startTs.getTime()

        mainText.innerHTML = 'Please wait 5s'
        subText.innerHTML = ''
        startButton.innerHTML = '...'
        startButton.disabled = true
        startCountdown()
    } else if (state == 'wait1') {
        state = 'walk1'
        testData.run1.walkStartMs = Date.now() - testData.startTs.getTime()

        mainText.innerHTML = 'Walk!'
        subText.innerHTML = 'Press "Done" when completed'
        startButton.innerHTML = 'Done'
        startButton.disabled = false
    } else if (state == 'walk1') {
        // first round completed
        testData.run1.completionMs = Date.now() - testData.startTs.getTime()

        state = 'intro2'

        mainText.innerHTML = 'Second round: turn around and press "Start" when ready to walk back'
        subText.innerHTML = ''
        startButton.innerHTML = 'Start'
        startButton.disabled = false
    } else if (state == 'intro2') {
        state = 'wait2'

        testData.run2.waitStartMs = Date.now() - testData.startTs.getTime()

        mainText.innerHTML = 'Please wait 5s'
        subText.innerHTML = ''
        startButton.innerHTML = '...'
        startButton.disabled = true
        startCountdown()
    } else if (state == 'wait2') {
        state = 'walk2'
        testData.run2.walkStartMs = Date.now() - testData.startTs.getTime()

        mainText.innerHTML = 'Walk!'
        subText.innerHTML = 'Press "Done" when completed'
        startButton.innerHTML = 'Done'
        startButton.disabled = false
    } else if (state == 'walk2') {
        // second round completed
        testData.run2.completionMs = Date.now() - testData.startTs.getTime()

        state = 'intro3'

        mainText.innerHTML = 'Last round: turn around again and press "Start" when ready to walk'
        subText.innerHTML = ''
        startButton.innerHTML = 'Start'
        startButton.disabled = false
    } else if (state == 'intro3') {
        state = 'wait3'
        testData.run3.waitStartMs = Date.now() - testData.startTs.getTime()

        mainText.innerHTML = 'Please wait 5s'
        subText.innerHTML = ''
        startButton.innerHTML = '...'
        startButton.disabled = true
        startCountdown()
    } else if (state == 'wait3') {
        state = 'walk3'
        testData.run3.walkStartMs = Date.now() - testData.startTs.getTime()

        mainText.innerHTML = 'Walk!'
        subText.innerHTML = 'Press "Done" when completed'
        startButton.innerHTML = 'Done'
        startButton.disabled = false
    } else if (state == 'walk3') {
        // third round completed
        testData.run3.completionMs = Date.now() - testData.startTs.getTime()

        // stop signals acquisition
        motion.stopNotifications()
        orientation.stopNotifications()

        testData.endTs = new Date()

        state = 'completion'

        // compute the time

        testData.run1.duration = testData.run1.completionMs - testData.run1.walkStartMs
        testData.run2.duration = testData.run2.completionMs - testData.run2.walkStartMs
        testData.run3.duration = testData.run3.completionMs - testData.run3.walkStartMs

        let avgTime = (testData.run1.duration + testData.run2.duration + testData.run3.duration) / 3

        mainText.innerHTML = 'Test completed!'
        subText.innerHTML = `Average time: ${(avgTime / 1000).toFixed(0)}s`
        startButton.innerHTML = 'Restart'
        startButton.disabled = false

        console.log(testData)
        var blob = new Blob([JSON.stringify(testData)], { type: "text/json;charset=utf-8" })
        saveAs(blob, "testresults.json")
    }
}


// detect file saving capability
try {
    new Blob
} catch (e) {
    console.error(e)
    state = 'error'
    subText.innerHTML = 'File saving not supported'
    startButton.style.visibility = 'hidden'
    startButton.disabled = true
}

// detect motion availability
if (!motion.isAvailable()) {
    state = 'error'
    subText.innerHTML = 'Motion sensor not available'
    startButton.style.visibility = 'hidden'
    startButton.disabled = true
}

// detect orientation availability
if (!orientation.isAvailable()) {
    state = 'error'
    subText.innerHTML = 'Orientation sensor not available'
    startButton.style.visibility = 'hidden'
    startButton.disabled = true
}


// start the test state machine
testMachine()

startButton.addEventListener('click', testMachine)