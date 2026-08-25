// =====================================================
// RACING ENGINEER V4.2
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


// =====================================================
// ELEMENTS
// =====================================================

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const speakBtn = document.getElementById("speakBtn");

const currentLapEl = document.getElementById("currentLap");
const deltaEl = document.getElementById("delta");
const bestLapEl = document.getElementById("bestLap");

const statusEl = document.getElementById("status");
const callEl = document.getElementById("call");
const subCallEl = document.getElementById("subCall");

const trackSelect = document.getElementById("trackSelect");

const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const millisecondsEl = document.getElementById("milliseconds");

const notesList = document.getElementById("notesList");
const addNoteBtn = document.getElementById("addNoteBtn");

const editingTrack = document.getElementById("editingTrack");
const timingMode = document.getElementById("timingMode");

const timeLog = document.getElementById("timeLog");


// =====================================================
// DEFAULT NOTES
// =====================================================

const defaultNotes = {

    spa: [
        {
            id: crypto.randomUUID(),
            corner: "T1",
            time: 18.2,
            call: "BRAKE HARD",
            detail: "100 meter board",
            gear: "3",
            enabled: true,
            voice: true
        },

        {
            id: crypto.randomUUID(),
            corner: "T2",
            time: 22.4,
            call: "TURN LEFT",
            detail: "Late apex",
            gear: "3",
            enabled: true,
            voice: true
        },

        {
            id: crypto.randomUUID(),
            corner: "T3",
            time: 25.8,
            call: "RIGHT HANDER",
            detail: "Build throttle",
            gear: "4",
            enabled: true,
            voice: true
        }
    ],

    bahrain: [],
    jeddah: [],
    australia: [],
    japan: [],
    miami: [],
    imola: [],
    monaco: [],
    canada: [],
    austria: [],
    britain: [],
    hungary: [],
    belgium: [],
    netherlands: [],
    italy: [],
    azerbaijan: [],
    singapore: [],
    usa: [],
    mexico: [],
    brazil: [],
    lasvegas: [],
    qatar: [],
    abudhabi: []
};


// =====================================================
// STORAGE
// =====================================================

function loadNotes() {

    const saved =
        localStorage.getItem(
            "racingEngineerNotesV42"
        );

    if (saved) {

        return JSON.parse(saved);

    }

    return defaultNotes;
}


let notesDatabase = loadNotes();


function saveNotes() {

    localStorage.setItem(
        "racingEngineerNotesV42",
        JSON.stringify(notesDatabase)
    );
}


// =====================================================
// TIME
// =====================================================

function getTargetTime() {

    const minutes =
        Number(minutesEl.value) || 0;

    const seconds =
        Math.min(
            59,
            Math.max(
                0,
                Number(secondsEl.value) || 0
            )
        );

    const milliseconds =
        Math.min(
            999,
            Math.max(
                0,
                Number(millisecondsEl.value) || 0
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

    const total =
        Math.max(
            0,
            Math.floor(ms)
        );

    const minutes =
        Math.floor(total / 60000);

    const seconds =
        Math.floor(
            (total % 60000) / 1000
        );

    const milliseconds =
        total % 1000;

    return (
        `${minutes}:` +
        `${String(seconds).padStart(2, "0")}.` +
        `${String(milliseconds).padStart(3, "0")}`
    );
}


function formatDelta(ms) {

    return (
        ms >= 0 ? "+" : "-"
    ) + formatTime(
        Math.abs(ms)
    );
}


// =====================================================
// SPEECH
// =====================================================

function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }

    speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.volume = 1;

    speechSynthesis.speak(
        utterance
    );
}


function engineerCall(
    main,
    sub = "",
    shouldSpeak = true
) {

    callEl.textContent =
        main;

    subCallEl.textContent =
        sub;

    if (shouldSpeak) {

        speak(
            `${main}. ${sub}`
        );
    }
}


// =====================================================
// NOTE EDITOR
// =====================================================

