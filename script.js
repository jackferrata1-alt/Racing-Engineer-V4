// =====================================================
// RACING ENGINEER V4.5
// PERSONAL VOICE ENGINEER
// =====================================================

"use strict";


// =====================================================
// CORE STATE
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

let mediaRecorder = null;
let recordingChunks = [];
let recordingNoteId = null;
let recordingStream = null;

let playingAudio = null;


// =====================================================
// STORAGE
// =====================================================

const STORAGE_KEY = "racingEngineerV45";

const VOICE_DB_NAME = "racingEngineerVoiceV45";

const VOICE_STORE_NAME = "recordings";


// =====================================================
// ELEMENT HELPER
// =====================================================

function $(id) {
    return document.getElementById(id);
}


// =====================================================
// ELEMENTS
// =====================================================

const trackSelect = $("trackSelect");
const startBtn = $("startBtn");
const pauseBtn = $("pauseBtn");
const stopBtn = $("stopBtn");
const speakBtn = $("speakBtn");
const addNoteBtn = $("addNoteBtn");

const currentLapEl = $("currentLap");
const deltaEl = $("delta");
const bestLapEl = $("bestLap");

const statusEl = $("status");
const callEl = $("call");
const subCallEl = $("subCall");

const notesList = $("notesList");
const editingTrack = $("editingTrack");

const timingMode = $("timingMode");
const timeLog = $("timeLog");

const minutesEl = $("minutes");
const secondsEl = $("seconds");
const millisecondsEl = $("milliseconds");


// =====================================================
// AUDIO ENABLE BUTTON
// =====================================================

let enableAudioBtn = $("enableAudioBtn");

