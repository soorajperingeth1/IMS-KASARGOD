let questions = [];
let currentQuestionIndex = 0;
let score = 0;
// Track indices of favorited questions using a Set to avoid duplicates
let favorites = new Set(); 

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const explanationBox = document.getElementById('explanation-box');
const nextBtn = document.getElementById('next-btn');
const backBtn = document.getElementById('back-btn'); // NEW
const skipBtn = document.getElementById('skip-btn'); // NEW
const favBtn = document.getElementById('fav-btn');   // NEW
const progressText = document.getElementById('progress');
const scoreText = document.getElementById('score');
const favoritesListContainer = document.getElementById('favorites-list'); // NEW (Optional UI display)

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

    // Update Favorite Button state for the current question
    updateFavButtonUI();

    currentQuestion.options.forEach(option => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('option-btn');
        button.addEventListener('click', () => selectOption(button, currentQuestion));
        optionsContainer.appendChild(button);
    });

    // Control visibility of the Back button
    if (currentQuestionIndex > 0) {
        backBtn.classList.remove('hidden');
    } else {
        backBtn.classList.add('hidden');
    }

    // Show Skip button only if the question hasn't been answered yet
    skipBtn.classList.remove('hidden');
}

// 3. Handle user selection
function selectOption(selectedButton, questionData) {
    const allButtons = optionsContainer.querySelectorAll('.option-btn');
    
    // Disable all options once a choice is made
    allButtons.forEach(btn => btn.disabled = true);

    // Hide the Skip button since they just answered it
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

// 4. Handle Next Button click
nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showQuizCompleteState();
    }
});

// 5. NEW: Handle Back Button click
backBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
});

// 6. NEW: Handle Skip Button click
skipBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showQuizCompleteState();
    }
});

// 7. NEW: Handle Favorite Button toggle
favBtn.addEventListener('click', () => {
    if (favorites.has(currentQuestionIndex)) {
        favorites.delete(currentQuestionIndex);
    } else {
        favorites.add(currentQuestionIndex);
    }
    updateFavButtonUI();
    renderFavoritesList(); // Optional: updates a side panel or list view of favorites
});

// Helper to change the look of the favorite button based on status
function updateFavButtonUI() {
    if (favorites.has(currentQuestionIndex)) {
        favBtn.innerText = "★ Unfavorite";
        favBtn.classList.add('favorited');
    } else {
        favBtn.innerText = "☆ Favorite";
        favBtn.classList.remove('favorited');
    }
}

// Helper to handle the end of the quiz
function showQuizCompleteState() {
    resetState();
    backBtn.classList.add('hidden');
    skipBtn.classList.add('hidden');
    favBtn.classList.add('hidden');
    progressText.innerText = "Quiz Completed!";
    questionText.innerText = `You finished! Your final score is ${score} out of ${questions.length}.`;
}

// Optional helper to list out all favorited questions at the bottom or side panel
function renderFavoritesList() {
    if (!favoritesListContainer) return;
    
    favoritesListContainer.innerHTML = '';
    if (favorites.size === 0) {
        favoritesListContainer.innerHTML = '<li>No favorite questions saved yet.</li>';
        return;
    }

    favorites.forEach(index => {
        const li = document.createElement('li');
        li.innerText = questions[index].question;
        // Optional: click to jump back to this question
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            currentQuestionIndex = index;
            favBtn.classList.remove('hidden'); // ensure it's visible if it was hidden at the end screen
            showQuestion();
        });
        favoritesListContainer.appendChild(li);
    });
}

// Start the application
loadQuizData();
