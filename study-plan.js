// study-plan.js
// Smart Study Planner

const STORAGE_KEYS = {
    subjects: "smartStudyPlannerSubjects",
    studyPlan: "smartStudyPlannerPlan"
};

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const difficultyBaseHours = {
    easy: 0.5,
    medium: 1,
    hard: 1.5
};

let subjects = loadSubjects();
let studyPlan = loadStudyPlan();

const subjectForm = document.getElementById("subjectForm");
const subjectsList = document.getElementById("subjectsList");
const generateBtn = document.getElementById("generatePlanBtn");
const clearBtn = document.getElementById("clearDataBtn");

function safeParse(value, fallback) {
    if (!value) return fallback;

    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
}

function loadSubjects() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.subjects), []);
}

function loadStudyPlan() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.studyPlan), []);
}

function saveSubjects() {
    localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(subjects));
}

function saveStudyPlan() {
    localStorage.setItem(STORAGE_KEYS.studyPlan, JSON.stringify(studyPlan));
}

function parseLocalDate(dateString) {
    if (!dateString) return null;

    const [year, month, day] = dateString.split("-").map(Number);

    if (!year || !month || !day) {
        return null;
    }

    return new Date(year, month - 1, day);
}

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function roundToQuarter(value) {
    return Math.round(value * 4) / 4;
}

function getDailyStudyCapacity() {
    if (!subjects.length) return 0;

    const capacities = subjects.map(subject => Number(subject.hours) || 0);

    return capacities.length ? Math.min(...capacities) : 0;
}

function getSubjectPriority(subject, currentDate) {
    const examDate = parseLocalDate(subject.examDate);

    if (!examDate) {
        return 0;
    }

    const daysUntilExam = Math.max(
        0,
        Math.ceil((examDate - currentDate) / DAY_IN_MS)
    );

    const baseHours = difficultyBaseHours[subject.difficulty] || 0.5;
    const urgencyBoost = Math.max(1, 7 - daysUntilExam);

    return {
        daysUntilExam,
        weight: baseHours * urgencyBoost
    };
}

function buildDayTasks(currentDate) {
    const eligibleSubjects = subjects.filter(subject => {
        const examDate = parseLocalDate(subject.examDate);
        return examDate && examDate > currentDate;
    });

    if (!eligibleSubjects.length) {
        return [];
    }

    const dailyLimit = getDailyStudyCapacity() || 1;
    const weightedSubjects = eligibleSubjects
        .map(subject => ({
            subject,
            ...getSubjectPriority(subject, currentDate)
        }))
        .sort((left, right) => {
            if (right.weight !== left.weight) {
                return right.weight - left.weight;
            }

            return left.daysUntilExam - right.daysUntilExam;
        });

    const totalWeight = weightedSubjects.reduce(
        (sum, item) => sum + item.weight,
        0
    );

    const tasks = [];
    let remainingHours = dailyLimit;

    weightedSubjects.forEach((item, index) => {
        if (remainingHours <= 0) return;

        const subjectHoursLimit = Number(item.subject.hours) || dailyLimit;
        let targetHours = dailyLimit;

        if (totalWeight > 0) {
            targetHours = dailyLimit * (item.weight / totalWeight);
        }

        targetHours = Math.min(targetHours, subjectHoursLimit, remainingHours);
        targetHours = Math.max(0, roundToQuarter(targetHours));

        if (index === weightedSubjects.length - 1 && remainingHours > 0) {
            targetHours = Math.min(remainingHours, Math.max(0.25, targetHours));
        }

        if (targetHours <= 0) {
            return;
        }

        tasks.push({
            subject: item.subject.name,
            hours: targetHours,
            examDate: item.subject.examDate
        });

        remainingHours = roundToQuarter(remainingHours - targetHours);
    });

    return tasks.filter(task => task.hours > 0);
}

subjectForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("subjectName").value.trim();
    const examDate = document.getElementById("examDate").value;
    const hours = Number(document.getElementById("studyHours").value);
    const difficulty = document.getElementById("difficulty").value;

    if (!name || !examDate || !hours || !difficulty) {
        alert("Please fill all fields!");
        return;
    }

    if (hours <= 0 || hours > 24) {
        alert("Study hours must be between 1 and 24.");
        return;
    }

    subjects.push({
        name: name,
        examDate: examDate,
        hours: hours,
        difficulty: difficulty
    });

    saveSubjects();
    displaySubjects();
    subjectForm.reset();
});