if (!enableAudioBtn) {

    const buttons =
        document.querySelector(".buttons");

    if (buttons) {

        enableAudioBtn =
            document.createElement("button");

        enableAudioBtn.id =
            "enableAudioBtn";

        enableAudioBtn.className =
            "primary";

        enableAudioBtn.textContent =
            "ENABLE ENGINEER AUDIO";

        buttons.appendChild(
            enableAudioBtn
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
// AUDIO ENABLE
// =====================================================

function enableEngineerAudio() {

    audioEnabled = true;

    if (enableAudioBtn) {

        enableAudioBtn.textContent =
            "ENGINEER AUDIO ENABLED";

        enableAudioBtn.disabled =
            true;
    }

    if (statusEl) {
        statusEl.textContent =
            "AUDIO READY";
    }

    engineerCall(
        "AUDIO READY",
        "Voice recording and playback are ready."
    );
}


// =====================================================
// VOICE DATABASE
// =====================================================

function openVoiceDatabase() {

    return new Promise(
        function(resolve, reject) {

            if (!("indexedDB" in window)) {

                reject(
                    new Error(
                        "IndexedDB unavailable"
                    )
                );

                return;
            }

            const request =
                indexedDB.open(
                    VOICE_DB_NAME,
                    1
                );

            request.onupgradeneeded =
                function(event) {

                    const db =
                        event.target.result;

                    if (
                        !db.objectStoreNames.contains(
                            VOICE_STORE_NAME
                        )
                    ) {

                        db.createObjectStore(
                            VOICE_STORE_NAME
                        );
                    }
                };

            request.onsuccess =
                function() {

                    resolve(
                        request.result
                    );
                };

            request.onerror =
                function() {

                    reject(
                        request.error
                    );
                };
        }
    );
}


// =====================================================
// SAVE RECORDING
// =====================================================

async function saveVoice(noteId, blob) {

    const db =
        await openVoiceDatabase();

    return new Promise(
        function(resolve, reject) {

            const transaction =
                db.transaction(
                    VOICE_STORE_NAME,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    VOICE_STORE_NAME
                );

            store.put(
                blob,
                String(noteId)
            );

            transaction.oncomplete =
                function() {

                    resolve();
                };

            transaction.onerror =
                function() {

                    reject(
                        transaction.error
                    );
                };
        }
    );
}


// =====================================================
// GET RECORDING
// =====================================================

async function getVoice(noteId) {

    const db =
        await openVoiceDatabase();

    return new Promise(
        function(resolve, reject) {

            const transaction =
                db.transaction(
                    VOICE_STORE_NAME,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    VOICE_STORE_NAME
                );

            const request =
                store.get(
                    String(noteId)
                );

            request.onsuccess =
                function() {

                    resolve(
                        request.result || null
                    );
                };

            request.onerror =
                function() {

                    reject(
                        request.error
                    );
                };
        }
    );
}


// =====================================================
// DELETE RECORDING
// =====================================================

async function deleteVoice(noteId) {

    const db =
        await openVoiceDatabase();

    return new Promise(
        function(resolve, reject) {

            const transaction =
                db.transaction(
                    VOICE_STORE_NAME,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    VOICE_STORE_NAME
                );

            store.delete(
                String(noteId)
            );

            transaction.oncomplete =
                function() {

                    resolve();
                };

            transaction.onerror =
                function() {

                    reject(
                        transaction.error
                    );
                };
        }
    );
}


// =====================================================
// RECORD VOICE
// =====================================================

async function recordVoice(noteId, button) {

    if (mediaRecorder) {

        if (
            recordingNoteId ===
            String(noteId)
        ) {

            stopRecording();

        } else {

            engineerCall(
                "RECORDING ACTIVE",
                "Stop the current recording first."
            );
        }

        return;
    }


    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        engineerCall(
            "MICROPHONE UNAVAILABLE",
            "This browser cannot access the microphone."
        );

        return;
    }


    try {

        recordingStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });


        recordingChunks = [];

        recordingNoteId =
            String(noteId);


        let options = {};

        if (
            typeof MediaRecorder !==
            "undefined"
        ) {

            if (
                MediaRecorder.isTypeSupported(
                    "audio/webm;codecs=opus"
                )
            ) {

                options.mimeType =
                    "audio/webm;codecs=opus";

            } else if (
                MediaRecorder.isTypeSupported(
                    "audio/webm"
                )
            ) {

                options.mimeType =
                    "audio/webm";
            }

        } else {

            throw new Error(
                "MediaRecorder unavailable"
            );
        }


        mediaRecorder =
            new MediaRecorder(
                recordingStream,
                options
            );


        mediaRecorder.ondataavailable =
            function(event) {

                if (
                    event.data &&
                    event.data.size > 0
                ) {

                    recordingChunks.push(
                        event.data
                    );
                }
            };


        mediaRecorder.onstop =
            async function() {

                try {

                    const blob =
                        new Blob(
                            recordingChunks,
                            {
                                type:
                                    mediaRecorder.mimeType ||
                                    "audio/webm"
                            }
                        );


                    await saveVoice(
                        recordingNoteId,
                        blob
                    );


                    engineerCall(
                        "VOICE SAVED",
                        "Your personal engineer call is ready."
                    );


                } catch (error) {

                    console.error(
                        "Voice save error:",
                        error
                    );

                    engineerCall(
                        "VOICE SAVE ERROR",
                        "The recording could not be saved."
                    );
                }


                if (recordingStream) {

                    recordingStream
                        .getTracks()
                        .forEach(
                            function(track) {

                                track.stop();
                            }
                        );
                }


                recordingStream = null;
                recordingChunks = [];
                recordingNoteId = null;
                mediaRecorder = null;


                renderNotes();
            };


        mediaRecorder.start();


        button.textContent =
            "STOP RECORDING";


        engineerCall(
            "RECORDING",
            "Say your engineer call now..."
        );


        if (statusEl) {

            statusEl.textContent =
                "RECORDING";
        }


    } catch (error) {

        console.error(
            "Microphone error:",
            error
        );


        if (recordingStream) {

            recordingStream
                .getTracks()
                .forEach(
                    function(track) {

                        track.stop();
                    }
                );
        }


        recordingStream = null;
        mediaRecorder = null;
        recordingNoteId = null;


        engineerCall(
            "MICROPHONE ERROR",
            "Microphone permission was denied or unavailable."
        );
    }
}


// =====================================================
// STOP RECORDING
// =====================================================

function stopRecording() {

    if (
        mediaRecorder &&
        mediaRecorder.state !==
            "inactive"
    ) {

        mediaRecorder.stop();
    }
}


// =====================================================
// PLAY PERSONAL VOICE
// =====================================================

