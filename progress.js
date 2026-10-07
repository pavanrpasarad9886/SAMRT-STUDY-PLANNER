// =====================================
// SMART STUDY PLANNER - PROGRESS
// Member 4
// =====================================

let completedTasks =
    JSON.parse(localStorage.getItem("completedTasks")) || [];


// =====================================
// Mark task as completed
// =====================================

function toggleTask(taskId) {

    if (completedTasks.includes(taskId)) {

        completedTasks =
            completedTasks.filter(id => id !== taskId);

    } else {

        completedTasks.push(taskId);
    }

    saveProgress();
    updateProgress();
}


// =====================================
// Save progress
// =====================================

function saveProgress() {

    localStorage.setItem(
        "completedTasks",
        JSON.stringify(completedTasks)
    );
}


// =====================================
// Calculate progress
// =====================================

function calculateProgress(totalTasks) {

    if (totalTasks === 0) {
        return 0;
    }

    return Math.round(
        (completedTasks.length / totalTasks) * 100
    );
}


// =====================================
// Update progress
// =====================================

function updateProgress() {

    const tasks =
        document.querySelectorAll(".study-task");

    const progressBar =
        document.getElementById("progressBar");

    const progressText =
        document.getElementById("overallProgress");

    const totalTasks = tasks.length;

    const percentage =
        calculateProgress(totalTasks);


    // Update checkbox state
    tasks.forEach(task => {

        const taskId =
            task.dataset.id;

        const checkbox =
            task.querySelector(".task-checkbox");

        if (completedTasks.includes(taskId)) {

            task.classList.add("completed");

            if (checkbox) {
                checkbox.checked = true;
            }

        } else {

            task.classList.remove("completed");

            if (checkbox) {
                checkbox.checked = false;
            }
        }
    });


    // Update progress bar
    if (progressBar) {

        progressBar.style.width =
            percentage + "%";
    }


    // Update percentage text
    if (progressText) {

        progressText.textContent =
            percentage + "%";
    }
}


// =====================================
// Add checkboxes to study tasks
// =====================================

function setupTaskCheckboxes() {

    const tasks =
        document.querySelectorAll(".study-task");

    tasks.forEach((task, index) => {

        // Don't add duplicate checkbox
        if (task.querySelector(".task-checkbox")) {
            return;
        }

        const taskId =
            "task-" + index + "-" +
            task.innerText.trim();

        task.dataset.id = taskId;


        const checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.className =
            "task-checkbox";


        checkbox.addEventListener(
            "change",
            function () {

                toggleTask(taskId);
            }
        );


        task.insertBefore(
            checkbox,
            task.firstChild
        );
    });

    updateProgress();
}


// =====================================
// Exam Countdown
// =====================================

function startCountdown(examDate) {

    const countdownElement =
        document.getElementById("examCountdown");

    if (!countdownElement) {
        return;
    }


    function updateCountdown() {

        const now =
            new Date().getTime();

        const examTime =
            new Date(examDate).getTime();

        const difference =
            examTime - now;


        if (difference <= 0) {

            countdownElement.textContent =
                "Exam Day!";

            return;
        }


        const days =
            Math.floor(
                difference /
                (1000 * 60 * 60 * 24)
            );


        const hours =
            Math.floor(
                (difference /
                (1000 * 60 * 60)) % 24
            );


        const minutes =
            Math.floor(
                (difference /
                (1000 * 60)) % 60
            );


        countdownElement.textContent =
            `${days} days ${hours} hours ${minutes} minutes`;
    }


    updateCountdown();

    setInterval(
        updateCountdown,
        60000
    );
}


// =====================================
// When study plan is generated
// =====================================

document.addEventListener(
    "studyPlanGenerated",
    function () {

        // Add checkboxes
        setupTaskCheckboxes();


        // Get subjects from study-plan.js
        if (
            typeof subjects !== "undefined" &&
            subjects.length > 0
        ) {

            // Find nearest exam
            const sortedSubjects =
                [...subjects].sort(
                    (a, b) =>
                        new Date(a.examDate) -
                        new Date(b.examDate)
                );

            const nearestExam =
                sortedSubjects[0];

            startCountdown(
                nearestExam.examDate
            );
        }
    }
);


// =====================================
// Restore progress when page loads
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateProgress();
    }
);