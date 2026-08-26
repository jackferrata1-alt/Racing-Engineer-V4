"use strict";

/* =========================================================
   RACING ENGINEER V5.0
   ========================================================= */


/* =========================================================
   DEFAULT TRACK DATA
   ========================================================= */

const DEFAULT_CORNERS = [

    { id: 1,  baseTime: 8,  text: "BRAKE TURN ONE",        next: "Turn two left",       x: 122, y: 285 },
    { id: 2,  baseTime: 12, text: "TURN TWO LEFT",        next: "Short run",            x: 111, y: 225 },
    { id: 3,  baseTime: 16, text: "TURN THREE RIGHT",     next: "Turn four left",       x: 145, y: 180 },
    { id: 4,  baseTime: 20, text: "TURN FOUR LEFT",       next: "Five right",           x: 190, y: 105 },
    { id: 5,  baseTime: 24, text: "TURN FIVE RIGHT",      next: "Six left",             x: 250, y: 82 },
    { id: 6,  baseTime: 28, text: "TURN SIX LEFT",        next: "Seven right",          x: 315, y: 105 },
    { id: 7,  baseTime: 32, text: "TURN SEVEN RIGHT",     next: "Eight left",           x: 365, y: 145 },
    { id: 8,  baseTime: 37, text: "TURN EIGHT LEFT",      next: "Nine right",           x: 425, y: 132 },
    { id: 9,  baseTime: 42, text: "TURN NINE RIGHT",      next: "Ten right",            x: 485, y: 88 },
    { id: 10, baseTime: 47, text: "TURN TEN RIGHT",       next: "Eleven left",          x: 575, y: 100 },
    { id: 11, baseTime: 52, text: "TURN ELEVEN LEFT",     next: "Twelve right",         x: 615, y: 165 },
    { id: 12, baseTime: 57, text: "TURN TWELVE RIGHT",    next: "Thirteen left",        x: 565, y: 220 },
    { id: 13, baseTime: 62, text: "TURN THIRTEEN LEFT",   next: "Fourteen right",       x: 530, y: 260 },
    { id: 14, baseTime: 67, text: "TURN FOURTEEN RIGHT",  next: "Fifteen left",         x: 520, y: 315 },
    { id: 15, baseTime: 72, text: "TURN FIFTEEN LEFT",    next: "Sixteen right",        x: 470, y: 360 },
    { id: 16, baseTime: 77, text: "TURN SIXTEEN RIGHT",   next: "Seventeen left",       x: 400, y: 350 },
    { id: 17, baseTime: 82, text: "TURN SEVENTEEN LEFT",  next: "Eighteen right",       x: 335, y: 320 },
    { id: 18, baseTime: 87, text: "TURN EIGHTEEN RIGHT",  next: "Nineteen right",       x: 275, y: 340 },
    { id: 19, baseTime: 92, text: "TURN NINETEEN RIGHT",  next: "Twenty left",          x: 205, y: 365 },
    { id: 20, baseTime: 98, text: "TURN TWENTY LEFT",     next: "Full push to finish",  x: 140, y: 345 }

];


/* =========================================================
   STATE
   ========================================================= */

const state = {

    targetTime: 105,

    elapsed: 0,

    running: false,

    paused: false,

    lastFrame: null,

    currentCorner: -1,

    selectedCorner: null,

    muted: false,

    recordingUrl: null,

    recordingBlob: null,

    recorder: null,

    stream: null,

    chunks: [],

    corners: structuredClone(DEFAULT_CORNERS)

};


/* =========================================================
   DOM
   ========================================================= */

const $ = id => document.getElementById(id);

const targetInput = $("targetInput");
const targetDisplay = $("targetDisplay");
const lapTimer = $("lapTimer");
const deltaDisplay = $("deltaDisplay");

const startBtn = $("startBtn");
const pauseBtn = $("pauseBtn");
const resetBtn = $("resetBtn");

const status = $("status");

const cornerMarkers = $("cornerMarkers");
const selectedCorner = $("selectedCorner");
const cornerEditor = $("cornerEditor");
const addCorner = $("addCorner");

const currentCall = $("currentCall");
const nextCall = $("nextCall");

const testVoice = $("testVoice");
const muteBtn = $("muteBtn");

