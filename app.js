let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let favorites = new Set(); 

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

    // Toggle Visibility logic for Navigation
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

function showQuizCompleteState() {
    resetState();
    backBtn.classList.add('hidden');
    skipBtn.classList.add('hidden');
    favBtn.classList.add('hidden');
    progressText.innerText = "Quiz Completed!";
    questionText.innerText = `You finished! Your final score is ${score} out of ${questions.length}.`;
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
