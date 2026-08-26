"use strict";


// =====================================================
// RACING ENGINEER V5
// =====================================================

let running = false;
let paused = false;

let lapStart = 0;
let pauseStart = 0;
let pausedTime = 0;

let animationFrame = null;

let lapNumber = 0;
let bestLap = null;

let triggeredNotes = new Set();

let activeFilter = "all";

let audioEnabled = false;


// =====================================================
// ELEMENTS
// =====================================================

const trackSelect = document.getElementById("trackSelect");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const speakBtn = document.getElementById("speakBtn");
const enableAudioBtn = document.getElementById("enableAudioBtn");
const addNoteBtn = document.getElementById("addNoteBtn");

const currentLapEl = document.getElementById("currentLap");
const deltaEl = document.getElementById("delta");
const bestLapEl = document.getElementById("bestLap");

const statusEl = document.getElementById("status");
const callEl = document.getElementById("call");
const subCallEl = document.getElementById("subCall");

const notesList = document.getElementById("notesList");
const editingTrack = document.getElementById("editingTrack");

const timingMode = document.getElementById("timingMode");

const timeLog = document.getElementById("timeLog");

const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const millisecondsEl = document.getElementById("milliseconds");

const clearLog = document.getElementById("clearLog");


// =====================================================
// DATABASE
// =====================================================

const STORAGE_KEY = "racingEngineerV5";

function loadDatabase() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (saved) {
            return JSON.parse(saved);
        }

    } catch (error) {

        console.error("Database load error:", error);
    }


    if (typeof TRACKS !== "undefined") {

        const copy =
            JSON.parse(JSON.stringify(TRACKS));

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(copy)
            );
        } catch (error) {
            console.error(error);
        }

        return copy;
    }


    return {};
}


let database = loadDatabase();


function saveDatabase() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(database)
        );

    } catch (error) {

        console.error(
            "Database save error:",
            error
        );
    }
}


// =====================================================
// DISPLAY
// =====================================================

function engineerCall(main, detail = "") {

    if (callEl) {
        callEl.textContent = main;
    }

    if (subCallEl) {
        subCallEl.textContent = detail;
    }
}


// =====================================================
// TRACKS
// =====================================================

function populateTracks() {

    if (!trackSelect) return;

    trackSelect.innerHTML = "";

    Object.keys(database).forEach(key => {

        const option =
            document.createElement("option");

        option.value = key;
        option.textContent =
            database[key].name || key;

        trackSelect.appendChild(option);
    });
}


// =====================================================
// TIME
// =====================================================

function getTargetTime() {

    const minutes =
        Number(minutesEl?.value) || 0;

    const seconds =
        Math.max(
            0,
            Math.min(
                59,
                Number(secondsEl?.value) || 0
            )
        );

    const milliseconds =
        Math.max(
            0,
            Math.min(
                999,
                Number(millisecondsEl?.value) || 0
            )
        );

    return (
        minutes * 60000 +
        seconds * 1000 +
        milliseconds
    );
}


function formatTime(ms) {

    if (!Number.isFinite(ms)) {
        return "--:--.---";
    }

    ms = Math.max(0, Math.floor(ms));

    const minutes =
        Math.floor(ms / 60000);

    const seconds =
        Math.floor((ms % 60000) / 1000);

    const milliseconds =
        ms % 1000;

    return (
        minutes +
        ":" +
        String(seconds).padStart(2, "0") +
        "." +
        String(milliseconds).padStart(3, "0")
    );
}


function formatDelta(ms) {

    const sign = ms >= 0 ? "+" : "-";

    return (
        sign +
        formatTime(Math.abs(ms))
    );
}


// =====================================================
// AUDIO
// =====================================================

function enableEngineerAudio() {

    if (!("speechSynthesis" in window)) {

        engineerCall(
            "AUDIO UNAVAILABLE",
            "Speech synthesis is not supported."
        );

        return;
    }


    audioEnabled = true;

    enableAudioBtn.textContent =
        "ENGINEER AUDIO ENABLED";

    enableAudioBtn.disabled = true;

    statusEl.textContent =
        "AUDIO READY";


    const voice =
        new SpeechSynthesisUtterance(
            "Engineer audio enabled."
        );

    voice.volume = 1;
    voice.rate = 1;
    voice.pitch = 1;

    speechSynthesis.cancel();
    speechSynthesis.speak(voice);
}


