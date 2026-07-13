let questions = [];
let currentQuestionIndex = 0;
let score = 0;

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const explanationBox = document.getElementById('explanation-box');
const nextBtn = document.getElementById('next-btn');
const progressText = document.getElementById('progress');
const scoreText = document.getElementById('score');

// 1. Fetch your custom JSON file
async function loadQuizData() {
    try {
        const response = await fetch('quiz-data.json');
        questions = await response.json();
        showQuestion();
    } catch (error) {
        questionText.innerText = "Failed to load quiz questions.";
        console.error(error);
    }
}

// 2. Render the current question
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
}

// 3. Handle user selection
function selectOption(selectedButton, questionData) {
    const allButtons = optionsContainer.querySelectorAll('.option-btn');
    
    // Disable all options once a choice is made
    allButtons.forEach(btn => btn.disabled = true);

    // Fixed mapping: Changed questionData.answer to questionData.correct_answer
    if (selectedButton.innerText === questionData.correct_answer) {
        selectedButton.classList.add('correct');
        score++;
        scoreText.innerText = score;
    } else {
        selectedButton.classList.add('incorrect');
        // Highlight the correct answer for the user
        allButtons.forEach(btn => {
            if (btn.innerText === questionData.correct_answer) btn.classList.add('correct');
        });
    }

    // Reveal explanation and Next button
    explanationBox.innerText = `Explanation: ${questionData.explanation}`;
    explanationBox.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
}

function resetState() {
    nextBtn.classList.add('hidden');
    explanationBox.classList.add('hidden');
    optionsContainer.innerHTML = '';
}

// 4. Handle Next Button click
nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        // Quiz complete state
        resetState();
        progressText.innerText = "Quiz Completed!";
        questionText.innerText = `You finished! Your final score is ${score} out of ${questions.length}.`;
    }
});

// Start the application
loadQuizData();
