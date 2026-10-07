// study-plan.js
// Member 3: Study Plan Generation

let subjects = [];

// Calculate days remaining until exam
function calculateDaysRemaining(examDate) {
    const today = new Date();
    const exam = new Date(examDate);

    today.setHours(0, 0, 0, 0);
    exam.setHours(0, 0, 0, 0);

    const difference = exam - today;

    return Math.ceil(
        difference / (1000 * 60 * 60 * 24)
    );
}


// Calculate priority based on difficulty + exam urgency
function calculatePriority(subject) {
    const days = calculateDaysRemaining(subject.examDate);

    let difficultyScore = 1;

    if (subject.difficulty === "hard") {
        difficultyScore = 3;
    } else if (subject.difficulty === "medium") {
        difficultyScore = 2;
    }

    let urgencyScore;

    if (days <= 2) {
        urgencyScore = 5;
    } else if (days <= 5) {
        urgencyScore = 4;
    } else if (days <= 7) {
        urgencyScore = 3;
    } else if (days <= 14) {
        urgencyScore = 2;
    } else {
        urgencyScore = 1;
    }

    return urgencyScore + difficultyScore;
}


// Sort subjects from highest priority to lowest
function sortSubjectsByPriority(subjectList) {
    return [...subjectList].sort((a, b) => {
        return calculatePriority(b) - calculatePriority(a);
    });
}


// Generate the study timetable
function generateStudyPlan(subjectList, dailyHours) {

    if (!subjectList || subjectList.length === 0) {
        return [];
    }

    const validSubjects = subjectList.filter(subject => {
        return calculateDaysRemaining(subject.examDate) >= 0;
    });

    if (validSubjects.length === 0) {
        return [];
    }

    const sortedSubjects =
        sortSubjectsByPriority(validSubjects);

    const maxDays = Math.max(
        ...sortedSubjects.map(subject =>
            calculateDaysRemaining(subject.examDate)
        )
    );

    const plan = [];

    for (let day = 0; day <= maxDays; day++) {

        let remainingHours = Number(dailyHours);

        if (remainingHours <= 0) {
            break;
        }

        const currentDate = new Date();

        currentDate.setDate(
            currentDate.getDate() + day
        );

        const dateString =
            currentDate.toISOString().split("T")[0];

        const dayTasks = [];

        for (const subject of sortedSubjects) {

            const daysLeft =
                calculateDaysRemaining(subject.examDate) - day;

            if (daysLeft < 0 || remainingHours <= 0) {
                continue;
            }

            const priority =
                calculatePriority(subject);

            let allocatedHours = 1;

            if (priority >= 7) {
                allocatedHours = 2;
            } else if (priority >= 5) {
                allocatedHours = 1.5;
            }

            allocatedHours =
                Math.min(
                    allocatedHours,
                    remainingHours
                );

            dayTasks.push({
                subject: subject.name,
                hours: allocatedHours,
                priority: priority,
                examDate: subject.examDate
            });

            remainingHours -= allocatedHours;
        }

        plan.push({
            date: dateString,
            tasks: dayTasks
        });
    }

    return plan;
}


// Display generated timetable
function displayStudyPlan(plan) {

    // Matches Member 1 HTML:
    // <div id="planContainer">
    const timetableContainer =
        document.getElementById("planContainer");

    if (!timetableContainer) {
        console.log(
            "Generated Study Plan:",
            plan
        );
        return;
    }

    timetableContainer.innerHTML = "";

    if (plan.length === 0) {

        timetableContainer.innerHTML =
            "<p>No study plan could be generated.</p>";

        return;
    }

    plan.forEach(day => {

        const dayCard =
            document.createElement("div");

        dayCard.className = "day-card";

        let tasksHTML = "";

        if (day.tasks.length === 0) {

            tasksHTML =
                "<p>No tasks scheduled.</p>";

        } else {

            day.tasks.forEach(task => {

                tasksHTML += `
                    <div class="study-task">
                        <strong>${task.subject}</strong>
                        <span>${task.hours} hour(s)</span>
                    </div>
                `;
            });
        }

        dayCard.innerHTML = `
            <h3>${day.date}</h3>
            ${tasksHTML}
        `;

        timetableContainer.appendChild(dayCard);
    });
}


// Read subject information from Member 1's HTML form
function getSubjectFromForm() {

    const subjectName =
        document
            .getElementById("subjectName")
            ?.value
            .trim();

    const examDate =
        document
            .getElementById("examDate")
            ?.value;

    const studyHours =
        Number(
            document
                .getElementById("studyHours")
                ?.value
        );

    const difficulty =
        document
            .getElementById("difficulty")
            ?.value;

    if (!subjectName || !examDate || !difficulty) {

        alert(
            "Please fill in all subject details."
        );

        return null;
    }

    if (!studyHours || studyHours <= 0) {

        alert(
            "Please enter valid study hours."
        );

        return null;
    }

    return {
        name: subjectName,
        examDate: examDate,
        difficulty: difficulty,
        studyHours: studyHours
    };
}


// Add a subject to the subject list
function addSubject() {

    const subject =
        getSubjectFromForm();

    if (!subject) {
        return;
    }

    subjects.push(subject);

    // Matches Member 1 HTML:
    // <div id="subjectsList">
    const subjectList =
        document.getElementById("subjectsList");

    if (subjectList) {

        // Remove "No subjects added yet."
        if (subjects.length === 1) {
            subjectList.innerHTML = "";
        }

        const item =
            document.createElement("div");

        item.className =
            "subject-item";

        item.innerHTML = `
            <strong>${subject.name}</strong>
            <span>
                Exam: ${subject.examDate} |
                Difficulty: ${subject.difficulty} |
                Hours: ${subject.studyHours}
            </span>
        `;

        subjectList.appendChild(item);
    }

    // Clear form
    document.getElementById("subjectName").value = "";
    document.getElementById("examDate").value = "";
    document.getElementById("studyHours").value = "";
    document.getElementById("difficulty").value = "";
}


// Generate plan using available hours per day
function generatePlanFromSubjects() {

    if (subjects.length === 0) {

        alert(
            "Please add at least one subject first."
        );

        return;
    }

    // Use the first subject's daily hours.
    // The HTML currently has one "Available Hours Per Day"
    // field inside the Add Subject form.
    const dailyHours =
        Number(subjects[0].studyHours);

    if (!dailyHours || dailyHours <= 0) {

        alert(
            "Please enter your available study hours per day."
        );

        return;
    }

    const plan =
        generateStudyPlan(
            subjects,
            dailyHours
        );

    displayStudyPlan(plan);

    // Make the plan available to progress.js
    window.generatedStudyPlan = plan;

    // Notify other JavaScript files
    document.dispatchEvent(
        new CustomEvent(
            "studyPlanGenerated",
            {
                detail: plan
            }
        )
    );
}


// Connect buttons after page loads
document.addEventListener(
    "DOMContentLoaded",
    () => {

        const addButton =
            document.getElementById(
                "addSubjectBtn"
            );

        const generateButton =
            document.getElementById(
                "generatePlanBtn"
            );

        if (addButton) {

            addButton.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    addSubject();
                }
            );
        }

        if (generateButton) {

            generateButton.addEventListener(
                "click",
                generatePlanFromSubjects
            );
        }
    }
);