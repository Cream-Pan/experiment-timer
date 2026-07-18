let experiments;
let currentExperiment;
let currentTaskIndex = 0;
let timerID = null;
let remaining = 0;
let running = false;
let paused = false;
let logs = [];
let participantID = "";
let countdownID = null;
let taskEndTimestamp = 0;
let pausedAt = 0;

// DOM
const select = document.getElementById("experimentSelect");
const taskName = document.getElementById("taskName");
const timer = document.getElementById("timer");
const status = document.getElementById("status");
const taskList = document.getElementById("taskList");

// JSON読み込み
fetch("experiments.json")
    .then(res => res.json())
    .then(data => {
        experiments = data.experiments;

        experiments.forEach(exp => {
            let option = document.createElement("option");
            option.value = exp.id;
            option.textContent = exp.name;
            select.appendChild(option);
        });

        showTasks();
    });

select.onchange = showTasks;

function showTasks() {
    if (!experiments) return;

    let exp = experiments.find(e => e.id === select.value);

    taskList.innerHTML = "";

    exp.tasks.forEach((task, i) => {
        let p = document.createElement("p");
        p.textContent = `${i + 1}. ${task.name}`;
        taskList.appendChild(p);
    });
}

function formatTimestamp(epochMs) {
  const now = new Date(epochMs);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

// 開始
document.getElementById("startBtn").onclick = startExperiment;

function startExperiment() {
    if (running || !experiments) return;

    participantID = document.getElementById("participantID").value.trim();

    if (participantID === "") {
        alert("参加者IDを入力してください");
        return;
    }

    currentExperiment = experiments.find(e => e.id === select.value);

    if (!currentExperiment) {
        alert("実験を選択してください");
        return;
    }

    logs = [];
    currentTaskIndex = 0;
    running = true;
    paused = false;

    document.getElementById("startBtn").disabled = true;
    document.getElementById("pauseBtn").disabled = true;
    document.getElementById("cancelBtn").disabled = false;
    document.getElementById("downloadBtn").disabled = true;
    document.getElementById("participantID").disabled = true;
    select.disabled = true;

    logEvent("Start", Date.now());

    countDown();
}

function countDown() {
    let count = 3;

    taskName.textContent = "開始まで";
    timer.textContent = count;
    status.textContent = "カウントダウン中";

    countdownID = setInterval(() => {
        count--;
        timer.textContent = count;

        if (count === 0) {
            clearInterval(countdownID);
            countdownID = null;
            startTask();
        }
    }, 1000);
}

function startTask() {
    paused = false;

    const task = currentExperiment.tasks[currentTaskIndex];

    logEvent(task.name, Date.now());

    taskName.textContent = task.name;
    timer.textContent = task.duration;
    status.textContent = "実験中";

    document.getElementById("pauseBtn").disabled = false;
    document.getElementById("pauseBtn").textContent = "一時停止 (Space)";

    taskEndTimestamp = Date.now() + task.duration * 1000;

    clearInterval(timerID);
    timerID = setInterval(updateTimer, 250);

    updateTimer();
}

function updateTimer() {
    if (!running || paused) return;

    const remainingMilliseconds = taskEndTimestamp - Date.now();
    const remainingSeconds = Math.max(
        0,
        Math.ceil(remainingMilliseconds / 1000)
    );

    timer.textContent = remainingSeconds;

    if (remainingMilliseconds <= 0) {
        clearInterval(timerID);
        timerID = null;
        finishTask();
    }
}

function finishTask() {
    clearInterval(timerID);

    currentTaskIndex++;

    if (currentTaskIndex >= currentExperiment.tasks.length) {
        finishExperiment();
        return;
    }

    startTask();
}

function finishExperiment() {
    clearInterval(timerID);
    timerID = null;

    logEvent("End", Date.now());

    running = false;
    paused = false;

    taskName.textContent = "実験終了";
    timer.textContent = "--";
    status.textContent = "完了";

    document.getElementById("startBtn").disabled = false;
    document.getElementById("pauseBtn").disabled = true;
    document.getElementById("cancelBtn").disabled = true;
    document.getElementById("downloadBtn").disabled = false;
    document.getElementById("participantID").disabled = false;
    document.getElementById("pauseBtn").textContent = "一時停止 (Space)";
    select.disabled = false;
}

// 一時停止
document.getElementById("pauseBtn").onclick = () => {
    if (!running || countdownID !== null) return;

    if (!paused) {
        paused = true;
        pausedAt = Date.now();
        status.textContent = "一時停止";
        document.getElementById("pauseBtn").textContent = "再開 (Space)";
    } else {
        taskEndTimestamp += Date.now() - pausedAt;
        paused = false;
        status.textContent = "実験中";
        document.getElementById("pauseBtn").textContent = "一時停止 (Space)";
        updateTimer();
    }
};

// キャンセル
document.getElementById("cancelBtn").onclick = () => {
    clearInterval(timerID);
    clearInterval(countdownID);

    timerID = null;
    countdownID = null;
    running = false;
    paused = false;
    logs = [];

    taskName.textContent = "待機中";
    timer.textContent = "--";
    status.textContent = "キャンセル";

    document.getElementById("startBtn").disabled = false;
    document.getElementById("pauseBtn").disabled = true;
    document.getElementById("cancelBtn").disabled = true;
    document.getElementById("downloadBtn").disabled = true;
    document.getElementById("participantID").disabled = false;
    document.getElementById("pauseBtn").textContent = "一時停止 (Space)";
    select.disabled = false;
};

// 音
function beep() {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.value = 800;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
}

// CSV
document.getElementById("downloadBtn").onclick = () => {
    let csv = "Task_Name,Timestamp\n";
    logs.forEach(l => {
        csv += `${l.Task_Name},${l.Timestamp}\n`;
    });

    let bom = "\uFEFF";
    let blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    let a = document.createElement("a");

    a.href = url;
    a.download = `${participantID}_${currentExperiment.id}_log.csv`;
    a.click();

    URL.revokeObjectURL(url);
};

// 時刻
function getTime() {
    return new Date().toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo"
    });
}

function logEvent(taskName, epochMs = Date.now()) {
    logs.push({ 
        Task_Name: taskName, 
        Timestamp: formatTimestamp(epochMs)
    });
}

// キーボード操作
document.addEventListener("keydown", e => {
    if (e.code === "Enter") {
        startExperiment();
    }
    if (e.code === "Space") {
        if (running) {
            document.getElementById("pauseBtn").click();
        }
    }
    if (e.code === "Escape") {
        document.getElementById("cancelBtn").click();
    }
});