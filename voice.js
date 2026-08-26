alert("VOICE JS LOADED");
// =====================================================
// RACING ENGINEER V5.1
// VOICE RECORDING SYSTEM
// =====================================================

"use strict";


// =====================================================
// SETTINGS
// =====================================================

const VOICE_DB_NAME = "RacingEngineerVoiceDB";
const VOICE_STORE_NAME = "recordings";


// =====================================================
// DATABASE
// =====================================================

let voiceDB = null;


function openVoiceDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                VOICE_DB_NAME,
                1
            );


        request.onupgradeneeded = function(event) {

            const db =
                event.target.result;


            if (!db.objectStoreNames.contains(
                VOICE_STORE_NAME
            )) {

                db.createObjectStore(
                    VOICE_STORE_NAME
                );
            }
        };


        request.onsuccess = function(event) {

            voiceDB =
                event.target.result;

            resolve(voiceDB);
        };


        request.onerror = function() {

            reject(
                request.error
            );
        };

    });
}


// =====================================================
// SAVE RECORDING
// =====================================================

function saveVoiceRecording(
    noteId,
    blob
) {

    return new Promise((resolve, reject) => {

        const transaction =
            voiceDB.transaction(
                VOICE_STORE_NAME,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                VOICE_STORE_NAME
            );


        const request =
            store.put(
                blob,
                String(noteId)
            );


        request.onsuccess =
            () => resolve();


        request.onerror =
            () => reject(request.error);

    });
}


// =====================================================
// GET RECORDING
// =====================================================

function getVoiceRecording(
    noteId
) {

    return new Promise((resolve, reject) => {

        const transaction =
            voiceDB.transaction(
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
            () => resolve(request.result);


        request.onerror =
            () => reject(request.error);

    });
}


// =====================================================
// DELETE RECORDING
// =====================================================

function deleteVoiceRecording(
    noteId
) {

    return new Promise((resolve, reject) => {

        const transaction =
            voiceDB.transaction(
                VOICE_STORE_NAME,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                VOICE_STORE_NAME
            );


        const request =
            store.delete(
                String(noteId)
            );


        request.onsuccess =
            () => resolve();


        request.onerror =
            () => reject(request.error);

    });
}


// =====================================================
// RECORDER
// =====================================================

const activeRecorders =
    new Map();


async function startRecording(
    note,
    card
) {

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

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });


        const recorder =
            new MediaRecorder(stream);


        const chunks = [];


        recorder.ondataavailable =
            function(event) {

                if (event.data.size > 0) {

                    chunks.push(
                        event.data
                    );
                }
            };


        recorder.onstop =
            async function() {

                stream
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );


                const blob =
                    new Blob(
                        chunks,
                        {
                            type:
                                recorder.mimeType ||
                                "audio/webm"
                        }
                    );


                try {

                    await saveVoiceRecording(
                        note.id,
                        blob
                    );


                    updateVoiceControls(
                        note,
                        card
                    );


                } catch (error) {

                    console.error(
                        "Could not save recording:",
                        error
                    );

                    alert(
                        "Could not save the recording."
                    );
                }

            };


        activeRecorders.set(
            String(note.id),
            recorder
        );


        recorder.start();


        const recordButton =
            card.querySelector(
                ".voiceRecord"
            );


        const stopButton =
            card.querySelector(
                ".voiceStop"
            );


        if (recordButton) {

            recordButton.disabled =
                true;

            recordButton.textContent =
                "● RECORDING...";
        }


        if (stopButton) {

            stopButton.disabled =
                false;
        }


    } catch (error) {

        console.error(
            "Microphone error:",
            error
        );


        alert(
            "Microphone permission was denied or unavailable."
        );
    }
}


// =====================================================
// STOP RECORDING
// =====================================================

function stopRecording(
    note,
    card
) {

    const recorder =
        activeRecorders.get(
            String(note.id)
        );


    if (!recorder) {
        return;
    }


    if (
        recorder.state !==
        "inactive"
    ) {

        recorder.stop();
    }


    activeRecorders.delete(
        String(note.id)
    );


    const recordButton =
        card.querySelector(
            ".voiceRecord"
        );


    const stopButton =
        card.querySelector(
            ".voiceStop"
        );


    if (recordButton) {

        recordButton.disabled =
            false;

        recordButton.textContent =
            "🎙 RECORD";
    }


    if (stopButton) {

        stopButton.disabled =
            true;
    }
}


// =====================================================
// PLAY RECORDING
// =====================================================

