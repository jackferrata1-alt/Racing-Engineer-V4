// =====================================================
// RACING ENGINEER V4.3 ENGINE
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
// STORAGE
// =====================================================

const STORAGE_KEY =
    "racingEngineerV43";


function loadDatabase() {

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );

    if (saved) {

        try {

            return JSON.parse(saved);

        } catch (error) {

            console.error(
                "Could not load saved data",
                error
            );
        }
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


let database =
    loadDatabase();


function saveDatabase() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(database)
    );
}


// =====================================================
// TRACK SELECTOR
// =====================================================

function populateTracks() {

    trackSelect.innerHTML = "";

    Object.keys(database).forEach(
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
// TIME
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
        Math.floor(
            total / 60000
        );

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
        ms >= 0
            ? "+"
            : "-"
    ) +
    formatTime(
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
        new SpeechSynthesisUtterance(
            text
        );

    utterance.rate =
        1.05;

    utterance.pitch =
        1;

    utterance.volume =
        1;

    speechSynthesis.speak(
        utterance
    );
}


function engineerCall(
    main,
    detail = "",
    voice = true
) {

    callEl.textContent =
        main;

    subCallEl.textContent =
        detail;

    if (voice) {

        speak(
            `${main}. ${detail}`
        );
    }
}


// =====================================================
// EDITOR
// =====================================================

function renderNotes() {

    const key =
        trackSelect.value;

    const track =
        database[key];

    editingTrack.textContent =
        track.name;

    notesList.innerHTML = "";


    let notes =
        [...track.notes];


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

                <label>
                    TRIGGER
                </label>

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


    // SAVE

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
                    `${note.corner} — ${note.call}`,
                    false
                );
            }
        );


    // TEST

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


    // DELETE

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
// ADD NOTE
// =====================================================

addNoteBtn.addEventListener(
    "click",
    () => {

        const track =
            database[
                trackSelect.value
            ];

        track.notes.push({

            id:
                crypto.randomUUID(),

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
// NOTE TIMING
// =====================================================

function getTriggerTime(
    note
) {

    if (
        timingMode.value ===
        "percentage"
    ) {

        return (
            getTargetTime() *
            Number(note.time) /
            100
        );
    }


    return (
        Number(note.time) *
        1000
    );
}


// =====================================================
// LAP
// =====================================================

function startLap() {

    if (running) {
        return;
    }

    running =
        true;

    paused =
        false;

    pausedTime =
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

    pauseBtn.disabled =
        false;


    const track =
        database[
            trackSelect.value
        ];


    engineerCall(
        "PUSH LAP",
        `${track.name} — target ${formatTime(getTargetTime())}`
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


function triggerNotes(
    elapsed
) {

    const track =
        database[
            trackSelect.value
        ];


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


            const trigger =
                getTriggerTime(
                    note
                );


            if (
                elapsed >=
                trigger
            ) {

                triggeredNotes.add(
                    note.id
                );


                callEl.textContent =
                    note.call;

                subCallEl.textContent =
                    note.detail;


                if (
                    note.voice
                ) {

                    speak(
                        `${note.call}. ${note.detail}`
                    );
                }

            }

        }
    );
}


// =====================================================
// PAUSE
// =====================================================

pauseBtn.addEventListener(
    "click",
    () => {

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
                "Lap timer stopped."
            );

        } else {

            paused =
                false;

            pausedTime +=
                performance.now() -
                pauseStart;

            statusEl.textContent =
                "PUSH LAP";

            pauseBtn.textContent =
                "PAUSE";


            engineerCall(
                "RESUME",
                "Back on the push lap."
            );
        }
    }
);


// =====================================================
// STOP
// =====================================================

stopBtn.addEventListener(
    "click",
    () => {

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

        pauseBtn.textContent =
            "PAUSE";

        pauseBtn.disabled =
            true;


        engineerCall(
            "LAP COMPLETE",
            `${formatTime(elapsed)} — ${formatDelta(delta)}`
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
            ${lap}
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

            lapNumber =
                0;

            bestLap =
                null;

            bestLapEl.textContent =
                "--:--.---";
        }
    );


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
            "Track selected. Push lap ready.",
            false
        );
    }
);


// =====================================================
// TARGET CHANGE
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
                        `Target ${formatTime(getTargetTime())}`,
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


// =====================================================
// TEST ENGINEER
// =====================================================

speakBtn.addEventListener(
    "click",
    () => {

        engineerCall(
            "ENGINEER TEST",
            "Audio system is working."
        );
    }
);


// =====================================================
// HTML SAFETY
// =====================================================

function escapeHTML(
    value
) {

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
// STARTUP
// =====================================================

populateTracks();

renderNotes();

engineerCall(
    "PUSH LAP READY",
    "Select your track and target time.",
    false
);
