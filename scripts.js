// core gameplay loop
// answer questions to grow your plants
// harvest and sell flowers, fruits and veggies to get coins
// shop has buy and sell options
// buy seeds and more garden plots to plant more stuff


// character movement
// state tracker for 4 primary movement keys (arrow keys and WASD)
const movement = {
    up: false,
    down: false,
    left: false,
    right: false
};

// Map physical keys to our movement directions
const keyMap = {
    'ArrowUp': 'up', 'w': 'up', 'W': 'up',
    'ArrowDown': 'down', 's': 'down', 'S': 'down',
    'ArrowLeft': 'left', 'a': 'left', 'A': 'left',
    'ArrowRight': 'right', 'd': 'right', 'D': 'right'
};

window.addEventListener("keydown", (event) => {
    if (keyMap[event.key]) {
        event.preventDefault();
        movement[keyMap[event.key]] = true;
    }
});
window.addEventListener("keyup", (event) => {
    if (keyMap[event.key]) {
        movement[keyMap[event.key]] = false;
    }
});

const playerAnimations = {
    '0': ['walk0.1.png', 'walk0.2.png', 'walk0.3.png', 'walk0.4.png', 'walk0.5.png'], // up
    '180': ['walk180.1.png', 'walk180.2.png', 'walk180.3.png', 'walk180.4.png', 'walk180.5.png'], // down
    '90': ['walk90.1.png', 'walk90.2.png', 'walk90.3.png', 'walk90.4.png', 'walk90.5.png'], // right
    '45': ['walk45.1.png', 'walk45.2.png', 'walk45.3.png', 'walk45.4.png', 'walk45.5.png'], // up-right
    '135': ['walk135.1.png', 'walk135.2.png', 'walk135.3.png', 'walk135.4.png', 'walk135.5.png'], // down-right
};

// Player physics & rendering state
let player = { x: 100, y: 100, speed: 6 };
let lastAngle = '180';
let animationFrame = 0;
let animationTimer = 0;
const ANIMATION_SPEED = 5; // Higher = slower switching (e.g., switch frame every 10 ticks)

function updateMovement() {
    if (isGamePaused) {
        requestAnimationFrame(updateMovement);
        return; 
    }
    let dx = 0;
    let dy = 0;

    // Check mapped directions
    if (movement.left) dx = -1;
    if (movement.right) dx = 1;
    if (movement.up) dy = -1;
    if (movement.down) dy = 1;

    // If moving diagonally, total speed increases by ~41% (Pythagorean theorem).
    // We divide by Math.sqrt(2) to keep diagonal speed exactly the same as straight speed
    if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
    }

    // Apply movement
    player.x += dx * player.speed;
    player.y += dy * player.speed;

    let isMoving = (dx !== 0 || dy !== 0);
    let lookupAngle = '180';
    let shouldFlip = false;   // CSS transform flag
    let currentSpriteImg = '';

    if (isMoving) {
    // Determine the absolute facing angle vs the available right-side asset angle
    if (movement.up && movement.right)       { lastAngle = '45';  lookupAngle = '45';  shouldFlip = false; }
    else if (movement.up && movement.left)   { lastAngle = '315'; lookupAngle = '45';  shouldFlip = true;  }
    else if (movement.down && movement.right) { lastAngle = '135'; lookupAngle = '135'; shouldFlip = false; }
    else if (movement.down && movement.left)  { lastAngle = '225'; lookupAngle = '135'; shouldFlip = true;  }
    else if (movement.up)                    { lastAngle = '0';   lookupAngle = '0';   shouldFlip = false; }
    else if (movement.down)                  { lastAngle = '180'; lookupAngle = '180'; shouldFlip = false; }
    else if (movement.right)                 { lastAngle = '90';  lookupAngle = '90';  shouldFlip = false; }
    else if (movement.left)                  { lastAngle = '270'; lookupAngle = '90';  shouldFlip = true;  }

        animationTimer++;
        if (animationTimer >= ANIMATION_SPEED) {
            animationTimer = 0;
            animationFrame = (animationFrame + 1) % playerAnimations[lookupAngle].length;
        }

        // Set sprite name string
        player.currentSpriteImg = playerAnimations[lookupAngle][animationFrame];

    } else {
        animationFrame = 0;
        animationTimer = 0;

        // Decode idle asset states out of our last known facing direction
        if (lastAngle === '315') { lookupAngle = '45'; shouldFlip = true; }
        else if (lastAngle === '225') { lookupAngle = '135'; shouldFlip = true; }
        else if (lastAngle === '270') { lookupAngle = '90'; shouldFlip = true; }
        else { lookupAngle = lastAngle; shouldFlip = false; }

        player.currentSpriteImg = `idle${lookupAngle}.png`;
    }

    const playerWrapper = document.getElementById("player");
    if (playerWrapper) {
        const characterImg = playerWrapper.querySelector("img");

        if (characterImg) {
            characterImg.src = player.currentSpriteImg;
            const playerWrapper = document.getElementById("player");
            if (playerWrapper) {
                const characterImg = playerWrapper.querySelector("img");

                if (characterImg) {
                    characterImg.src = player.currentSpriteImg;
                }

                const wrapperWidth = 50;
                const wrapperHeight = 50;

                // Screen boundaries
                if (player.x < 0) player.x = 0;
                if (player.x > window.innerWidth - wrapperWidth) {
                    player.x = window.innerWidth - wrapperWidth;
                }

                if (player.y < 0) player.y = 0;
                if (player.y > window.innerHeight - wrapperHeight) {
                    player.y = window.innerHeight - wrapperHeight;
                }

                // Position the wrapper and handle the horizontal left-flip transform
                playerWrapper.style.transform = `translate(${player.x}px, ${player.y}px) scaleX(${shouldFlip ? -1 : 1})`;
            }
        }
    }

    requestAnimationFrame(updateMovement);
}