async function playVoice(noteId) {

    try {

        const blob =
            await getVoice(noteId);


        if (!blob) {

            engineerCall(
                "NO RECORDING",
                "Record your voice for this call first."
            );

            return;
        }


        if (playingAudio) {

            playingAudio.pause();

            playingAudio.currentTime = 0;

            playingAudio = null;
        }


        const url =
            URL.createObjectURL(
                blob
            );


        const audio =
            new Audio(url);


        playingAudio =
            audio;


        audio.volume = 1;


        audio.onended =
            function() {

                URL.revokeObjectURL(
                    url
                );

                if (
                    playingAudio ===
                    audio
                ) {

                    playingAudio = null;
                }
            };


        await audio.play();


    } catch (error) {

        console.error(
            "Voice playback error:",
            error
        );

        engineerCall(
            "PLAYBACK ERROR",
            "The recording could not be played."
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
            JSON.stringify(
                TRACKS
            )
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
// TRACKS
// =====================================================

function populateTracks() {

    if (!trackSelect) {
        return;
    }


    trackSelect.innerHTML = "";


    Object.keys(database).forEach(
        function(key) {

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
            minutesEl ? minutesEl.value : 0
        ) || 0;

    const seconds =
        Math.max(
            0,
            Math.min(
                59,
                Number(
                    secondsEl ?
                    secondsEl.value :
                    0
                ) || 0
            )
        );

    const milliseconds =
        Math.max(
            0,
            Math.min(
                999,
                Number(
                    millisecondsEl ?
                    millisecondsEl.value :
                    0
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
// FORMAT
// =====================================================

function formatTime(ms) {

    if (!Number.isFinite(ms)) {

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
        ms >= 0 ? "+" : "-";


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

    if (running) {
        return;
    }


    if (
        !trackSelect ||
        !trackSelect.value ||
        !database[
            trackSelect.value
        ]
    ) {

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

        startBtn.textContent =
            "LAP RUNNING";

        startBtn.disabled =
            true;
    }


    if (pauseBtn) {

        pauseBtn.disabled =
            false;
    }


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
        )
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


    if (
        !track ||
        !Array.isArray(
            track.notes
        )
    ) {

        return;
    }


    track.notes.forEach(
        function(note) {

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
                timingMode &&
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
                    note.detail
                );


                if (
                    note.voice
                ) {

                    playVoice(
                        note.id
                    );
                }
            }
        }
    );
}


// =====================================================
// PAUSE
// =====================================================

function togglePause() {

    if (!running) {
        return;
    }


    if (!paused) {

        paused = true;

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


        if (playingAudio) {

            playingAudio.pause();
        }


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


        if (statusEl) {

            statusEl.textContent =
                "PUSH LAP";
        }


        if (pauseBtn) {

            pauseBtn.textContent =
                "PAUSE";
        }


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


    if (playingAudio) {

        playingAudio.pause();

        playingAudio.currentTime = 0;

        playingAudio = null;
    }


    if (currentLapEl) {

        currentLapEl.textContent =
            formatTime(
                elapsed
            );
    }


    const delta =
        elapsed -
        getTargetTime();


    if (deltaEl) {

        deltaEl.textContent =
            formatDelta(
                delta
            );
    }


    const isBest =
        bestLap === null ||
        elapsed < bestLap;


    if (isBest) {

        bestLap =
            elapsed;


        if (bestLapEl) {

            bestLapEl.textContent =
                formatTime(
                    bestLap
                );
        }
    }


    addLog(
        lapNumber,
        elapsed,
        delta,
        isBest
    );


    if (statusEl) {

        statusEl.textContent =
            "READY";
    }


    if (startBtn) {

        startBtn.textContent =
            "START PUSH LAP";

        startBtn.disabled =
            false;
    }


    if (pauseBtn) {

        pauseBtn.textContent =
            "PAUSE";

        pauseBtn.disabled =
            true;
    }


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
        <span>LAP ${lap}</span>
        <span>${formatTime(time)}</span>
        <span>${formatDelta(delta)}</span>
        <span>${isBest ? "★ BEST" : ""}</span>
    `;


    timeLog.prepend(
        row
    );
}


// =====================================================
// CLEAR LOG
// =====================================================

const clearLog =
    $("clearLog");


if (clearLog) {

    clearLog.addEventListener(
        "click",
        function() {

            if (timeLog) {

                timeLog.innerHTML = `
                    <div class="empty">
                        No completed laps.
                    </div>
                `;
            }


            lapNumber = 0;

            bestLap = null;


            if (bestLapEl) {

                bestLapEl.textContent =
                    "--:--.---";
            }
        }
    );
}


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
// NOTE EDITOR
// =====================================================

async function renderNotes() {

    if (!notesList || !trackSelect) {
        return;
    }


    const track =
        database[
            trackSelect.value
        ];


    if (!track) {
        return;
    }


    if (editingTrack) {

        editingTrack.textContent =
            track.name;
    }


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
                function(note) {

                    return (
                        note.type ===
                        activeFilter
                    );
                }
            );
    }


    notes.sort(
        function(a, b) {

            return (
                Number(a.time) -
                Number(b.time)
            );
        }
    );


    if (!notes.length) {

        notesList.innerHTML = `
            <div class="empty">
                No calls match this filter.
            </div>
        `;

        return;
    }


    for (
        const note of notes
    ) {

        await createNoteCard(
            track,
            note
        );
    }
}


// =====================================================
// NOTE CARD
// =====================================================

async function createNoteCard(
    track,
    note
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "noteCard";


    let hasRecording = false;


    try {

        hasRecording =
            !!(
                await getVoice(
                    note.id
                )
            );

    } catch (error) {

        console.warn(
            "Could not check recording:",
            error
        );
    }


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
                        function(type) {

                            return `
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
                            `;
                        }
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


        <div class="voiceStatus">

            ${
                hasRecording
                    ? "🎙 VOICE RECORDED"
                    : "🎙 NO VOICE RECORDED"
            }

        </div>


        <div class="noteActions">

            <button class="recordVoice">
                🎙 RECORD VOICE
            </button>

            <button class="testVoice">
                ▶ TEST VOICE
            </button>

            <button class="deleteVoice">
                DELETE VOICE
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
        function(selector) {

            return card.querySelector(
                selector
            );
        };


    // -------------------------------------------------
    // RECORD
    // -------------------------------------------------

    get(".recordVoice")
        .addEventListener(
            "click",
            function() {

                recordVoice(
                    note.id,
                    get(".recordVoice")
                );
            }
        );


    // -------------------------------------------------
    // TEST
    // -------------------------------------------------

    get(".testVoice")
        .addEventListener(
            "click",
            function() {

                playVoice(
                    note.id
                );
            }
        );


    // -------------------------------------------------
    // DELETE VOICE
    // -------------------------------------------------

    get(".deleteVoice")
        .addEventListener(
            "click",
            async function() {

                try {

                    await deleteVoice(
                        note.id
                    );


                    engineerCall(
                        "VOICE DELETED",
                        "Recording removed."
                    );


                    renderNotes();

                } catch (error) {

                    console.error(
                        error
                    );
                }
            }
        );


    // -------------------------------------------------
    // SAVE
    // -------------------------------------------------

    get(".save")
        .addEventListener(
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


    // -------------------------------------------------
    // DELETE NOTE
    // -------------------------------------------------

    get(".deleteNote")
        .addEventListener(
            "click",
            async function() {

                try {

                    await deleteVoice(
                        note.id
                    );

                } catch (error) {

                    console.warn(
                        error
                    );
                }


                track.notes =
                    track.notes.filter(
                        function(item) {

                            return (
                                item.id !==
                                note.id
                            );
                        }
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
        function() {

            const track =
                database[
                    trackSelect.value
                ];


            if (!track) {
                return;
            }


            if (
                !Array.isArray(
                    track.notes
                )
            ) {

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
}


// =====================================================
// FILTERS
// =====================================================

document
    .querySelectorAll(".filter")
    .forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

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
            function(button) {

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
        function() {

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


            if (track) {

                engineerCall(
                    track.name,
                    "Track selected. Push lap ready."
                );
            }
        }
    );
}


// =====================================================
// TARGET CHANGES
// =====================================================

[
    minutesEl,
    secondsEl,
    millisecondsEl
]
.filter(Boolean)
.forEach(
    function(input) {

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

if (timingMode) {

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
}


// =====================================================
// MAIN BUTTONS
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
        function() {

            engineerCall(
                "VOICE SYSTEM",
                "Use RECORD VOICE on a call to create your engineer audio."
            );
        }
    );
}


if (enableAudioBtn) {

    enableAudioBtn.addEventListener(
        "click",
        enableEngineerAudio
    );
}


// =====================================================
// GLOBALS
// =====================================================

window.startLap =
    startLap;

window.togglePause =
    togglePause;

window.stopLap =
    stopLap;

window.enableEngineerAudio =
    enableEngineerAudio;

window.stopRecording =
    stopRecording;


// =====================================================
// STARTUP
// =====================================================

try {

    populateTracks();

    renderNotes();


    if (pauseBtn) {

        pauseBtn.disabled =
            true;
    }


    engineerCall(
        "PUSH LAP READY",
        "Select a track and set your target."
    );


    console.log(
        "Racing Engineer V4.5 loaded successfully."
    );

} catch (error) {

    console.error(
        "Racing Engineer startup error:",
        error
    );


    if (statusEl) {

        statusEl.textContent =
            "ERROR";
    }
                }