async function playVoiceRecording(
    note
) {

    try {

        const blob =
            await getVoiceRecording(
                note.id
            );


        if (!blob) {

            alert(
                "This note does not have a recording yet."
            );

            return;
        }


        const url =
            URL.createObjectURL(
                blob
            );


        const audio =
            new Audio(url);


        audio.volume = 1;


        audio.onended =
            function() {

                URL.revokeObjectURL(
                    url
                );
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
// CLEAR RECORDING
// =====================================================

async function clearVoiceRecording(
    note,
    card
) {

    try {

        await deleteVoiceRecording(
            note.id
        );


        updateVoiceControls(
            note,
            card
        );


    } catch (error) {

        console.error(
            "Could not delete recording:",
            error
        );
    }
}


// =====================================================
// CREATE VOICE CONTROLS
// =====================================================

function createVoiceControls(
    note
) {

    const container =
        document.createElement(
            "div"
        );


    container.className =
        "voiceControls";


    container.style.marginTop =
        "10px";


    container.style.display =
        "flex";


    container.style.flexWrap =
        "wrap";


    container.style.gap =
        "8px";


    container.innerHTML = `

        <button
            class="voiceRecord"
            type="button">
            🎙 RECORD
        </button>

        <button
            class="voiceStop"
            type="button"
            disabled>
            ⏹ STOP
        </button>

        <button
            class="voicePlay"
            type="button">
            ▶ PLAY
        </button>

        <button
            class="voiceClear"
            type="button">
            🗑 CLEAR VOICE
        </button>

        <span
            class="voiceStatus"
            style="padding:8px;">
            No recording
        </span>

    `;


    return container;
}


// =====================================================
// UPDATE VOICE STATUS
// =====================================================

async function updateVoiceControls(
    note,
    card
) {

    const status =
        card.querySelector(
            ".voiceStatus"
        );


    const playButton =
        card.querySelector(
            ".voicePlay"
        );


    const clearButton =
        card.querySelector(
            ".voiceClear"
        );


    try {

        const recording =
            await getVoiceRecording(
                note.id
            );


        if (recording) {

            if (status) {

                status.textContent =
                    "🎙 Voice saved";
            }


            if (playButton) {

                playButton.disabled =
                    false;
            }


            if (clearButton) {

                clearButton.disabled =
                    false;
            }

        } else {

            if (status) {

                status.textContent =
                    "No recording";
            }


            if (playButton) {

                playButton.disabled =
                    true;
            }


            if (clearButton) {

                clearButton.disabled =
                    true;
            }
        }


    } catch (error) {

        console.error(
            "Voice status error:",
            error
        );
    }
}


// =====================================================
// ATTACH CONTROLS TO NOTE CARD
// =====================================================

async function attachVoiceControls(
    note,
    card
) {

    const existing =
        card.querySelector(
            ".voiceControls"
        );


    if (existing) {
        return;
    }


    const controls =
        createVoiceControls(
            note
        );


    const actions =
        card.querySelector(
            ".noteActions"
        );


    if (actions) {

        actions.before(
            controls
        );

    } else {

        card.appendChild(
            controls
        );
    }


    const recordButton =
        controls.querySelector(
            ".voiceRecord"
        );


    const stopButton =
        controls.querySelector(
            ".voiceStop"
        );


    const playButton =
        controls.querySelector(
            ".voicePlay"
        );


    const clearButton =
        controls.querySelector(
            ".voiceClear"
        );


    recordButton.addEventListener(
        "click",
        function() {

            startRecording(
                note,
                card
            );
        }
    );


    stopButton.addEventListener(
        "click",
        function() {

            stopRecording(
                note,
                card
            );
        }
    );


    playButton.addEventListener(
        "click",
        function() {

            playVoiceRecording(
                note
            );
        }
    );


    clearButton.addEventListener(
        "click",
        function() {

            clearVoiceRecording(
                note,
                card
            );
        }
    );


    updateVoiceControls(
        note,
        card
    );
}


// =====================================================
// AUTOMATIC PLAYBACK
// =====================================================

async function playRecordedVoice(
    note
) {

    try {

        const blob =
            await getVoiceRecording(
                note.id
            );


        if (!blob) {

            return false;
        }


        const url =
            URL.createObjectURL(
                blob
            );


        const audio =
            new Audio(url);


        audio.volume = 1;


        audio.onended =
            function() {

                URL.revokeObjectURL(
                    url
                );
            };


        await audio.play();


        return true;


    } catch (error) {

        console.error(
            "Automatic voice playback failed:",
            error
        );


        return false;
    }
}


// =====================================================
// HOOK INTO EXISTING ENGINEER
// =====================================================

function enableRecordedVoiceForNote(
    note
) {

    if (!note) {
        return;
    }


    // The main script will continue
    // to display the engineer call.


    playRecordedVoice(
        note
    );
}


// =====================================================
// OBSERVE NOTE CARDS
// =====================================================

function scanForNoteCards() {

    const cards =
        document.querySelectorAll(
            ".noteCard"
        );


    cards.forEach(
        card => {

            if (
                card.dataset.voiceReady ===
                "true"
            ) {

                return;
            }


            const callInput =
                card.querySelector(
                    ".call"
                );


            if (!callInput) {
                return;
            }


            const trackSelect =
                document.getElementById(
                    "trackSelect"
                );


            if (!trackSelect) {
                return;
            }


            const track =
                window.database?.[
                    trackSelect.value
                ];


            if (!track ||
                !Array.isArray(track.notes)) {

                return;
            }


            const note =
                track.notes.find(
                    item =>
                        item.call ===
                        callInput.value
                );


            if (!note) {
                return;
            }


            attachVoiceControls(
                note,
                card
            );


            card.dataset.voiceReady =
                "true";
        }
    );
}


// =====================================================
// STARTUP
// =====================================================

async function initializeVoiceSystem() {

    try {

        await openVoiceDatabase();

        console.log(
            "Voice database ready."
        );


        scanForNoteCards();


        setInterval(
            scanForNoteCards,
            500
        );


    } catch (error) {

        console.error(
            "Voice system failed to initialize:",
            error
        );
    }
}


// =====================================================
// GLOBAL API
// =====================================================

window.playRecordedVoice =
    playRecordedVoice;

window.enableRecordedVoiceForNote =
    enableRecordedVoiceForNote;

window.scanForNoteCards =
    scanForNoteCards;


// =====================================================
// RUN
// =====================================================

initializeVoiceSystem();
