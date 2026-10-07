// progress.js
// Today's Plan + Progress + Exam Countdown

let currentPlan = [];

let completedTasks =
    JSON.parse(localStorage.getItem("completedTasks") || "[]");

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getTaskId(date, subject) {
    return `${date}-${subject}`;
}

function getEffectiveTaskMap() {
    const map = new Map();

    currentPlan.forEach(day => {
        day.tasks.forEach(task => {
            const id = getTaskId(day.date, task.subject);
            map.set(id, task);
        });
    });

    return map;
}

function showTodayPlan() {
    const box = document.getElementById("todayPlan");

    if (!box) return;

    const today = getTodayDate();
    const todayData = currentPlan.find(day => day.date === today);

    if (!todayData || todayData.tasks.length === 0) {
        box.innerHTML = "<p>No tasks scheduled for today.</p>";
        return;
    }

    box.innerHTML = "<h3>Today's Tasks</h3>";

    todayData.tasks.forEach(task => {
        const id = getTaskId(today, task.subject);
        const checked = completedTasks.includes(id) ? "checked" : "";

        const row = document.createElement("div");
        row.style.margin = "10px 0";

        row.innerHTML = `
            <label>
                <input
                    type="checkbox"
                    class="study-checkbox"
                    data-id="${id}"
                    ${checked}
                >
                📚 ${task.subject} - ${task.hours} hour(s)
            </label>
        `;

        box.appendChild(row);
    });

    addCheckboxEvents();
}

function showProgressTasks() {
    const box = document.getElementById("progressContainer");

    if (!box) return;

    box.innerHTML = "";

    if (!currentPlan.length) {
        box.innerHTML = "<p>Complete your tasks to track progress.</p>";
        return;
    }

    currentPlan.forEach(day => {
        if (day.tasks.length === 0) return;

        const heading = document.createElement("h3");
        heading.textContent = `📅 ${day.date}`;
        box.appendChild(heading);

        day.tasks.forEach(task => {
            const id = getTaskId(day.date, task.subject);
            const checked = completedTasks.includes(id) ? "checked" : "";

            const row = document.createElement("div");
            row.style.margin = "8px 0";

            row.innerHTML = `
                <label>
                    <input
                        type="checkbox"
                        class="study-checkbox"
                        data-id="${id}"
                        ${checked}
                    >
                    ${task.subject} - ${task.hours} hour(s)
                </label>
            `;

            box.appendChild(row);
        });
    });

    addCheckboxEvents();
}

function addCheckboxEvents() {
    const checkboxes = document.querySelectorAll(".study-checkbox");

    checkboxes.forEach(box => {
        box.onchange = function () {
            const id = this.dataset.id;

            if (this.checked) {
                if (!completedTasks.includes(id)) completedTasks.push(id);
            } else {
                completedTasks = completedTasks.filter(item => item !== id);
            }

            localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
            updateProgress();
        };
    });
}

function updateProgress() {
    const validTasks = getEffectiveTaskMap();
    let total = 0;
    let completed = 0;

    validTasks.forEach(task => {
        total += 1;

        const id = getTaskId(task.date || getTodayDate(), task.subject);
        if (completedTasks.includes(id)) {
            completed += 1;
        }
    });

    currentPlan.forEach(day => {
        day.tasks.forEach(task => {
            const id = getTaskId(day.date, task.subject);
            if (completedTasks.includes(id)) {
                completed += 0;
            }
        });
    });

    let percentage = 0;

    if (total > 0) {
        percentage = Math.round((completed / total) * 100);
    }

    const percentageText = document.getElementById("overallProgress");
    const progressBar = document.getElementById("progressBar");

    if (percentageText) {
        percentageText.textContent = `${percentage}%`;
    }

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
}

function showExamCountdown() {
    const box = document.getElementById("examCountdown");

    if (!box) return;

    if (!currentPlan.length) {
        box.innerHTML = "Add a subject to see the countdown.";
        return;
    }

    const exams = [];

    currentPlan.forEach(day => {
        day.tasks.forEach(task => {
            if (!exams.some(exam => exam.subject === task.subject && exam.date === task.examDate)) {
                exams.push({
                    subject: task.subject,
                    date: task.examDate
                });
            }
        });
    });

    if (!exams.length) {
        box.innerHTML = "No upcoming exams.";
        return;
    }

    box.innerHTML = "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    exams.forEach(exam => {
        const examDate = new Date(exam.date);
        examDate.setHours(0, 0, 0, 0);

        const difference = examDate - today;
        const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

        let message = "";

        if (days < 0) {
            message = `📚 ${exam.subject} — Exam completed`;
        } else if (days === 0) {
            message = `🔥 ${exam.subject} — EXAM IS TODAY!`;
        } else {
            message = `⏰ ${exam.subject} — Exam in ${days} day(s)`;
        }

        const paragraph = document.createElement("p");
        paragraph.style.fontSize = "18px";
        paragraph.textContent = message;
        box.appendChild(paragraph);
    });
}

document.addEventListener("studyPlanGenerated", function(event) {
    currentPlan = event.detail || [];

    showTodayPlan();
    showProgressTasks();
    updateProgress();
    showExamCountdown();
});