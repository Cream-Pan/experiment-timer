let experiments;
let currentExperiment;
let currentTaskIndex = 0;
let timerID = null;
let remaining = 0;
let running = false;
let paused = false;
let logs = [];
let participantID = "";

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
    if (running) return;

    participantID = document.getElementById("participantID").value;

    if (participantID === "") {
        alert("参加者IDを入力してください");
        return;
    }

    currentExperiment = experiments.find(e => e.id === select.value);
    logs = [];
    currentTaskIndex = 0;

    document.getElementById("pauseBtn").disabled = false;
    document.getElementById("cancelBtn").disabled = false;

    countDown();
}

// カウントダウン
function countDown() {
    let count = 3;
    taskName.textContent = "開始まで";
    timer.textContent = count;

    let c = setInterval(() => {
        count--;
        timer.textContent = count;

        if (count === 0) {
            clearInterval(c);
            startTask();
        }
    }, 1000);
}

function startTask() {
    running = true;
    paused = false;

    let task = currentExperiment.tasks[currentTaskIndex];
    let now = getTime();

    logs.push({
        Task_Name: task.name,
        Timestamp: formatTimestamp(Date.now())
    });

    taskName.textContent = task.name;
    remaining = task.duration;
    timer.textContent = remaining;

    timerID = setInterval(() => {
        if (paused) return;

        remaining--;
        timer.textContent = remaining;

        // 5秒前通知
        if (remaining <= 5 && remaining > 0) {
            beep();
        }

        if (remaining === 0) {
            finishTask();
        }
    }, 1000);

    status.textContent = "実験中";
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
    running = false;
    taskName.textContent = "実験終了";
    timer.textContent = "--";
    status.textContent = "完了";
    document.getElementById("downloadBtn").disabled = false;
}

// 一時停止
document.getElementById("pauseBtn").onclick = () => {
    paused = !paused;
    status.textContent = paused ? "一時停止" : "実験中";
};

// キャンセル
document.getElementById("cancelBtn").onclick = () => {
    clearInterval(timerID);
    running = false;
    status.textContent = "キャンセル";
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
    let a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = `${participantID}_${currentExperiment.id}_log.csv`;
    a.click();
};

// 時刻
function getTime() {
    return new Date().toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo"
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