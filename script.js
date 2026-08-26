// =====================================================
// RACING ENGINEER V4.3 — STABLE LAP ENGINE
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

const STORAGE_KEY = "racingEngineerV43";


// =====================================================
// ELEMENTS
// =====================================================

const trackSelect = document.getElementById("trackSelect");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const speakBtn = document.getElementById("speakBtn");

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


// =====================================================
// DATABASE
// =====================================================

function loadDatabase() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (saved) {
            return JSON.parse(saved);
        }

    } catch (error) {

        console.error(
            "Database loading error:",
            error
        );
    }

    const copy =
        JSON.parse(
            JSON.stringify(TRACKS)
        );

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(copy)
    );

    return copy;
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
// TRACKS
// =====================================================

function populateTracks() {

    trackSelect.innerHTML = "";

    Object.keys(database).forEach(
        key => {

            const option =
                document.createElement("option");

            option.value = key;

            option.textContent =
                database[key].name;

            trackSelect.appendChild(option);
        }
    );
}


// =====================================================
// TARGET TIME
// =====================================================

function getTargetTime() {

    const minutes =
        Number(minutesEl.value) || 0;

    const seconds =
        Math.max(
            0,
            Math.min(
                59,
                Number(secondsEl.value) || 0
            )
        );

    const milliseconds =
        Math.max(
            0,
            Math.min(
                999,
                Number(millisecondsEl.value) || 0
            )
        );

    return (
        minutes * 60000 +
        seconds * 1000 +
        milliseconds
    );
}


// =====================================================
// TIME FORMAT
// =====================================================

function formatTime(ms) {

    if (!Number.isFinite(ms)) {
        return "--:--.---";
    }

    ms = Math.max(
        0,
        Math.floor(ms)
    );

    const minutes =
        Math.floor(ms / 60000);

    const seconds =
        Math.floor(
            (ms % 60000) / 1000
        );

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

    const sign =
        ms >= 0 ? "+" : "-";

    return (
        sign +
        formatTime(
            Math.abs(ms)
        )
    );
}


// =====================================================
// SPEECH
// =====================================================

function speak(text) {

    if (
        !window.speechSynthesis
    ) {
        return;
    }

    window.speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(
            String(text)
        );

    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(
        utterance
    );
}


function engineerCall(
    main,
    detail = "",
    voice = false
) {

    callEl.textContent =
        main;

    subCallEl.textContent =
        detail;

    if (voice) {

        speak(
            main +
            ". " +
            detail
        );
    }
}


// =====================================================
// START LAP
// =====================================================

function startLap() {

    console.log(
        "START BUTTON PRESSED"
    );

    if (running) {

        console.log(
            "Lap already running"
        );

        return;
    }


    // Make sure a track exists.

    if (
        !trackSelect.value ||
        !database[trackSelect.value]
    ) {

        engineerCall(
            "SELECT TRACK",
            "Choose a track before starting.",
            true
        );

        return;
    }


    // Reset lap state.

    running = true;

    paused = false;

    pausedTime = 0;

    pauseStart = 0;

    triggeredNotes = new Set();

    lapNumber++;


    // IMPORTANT:
    // Use performance.now() for a reliable timer.

    lapStart =
        performance.now();


    // Update interface.

    statusEl.textContent =
        "PUSH LAP";

    startBtn.textContent =
        "LAP RUNNING";

    startBtn.disabled =
        true;

    pauseBtn.disabled =
        false;


    const track =
        database[
            trackSelect.value
        ];


    engineerCall(
        "PUSH LAP",
        track.name +
        " — Target " +
        formatTime(
            getTargetTime()
        ),
        true
    );


    // Start the animation loop.

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


        currentLapEl.textContent =
            formatTime(
                elapsed
            );


        deltaEl.textContent =
            formatDelta(
                elapsed -
                getTargetTime()
            );


        triggerNotes(
            elapsed
        );
    }


    animationFrame =
        requestAnimationFrame(
            updateTimer
        );
}


// =====================================================
// TRIGGER NOTES
// =====================================================