function renderNotes() {

    const track =
        trackSelect.value;

    const notes =
        notesDatabase[track] || [];

    editingTrack.textContent =
        trackSelect.options[
            trackSelect.selectedIndex
        ].text;

    notesList.innerHTML = "";

    if (!notes.length) {

        notesList.innerHTML = `
            <div class="empty">
                No custom notes yet.
                Press "+ ADD NOTE".
            </div>
        `;

        return;
    }


    notes
        .sort(
            (a, b) =>
                Number(a.time) -
                Number(b.time)
        )
        .forEach(note => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "noteCard";

            card.innerHTML = `

                <div class="noteTop">

                    <div class="noteField">

                        <label>CORNER</label>

                        <input
                            class="noteCorner"
                            value="${escapeHTML(note.corner)}"
                        >

                    </div>


                    <div class="noteField">

                        <label>
                            TRIGGER TIME / %
                        </label>

                        <input
                            type="number"
                            step="0.1"
                            class="noteTime"
                            value="${note.time}"
                        >

                    </div>


                    <div class="noteField">

                        <label>GEAR</label>

                        <input
                            class="noteGear"
                            value="${escapeHTML(note.gear)}"
                        >

                    </div>

                </div>


                <div class="noteMiddle">

                    <div class="noteField">

                        <label>ENGINEER CALL</label>

                        <input
                            class="noteCall"
                            value="${escapeHTML(note.call)}"
                        >

                    </div>


                    <div class="noteField">

                        <label>DETAIL</label>

                        <input
                            class="noteDetail"
                            value="${escapeHTML(note.detail)}"
                        >

                    </div>


                    <div class="noteField">

                        <label>ENABLED</label>

                        <select class="noteEnabled">

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

                </div>


                <div class="noteActions">

                    <label>
                        <input
                            type="checkbox"
                            class="noteVoice"
                            ${note.voice ? "checked" : ""}
                        >
                        Voice
                    </label>

                    <button
                        class="testNote"
                    >
                        TEST
                    </button>

                    <button
                        class="saveNote primary"
                    >
                        SAVE
                    </button>

                    <button
                        class="deleteNote"
                    >
                        DELETE
                    </button>

                </div>
            `;


            // SAVE

            card
                .querySelector(
                    ".saveNote"
                )
                .addEventListener(
                    "click",
                    () => {

                        note.corner =
                            card.querySelector(
                                ".noteCorner"
                            ).value;

                        note.time =
                            Number(
                                card.querySelector(
                                    ".noteTime"
                                ).value
                            ) || 0;

                        note.gear =
                            card.querySelector(
                                ".noteGear"
                            ).value;

                        note.call =
                            card.querySelector(
                                ".noteCall"
                            ).value;

                        note.detail =
                            card.querySelector(
                                ".noteDetail"
                            ).value;

                        note.enabled =
                            card.querySelector(
                                ".noteEnabled"
                            ).value === "true";

                        note.voice =
                            card.querySelector(
                                ".noteVoice"
                            ).checked;

                        saveNotes();

                        renderNotes();

                        engineerCall(
                            "NOTE SAVED",
                            `${note.corner} — ${note.call}`,
                            false
                        );
                    }
                );


            // DELETE

            card
                .querySelector(
                    ".deleteNote"
                )
                .addEventListener(
                    "click",
                    () => {

                        notesDatabase[
                            track
                        ] =
                            notesDatabase[
                                track
                            ].filter(
                                n =>
                                    n.id !==
                                    note.id
                            );

                        saveNotes();

                        renderNotes();
                    }
                );


            // TEST

            card
                .querySelector(
                    ".testNote"
                )
                .addEventListener(
                    "click",
                    () => {

                        const text =
                            `${note.call}. ${note.detail}`;

                        engineerCall(
                            note.call,
                            note.detail
                        );
                    }
                );


            notesList.appendChild(
                card
            );
        });
}


