// =====================================================
// RACING ENGINEER V4.4
// QUEST AUDIO + LAP ENGINE
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

const STORAGE_KEY = "racingEngineerV44";


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

const addNoteBtn =
    document.getElementById("addNoteBtn");

const currentLapEl =
    document.getElementById("currentLap");

const deltaEl =
    document.getElementById("delta");

const bestLapEl =
    document.getElementById("bestLap");

const statusEl =
    document.getElementById("status");

const callEl =
    document.getElementById("call");

const subCallEl =
    document.getElementById("subCall");

const notesList =
    document.getElementById("notesList");

const editingTrack =
    document.getElementById("editingTrack");

const timingMode =
    document.getElementById("timingMode");

const timeLog =
    document.getElementById("timeLog");

const minutesEl =
    document.getElementById("minutes");

const secondsEl =
    document.getElementById("seconds");

const millisecondsEl =
    document.getElementById("milliseconds");


// =====================================================
// QUEST AUDIO BUTTON
// =====================================================

let enableAudioBtn =
    document.getElementById("enableAudioBtn");


if (!enableAudioBtn) {

    enableAudioBtn =
        document.createElement("button");

    enableAudioBtn.id =
        "enableAudioBtn";

    enableAudioBtn.textContent =
        "ENABLE ENGINEER AUDIO";

    enableAudioBtn.className =
        "primary";

    const buttons =
        document.querySelector(".buttons");

    if (buttons) {

        buttons.appendChild(
            enableAudioBtn
        );
    }
}


// =====================================================
// AUDIO UNLOCK
// =====================================================

function enableEngineerAudio() {

    if (
        !("speechSynthesis" in window)
    ) {

        alert(
            "Speech synthesis is not available in this Quest browser."
        );

        statusEl.textContent =
            "AUDIO UNAVAILABLE";

        return;
    }


    try {

        speechSynthesis.cancel();


        const unlock =
            new SpeechSynthesisUtterance(
                "Engineer audio enabled."
            );


        unlock.volume = 1;
        unlock.rate = 1;
        unlock.pitch = 1;


        unlock.onstart = () => {

            audioEnabled = true;

            enableAudioBtn.textContent =
                "ENGINEER AUDIO ENABLED";

            enableAudioBtn.disabled =
                true;

            statusEl.textContent =
                "AUDIO READY";
        };


        unlock.onerror = error => {

            console.error(
                "Speech error:",
                error
            );

            audioEnabled = false;

            enableAudioBtn.textContent =
                "ENABLE ENGINEER AUDIO";
        };


        speechSynthesis.speak(
            unlock
        );


    } catch (error) {

        console.error(
            "Audio unlock failed:",
            error
        );
    }
}


enableAudioBtn.addEventListener(
    "click",
    enableEngineerAudio
);


// =====================================================
// SPEECH
// =====================================================

function speak(text) {

    if (!audioEnabled) {
        return;
    }


    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }


    try {

        speechSynthesis.cancel();


        const utterance =
            new SpeechSynthesisUtterance(
                String(text)
            );


        utterance.volume =
            1;

        utterance.rate =
            1.05;

        utterance.pitch =
            1;


        speechSynthesis.speak(
            utterance
        );


    } catch (error) {

        console.error(
            "Speech failed:",
            error
        );
    }
}


// =====================================================
// ENGINEER DISPLAY
// =====================================================

function engineerCall(
    main,
    detail = "",
    voice = false
) {

    if (callEl) {

        callEl.textContent =
            main;
    }


    if (subCallEl) {

        subCallEl.textContent =
            detail;
    }


    if (voice) {

        speak(
            main +
            ". " +
            detail
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
            "Database load error:",
            error
        );
    }


    const copy =
        JSON.parse(
            JSON.stringify(TRACKS)
        );


    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(copy)
        );

    } catch (error) {

        console.error(
            "Database save error:",
            error
        );
    }


    return copy;
}


let database =
    loadDatabase();


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
// TRACK SELECTOR
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
                    database[key].name;


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
            minutesEl?.value
        ) || 0;


    const seconds =
        Math.max(
            0,
            Math.min(
                59,
                Number(
                    secondsEl?.value
                ) || 0
            )
        );


    const milliseconds =
        Math.max(
            0,
            Math.min(
                999,
                Number(
                    millisecondsEl?.value
                ) || 0
            )
        );


    return (
        minutes * 60000 +
        seconds * 1000 +
        milliseconds
    );
}


// =====================================================
// FORMAT TIME
// =====================================================