function triggerNotes(elapsed) {

    const track =
        database[
            trackSelect.value
        ];


    if (!track) {
        return;
    }


    if (!Array.isArray(track.notes)) {
        return;
    }


    track.notes.forEach(
        note => {

            if (!note.enabled) {
                return;
            }


            if (
                triggeredNotes.has(
                    note.id
                )
            ) {
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


            if (
                elapsed >=
                triggerTime
            ) {

                triggeredNotes.add(
                    note.id
                );


                engineerCall(
                    note.call,
                    note.detail,
                    note.voice
                );
            }

        }
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

        paused = true;

        pauseStart =
            performance.now();

        statusEl.textContent =
            "PAUSED";

        pauseBtn.textContent =
            "RESUME";


        engineerCall(
            "PAUSED",
            "Lap timer stopped.",
            true
        );


    } else {

        paused = false;

        pausedTime +=
            performance.now() -
            pauseStart;

        pauseStart = 0;

        statusEl.textContent =
            "PUSH LAP";

        pauseBtn.textContent =
            "PAUSE";


        engineerCall(
            "RESUME",
            "Back on the push lap.",
            true
        );
    }
}


// =====================================================
// STOP LAP
// =====================================================

function stopLap() {

    if (!running) {
        return;
    }


    let endTime;


    if (paused) {

        endTime =
            pauseStart;

    } else {

        endTime =
            performance.now();
    }


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
        formatTime(
            elapsed
        );


    const delta =
        elapsed -
        getTargetTime();


    deltaEl.textContent =
        formatDelta(
            delta
        );


    const isBest =
        bestLap === null ||
        elapsed < bestLap;


    if (isBest) {

        bestLap =
            elapsed;

        bestLapEl.textContent =
            formatTime(
                bestLap
            );
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

    startBtn.disabled =
        false;

    pauseBtn.textContent =
        "PAUSE";

    pauseBtn.disabled =
        true;


    engineerCall(
        "LAP COMPLETE",
        formatTime(elapsed) +
        " — " +
        formatDelta(delta),
        true
    );
}


// =====================================================
// BUTTON CONNECTIONS
// =====================================================

// Explicitly connect the buttons.

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


speakBtn.addEventListener(
    "click",
    () => {

        engineerCall(
            "ENGINEER TEST",
            "Audio system is working.",
            true
        );
    }
);


// =====================================================
// TIME LOG
// =====================================================

function addLog(
    lap,
    time,
    delta,
    isBest
) {

    const empty =
        timeLog.querySelector(
            ".empty"
        );


    if (empty) {
        empty.remove();
    }


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "logRow";


    row.innerHTML = `

        <span>
            LAP ${lap}
        </span>

        <span>
            ${formatTime(time)}
        </span>

        <span>
            ${formatDelta(delta)}
        </span>

        <span>
            ${isBest ? "★ BEST" : ""}
        </span>
    `;


    timeLog.prepend(
        row
    );
}


// =====================================================
// CLEAR LOG
// =====================================================

document
    .getElementById("clearLog")
    .addEventListener(
        "click",
        () => {

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
// EDITOR
// =====================================================

function renderNotes() {

    const track =
        database[
            trackSelect.value
        ];


    if (!track) {
        return;
    }


    editingTrack.textContent =
        track.name;


    notesList.innerHTML = "";


    let notes =
        Array.isArray(track.notes)
            ? [...track.notes]
            : [];


    if (
        activeFilter !==
        "all"
    ) {

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
        note => {

            createNoteCard(
                track,
                note
            );
        }
    );
}


function createNoteCard(
    track,
    note
) {

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "noteCard";


    card.innerHTML = `

        <div class="noteTop">

            <div>
                <label>CORNER</label>

                <input
                    class="corner"
                    value="${escapeHTML(note.corner)}"
                >
            </div>

            <div>
                <label>TRIGGER</label>

                <input
                    class="time"
                    type="number"
                    step="0.1"
                    value="${note.time}"
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
                    ]
                    .map(
                        type => `
                            <option
                                value="${type}"
                                ${note.type === type ? "selected" : ""}
                            >
                                ${type}
                            </option>
                        `
                    )
                    .join("")}

                </select>
            </div>

        </div>


        <div class="noteMiddle">

            <div>
                <label>ENGINEER CALL</label>

                <input
                    class="call"
                    value="${escapeHTML(note.call)}"
                >
            </div>

            <div>
                <label>DETAIL</label>

                <input
                    class="detail"
                    value="${escapeHTML(note.detail)}"
                >
            </div>

            <div>
                <label>GEAR</label>

                <input
                    class="gear"
                    value="${escapeHTML(note.gear)}"
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
            card.querySelector(
                selector
            );


    get(".save")
        .addEventListener(
            "click",
            () => {

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

                renderNotes();

                engineerCall(
                    "CALL SAVED",
                    note.corner +
                    " — " +
                    note.call
                );
            }
        );


    get(".test")
        .addEventListener(
            "click",
            () => {

                engineerCall(
                    note.call,
                    note.detail,
                    true
                );
            }
        );


    get(".deleteNote")
        .addEventListener(
            "click",
            () => {

                track.notes =
                    track.notes.filter(
                        item =>
                            item.id !==
                            note.id
                    );

                saveDatabase();

                renderNotes();
            }
        );


    notesList.appendChild(
        card
    );
}


// =====================================================
// ADD CALL
// =====================================================

addNoteBtn.addEventListener(
    "click",
    () => {

        const track =
            database[
                trackSelect.value
            ];


        if (!track) {
            return;
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

        activeFilter =
            "all";

        updateFilterButtons();

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
                () => {

                    activeFilter =
                        button.dataset.filter;

                    updateFilterButtons();

                    renderNotes();
                }
            );
        }
    );


function updateFilterButtons() {

    document
        .querySelectorAll(".filter")
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.filter ===
                    activeFilter
                );
            }
        );
}


// =====================================================
// TRACK CHANGE
// =====================================================

trackSelect.addEventListener(
    "change",
    () => {

        if (running) {
            return;
        }


        activeFilter =
            "all";

        updateFilterButtons();

        renderNotes();


        const track =
            database[
                trackSelect.value
            ];


        engineerCall(
            track.name,
            "Track selected. Push lap ready."
        );
    }
);


// =====================================================
// TIMING MODE
// =====================================================

timingMode.addEventListener(
    "change",
    () => {

        engineerCall(
            "TIMING MODE",
            timingMode.options[
                timingMode.selectedIndex
            ].text
        );
    }
);


// =====================================================
// TARGET TIME
// =====================================================

[
    minutesEl,
    secondsEl,
    millisecondsEl
].forEach(
    input => {

        input.addEventListener(
            "change",
            () => {

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
// HTML ESCAPE
// =====================================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}


// =====================================================
// STARTUP
// =====================================================

populateTracks();

renderNotes();

engineerCall(
    "PUSH LAP READY",
    "Select your track and target time."
);

pauseBtn.disabled = true;

console.log(
    "Racing Engineer V4.3 loaded successfully."
);

window.startLap = startLap;
window.togglePause = togglePause;
window.stopLap = stopLap;
