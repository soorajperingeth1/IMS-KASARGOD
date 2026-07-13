let masterQuestionsPool = []; // Holds the original, untouched JSON data
let questions = [];           // Holds the current session's questions
let currentQuestionIndex = 0;
let score = 0;

// Tracking structures
let wrongQuestions = [];      // Stores the actual question objects that were failed
let skippedQuestions = [];    // Stores the actual question objects that were skipped
let answeredQuestions = new Set(); 

// Timer variables
let startTime;
let timerInterval;
let totalTimeElapsed = 0; 

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
        masterQuestionsPool = await response.json();
        
        // Start a fresh standard quiz session
        startQuizSession(masterQuestionsPool);
    } catch (error) {
        questionText.innerText = "Failed to load quiz questions.";
        console.error(error);
    }
}

// 2. Initialize or Restart a Quiz Session
function startQuizSession(questionSet) {
    // Deep clone the incoming question set so modifications don't break the master pool
    questions = questionSet.map(q => ({
        ...q,
        options: shuffleArray([...q.options]) // Shuffles options freshly per session
    }));

    // Reset all tracking states
    currentQuestionIndex = 0;
    score = 0;
    scoreText.innerText = score;
    wrongQuestions = [];
    skippedQuestions = [];
    answeredQuestions.clear();
    
    // Reset and start timer
    clearInterval(timerInterval);
    totalTimeElapsed = 0;
    startTimer();
    
    // UI elements reset
    bulkActions.classList.remove('hidden');
    showQuestion();
}

// Fisher-Yates Shuffling Utility Function
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// 3. Timer Mechanics
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

// 4. Render Question Elements
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
    
    skipBtn.classList.remove('hidden');
}

// 5. Choice Validation Logic
function selectOption(selectedButton, questionData) {
    const allButtons = optionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach(btn => btn.disabled = true);
    skipBtn.classList.add('hidden');

    // Remove from skipped list if answered
    skippedQuestions = skippedQuestions.filter(q => q.question !== questionData.question);
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
        
        // Save the whole question data object into the wrong list tracker
        if (!wrongQuestions.some(q => q.question === questionData.question)) {
            wrongQuestions.push(questionData);
        }
    }

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

// 6. Navigation Click Handles
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
    const currentQuestion = questions[currentQuestionIndex];
    if (!answeredQuestions.has(currentQuestionIndex) && !skippedQuestions.some(q => q.question === currentQuestion.question)) {
        skippedQuestions.push(currentQuestion);
    }
    
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showQuizCompleteState();
    }
});

skipAllBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to skip all remaining questions and view your summary?")) {
        for (let i = currentQuestionIndex; i < questions.length; i++) {
            if (!answeredQuestions.has(i) && !skippedQuestions.some(q => q.question === questions[i].question)) {
                skippedQuestions.push(questions[i]);
            }
        }
        showQuizCompleteState();
    }
});

// 7. Complete State View Processing
function showQuizCompleteState() {
    clearInterval(timerInterval); 
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
        skippedQuestions.forEach((questionData, idx) => {
            reviewWrapper.appendChild(createReviewBlock(idx + 1, questionData, true));
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
        wrongQuestions.forEach((questionData, idx) => {
            reviewWrapper.appendChild(createReviewBlock(idx + 1, questionData, false));
        });
    }

    // DYNAMIC REATTEMPT ACTIONS
    const actionContainer = document.createElement('div');
    actionContainer.style.marginTop = "25px";
    actionContainer.style.display = "flex";
    actionContainer.style.flexDirection = "column";
    actionContainer.style.gap = "10px";

    const totalReviewItems = wrongQuestions.length + skippedQuestions.length;

    if (totalReviewItems > 0) {
        // Master Button for both Wrong and Skipped Combined
        if (wrongQuestions.length > 0 && skippedQuestions.length > 0) {
            const reattemptAllBtn = document.createElement('button');
            reattemptAllBtn.innerText = `🔄 Reattempt All Missed & Skipped (${totalReviewItems})`;
            reattemptAllBtn.classList.add('reattempt-btn');
            reattemptAllBtn.style.background = "var(--primary)";
            reattemptAllBtn.addEventListener('click', () => {
                startQuizSession([...wrongQuestions, ...skippedQuestions]);
            });
            actionContainer.appendChild(reattemptAllBtn);
        }

        // Individual Button: Wrong Questions Only
        if (wrongQuestions.length > 0) {
            const reattemptWrongBtn = document.createElement('button');
            reattemptWrongBtn.innerText = `❌ Reattempt Only Incorrect (${wrongQuestions.length})`;
            reattemptWrongBtn.classList.add('reattempt-btn');
            reattemptWrongBtn.addEventListener('click', () => {
                startQuizSession(wrongQuestions);
            });
            actionContainer.appendChild(reattemptWrongBtn);
        }

        // Individual Button: Skipped Questions Only (TYPO FIXED HERE)
        if (skippedQuestions.length > 0) {
            const reattemptSkippedBtn = document.createElement('button');
            reattemptSkippedBtn.innerText = `⚠️ Reattempt Only Skipped (${skippedQuestions.length})`;
            reattemptSkippedBtn.classList.add('reattempt-btn');
            reattemptSkippedBtn.style.background = "var(--warning)";
            reattemptSkippedBtn.addEventListener('click', () => {
                startQuizSession(skippedQuestions);
            });
            actionContainer.appendChild(reattemptSkippedBtn);
        }

        reviewWrapper.appendChild(actionContainer);
    }

    optionsContainer.appendChild(reviewWrapper);
}

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

loadQuizData();