function formatTime(ms) {

    if (
        !Number.isFinite(ms)
    ) {

        return "--:--.---";
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

    const sign =
        ms >= 0
            ? "+"
            : "-";


    return (
        sign +
        formatTime(
            Math.abs(ms)
        )
    );
}


// =====================================================
// START LAP
// =====================================================

function startLap() {

    console.log(
        "START PUSH LAP"
    );


    if (running) {
        return;
    }


    const selectedTrack =
        trackSelect?.value;


    if (
        !selectedTrack ||
        !database[selectedTrack]
    ) {

        engineerCall(
            "SELECT TRACK",
            "Choose a track first.",
            true
        );

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


    statusEl.textContent =
        "PUSH LAP";


    startBtn.textContent =
        "LAP RUNNING";


    startBtn.disabled =
        true;


    pauseBtn.disabled =
        false;


    const track =
        database[selectedTrack];


    engineerCall(
        "PUSH LAP",
        track.name +
        " — Target " +
        formatTime(
            getTargetTime()
        ),
        true
    );


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
// NOTE TRIGGERING
// =====================================================

function triggerNotes(
    elapsed
) {

    const track =
        database[
            trackSelect.value
        ];


    if (
        !track ||
        !Array.isArray(
            track.notes
        )
    ) {

        return;
    }


    track.notes.forEach(
        note => {

            if (
                !note.enabled
            ) {

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

        paused =
            true;


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

        paused =
            false;


        pausedTime +=
            performance.now() -
            pauseStart;


        pauseStart =
            0;


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
// STOP
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


    running =
        false;


    paused =
        false;


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
// TIME LOG
// =====================================================

function addLog(
    lap,
    time,
    delta,
    isBest
) {

    if (!timeLog) {
        return;
    }


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

const clearLog =
    document.getElementById(
        "clearLog"
    );


if (clearLog) {

    clearLog.addEventListener(
        "click",
        () => {

            timeLog.innerHTML = `
                <div class="empty">
                    No completed laps.
                </div>
            `;


            lapNumber =
                0;


            bestLap =
                null;


            bestLapEl.textContent =
                "--:--.---";
        }
    );
}


// =====================================================
// TRACK EDITOR
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


    notesList.innerHTML =
        "";


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


// =====================================================
// NOTE CARD
// =====================================================

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
                                ${
                                    note.type === type
                                        ? "selected"
                                        : ""
                                }
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
                        ${
                            note.enabled
                                ? "selected"
                                : ""
                        }
                    >
                        ON
                    </option>

                    <option
                        value="false"
                        ${
                            !note.enabled
                                ? "selected"
                                : ""
                        }
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
                        ${
                            note.voice
                                ? "selected"
                                : ""
                        }
                    >
                        ON
                    </option>

                    <option
                        value="false"
                        ${
                            !note.voice
                                ? "selected"
                                : ""
                        }
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


    get(".save").addEventListener(
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
                note.call,
                false
            );
        }
    );


    get(".test").addEventListener(
        "click",
        () => {

            if (!audioEnabled) {

                engineerCall(
                    "ENABLE AUDIO FIRST",
                    "Press Enable Engineer Audio.",
                    false
                );

                return;
            }


            engineerCall(
                note.call,
                note.detail,
                true
            );
        }
    );


    get(".deleteNote").addEventListener(
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
// ADD NOTE
// =====================================================

if (addNoteBtn) {

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


            activeFilter =
                "all";


            updateFilterButtons();

            renderNotes();
        }
    );
}


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

if (trackSelect) {

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
                "Track selected. Push lap ready.",
                false
            );
        }
    );
}


// =====================================================
// TARGET TIME
// =====================================================

[
    minutesEl,
    secondsEl,
    millisecondsEl
]
.filter(Boolean)
.forEach(
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
                        ),
                        false
                    );
                }
            }
        );
    }
);


// =====================================================
// TIMING MODE
// =====================================================

if (timingMode) {

    timingMode.addEventListener(
        "change",
        () => {

            engineerCall(
                "TIMING MODE",
                timingMode.options[
                    timingMode.selectedIndex
                ].text,
                false
            );
        }
    );
}


// =====================================================
// BUTTONS
// =====================================================

if (startBtn) {

    startBtn.addEventListener(
        "click",
        startLap
    );
}


if (pauseBtn) {

    pauseBtn.addEventListener(
        "click",
        togglePause
    );
}


if (stopBtn) {

    stopBtn.addEventListener(
        "click",
        stopLap
    );
}


if (speakBtn) {

    speakBtn.addEventListener(
        "click",
        () => {

            if (!audioEnabled) {

                engineerCall(
                    "ENABLE AUDIO FIRST",
                    "Press Enable Engineer Audio.",
                    false
                );

                return;
            }


            engineerCall(
                "ENGINEER TEST",
                "Audio system is working.",
                true
            );
        }
    );
}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        );
}


// =====================================================
// GLOBAL FUNCTIONS
// =====================================================

window.startLap =
    startLap;

window.togglePause =
    togglePause;

window.stopLap =
    stopLap;

window.enableEngineerAudio =
    enableEngineerAudio;


// =====================================================
// STARTUP
// =====================================================

try {

    populateTracks();

    renderNotes();

    if (pauseBtn) {
        pauseBtn.disabled = true;
    }

    engineerCall(
        "PUSH LAP READY",
        "Enable audio, select a track and set your target.",
        false
    );

    console.log(
        "Racing Engineer V4.4 loaded."
    );

} catch (error) {

    console.error(
        "Startup error:",
        error
    );
}
