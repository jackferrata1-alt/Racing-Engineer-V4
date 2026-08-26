// =====================================================
// RACING ENGINEER V4.5
// PERSONAL VOICE ENGINEER
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

let activeAudio = null;

const STORAGE_KEY = "racingEngineerV45";

const VOICE_DB_NAME = "RacingEngineerVoiceV45";
const VOICE_STORE_NAME = "recordings";


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
// AUDIO BUTTON
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
// AUDIO DATABASE
// =====================================================

function openVoiceDatabase() {

    return new Promise(
        (resolve, reject) => {

            const request =
                indexedDB.open(
                    VOICE_DB_NAME,
                    1
                );


            request.onupgradeneeded =
                event => {

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
                () => {

                    resolve(
                        request.result
                    );
                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );
                };
        }
    );
}


// =====================================================
// SAVE VOICE
// =====================================================

async function saveVoiceRecording(
    noteId,
    blob
) {

    const db =
        await openVoiceDatabase();


    return new Promise(
        (resolve, reject) => {

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
                () => resolve();


            transaction.onerror =
                () =>
                    reject(
                        transaction.error
                    );
        }
    );
}


// =====================================================
// GET VOICE
// =====================================================

async function getVoiceRecording(
    noteId
) {

    const db =
        await openVoiceDatabase();


    return new Promise(
        (resolve, reject) => {

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
                () => {

                    resolve(
                        request.result ||
                        null
                    );
                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );
                };
        }
    );
}


// =====================================================
// DELETE VOICE
// =====================================================

async function deleteVoiceRecording(
    noteId
) {

    const db =
        await openVoiceDatabase();


    return new Promise(
        (resolve, reject) => {

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
                () => resolve();


            transaction.onerror =
                () =>
                    reject(
                        transaction.error
                    );
        }
    );
}


// =====================================================
// CHECK VOICE
// =====================================================

async function hasVoiceRecording(
    noteId
) {

    const recording =
        await getVoiceRecording(
            noteId
        );

    return !!recording;
}


// =====================================================
// ENABLE AUDIO
// =====================================================

function enableEngineerAudio() {

    audioEnabled = true;


    enableAudioBtn.textContent =
        "ENGINEER AUDIO ENABLED";

    enableAudioBtn.disabled =
        true;


    statusEl.textContent =
        "AUDIO READY";


    engineerCall(
        "AUDIO READY",
        "Your personal engineer voice is ready.",
        false
    );
}


// =====================================================
// START RECORDING
// =====================================================

async function startVoiceRecording(
    noteId,
    button
) {

    if (mediaRecorder) {

        return;
    }


    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        alert(
            "Microphone recording is not supported in this browser."
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


        mediaRecorder =
            new MediaRecorder(
                recordingStream,
                options
            );


        mediaRecorder.ondataavailable =
            event => {

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
            async () => {

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


                    await saveVoiceRecording(
                        recordingNoteId,
                        blob
                    );


                    engineerCall(
                        "VOICE SAVED",
                        "Your engineer call has been saved.",
                        false
                    );


                } catch (error) {

                    console.error(
                        "Voice save failed:",
                        error
                    );

                    engineerCall(
                        "VOICE SAVE ERROR",
                        "The recording could not be saved.",
                        false
                    );
                }


                recordingChunks = [];

                recordingNoteId = null;


                if (recordingStream) {

                    recordingStream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );
                }


                recordingStream = null;

                mediaRecorder = null;

                renderNotes();
            };


        mediaRecorder.start();


        button.textContent =
            "⏹ STOP RECORDING";


        button.classList.add(
            "recording"
        );


        statusEl.textContent =
            "RECORDING";


    } catch (error) {

        console.error(
            "Microphone error:",
            error
        );


        alert(
            "Microphone permission was denied or unavailable."
        );


        mediaRecorder = null;

        recordingStream = null;
    }
}


// =====================================================
// STOP RECORDING
// =====================================================

function stopVoiceRecording() {

    if (
        mediaRecorder &&
        mediaRecorder.state !==
            "inactive"
    ) {

        mediaRecorder.stop();
    }
}


// =====================================================
// PLAY VOICE
// =====================================================

async function playVoiceRecording(
    noteId
) {

    try {

        const blob =
            await getVoiceRecording(
                noteId
            );


        if (!blob) {

            engineerCall(
                "NO VOICE",
                "Record a voice call for this note first.",
                false
            );

            return;
        }


        if (activeAudio) {

            activeAudio.pause();

            activeAudio.currentTime = 0;

            activeAudio = null;
        }


        const url =
            URL.createObjectURL(
                blob
            );


        const audio =
            new Audio(url);


        activeAudio =
            audio;


        audio.volume = 1;


        audio.onended =
            () => {

                URL.revokeObjectURL(
                    url
                );


                if (
                    activeAudio === audio
                ) {

                    activeAudio = null;
                }
            };


        await audio.play();


    } catch (error) {

        console.error(
            "Voice playback failed:",
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
            false
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
        false
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
                    false
                );


                if (
                    note.voice
                ) {

                    playVoiceRecording(
                        note.id
                    );
                }
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


        if (activeAudio) {

            activeAudio.pause();
        }


        engineerCall(
            "PAUSED",
            "Lap timer stopped.",
            false
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
            false
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


    if (activeAudio) {

        activeAudio.pause();

        activeAudio.currentTime = 0;

        activeAudio = null;
    }


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
        false
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


            lapNumber = 0;

            bestLap = null;


            bestLapEl.textContent =
                "--:--.---";
        }
    );
}


// =====================================================
// TRACK EDITOR
// =====================================================

async function renderNotes() {

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


    for (
        const note of notes
    ) {

        await createNoteCard(
            track,
            note
        );
   