function displaySubjects() {
    if (!subjectsList) return;

    if (subjects.length === 0) {
        subjectsList.innerHTML = "<p>No subjects added yet.</p>";
        return;
    }

    subjectsList.innerHTML = "";

    subjects.forEach((subject, index) => {
        const div = document.createElement("div");
        div.className = "subject-card";

        div.innerHTML = `
            <p>
                📚 <strong>${subject.name}</strong>
                | Exam: ${subject.examDate}
                | ${subject.hours} hr/day
                | ${subject.difficulty}
                <button type="button" onclick="deleteSubject(${index})">❌</button>
            </p>
        `;

        subjectsList.appendChild(div);
    });
}

function deleteSubject(index) {
    subjects.splice(index, 1);
    saveSubjects();
    displaySubjects();
}

generateBtn.addEventListener("click", function () {
    if (!subjects.length) {
        alert("Please add subjects first!");
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingSubjects = subjects.filter(subject => {
        const examDate = parseLocalDate(subject.examDate);
        return examDate && examDate > today;
    });

    if (!upcomingSubjects.length) {
        studyPlan = [];
        saveStudyPlan();
        displayPlan();
        document.dispatchEvent(
            new CustomEvent("studyPlanGenerated", { detail: studyPlan })
        );
        return;
    }

    let latestExam = parseLocalDate(upcomingSubjects[0].examDate);

    upcomingSubjects.forEach(subject => {
        const examDate = parseLocalDate(subject.examDate);
        if (examDate && examDate > latestExam) {
            latestExam = examDate;
        }
    });

    studyPlan = [];

    const totalDays = Math.ceil((latestExam - today) / DAY_IN_MS);

    for (let day = 0; day <= totalDays; day++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + day);

        const tasks = buildDayTasks(currentDate);

        if (tasks.length > 0) {
            studyPlan.push({
                date: formatLocalDate(currentDate),
                tasks: tasks
            });
        }
    }

    saveStudyPlan();
    displayPlan();

    document.dispatchEvent(
        new CustomEvent("studyPlanGenerated", { detail: studyPlan })
    );
});

function displayPlan() {
    const container = document.getElementById("planContainer");

    if (!container) return;

    container.innerHTML = "";

    if (!studyPlan.length) {
        container.innerHTML = "<p>No study plan available.</p>";
        return;
    }

    studyPlan.forEach(day => {
        const dayDiv = document.createElement("div");
        dayDiv.className = "day-plan";

        dayDiv.innerHTML = `
            <h3>📅 ${day.date}</h3>
        `;

        day.tasks.forEach(task => {
            const taskDiv = document.createElement("div");
            taskDiv.className = "study-task";

            taskDiv.innerHTML = `
                <div>
                    <strong>${task.subject}</strong>
                </div>
                <span class="study-hours">${task.hours} hour(s)</span>
            `;

            dayDiv.appendChild(taskDiv);
        });

        container.appendChild(dayDiv);
    });
}

clearBtn.addEventListener("click", function () {
    subjects = [];
    studyPlan = [];

    localStorage.removeItem(STORAGE_KEYS.subjects);
    localStorage.removeItem(STORAGE_KEYS.studyPlan);
    localStorage.removeItem("completedTasks");

    displaySubjects();
    displayPlan();

    const todayPlan = document.getElementById("todayPlan");
    if (todayPlan) {
        todayPlan.innerHTML = "<p>No tasks for today.</p>";
    }

    const progressContainer = document.getElementById("progressContainer");
    if (progressContainer) {
        progressContainer.innerHTML = "<p>Complete your tasks to track progress.</p>";
    }

    const overallProgress = document.getElementById("overallProgress");
    if (overallProgress) {
        overallProgress.textContent = "0%";
    }

    const progressBar = document.getElementById("progressBar");
    if (progressBar) {
        progressBar.style.width = "0%";
    }

    const examCountdown = document.getElementById("examCountdown");
    if (examCountdown) {
        examCountdown.innerHTML = "Add a subject to see the countdown.";
    }

    document.dispatchEvent(
        new CustomEvent("studyPlanGenerated", { detail: [] })
    );
});

displaySubjects();
displayPlan();