function speak(text) {

    if (!audioEnabled) return;

    if (!("speechSynthesis" in window)) return;

    speechSynthesis.cancel();

    const voice =
        new SpeechSynthesisUtterance(
            String(text)
        );

    voice.volume = 1;
    voice.rate = 1.05;
    voice.pitch = 1;

    speechSynthesis.speak(voice);
}


// =====================================================
// START LAP
// =====================================================

function startLap() {

    if (running) return;


    const track =
        database[trackSelect.value];


    if (!track) {

        engineerCall(
            "SELECT TRACK",
            "Choose a track first."
        );

        return;
    }


    running = true;
    paused = false;

    pausedTime = 0;
    pauseStart = 0;

    triggeredNotes = new Set();

    lapNumber++;


    lapStart =
        performance.now();


    statusEl.textContent =
        "PUSH LAP";


    startBtn.textContent =
        "LAP RUNNING";

    startBtn.disabled = true;

    pauseBtn.disabled = false;


    engineerCall(
        "PUSH LAP",
        track.name +
        " — Target " +
        formatTime(getTargetTime())
    );


    animationFrame =
        requestAnimationFrame(updateTimer);
}


// =====================================================
// TIMER
// =====================================================

function updateTimer() {

    if (!running) return;


    if (!paused) {

        const elapsed =
            performance.now() -
            lapStart -
            pausedTime;


        currentLapEl.textContent =
            formatTime(elapsed);


        deltaEl.textContent =
            formatDelta(
                elapsed -
                getTargetTime()
            );


        triggerNotes(elapsed);
    }


    animationFrame =
        requestAnimationFrame(updateTimer);
}


// =====================================================
// NOTES
// =====================================================

function triggerNotes(elapsed) {

    const track =
        database[trackSelect.value];


    if (!track ||
        !Array.isArray(track.notes)) {

        return;
    }


    track.notes.forEach(note => {

        if (!note.enabled) return;

        if (triggeredNotes.has(note.id)) {
            return;
        }


        let triggerTime;


        if (
            timingMode.value ===
            "percentage"
        ) {

            triggerTime =
                getTargetTime() *
                Number(note.time) /
                100;

        } else {

            triggerTime =
                Number(note.time) *
                1000;
        }


        if (elapsed >= triggerTime) {

            triggeredNotes.add(note.id);


            engineerCall(
                note.call,
                note.detail
            );


            if (note.voice) {

                speak(
                    note.call +
                    ". " +
                    note.detail
                );
            }
        }

    });
}


// =====================================================
// PAUSE
// =====================================================

function togglePause() {

    if (!running) return;


    if (!paused) {

        paused = true;

        pauseStart =
            performance.now();

        pauseBtn.textContent =
            "RESUME";

        statusEl.textContent =
            "PAUSED";


        engineerCall(
            "PAUSED",
            "Lap timer stopped."
        );

    } else {

        paused = false;

        pausedTime +=
            performance.now() -
            pauseStart;

        pauseStart = 0;

        pauseBtn.textContent =
            "PAUSE";

        statusEl.textContent =
            "PUSH LAP";


        engineerCall(
            "RESUME",
            "Back on the push lap."
        );
    }
}


// =====================================================
// STOP
// =====================================================

function stopLap() {

    if (!running) return;


    const endTime =
        paused
            ? pauseStart
            : performance.now();


    const elapsed =
        endTime -
        lapStart -
        pausedTime;


    running = false;
    paused = false;


    cancelAnimationFrame(
        animationFrame
    );


    currentLapEl.textContent =
        formatTime(elapsed);


    const delta =
        elapsed -
        getTargetTime();


    deltaEl.textContent =
        formatDelta(delta);


    const isBest =
        bestLap === null ||
        elapsed < bestLap;


    if (isBest) {

        bestLap = elapsed;

        bestLapEl.textContent =
            formatTime(bestLap);
    }


    addLog(
        lapNumber,
        elapsed,
        delta,
        isBest
    );


    statusEl.textContent =
        "READY";

    startBtn.textContent =
        "START PUSH LAP";

    startBtn.disabled = false;

    pauseBtn.disabled = true;

    pauseBtn.textContent =
        "PAUSE";


    engineerCall(
        "LAP COMPLETE",
        formatTime(elapsed) +
        " — " +
        formatDelta(delta)
    );
}


