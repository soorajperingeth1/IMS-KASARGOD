let questions = [];
let currentQuestionIndex = 0;
let score = 0;

// Tracking structures
let wrongQuestions = []; 
let skippedQuestions = [];
let answeredQuestions = new Set(); // Fixes double scoring bug

// Timer variables
let startTime;
let timerInterval;
let totalTimeElapsed = 0; // in seconds

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const explanationBox = document.getElementById('explanation-box');
const nextBtn = document.getElementById('next-btn');
const backBtn = document.getElementById('back-btn'); 
const skipBtn = document.getElementById('skip-btn'); 
const skipAllBtn = document.getElementById('skip-all-btn');
const progressText = document.getElementById('progress');
const scoreText = document.getElementById('score');
const timerDisplay = document.getElementById('quiz-timer');
const bulkActions = document.getElementById('bulk-actions');

// 1. Fetch JSON file
async function loadQuizData() {
    try {
        const response = await fetch('quiz-data.json');
        questions = await response.json();
        startTimer();
        showQuestion();
    } catch (error) {
        questionText.innerText = "Failed to load quiz questions.";
        console.error(error);
    }
}

// 2. Timer Mechanics
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        totalTimeElapsed = Math.floor((Date.now() - startTime) / 1000);
        updateTimerUI(totalTimeElapsed);
    }, 1000);
}

function updateTimerUI(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    timerDisplay.innerText = `Time: ${mins}:${secs}`;
}

// 3. Render Question Elements
function showQuestion() {
    resetState();
    const currentQuestion = questions[currentQuestionIndex];
    
    progressText.innerText = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    questionText.innerText = currentQuestion.question;

    currentQuestion.options.forEach(option => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('option-btn');
        button.addEventListener('click', () => selectOption(button, currentQuestion));
        optionsContainer.appendChild(button);
    });

    if (currentQuestionIndex > 0) {
        backBtn.classList.remove('hidden');
    } else {
        backBtn.classList.add('hidden');
    }
    
    // Clear dynamic skip button states if already evaluated
    skipBtn.classList.remove('hidden');
}

// 4. Choice Validation Logic
function selectOption(selectedButton, questionData) {
    const allButtons = optionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach(btn => btn.disabled = true);
    skipBtn.classList.add('hidden');

    // Remove from skipped list if they backed into it and answered
    skippedQuestions = skippedQuestions.filter(index => index !== currentQuestionIndex);

    // FIXED: Only process points if this specific question has never been answered before
    const wasAlreadyAnswered = answeredQuestions.has(currentQuestionIndex);

    if (selectedButton.innerText === questionData.correct_answer) {
        selectedButton.classList.add('correct');
        if (!wasAlreadyAnswered) {
            score++;
            scoreText.innerText = score;
        }
    } else {
        selectedButton.classList.add('incorrect');
        allButtons.forEach(btn => {
            if (btn.innerText === questionData.correct_answer) btn.classList.add('correct');
        });
        
        if (!wrongQuestions.includes(currentQuestionIndex)) {
            wrongQuestions.push(currentQuestionIndex);
        }
    }

    // Mark as answered now
    answeredQuestions.add(currentQuestionIndex);

    explanationBox.innerText = `Explanation: ${questionData.explanation}`;
    explanationBox.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
}

function resetState() {
    nextBtn.classList.add('hidden');
    explanationBox.classList.add('hidden');
    optionsContainer.innerHTML = '';
}

// 5. Navigation Click Handles
nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showQuizCompleteState();
    }
});

backBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
});

skipBtn.addEventListener('click', () => {
    // Only track as skipped if it wasn't already answered previously
    if (!answeredQuestions.has(currentQuestionIndex) && !skippedQuestions.includes(currentQuestionIndex)) {
        skippedQuestions.push(currentQuestionIndex);
    }
    
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showQuizCompleteState();
    }
});

// Skip All Button Handler
skipAllBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to skip all remaining questions and view your summary?")) {
        // Collect all remaining unanswered questions into skipped pool
        for (let i = currentQuestionIndex; i < questions.length; i++) {
            if (!answeredQuestions.has(i) && !skippedQuestions.includes(i)) {
                skippedQuestions.push(i);
            }
        }
        showQuizCompleteState();
    }
});

// 6. Complete State View Processing
function showQuizCompleteState() {
    clearInterval(timerInterval); // Stop stopwatch
    resetState();
    
    backBtn.classList.add('hidden');
    skipBtn.classList.add('hidden');
    bulkActions.classList.add('hidden');
    
    const finalMins = Math.floor(totalTimeElapsed / 60).toString().padStart(2, '0');
    const finalSecs = (totalTimeElapsed % 60).toString().padStart(2, '0');

    progressText.innerText = "Quiz Completed!";
    questionText.innerText = `You finished! Your final score is ${score} out of ${questions.length}.\nTotal Time Taken: ${finalMins}m ${finalSecs}s.`;

    optionsContainer.innerHTML = '';
    const reviewWrapper = document.createElement('div');
    reviewWrapper.classList.add('review-wrapper');

    // Section A: Skipped Review
    const skippedHeader = document.createElement('h3');
    skippedHeader.innerText = `⚠️ Skipped Questions Review (${skippedQuestions.length})`;
    reviewWrapper.appendChild(skippedHeader);

    if (skippedQuestions.length === 0) {
        const noSkipsMsg = document.createElement('p');
        noSkipsMsg.innerText = "No skipped questions.";
        reviewWrapper.appendChild(noSkipsMsg);
    } else {
        skippedQuestions.forEach(index => {
            reviewWrapper.appendChild(createReviewBlock(index + 1, questions[index], true));
        });
    }

    // Section B: Incorrect Review
    const wrongHeader = document.createElement('h3');
    wrongHeader.innerText = `❌ Incorrect Questions Review (${wrongQuestions.length})`;
    wrongHeader.style.marginTop = "30px";
    reviewWrapper.appendChild(wrongHeader);

    if (wrongQuestions.length === 0) {
        const perfectScoreMsg = document.createElement('p');
        perfectScoreMsg.innerText = "No incorrect responses logged!";
        reviewWrapper.appendChild(perfectScoreMsg);
    } else {
        wrongQuestions.forEach(index => {
            reviewWrapper.appendChild(createReviewBlock(index + 1, questions[index], false));
        });
    }

    optionsContainer.appendChild(reviewWrapper);
}

// Build Display Node Blocks
function createReviewBlock(labelIndex, qData, isSkipped) {
    const block = document.createElement('div');
    block.classList.add('review-card');

    const title = document.createElement('strong');
    title.innerText = `Q${labelIndex}: ${qData.question}`;
    block.appendChild(title);

    const answerSpan = document.createElement('div');
    const tagClass = isSkipped ? 'skipped-tag' : 'correct-tag';
    const tagLabel = isSkipped ? 'Skipped Answer' : 'Correct Answer';
    
    answerSpan.innerHTML = `<span class="${tagClass}">${tagLabel}:</span> ${qData.correct_answer}`;
    answerSpan.style.margin = "6px 0";
    block.appendChild(answerSpan);

    const expSpan = document.createElement('div');
    expSpan.innerHTML = `<span class="explanation-tag">Explanation:</span> ${qData.explanation}`;
    expSpan.classList.add('review-explanation');
    block.appendChild(expSpan);

    return block;
}

// Initialize Application
loadQuizData();
