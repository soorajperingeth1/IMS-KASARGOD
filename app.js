let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let favorites = new Set(); 
// NEW: Track indices of questions the user answered incorrectly
let wrongQuestions = []; 

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const explanationBox = document.getElementById('explanation-box');
const nextBtn = document.getElementById('next-btn');
const backBtn = document.getElementById('back-btn'); 
const skipBtn = document.getElementById('skip-btn'); 
const favBtn = document.getElementById('fav-btn');   
const progressText = document.getElementById('progress');
const scoreText = document.getElementById('score');
const favoritesListContainer = document.getElementById('favorites-list'); 

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

    updateFavButtonUI();

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

// 3. Handle user selection
function selectOption(selectedButton, questionData) {
    const allButtons = optionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach(btn => btn.disabled = true);
    skipBtn.classList.add('hidden');

    if (selectedButton.innerText === questionData.correct_answer) {
        selectedButton.classList.add('correct');
        score++;
        scoreText.innerText = score;
    } else {
        selectedButton.classList.add('incorrect');
        allButtons.forEach(btn => {
            if (btn.innerText === questionData.correct_answer) btn.classList.add('correct');
        });
        
        // NEW: Log this question index to wrong questions list if not already logged
        if (!wrongQuestions.includes(currentQuestionIndex)) {
            wrongQuestions.push(currentQuestionIndex);
        }
    }

    explanationBox.innerText = `Explanation: ${questionData.explanation}`;
    explanationBox.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
}

function resetState() {
    nextBtn.classList.add('hidden');
    explanationBox.classList.add('hidden');
    optionsContainer.innerHTML = '';
}

// 4. Navigation Event Handlers
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
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showQuizCompleteState();
    }
});

// 5. Favorites Toggle Logic
favBtn.addEventListener('click', () => {
    if (favorites.has(currentQuestionIndex)) {
        favorites.delete(currentQuestionIndex);
    } else {
        favorites.add(currentQuestionIndex);
    }
    updateFavButtonUI();
    renderFavoritesList(); 
});

function updateFavButtonUI() {
    if (favorites.has(currentQuestionIndex)) {
        favBtn.innerText = "★ Unfavorite";
        favBtn.classList.add('favorited');
    } else {
        favBtn.innerText = "☆ Favorite";
        favBtn.classList.remove('favorited');
    }
}

// 6. NEW & IMPROVED: Review Screens generated on Quiz Completion
function showQuizCompleteState() {
    resetState();
    backBtn.classList.add('hidden');
    skipBtn.classList.add('hidden');
    favBtn.classList.add('hidden');
    
    progressText.innerText = "Quiz Completed!";
    questionText.innerText = `You finished! Your final score is ${score} out of ${questions.length}.`;

    // Clear options out completely to prepare for review layouts
    optionsContainer.innerHTML = '';

    // Create Review Container Box
    const reviewWrapper = document.createElement('div');
    reviewWrapper.classList.add('review-wrapper');

    // Section A: Review Wrong Answers
    const wrongHeader = document.createElement('h3');
    wrongHeader.innerText = `❌ Incorrect Questions Review (${wrongQuestions.length})`;
    reviewWrapper.appendChild(wrongHeader);

    if (wrongQuestions.length === 0) {
        const perfectScoreMsg = document.createElement('p');
        perfectScoreMsg.innerText = "Awesome job! You didn't miss any questions.";
        reviewWrapper.appendChild(perfectScoreMsg);
    } else {
        wrongQuestions.forEach(index => {
            const qData = questions[index];
            reviewWrapper.appendChild(createReviewBlock(index + 1, qData));
        });
    }

    // Section B: Review Favorite Questions
    const favHeader = document.createElement('h3');
    favHeader.innerText = `⭐ Favorite Questions Review (${favorites.size})`;
    favHeader.style.marginTop = "30px";
    reviewWrapper.appendChild(favHeader);

    if (favorites.size === 0) {
        const noFavsMsg = document.createElement('p');
        noFavsMsg.innerText = "You haven't added any questions to your favorites during this run.";
        reviewWrapper.appendChild(noFavsMsg);
    } else {
        favorites.forEach(index => {
            const qData = questions[index];
            reviewWrapper.appendChild(createReviewBlock(index + 1, qData));
        });
    }

    optionsContainer.appendChild(reviewWrapper);
}

// Helper to build a clean display unit block for reviewed items
function createReviewBlock(labelIndex, qData) {
    const block = document.createElement('div');
    block.classList.add('review-card');

    const title = document.createElement('strong');
    title.innerText = `Q${labelIndex}: ${qData.question}`;
    block.appendChild(title);

    const answerSpan = document.createElement('div');
    answerSpan.innerHTML = `<span class="correct-tag">Correct Answer:</span> ${qData.correct_answer}`;
    answerSpan.style.margin = "6px 0";
    block.appendChild(answerSpan);

    const expSpan = document.createElement('div');
    expSpan.innerHTML = `<span class="explanation-tag">Explanation:</span> ${qData.explanation}`;
    expSpan.classList.add('review-explanation');
    block.appendChild(expSpan);

    return block;
}

function renderFavoritesList() {
    if (!favoritesListContainer) return;
    favoritesListContainer.innerHTML = '';
    
    if (favorites.size === 0) {
        favoritesListContainer.innerHTML = '<li>No favorite questions saved yet.</li>';
        return;
    }

    favorites.forEach(index => {
        const li = document.createElement('li');
        li.innerText = `Q${index + 1}: ${questions[index].question}`;
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            currentQuestionIndex = index;
            favBtn.classList.remove('hidden'); 
            showQuestion();
        });
        favoritesListContainer.appendChild(li);
    });
}

// Initialize
loadQuizData();
