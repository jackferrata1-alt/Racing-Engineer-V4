let running = false;
let paused = false;

let lapStart = 0;
let pauseStart = 0;
let pausedTime = 0;

let animationFrame = null;

let lapNumber = 0;
let bestLap = null;

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
const timeLog = document.getElementById("timeLog");

const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const millisecondsEl = document.getElementById("milliseconds");


// -----------------------------
// TIME
// -----------------------------

function getTargetTime() {

    const minutes = Number(minutesEl.value) || 0;
    const seconds = Number(secondsEl.value) || 0;
    const milliseconds = Number(millisecondsEl.value) || 0;

    return (
        minutes * 60 * 1000 +
        seconds * 1000 +
        milliseconds
    );
}


function formatTime(ms) {

    if (!Number.isFinite(ms)) {
        return "--:--.---";
    }

    const totalMilliseconds = Math.max(0, Math.floor(ms));

    const minutes = Math.floor(totalMilliseconds / 60000);

    const seconds = Math.floor(
        (totalMilliseconds % 60000) / 1000
    );

    const milliseconds =
        totalMilliseconds % 1000;

    return (
        `${minutes}:` +
        `${String(seconds).padStart(2, "0")}.` +
        `${String(milliseconds).padStart(3, "0")}`
    );
}


// -----------------------------
// SPEECH
// -----------------------------

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(text);

    voice.rate = 1.05;
    voice.pitch = 1;
    voice.volume = 1;

    window.speechSynthesis.speak(voice);
}


// -----------------------------
// ENGINEER
// -----------------------------

function setEngineerCall(main, sub = "") {

    callEl.textContent = main;
    subCallEl.textContent = sub;

    speak(main + ". " + sub);
}


// -----------------------------
// START
// -----------------------------

function startLap() {

    if (running) {
        return;
    }

    running = true;
    paused = false;

    pausedTime = 0;
    pauseStart = 0;

    lapNumber++;

    lapStart = performance.now();

    statusEl.textContent = "PUSH LAP";

    startBtn.textContent = "LAP RUNNING";

    setEngineerCall(
        "PUSH LAP",
        `${trackSelect.options[trackSelect.selectedIndex].text} — target ${formatTime(getTargetTime())}`
    );

    updateTimer();
}


// -----------------------------
// TIMER
// -----------------------------

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

        const target =
            getTargetTime();

        const delta =
            elapsed - target;

        const sign =
            delta >= 0 ? "+" : "-";

        deltaEl.textContent =
            sign + formatTime(Math.abs(delta));

    }

    animationFrame =
        requestAnimationFrame(updateTimer);
}


// -----------------------------
// PAUSE
// -----------------------------

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

        setEngineerCall(
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

        setEngineerCall(
            "RESUME",
            "Back on the push lap."
        );
    }
}


// -----------------------------
// STOP / COMPLETE LAP
// -----------------------------

function stopLap() {

    if (!running) {
        return;
    }

    const elapsed =
        paused
            ? pauseStart - lapStart - pausedTime
            : performance.now() - lapStart - pausedTime;

    running = false;
    paused = false;

    cancelAnimationFrame(animationFrame);

    currentLapEl.textContent =
        formatTime(elapsed);

    const target =
        getTargetTime();

    const delta =
        elapsed - target;

    const sign =
        delta >= 0 ? "+" : "-";

    deltaEl.textContent =
        sign + formatTime(Math.abs(delta));


    if (
        bestLap === null ||
        elapsed < bestLap
    ) {

        bestLap = elapsed;

        bestLapEl.textContent =
            formatTime(bestLap);
    }


    addLog(
        lapNumber,
        elapsed,
        delta,
        elapsed === bestLap
    );


    statusEl.textContent =
        "READY";

    startBtn.textContent =
        "START PUSH LAP";

    pauseBtn.textContent =
        "PAUSE";

    setEngineerCall(
        "LAP COMPLETE",
        `${formatTime(elapsed)} — ${sign}${formatTime(Math.abs(delta))}`
    );
}


// -----------------------------
// LOG
// -----------------------------

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

    const sign =
        delta >= 0 ? "+" : "-";

    row.innerHTML = `
        <span>${lap}</span>
        <span>${formatTime(time)}</span>
        <span>${sign}${formatTime(Math.abs(delta))}</span>
        <span>${isBest ? "★ BEST" : ""}</span>
    `;

    timeLog.prepend(row);
}


// -----------------------------
// CLEAR LOG
// -----------------------------

document
    .getElementById("clearLog")
    .addEventListener("click", () => {

        timeLog.innerHTML = `
            <div class="empty">
                No completed laps.
            </div>
        `;

        lapNumber = 0;
        bestLap = null;

        bestLapEl.textContent =
            "--:--.---";
    });


// -----------------------------
// BUTTONS
// -----------------------------

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

        speak(
            "Engineer test successful. " +
            "Push lap ready."
        );
    }
);


// -----------------------------
// TRACK CHANGE
// -----------------------------

trackSelect.addEventListener(
    "change",
    () => {

        if (!running) {

            setEngineerCall(
                trackSelect.options[
                    trackSelect.selectedIndex
                ].text,
                "Track selected. Push lap ready."
            );
        }
    }
);


// -----------------------------
// INITIAL STATE
// -----------------------------

pauseBtn.disabled = true;

startBtn.addEventListener(
    "click",
    () => {
        pauseBtn.disabled = false;
    }
);

stopBtn.addEventListener(
    "click",
    () => {
        pauseBtn.disabled = true;
    }
);

pauseBtn.addEventListener(
    "click",
    () => {
        pauseBtn.disabled = false;
    }
);