const autoCalls = $("autoCalls");
const useRecording = $("useRecording");

const recordBtn = $("recordBtn");
const stopRecordBtn = $("stopRecordBtn");
const playRecordBtn = $("playRecordBtn");
const deleteRecordBtn = $("deleteRecordBtn");

const recordStatus = $("recordStatus");
const micLight = $("micLight");
const recordedAudio = $("recordedAudio");

const systemMessage = $("systemMessage");


/* =========================================================
   SYSTEM
   ========================================================= */

function system(message) {

    systemMessage.textContent = message;

    console.log("[V5]", message);

}


/* =========================================================
   TIME FUNCTIONS
   ========================================================= */

function formatTime(seconds) {

    seconds = Math.max(0, seconds);

    const minutes =
        Math.floor(seconds / 60);

    const secs =
        Math.floor(seconds % 60);

    const ms =
        Math.floor((seconds % 1) * 1000);

    return (
        minutes +
        ":" +
        String(secs).padStart(2, "0") +
        "." +
        String(ms).padStart(3, "0")
    );

}


function parseTime(value) {

    value = String(value).trim();

    if (value.includes(":")) {

        const parts =
            value.split(":");

        const minutes =
            Number(parts[0]);

        const seconds =
            Number(parts[1]);

        if (
            Number.isFinite(minutes) &&
            Number.isFinite(seconds)
        ) {

            return (
                minutes * 60 +
                seconds
            );

        }

    }

    const seconds =
        Number(value);

    return Number.isFinite(seconds)
        ? seconds
        : null;

}


function setTargetTime(seconds) {

    seconds =
        Math.max(1, Math.min(600, seconds));

    state.targetTime =
        Math.round(seconds * 1000) / 1000;

    targetInput.value =
        formatTime(state.targetTime);

    targetDisplay.textContent =
        formatTime(state.targetTime);

    system(
        "Target lap: " +
        formatTime(state.targetTime)
    );

}


/* =========================================================
   TARGET CONTROLS
   ========================================================= */

function changeTarget(amount) {

    setTargetTime(
        state.targetTime + amount
    );

}


$("minusOne").addEventListener(
    "click",
    () => changeTarget(-1)
);

$("minusTenth").addEventListener(
    "click",
    () => changeTarget(-0.1)
);

$("plusTenth").addEventListener(
    "click",
    () => changeTarget(0.1)
);

$("plusOne").addEventListener(
    "click",
    () => changeTarget(1)
);


targetInput.addEventListener(
    "change",
    () => {

        const value =
            parseTime(targetInput.value);

        if (value === null) {

            targetInput.value =
                formatTime(state.targetTime);

            system("Invalid target time.");

            return;
        }

        setTargetTime(value);

    }
);


document.querySelectorAll(".preset")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                setTargetTime(
                    Number(button.dataset.time)
                );

            }
        );

    });


/* =========================================================
   LAP TIMER
   ========================================================= */

function updateTimer() {

    lapTimer.textContent =
        formatTime(state.elapsed);


    const difference =
        state.elapsed -
        (state.targetTime *
            state.elapsed /
            state.targetTime);


    if (state.elapsed <= state.targetTime) {

        const remaining =
            state.targetTime -
            state.elapsed;

        deltaDisplay.textContent =
            "-" + formatTime(remaining);

    } else {

        deltaDisplay.textContent =
            "+" +
            formatTime(
                state.elapsed -
                state.targetTime
            );

    }

}


function frame(timestamp) {

    if (!state.running) {
        return;
    }

    if (state.lastFrame === null) {
        state.lastFrame = timestamp;
    }

    if (!state.paused) {

        const delta =
            (timestamp -
                state.lastFrame) /
            1000;

        state.elapsed += delta;

        updateTimer();

        checkCorners();

    }

    state.lastFrame = timestamp;

    requestAnimationFrame(frame);

}


/* =========================================================
   LAP CONTROL
   ========================================================= */