// =====================================================
// LOG
// =====================================================

function addLog(
    lap,
    time,
    delta,
    isBest
) {

    const empty =
        timeLog.querySelector(".empty");

    if (empty) {
        empty.remove();
    }


    const row =
        document.createElement("div");

    row.className =
        "logRow";


    row.innerHTML = `
        <span>LAP ${lap}</span>
        <span>${formatTime(time)}</span>
        <span>${formatDelta(delta)}</span>
        <span>${isBest ? "★ BEST" : ""}</span>
    `;


    timeLog.prepend(row);
}


clearLog.addEventListener(
    "click",
    function() {

        timeLog.innerHTML = `
            <div class="empty">
                No completed laps.
            </div>
        `;

        lapNumber = 0;
        bestLap = null;

        bestLapEl.textContent =
            "--:--.---";
    }
);


// =====================================================
// NOTE EDITOR
// =====================================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}


function renderNotes() {

    const track =
        database[trackSelect.value];


    if (!track) return;


    editingTrack.textContent =
        track.name;


    notesList.innerHTML = "";


    let notes =
        Array.isArray(track.notes)
            ? [...track.notes]
            : [];


    if (activeFilter !== "all") {

        notes =
            notes.filter(
                note =>
                    note.type ===
                    activeFilter
            );
    }


    notes.sort(
        (a, b) =>
            Number(a.time) -
            Number(b.time)
    );


    if (!notes.length) {

        notesList.innerHTML = `
            <div class="empty">
                No calls match this filter.
            </div>
        `;

        return;
    }


    notes.forEach(
        note =>
            createNoteCard(
                track,
                note
            )
    );
}


function createNoteCard(
    track,
    note
) {

    const card =
        document.createElement("div");


    card.className =
        "noteCard";


    card.innerHTML = `

        <div class="noteTop">

            <div>
                <label>CORNER</label>

                <input
                    class="corner"
                    value="${escapeHTML(note.corner || "")}"
                >
            </div>

            <div>
                <label>TRIGGER</label>

                <input
                    class="time"
                    type="number"
                    step="0.1"
                    value="${note.time || 0}"
                >
            </div>

            <div>
                <label>TYPE</label>

                <select class="type">

                    ${[
                        "BRAKE",
                        "TURN",
                        "APEX",
                        "EXIT",
                        "THROTTLE",
                        "GEAR",
                        "DRS",
                        "ERS",
                        "LIFT",
                        "CUSTOM"
                    ].map(
                        type => `
                            <option
                                value="${type}"
                                ${note.type === type ? "selected" : ""}
                            >
                                ${type}
                            </option>
                        `
                    ).join("")}

                </select>
            </div>

        </div>


        <div class="noteMiddle">

            <div>
                <label>ENGINEER CALL</label>

                <input
                    class="call"
                    value="${escapeHTML(note.call || "")}"
                >
            </div>

            <div>
                <label>DETAIL</label>

                <input
                    class="detail"
                    value="${escapeHTML(note.detail || "")}"
                >
            </div>

            <div>
                <label>GEAR</label>

                <input
                    class="gear"
                    value="${escapeHTML(note.gear || "")}"
                >
            </div>

        </div>


        <div class="noteBottom">

            <div>

                <label>ENABLED</label>

                <select class="enabled">

                    <option
                        value="true"
                        ${note.enabled ? "selected" : ""}
                    >
                        ON
                    </option>

                    <option
                        value="false"
                        ${!note.enabled ? "selected" : ""}
                    >
                        OFF
                    </option>

                </select>

            </div>


            <div>

                <label>VOICE</label>

                <select class="voice">

                    <option
                        value="true"
                        ${note.voice ? "selected" : ""}
                    >
                        ON
                    </option>

                    <option
                        value="false"
                        ${!note.voice ? "selected" : ""}
                    >
                        OFF
                    </option>

                </select>

            </div>

        </div>


        <div class="noteActions">

            <button class="test">
                TEST
            </button>

            <button class="save primary">
                SAVE
            </button>

            <button class="deleteNote">
                DELETE
            </button>

        </div>
    `;


    const get =
        selector =>
            card.querySelector(selector);


    get(".test").addEventListener(
        "click",
        function() {

            engineerCall(
                note.call,
                note.detail
            );

            if (audioEnabled) {

                speak(
                    note.call +
                    ". " +
                    note.detail
                );
            }
        }
    );


    get(".save").addEventListener(
        "click",
        function() {

            note.corner =
                get(".corner").value;

            note.time =
                Number(
                    get(".time").value
                ) || 0;

            note.type =
                get(".type").value;

            note.call =
                get(".call").value;

            note.detail =
                get(".detail").value;

            note.gear =
                get(".gear").value;

            note.enabled =
                get(".enabled").value ===
                "true";

            note.voice =
                get(".voice").value ===
                "true";


            saveDatabase();


            engineerCall(
                "CALL SAVED",
                note.corner +
                " — " +
                note.call
            );
        }
    );


    get(".deleteNote").addEventListener(
        "click",
        function() {

            track.notes =
                track.notes.filter(
                    item =>
                        item.id !== note.id
                );


            saveDatabase();

            renderNotes();
        }
    );


    notesList.appendChild(card);
}


