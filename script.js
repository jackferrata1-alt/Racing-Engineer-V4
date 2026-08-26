// =====================================================
// RACING ENGINEER V4.5
// QUEST 3S AUDIO ENGINE
// =====================================================

let audioEnabled = false;
let pushLapAudio = null;

let running = false;
let paused = false;

let lapStart = 0;
let pauseStart = 0;
let pausedTime = 0;

let animationFrame = null;

let lapNumber = 0;
let bestLap = null;

let triggeredNotes = new Set();

const STORAGE_KEY = "racingEngineerV45";


// =====================================================
// ELEMENTS
// =====================================================

const trackSelect =
    document.getElementById("trackSelect");

const startBtn =
    document.getElementById("startBtn");

const pauseBtn =
    document.getElementById("pauseBtn");

const stopBtn =
    document.getElementById("stopBtn");

const speakBtn =
    document.getElementById("speakBtn");

const currentLapEl =
    document.getElementById("currentLap");

const deltaEl =
    document.getElementById("delta");

const bestLapEl =
    document.getElementById("bestLap");

const statusEl =
    document.getElementById("status");


// =====================================================
// AUDIO
// =====================================================

pushLapAudio =
    new Audio(
        "./audio/push-lap.mp3"
    );

pushLapAudio.preload =
    "auto";


// =====================================================
// CREATE AUDIO BUTTON
// =====================================================

let audioButton =
    document.getElementById(
        "audioTestBtn"
    );


if (!audioButton) {

    audioButton =
        document.createElement(
            "button"
        );

    audioButton.id =
        "audioTestBtn";

    audioButton.textContent =
        "TEST PUSH LAP AUDIO";

    audioButton.className =
        "primary";


    const container =
        startBtn?.parentElement ||
        document.body;


    container.appendChild(
        audioButton
    );
}


// =====================================================
// AUDIO TEST
// =====================================================

async function testPushLapAudio() {

    try {

        pushLapAudio.currentTime =
            0;


        await pushLapAudio.play();


        audioEnabled =
            true;


        audioButton.textContent =
            "AUDIO WORKING ✓";


        if (statusEl) {

            statusEl.textContent =
                "AUDIO READY";
        }


        console.log(
            "Push lap audio playing."
        );


    } catch (error) {

        console.error(
            "Audio playback failed:",
            error
        );


        if (statusEl) {

            statusEl.textContent =
                "AUDIO ERROR";
        }


        alert(
            "The Quest could not play the MP3. Check that audio/push-lap.mp3 exists and try again."
        );
    }
}


audioButton.addEventListener(
    "click",
    testPushLapAudio
);


// =====================================================
// PLAY AUDIO
// =====================================================

async function playPushLap() {

    if (!pushLapAudio) {
        return;
    }


    try {

        pushLapAudio.currentTime =
            0;


        await pushLapAudio.play();


    } catch (error) {

        console.error(
            "Engineer audio error:",
            error
        );
    }
}


// =====================================================
// DATABASE
// =====================================================

function loadDatabase() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (saved) {

            return JSON.parse(
                saved
            );
        }

    } catch (error) {

        console.error(
            error
        );
    }


    if (
        typeof TRACKS !==
        "undefined"
    ) {

        const copy =
            JSON.parse(
                JSON.stringify(
                    TRACKS
                )
            );


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                copy
            )
        );


        return copy;
    }


    return {};
}


let database =
    loadDatabase();


// =====================================================
// TRACKS
// =====================================================

function populateTracks() {

    if (!trackSelect) {
        return;
    }


    trackSelect.innerHTML =
        "";


    Object.keys(database)
        .forEach(
            key => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    key;


                option.textContent =
                    database[key].name ||
                    key;


                trackSelect.appendChild(
                    option
                );
            }
        );
}


// =====================================================
// TARGET TIME
// =====================================================

function getTargetTime() {

    const minutes =
        Number(
            document.getElementById(
                "minutes"
            )?.value
        ) || 0;


    const seconds =
        Number(
            document.getElementById(
                "seconds"
            )?.value
        ) || 0;


    const milliseconds =
        Number(
            document.getElementById(
                "milliseconds"
            )?.value
        ) || 0;


    return (
        minutes * 60000 +
        seconds * 1000 +
        milliseconds
    );
}


// =====================================================
// FORMAT
// =====================================================

function formatTime(ms) {

    if (
        !Number.isFinite(ms)
    ) {

        return "0:00.000";
    }


    ms =
        Math.max(
            0,
            Math.floor(ms)
        );


    const minutes =
        Math.floor(
            ms / 60000
        );


    const seconds =
        Math.floor(
            (ms % 60000) / 1000
        );


    const milliseconds =
        ms % 1000;


    return (
        minutes +
        ":" +
        String(seconds)
            .padStart(2, "0") +
        "." +
        String(milliseconds)
            .padStart(3, "0")
    );
}


function formatDelta(ms) {

    return (
        ms >= 0 ? "+" : "-" +
        formatTime(
            Math.abs(ms)
        )
    );
}


// =====================================================
// START
// =====================================================

async function startLap() {

    console.log(
        "START PUSH LAP"
    );


    if (running) {
        return;
    }


    running =
        true;


    paused =
        false;


    pausedTime =
        0;


    pauseStart =
        0;


    triggeredNotes =
        new Set();


    lapNumber++;


    lapStart =
        performance.now();


    if (statusEl) {

        statusEl.textContent =
            "PUSH LAP";
    }


    if (startBtn) {

        startBtn.disabled =
            true;

        startBtn.textContent =
            "LAP RUNNING";
    }


    if (pauseBtn) {

        pauseBtn.disabled =
            false;
    }


    // IMPORTANT:
    // The START button itself is a user interaction,
    // so Quest is allowed to play the MP3 here.

    await playPushLap();


    cancelAnimationFrame(
        animationFrame
    );


    animationFrame =
        requestAnimationFrame(
            updateTimer
        );
}


// =====================================================
// TIMER
// =====================================================

function updateTimer() {

    if (!running) {
        return;
    }


    if (!paused) {

        const elapsed =
            performance.now() -
            lapStart -
            pausedTime;


        if (currentLapEl) {

            currentLapEl.textContent =
                formatTime(
                    elapsed
                );
        }


        if (deltaEl) {

            deltaEl.textContent =
                formatDelta(
                    elapsed -
                    getTargetTime()
                );
        }
    }


    animationFrame =
        requestAnimationFrame(
            updateTimer
        );
}


// =====================================================
// PAUSE / RESUME
// =====================================================

function togglePause() {

    if (!running) {
        return;
    }


    if (!paused) {

        paused =
            true;


        pauseStart =
            performance.now();


        if (statusEl) {

            statusEl.textContent =
                "PAUSED";
        }


        if (pauseBtn) {

            pauseBtn.textContent =
                "RESUME";
        }


    } else {

        paused =
            false;


        pausedTime +=
            performance.now() -
            pauseStart;


        pauseStart =
            0;


        if (statusEl) {

            statusEl.textContent =
                "PUSH LAP";
        }


        if (pauseBtn) {

            pauseBtn.textContent =
                "PAUSE";
        }
    }
}


// =====================================================
// STOP
// =====================================================

function stopLap() {

    if (!running) {
        return;
    }


    const endTime =
        paused
            ? pauseStart
            : performance.now();


    const elapsed =
        endTime -
        lap