requestAnimationFrame(updateMovement);

// question and answer system!
// Add as many Hiragana/Katakana characters here as you'd like to test!
const kanaBank = [
    { romaji: "a", hiragana: "あ", katakana: "ア" },
    { romaji: "i", hiragana: "い", katakana: "イ" },
    { romaji: "u", hiragana: "う", katakana: "ウ" },
    { romaji: "e", hiragana: "え", katakana: "エ" },
    { romaji: "o", hiragana: "お", katakana: "オ" },
    { romaji: "ka", hiragana: "か", katakana: "カ" },
    { romaji: "ki", hiragana: "き", katakana: "キ" },
    { romaji: "ku", hiragana: "く", katakana: "ク" },
    { romaji: "ke", hiragana: "け", katakana: "ケ" },
    { romaji: "ko", hiragana: "こ", katakana: "コ" },
    { romaji: "sa", hiragana: "さ", katakana: "サ" },
    { romaji: "shi", hiragana: "し", katakana: "シ" },
    { romaji: "su", hiragana: "す", katakana: "ス" },
    { romaji: "se", hiragana: "せ", katakana: "セ" },
    { romaji: "so", hiragana: "そ", katakana: "ソ" },
    { romaji: "ta", hiragana: "た", katakana: "タ" },
    { romaji: "chi", hiragana: "ち", katakana: "チ" },
    { romaji: "tsu", hiragana: "つ", katakana: "ツ" },
    { romaji: "te", hiragana: "て", katakana: "テ" },
    { romaji: "to", hiragana: "と", katakana: "ト" },
    { romaji: "na", hiragana: "な", katakana: "ナ" },
    { romaji: "ni", hiragana: "に", katakana: "ニ" },
    { romaji: "nu", hiragana: "ぬ", katakana: "ヌ" },
    { romaji: "ne", hiragana: "ね", katakana: "ネ" },
    { romaji: "no", hiragana: "の", katakana: "ノ" },
    { romaji: "ha", hiragana: "は", katakana: "ハ" },
    { romaji: "hi", hiragana: "ひ", katakana: "ヒ" },
    { romaji: "fu", hiragana: "ふ", katakana: "フ" },
    { romaji: "he", hiragana: "へ", katakana: "ヘ" },
    { romaji: "ho", hiragana: "ほ", katakana: "ホ" },   
    { romaji: "ma", hiragana: "ま", katakana: "マ" },
    { romaji: "mi", hiragana: "み", katakana: "ミ" },
    { romaji: "mu", hiragana: "む", katakana: "ム" },
    { romaji: "me", hiragana: "め", katakana: "メ" },
    { romaji: "mo", hiragana: "も", katakana: "モ" },
    { romaji: "ya", hiragana: "や", katakana: "ヤ" },
    { romaji: "yu", hiragana: "ゆ", katakana: "ユ" },
    { romaji: "yo", hiragana: "よ", katakana: "ヨ" },
    { romaji: "ra", hiragana: "ら", katakana: "ラ" },
    { romaji: "ri", hiragana: "り", katakana: "リ" },
    { romaji: "ru", hiragana: "る", katakana: "ル" },
    { romaji: "re", hiragana: "れ", katakana: "レ" },
    { romaji: "ro", hiragana: "ろ", katakana: "ロ" },
    { romaji: "wa", hiragana: "わ", katakana: "ワ" },
    { romaji: "wo", hiragana: "を", katakana: "ヲ" },
    { romaji: "n", hiragana: "ん", katakana: "ン" }
];

let totalCorrectAnswers = 0; // Tracks master garden progress points
let currentQuestion = null;   // Stores active runtime question properties

