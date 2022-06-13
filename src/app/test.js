import motion from './phone/motion.js'
import orientation from './phone/orientation.js'

let startButton = document.getElementById('startBtn')
let mainText = document.getElementById('mainText')
let subText = document.getElementById('subText')

// current state of the test
let state = 'completion'

// object containing the data of the test
let testData = {}
// initialization of an empty test data
let initData = function () {
    testData = {
        motion: [],
        orientation: [],
        run1: {
            startTs: '',
            endTs: '',
            duration: 0
        },
        run2: {
            startTs: '',
            endTs: '',
            duration: 0
        },
        run3: {
            startTs: '',
            endTs: '',
            duration: 0
        }
    }
}


// the state machine of the test is implemented in the callback of the button
let testMachine = () => {

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

    if (state == 'completion') {
        state = 'intro1'

        initData()

        mainText.innerHTML = 'Position yourself over the marked starting point and press "Start" when ready'
        subText.innerHTML = ''
        startButton.innerHTML = 'Start'
        startButton.disabled = false
    } else if (state == 'intro1') {
        state = 'wait1'

        testData.run1.startTs = new Date()
        // start acquiring signals
        motion.startNotifications((data) => {
            testData.motion.push(data)
        })
        orientation.startNotifications((data) => {
            testData.orientation.push(data)
        })

        mainText.innerHTML = 'Please wait 5s'
        subText.innerHTML = ''
        startButton.innerHTML = '...'
        startButton.disabled = true
        startCountdown()
    } else if (state == 'wait1') {
        state = 'walk1'

        mainText.innerHTML = 'Walk!'
        subText.innerHTML = 'Press "Done" when completed'
        startButton.innerHTML = 'Done'
        startButton.disabled = false
    } else if (state == 'walk1') {
        // first round completed
        testData.run1.endTs = new Date()

        state = 'intro2'

        mainText.innerHTML = 'Second round: turn around and press "Start" when ready to walk back'
        subText.innerHTML = ''
        startButton.innerHTML = 'Start'
        startButton.disabled = false
    } else if (state == 'intro2') {
        state = 'wait2'

        testData.run2.startTs = new Date()

        mainText.innerHTML = 'Please wait 5s'
        subText.innerHTML = ''
        startButton.innerHTML = '...'
        startButton.disabled = true
        startCountdown()
    } else if (state == 'wait2') {
        state = 'walk2'

        mainText.innerHTML = 'Walk!'
        subText.innerHTML = 'Press "Done" when completed'
        startButton.innerHTML = 'Done'
        startButton.disabled = false
    } else if (state == 'walk2') {
        // second round completed
        testData.run2.endTs = new Date()

        state = 'intro3'

        mainText.innerHTML = 'Last round: turn around again and press "Start" when ready to walk'
        subText.innerHTML = ''
        startButton.innerHTML = 'Start'
        startButton.disabled = false
    } else if (state == 'intro3') {
        state = 'wait3'

        testData.run3.startTs = new Date()

        mainText.innerHTML = 'Please wait 5s'
        subText.innerHTML = ''
        startButton.innerHTML = '...'
        startButton.disabled = true
        startCountdown()
    } else if (state == 'wait3') {
        state = 'walk3'

        mainText.innerHTML = 'Walk!'
        subText.innerHTML = 'Press "Done" when completed'
        startButton.innerHTML = 'Done'
        startButton.disabled = false
    } else if (state == 'walk3') {
        // third round completed
        testData.run3.endTs = new Date()

        // stop signals acquisition
        motion.stopNotifications()
        orientation.stopNotifications()

        state = 'completion'

        // compute the time

        testData.run1.duration = testData.run1.endTs.getTime() - testData.run1.startTs.getTime()
        testData.run2.duration = testData.run2.endTs.getTime() - testData.run2.startTs.getTime()
        testData.run3.duration = testData.run3.endTs.getTime() - testData.run3.startTs.getTime()

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


// start the test state machine
testMachine()

startButton.addEventListener('click', testMachine)


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

try {
    await motion.requestPermission()
} catch (err) {
    console.error(err)
    state = 'error'
    subText.innerHTML = 'Motion sensor not given permission'
    startButton.style.visibility = 'hidden'
    startButton.disabled = true
}

// detect orientation availability
if (!orientation.isAvailable()) {
    state.current = 'error'
    subText.innerHTML = 'Orientation sensor not available'
    startButton.style.visibility = 'hidden'
    startButton.disabled = true
}

try {
    await orientation.requestPermission()
} catch (err) {
    console.error(err)
    state.current = 'error'
    subText.innerHTML = 'Orientation sensor not given permission'
    startButton.style.visibility = 'hidden'
    startButton.disabled = true
}