function startLap() {

    if (state.running && !state.paused) {

        system("Lap is already running.");

        return;
    }


    if (!state.running) {

        state.elapsed = 0;

        state.currentCorner = -1;

        state.running = true;

        state.paused = false;

        state.lastFrame = null;

        currentCall.textContent =
            "PUSH LAP";

        nextCall.textContent =
            state.corners.length
                ? state.corners[0].text
                : "NO CORNERS";

        status.textContent =
            "RUNNING";

        startBtn.textContent =
            "LAP RUNNING";

        speak("Push lap.");

        system("Push lap started.");

        requestAnimationFrame(frame);

        return;

    }


    state.paused = false;

    state.lastFrame = null;

    status.textContent =
        "RUNNING";

    pauseBtn.textContent =
        "PAUSE";

    system("Lap resumed.");

    requestAnimationFrame(frame);

}


function pauseLap() {

    if (!state.running) {

        system("No lap is running.");

        return;
    }


    state.paused =
        !state.paused;


    if (state.paused) {

        status.textContent =
            "PAUSED";

        pauseBtn.textContent =
            "RESUME";

        system("Lap paused.");

    } else {

        state.lastFrame = null;

        status.textContent =
            "RUNNING";

        pauseBtn.textContent =
            "PAUSE";

        system("Lap resumed.");

        requestAnimationFrame(frame);

    }

}


function resetLap() {

    state.running = false;

    state.paused = false;

    state.elapsed = 0;

    state.currentCorner = -1;

    state.lastFrame = null;


    lapTimer.textContent =
        "0:00.000";

    deltaDisplay.textContent =
        "—";

    currentCall.textContent =
        "ENGINEER READY";

    nextCall.textContent =
        state.corners.length
            ? state.corners[0].text
            : "PUSH LAP";

    startBtn.textContent =
        "START PUSH LAP";

    pauseBtn.textContent =
        "PAUSE";

    status.textContent =
        "READY";


    renderMap();

    system("Lap reset.");

}


/* =========================================================
   CORNER TIMING
   ========================================================= */

/*
   Corner timings are stored around the default
   1:45 lap.

   If target changes to 1:47, every corner timing
   automatically scales proportionally.
*/

function scaledTime(corner) {

    const baseLap = 105;

    return (
        corner.baseTime *
        state.targetTime /
        baseLap
    );

}


function checkCorners() {

    if (!autoCalls.checked) {
        return;
    }


    let index = -1;


    for (
        let i = 0;
        i < state.corners.length;
        i++
    ) {

        if (
            state.elapsed >=
            scaledTime(
                state.corners[i]
            )
        ) {

            index = i;

        } else {

            break;

        }

    }


    if (
        index !== -1 &&
        index !== state.currentCorner
    ) {

        state.currentCorner =
            index;

        const corner =
            state.corners[index];


        currentCall.textContent =
            corner.text;

        nextCall.textContent =
            state.corners[index + 1]
                ? state.corners[index + 1].text
                : "FINISH LINE";


        renderMap();

        speak(corner.text);

    }

}


/* =========================================================
   MAP
   ========================================================= */

function renderMap() {

    cornerMarkers.innerHTML = "";


    state.corners.forEach(
        (corner, index) => {

            const group =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "g"
                );


            group.classList.add(
                "corner-marker"
            );


            if (
                index ===
                state.currentCorner
            ) {

                group.classList.add(
                    "active"
                );

            }


            group.innerHTML = `
                <circle
                    cx="${corner.x}"
                    cy="${corner.y}"
                    r="15"
                ></circle>

                <text
                    x="${corner.x}"
                    y="${corner.y}"
                >
                    ${corner.id}
                </text>
            `;


            group.addEventListener(
                "click",
                () => selectCorner(index)
            );


            cornerMarkers.appendChild(
                group
            );

        }
    );

}


/* =========================================================
   CORNER EDITOR
   ========================================================= */

function selectCorner(index) {

    if (
        index < 0 ||
        index >= state.corners.length
    ) {
        return;
    }


    state.selectedCorner =
        index;


    const corner =
        state.corners[index];


    selectedCorner.textContent =
        "TURN " +
        corner.id +
        " • TARGET " +
        formatTime(
            scaledTime(corner)
        );


    renderEditor();

}