function generateRandomQuestion() {
  // 1. Pick a random target character from the dictionary array
  const targetIndex = Math.floor(Math.random() * kanaBank.length);
  const target = kanaBank[targetIndex];

  // 2. Decide question type: 0 = "What sound?", 1 = "Which character?"
  const questionType = Math.floor(Math.random() * 2);
  
  // 3. Randomly choose whether to test Hiragana or Katakana this turn
  const isHiragana = Math.random() < 0.5;
  const scriptName = isHiragana ? "Hiragana" : "Katakana";
  const kanaChar = isHiragana ? target.hiragana : target.katakana;

  let questionText = "";
  let correctAnswerText = "";
  let wrongChoicesPool = [];

  if (questionType === 0) {
    // Format A: "What sound does the character あ make?"
    questionText = `What sound does the ${scriptName} character "${kanaChar}" make?`;
    correctAnswerText = target.romaji;
    // Pool incorrect options from other Romaji values
    wrongChoicesPool = kanaBank.filter(k => k.romaji !== target.romaji).map(k => k.romaji);
  } else {
    // Format B: "Which character makes the sound 'ka'?"
    questionText = `Which ${scriptName} character makes the sound "${target.romaji}"?`;
    correctAnswerText = kanaChar;
    // Pool incorrect options from other matching script items
    wrongChoicesPool = kanaBank.filter(k => k.romaji !== target.romaji).map(k => isHiragana ? k.hiragana : k.katakana);
  }

  // 4. Shuffle choices to get 3 random wrong answers + 1 right answer
  wrongChoicesPool.sort(() => 0.5 - Math.random());
  const finalChoices = [correctAnswerText, wrongChoicesPool[0], wrongChoicesPool[1], wrongChoicesPool[2]];
  finalChoices.sort(() => 0.5 - Math.random()); // Mix them together

  return {
    prompt: questionText,
    choices: finalChoices,
    correct: correctAnswerText
  };
}

let score = 0;
let currentQuestionIndex = 0;
let isGamePaused = false; // Flag to freeze player movement while reading

// 3. Document Element References
const openBtn = document.getElementById("practice-btn");
const overlay = document.getElementById("quiz-modal-overlay");
const closeBtn = document.getElementById("close-modal-btn");
const questionText = document.getElementById("question-text");
const choicesContainer = document.getElementById("choices-container");
const feedbackText = document.getElementById("feedback-text");

// 4. Modal Visibility Controllers
openBtn.addEventListener("click", openQuizModal);
closeBtn.addEventListener("click", closeQuizModal);

// HTML elements reference variables remain the same as previous setup
function openQuizModal() {
  overlay.classList.remove("hidden");
  isGamePaused = true; 
  nextQuestionSession(); // Jump straight into a brand new random prompt
}

function nextQuestionSession() {
  feedbackText.classList.add("hidden");
  choicesContainer.innerHTML = ""; 

  // Generate completely fresh random properties on execution
  currentQuestion = generateRandomQuestion();
  questionText.textContent = currentQuestion.prompt;

  currentQuestion.choices.forEach(choice => {
    const button = document.createElement("button");
    button.classList.add("choice-btn");
    button.textContent = choice;
    button.addEventListener("click", () => checkKanaAnswer(button, choice));
    choicesContainer.appendChild(button);
  });
}

function checkKanaAnswer(selectedButton, chosenText) {
  feedbackText.classList.remove("hidden");
  
  // Lock selection choices immediately
  const choiceButtons = choicesContainer.querySelectorAll(".choice-btn");
  choiceButtons.forEach(btn => btn.disabled = true);

  if (chosenText === currentQuestion.correct) {
    totalCorrectAnswers++; // Global growth point tier increments seamlessly!
    feedbackText.textContent = "✨ Correct! Your garden feels a tiny burst of energy.";
    feedbackText.className = "correct-msg";
    selectedButton.style.borderColor = "#2e7d32";
    selectedButton.style.backgroundColor = "#e8f5e9";
  } else {
    feedbackText.textContent = `❌ Not quite! The correct answer was "${currentQuestion.correct}".`;
    feedbackText.className = "wrong-msg";
    selectedButton.style.borderColor = "#c62828";
    selectedButton.style.backgroundColor = "#ffebee";
  }

  // Create an explicit, user-triggered action pathway to clear the block
  // Instead of closing automatically, we let them click to load the next character prompt
  const nextBtn = document.createElement("button");
  nextBtn.id = "modal-next-action-btn";
  nextBtn.textContent = "Next Question 👉";
  nextBtn.style.marginTop = "20px";
  nextBtn.style.padding = "10px 20px";
  nextBtn.className = "choice-btn"; 
  
  nextBtn.addEventListener("click", nextQuestionSession);
  choicesContainer.appendChild(nextBtn);
}