function addNote() {

    const track =
        trackSelect.value;

    if (!notesDatabase[track]) {
        notesDatabase[track] = [];
    }

    notesDatabase[track].push({

        id:
            crypto.randomUUID(),

        corner:
            "T1",

        time:
            10,

        call:
            "CUSTOM CALL",

        detail:
            "Your note here",

        gear:
            "3",

        enabled:
            true,

        voice:
            true
    });

    saveNotes();

    renderNotes();
}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}


// =====================================================
// LAP ENGINE
// =====================================================

function startLap() {

    if (running) {
        return;
    }

    running = true;

    paused = false;

    pausedTime = 0;

    pauseStart = 0;

    triggeredNotes =
        new Set();

    lapNumber++;

    lapStart =
        performance.now();

    statusEl.textContent =
        "PUSH LAP";

    startBtn.textContent =
        "LAP RUNNING";

    pauseBtn.disabled =
        false;

    const trackName =
        trackSelect.options[
            trackSelect.selectedIndex
        ].text;

    engineerCall(
        "PUSH LAP",
        `${trackName} — target ${formatTime(getTargetTime())}`
    );

    updateTimer();
}


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
            formatTime(elapsed);

        deltaEl.textContent =
            formatDelta(
                elapsed -
                getTargetTime()
            );

        checkNotes(
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

function checkNotes(elapsed) {

    const track =
        trackSelect.value;

    const notes =
        notesDatabase[track] || [];

    const target =
        getTargetTime();

    notes.forEach(note => {

        if (!note.enabled) {
            return;
        }

        let triggerTime;

        if (
            timingMode.value ===
            "percentage"
        ) {

            triggerTime =
                target *
                (Number(note.time) / 100);

        } else {

            triggerTime =
                Number(note.time) *
                1000;
        }


        if (
            elapsed >= triggerTime &&
            !triggeredNotes.has(note.id)
        ) {

            triggeredNotes.add(
                note.id
            );

            const message =
                `${note.call}. ${note.detail}`;

            callEl.textContent =
                note.call;

            subCallEl.textContent =
                note.detail ||
                `Gear ${note.gear}`;

            if (note.voice) {
                speak(message);
            }

        }

    });
}


function pauseLap() {

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
            "Lap timer stopped."
        );

    } else {

        paused = false;

        pausedTime +=
            performance.now() -
            pauseStart;

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


function stopLap() {

    if (!running) {
        return;
    }

    const elapsed =
        paused
            ? pauseStart -
              lapStart -
              pausedTime

            : performance.now() -
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

        bestLap =
            elapsed;

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

    pauseBtn.textContent =
        "PAUSE";

    pauseBtn.disabled =
        true;

    engineerCall(
        "LAP COMPLETE",
        `${formatTime(elapsed)} — ${formatDelta(delta)}`
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
        <span>${lap}</span>
        <span>${formatTime(time)}</span>
        <span>${formatDelta(delta)}</span>
        <span>${isBest ? "★ BEST" : ""}</span>
    `;

    timeLog.prepend(row);
}


// =====================================================
// BUTTONS
// =====================================================

startBtn.addEventListener(
    "click",
    startLap
);

pauseBtn.addEventListener(
    "click",
    pauseLap
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
            "Audio system is working."
        );
    }
);

addNoteBtn.addEventListener(
    "click",
    addNote
);

trackSelect.addEventListener(
    "change",
    () => {

        if (!running) {

            renderNotes();

            const name =
                trackSelect.options[
                    trackSelect.selectedIndex
                ].text;

            engineerCall(
                name,
                "Track selected.",
                false
            );
        }
    }
);

timingMode.addEventListener(
    "change",
    renderNotes
);


document
    .getElementById("clearLog")
    .addEventListener(
        "click",
        () => {

            timeLog.innerHTML =
                `<div class="empty">
                    No completed laps.
                </div>`;

            lapNumber = 0;

            bestLap = null;

            bestLapEl.textContent =
                "--:--.---";
        }
    );


// =====================================================
// INITIALIZE
// =====================================================

renderNotes();

engineerCall(
    "PUSH LAP READY",
    "Configure your notes below.",
    false
);