function renderEditor() {

    if (
        state.selectedCorner === null
    ) {

        cornerEditor.innerHTML =
            `<div class="empty">
                Select a corner on the map.
            </div>`;

        return;

    }


    const index =
        state.selectedCorner;

    const corner =
        state.corners[index];


    cornerEditor.innerHTML = `

        <div class="corner-form">

            <label>
                CORNER NUMBER
            </label>

            <input
                id="editId"
                type="number"
                value="${corner.id}"
            >

            <label>
                BASE TIME AT 1:45
            </label>

            <input
                id="editTime"
                type="number"
                step="0.1"
                value="${corner.baseTime}"
            >

            <label>
                ENGINEER CALL
            </label>

            <textarea id="editText">${corner.text}</textarea>

            <label>
                NEXT CALL
            </label>

            <input
                id="editNext"
                value="${corner.next}"
            >

            <label>
                MAP X
            </label>

            <input
                id="editX"
                type="number"
                value="${corner.x}"
            >

            <label>
                MAP Y
            </label>

            <input
                id="editY"
                type="number"
                value="${corner.y}"
            >

            <div class="editor-buttons">

                <button id="saveCorner">
                    SAVE CORNER
                </button>

                <button
                    id="deleteCorner"
                    class="delete-corner"
                >
                    DELETE CORNER
                </button>

            </div>

        </div>
    `;


    $("saveCorner").addEventListener(
        "click",
        saveCorner
    );


    $("deleteCorner").addEventListener(
        "click",
        deleteSelectedCorner
    );

}


function saveCorner() {

    const corner =
        state.corners[
            state.selectedCorner
        ];


    corner.id =
        Number($("editId").value) ||
        corner.id;

    corner.baseTime =
        Number($("editTime").value) ||
        corner.baseTime;

    corner.text =
        $("editText").value.trim() ||
        "ENGINEER CALL";

    corner.next =
        $("editNext").value.trim() ||
        "NEXT";

    corner.x =
        Number($("editX").value);

    corner.y =
        Number($("editY").value);


    renderMap();

    renderEditor();


    selectedCorner.textContent =
        "TURN " +
        corner.id +
        " • TARGET " +
        formatTime(
            scaledTime(corner)
        );


    system(
        "Corner " +
        corner.id +
        " saved."
    );

}


function deleteSelectedCorner() {

    if (
        state.selectedCorner === null
    ) {
        return;
    }


    const removed =
        state.corners[
            state.selectedCorner
        ];


    state.corners.splice(
        state.selectedCorner,
        1
    );


    state.selectedCorner =
        null;

    state.currentCorner =
        -1;


    renderMap();

    renderEditor();


    selectedCorner.textContent =
        "Corner deleted.";


    system(
        "Deleted corner " +
        removed.id +
        "."
    );

}


/* =========================================================
   ADD CORNER
   ========================================================= */

addCorner.addEventListener(
    "click",
    () => {

        const newId =
            state.corners.length + 1;


        const previous =
            state.corners[
                state.corners.length - 1
            ];


        const newCorner = {

            id: newId,

            baseTime:
                previous
                    ? previous.baseTime + 4
                    : 10,

            text:
                "TURN " +
                newId,

            next:
                "NEXT",

            x: 350,

            y: 210

        };


        state.corners.push(
            newCorner
        );


        renderMap();

        selectCorner(
            state.corners.length - 1
        );


        system(
            "New corner added."
        );

    }
);


/* =========================================================
   VOICE
   ========================================================= */

function speak(text) {

    if (state.muted) {
        return;
    }


    if (
        useRecording.checked &&
        state.recordingUrl
    ) {

        playRecording();

        return;

    }


    if (
        !("speechSynthesis" in window)
    ) {

        system(
            "Text-to-speech unavailable."
        );

        return;
    }


    speechSynthesis.cancel();


    const voice =
        new SpeechSynthesisUtterance(
            text
        );


    voice.rate = 1.05;
    voice.pitch = .9;
    voice.volume = 1;


    speechSynthesis.speak(
        voice
    );

}


testVoice.addEventListener(
    "click",
    () => {

        speak(
            "Engineer test. Push lap. Audio system working."
        );

        system(
            "Engineer test."
        );

    }
);


muteBtn.addEventListener(
    "click",
    () => {

        state.muted =
            !state.muted;


        if (state.muted) {

            muteBtn.textContent =
                "🔇 AUDIO OFF";

            speechSynthesis.cancel();

        } else {

            muteBtn.textContent =
                "🔊 AUDIO ON";

        }

    }
);