// =====================================================
// ADD CALL
// =====================================================

addNoteBtn.addEventListener(
    "click",
    function() {

        const track =
            database[trackSelect.value];


        if (!track) return;


        if (!Array.isArray(track.notes)) {
            track.notes = [];
        }


        track.notes.push({

            id:
                Date.now().toString(),

            corner:
                "T1",

            type:
                "CUSTOM",

            time:
                10,

            call:
                "CUSTOM CALL",

            detail:
                "Your note",

            gear:
                "3",

            enabled:
                true,

            voice:
                true
        });


        saveDatabase();

        renderNotes();
    }
);


// =====================================================
// FILTERS
// =====================================================

document
    .querySelectorAll(".filter")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function() {

                    activeFilter =
                        button.dataset.filter;

                    document
                        .querySelectorAll(".filter")
                        .forEach(
                            b =>
                                b.classList.toggle(
                                    "active",
                                    b === button
                                )
                        );

                    renderNotes();
                }
            );
        }
    );


// =====================================================
// TRACK CHANGE
// =====================================================

trackSelect.addEventListener(
    "change",
    function() {

        if (running) return;

        activeFilter = "all";

        renderNotes();


        const track =
            database[
                trackSelect.value
            ];


        if (track) {

            engineerCall(
                track.name,
                "Track selected. Push lap ready."
            );
        }
    }
);


// =====================================================
// AUDIO BUTTONS
// =====================================================

enableAudioBtn.addEventListener(
    "click",
    enableEngineerAudio
);


speakBtn.addEventListener(
    "click",
    function() {

        if (!audioEnabled) {

            engineerCall(
                "ENABLE AUDIO FIRST",
                "Press Enable Engineer Audio."
            );

            return;
        }


        engineerCall(
            "ENGINEER TEST",
            "Audio system is working."
        );


        speak(
            "Engineer test. Audio system is working."
        );
    }
);


// =====================================================
// MAIN BUTTONS
// =====================================================

startBtn.addEventListener(
    "click",
    startLap
);


pauseBtn.addEventListener(
    "click",
    togglePause
);


stopBtn.addEventListener(
    "click",
    stopLap
);


// =====================================================
// TARGET TIME
// =====================================================

[
    minutesEl,
    secondsEl,
    millisecondsEl
]
.forEach(
    input => {

        input.addEventListener(
            "change",
            function() {

                if (!running) {

                    engineerCall(
                        "TARGET UPDATED",
                        "Target " +
                        formatTime(
                            getTargetTime()
                        )
                    );
                }
            }
        );
    }
);


// =====================================================
// TIMING MODE
// =====================================================

timingMode.addEventListener(
    "change",
    function() {

        engineerCall(
            "TIMING MODE",
            timingMode.options[
                timingMode.selectedIndex
            ].text
        );
    }
);


// =====================================================
// STARTUP
// =====================================================

populateTracks();

renderNotes();

pauseBtn.disabled = true;

engineerCall(
    "PUSH LAP READY",
    "Select a track and set your target."
);

console.log(
    "Racing Engineer V5 loaded successfully."
);