/* =========================================================
   RECORDING
   ========================================================= */

async function startRecording() {

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        recordStatus.textContent =
            "Microphone unsupported";

        system(
            "This browser does not support recording."
        );

        return;

    }


    try {

        state.stream =
            await navigator.mediaDevices.getUserMedia(
                {
                    audio: true
                }
            );


        state.chunks = [];


        let options = {};


        if (
            MediaRecorder.isTypeSupported(
                "audio/webm;codecs=opus"
            )
        ) {

            options.mimeType =
                "audio/webm;codecs=opus";

        }


        state.recorder =
            new MediaRecorder(
                state.stream,
                options
            );


        state.recorder.ondataavailable =
            event => {

                if (event.data.size > 0) {

                    state.chunks.push(
                        event.data
                    );

                }

            };


        state.recorder.onstop =
            finishRecording;


        state.recorder.start();


        recordBtn.disabled =
            true;

        stopRecordBtn.disabled =
            false;

        playRecordBtn.disabled =
            true;

        deleteRecordBtn.disabled =
            true;


        micLight.classList.add(
            "recording"
        );


        recordStatus.textContent =
            "RECORDING...";

        status.textContent =
            "RECORDING";


        system(
            "Recording started."
        );

    }

    catch (error) {

        console.error(error);

        recordStatus.textContent =
            "Microphone permission denied";

        system(
            "Allow microphone access and try again."
        );

    }

}


function stopRecording() {

    if (
        state.recorder &&
        state.recorder.state ===
        "recording"
    ) {

        state.recorder.stop();

    }


    if (state.stream) {

        state.stream
            .getTracks()
            .forEach(
                track => track.stop()
            );

    }

}


function finishRecording() {

    const blob =
        new Blob(
            state.chunks,
            {
                type:
                    state.recorder.mimeType ||
                    "audio/webm"
            }
        );


    if (state.recordingUrl) {

        URL.revokeObjectURL(
            state.recordingUrl
        );

    }


    state.recordingBlob =
        blob;


    state.recordingUrl =
        URL.createObjectURL(
            blob
        );


    recordedAudio.src =
        state.recordingUrl;

    recordedAudio.hidden =
        false;


    recordBtn.disabled =
        false;

    stopRecordBtn.disabled =
        true;

    playRecordBtn.disabled =
        false;

    deleteRecordBtn.disabled =
        false;


    micLight.classList.remove(
        "recording"
    );


    recordStatus.textContent =
        "Recording ready";

    status.textContent =
        "READY";


    system(
        "Voice recording saved."
    );

}


function playRecording() {

    if (!state.recordingUrl) {

        system(
            "No recording exists."
        );

        return;
    }


    recordedAudio.currentTime =
        0;


    recordedAudio.play()
        .catch(
            error => {

                console.error(error);

                system(
                    "Audio playback was blocked."
                );

            }
        );

}


function deleteRecording() {

    if (state.recordingUrl) {

        URL.revokeObjectURL(
            state.recordingUrl
        );

    }


    state.recordingUrl =
        null;

    state.recordingBlob =
        null;


    recordedAudio.pause();

    recordedAudio.removeAttribute(
        "src"
    );

    recordedAudio.load();

    recordedAudio.hidden =
        true;


    recordBtn.disabled =
        false;

    stopRecordBtn.disabled =
        true;

    playRecordBtn.disabled =
        true;

    deleteRecordBtn.disabled =
        true;


    recordStatus.textContent =
        "Ready";


    system(
        "Recording deleted."
    );

}


recordBtn.addEventListener(
    "click",
    startRecording
);

stopRecordBtn.addEventListener(
    "click",
    stopRecording
);

playRecordBtn.addEventListener(
    "click",
    playRecording
);

deleteRecordBtn.addEventListener(
    "click",
    deleteRecording
);


/* =========================================================
   INITIALIZE
   ========================================================= */

setTargetTime(105);

renderMap();

renderEditor();

updateTimer();

system(
    "V5.0 ready. All systems connected."
);

console.log(
    "RACING ENGINEER V5.0 READY"
);
