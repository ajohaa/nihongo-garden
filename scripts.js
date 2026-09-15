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
const ANIMATION_SPEED = 4; // Higher = slower switching (e.g., switch frame every 10 ticks)

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

    requestAnimationFrame(updateMovement);
}

requestAnimationFrame(updateMovement);

// question and answer system!
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

let playerLevel = 0;
let currentEXP = 0;
let expNeededForLevelUp = 100;
let totalCorrectAnswers = 0;

let currentQuestion = null;   
let currentMode = "free";    
let isGamePaused = false;    

let timedCountdownInterval = null;
let secondsRemaining = 60;
let timedSessionCorrectCount = 0;

const openBtn = document.getElementById("practice-btn");
const overlay = document.getElementById("quiz-modal-overlay");
const closeBtn = document.getElementById("close-modal-btn");
const menuScreen = document.getElementById("mode-selection-menu");
const gameScreen = document.getElementById("question-gameplay-screen");
const questionText = document.getElementById("question-text");
const choicesContainer = document.getElementById("choices-container");
const feedbackText = document.getElementById("feedback-text");

const modalTimerBlock = document.getElementById("modal-timer");
const modalTimerText = document.getElementById("modal-timer-countdown");

openBtn.addEventListener("click", openQuizModal);
closeBtn.addEventListener("click", closeQuizModal);

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentMode = btn.dataset.mode;
    
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    
    // Start specialized clock if Timed Mode is chosen
    if (currentMode === "timed") {
      startTimedPracticeSession();
    } else {
      nextQuestionSession();
    }
  });
});

function openQuizModal() {
  overlay.classList.remove("hidden");
  menuScreen.classList.remove("hidden"); // Always route back to choice center
  gameScreen.classList.add("hidden");
  isGamePaused = true; // Signals character movement updates to halt execution
}

function closeQuizModal() {
  // If player clicks close button while timed mode interval is actively processing...
  if (currentMode === "timed" && timedCountdownInterval !== null && secondsRemaining > 0) {
    const confirmExit = confirm("⚠️ Are you sure you want to exit early? You will forfeit all progress and gain 0 EXP for this session!");
    
    if (!confirmExit) {
      return; // Break execution cycle out, returning them safely back into the active quiz game
    }
  }

  // Clear running timers if player leaves early
  if (timedCountdownInterval) {
    clearInterval(timedCountdownInterval);
    timedCountdownInterval = null;
  }

  overlay.classList.add("hidden");
  feedbackText.classList.add("hidden");
  modalTimerBlock.classList.add("hidden"); // Securely clear internal layout elements
  
  isGamePaused = false; 
  updateHUD();
}

// IN-MODAL TIMER ENGINE
function startTimedPracticeSession() {
  secondsRemaining = 60;
  timedSessionCorrectCount = 0;
  modalTimerText.textContent = secondsRemaining;
  modalTimerBlock.classList.remove("hidden"); // Render clock panel above question blocks
  
  nextQuestionSession();
  
  timedCountdownInterval = setInterval(() => {
    secondsRemaining--;
    modalTimerText.textContent = secondsRemaining;
    
    if (secondsRemaining <= 0) {
      endTimedPracticeSession();
    }
  }, 1000);
}

function endTimedPracticeSession() {
  clearInterval(timedCountdownInterval);
  timedCountdownInterval = null;
  modalTimerBlock.classList.add("hidden"); 

  const expGained = timedSessionCorrectCount * 2; 
  
  // 1. Show the summary results panel cleanly
  questionText.textContent = "⏱️ Time's Up!";
  feedbackText.classList.remove("hidden");
  feedbackText.className = "correct-msg";
  feedbackText.innerHTML = `Great job! You answered <strong>${timedSessionCorrectCount}</strong> questions correctly.<br>🎉 Gained <strong>+${expGained} EXP</strong>!`;
  
  // 2. Clear out old answer choice buttons
  choicesContainer.innerHTML = "";
  
  gainEXP(expGained);

  // 3. Generate the action button
  const menuReturnBtn = document.createElement("button");
  menuReturnBtn.className = "choice-btn";
  menuReturnBtn.textContent = "Return to Menu";
  menuReturnBtn.style.marginTop = "25px";
  
  menuReturnBtn.addEventListener("click", () => {
    feedbackText.classList.add("hidden"); 
    feedbackText.innerHTML = ""; // Completely wipe the text out of memory
    
    menuScreen.classList.remove("hidden");
    gameScreen.classList.add("hidden");
  });
  
  choicesContainer.appendChild(menuReturnBtn);
}

function gainEXP(amount) {
  currentEXP += amount;
  
  while (currentEXP >= expNeededForLevelUp) {
    currentEXP -= expNeededForLevelUp;
    playerLevel++;
    expNeededForLevelUp += 20; 
    alert(`🎉 LEVEL UP! You reached Level ${playerLevel}!`);
  }
  updateHUD();
}

function generateRandomQuestion() {
  const targetIndex = Math.floor(Math.random() * kanaBank.length);
  const target = kanaBank[targetIndex];
  
  let questionText = "";
  let correctAnswerText = "";
  let wrongChoicesPool = [];

  let isHiragana = true;
  if (currentMode === "katakana") isHiragana = false;
  if (currentMode === "free" || currentMode === "timed") isHiragana = Math.random() < 0.5;  
  const scriptName = isHiragana ? "Hiragana" : "Katakana";
  const kanaChar = isHiragana ? target.hiragana : target.katakana;

  if (currentMode === "matching") {
    // Mode C: Connection Matching 
    questionText = `Match the Hiragana character "${target.hiragana}" to its Katakana pair:`;
    correctAnswerText = target.katakana;
    wrongChoicesPool = kanaBank.filter(k => k.romaji !== target.romaji).map(k => k.katakana);
    
  } else {
    // Modes A & B: Sub-split into Identification vs Sound prompts
    const subType = Math.floor(Math.random() * 2);
    
    if (subType === 0) {
      questionText = `What sound does the ${scriptName} character "${kanaChar}" make?`;
      correctAnswerText = target.romaji;
      wrongChoicesPool = kanaBank.filter(k => k.romaji !== target.romaji).map(k => k.romaji);
    } else {
      questionText = `Which ${scriptName} character makes the sound "${target.romaji}"?`;
      correctAnswerText = kanaChar;
      wrongChoicesPool = kanaBank.filter(k => k.romaji !== target.romaji).map(k => isHiragana ? k.hiragana : k.katakana);
    }
  }

  // Shuffle selections array down to exactly 3 wrong items + 1 right choice
  wrongChoicesPool.sort(() => 0.5 - Math.random());
  const finalChoices = [correctAnswerText, wrongChoicesPool[0], wrongChoicesPool[1], wrongChoicesPool[2]];
  finalChoices.sort(() => 0.5 - Math.random()); 

  return { prompt: questionText, choices: finalChoices, correct: correctAnswerText };
}

function nextQuestionSession() {
  feedbackText.classList.add("hidden");
  choicesContainer.innerHTML = ""; 

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
    if (currentMode === "timed") {
      timedSessionCorrectCount++; 
    } else {
    totalCorrectAnswers++; }
    feedbackText.textContent = "✨ Great job! Your answer is correct.";
    feedbackText.className = "correct-msg";
    selectedButton.style.borderColor = "#2e7d32";
    selectedButton.style.backgroundColor = "#e8f5e9";
  } else {
    feedbackText.textContent = `❌ Not quite! The correct answer was "${currentQuestion.correct}".`;
    feedbackText.className = "wrong-msg";
    selectedButton.style.borderColor = "#c62828";
    selectedButton.style.backgroundColor = "#ffebee";
  }

  // If in timed mode, skip the manual "Next Question" click
  // It waits exactly 0.6 seconds so they see the feedback color, then auto-loads the next question
  if (currentMode === "timed") {
    setTimeout(() => {
      if (secondsRemaining > 0) nextQuestionSession();
    }, 600);
  } else {
    // Normal practice modes get the manual click button path
    const nextBtn = document.createElement("button");
    nextBtn.id = "modal-next-action-btn";
    nextBtn.textContent = "Next Question 👉";
    nextBtn.style.marginTop = "20px";
    nextBtn.style.padding = "10px 20px";
    nextBtn.className = "choice-btn"; 
    nextBtn.addEventListener("click", nextQuestionSession);
    choicesContainer.appendChild(nextBtn);
  }
}

// REFRESH STAT DATA COUNTERS
function updateHUD() {
  document.getElementById("hud-coins").textContent = playerWallet;
  document.getElementById("hud-level").textContent = playerLevel;
  document.getElementById("hud-exp").textContent = `${currentEXP}/${expNeededForLevelUp}`;
}

// plants n' stuff

// Represents the interactive soil plots on screen
let gardenPlots = [
  { id: 1, isPlanted: false, cropType: null, questionsAnswered: 0, currentStage: 0 },
  { id: 2, isPlanted: false, cropType: null, questionsAnswered: 0, currentStage: 0 },
  { id: 3, isPlanted: false, cropType: null, questionsAnswered: 0, currentStage: 0 }
];

function progressGardenGrowth() {
  gardenPlots.forEach(plot => {
    // Only grow plants that are currently seeded and not fully matured yet
    if (plot.isPlanted && plot.currentStage < seedCatalog[plot.cropType].maxStages) {
      plot.questionsAnswered++;
      
      const cropInfo = seedCatalog[plot.cropType];
      
      // Calculate if it's time to advance to the next sprite stage
      // e.g., if it needs 3 questions total and has 3 stages, it grows every 1 correct answer
      let questionsPerStage = cropInfo.requiredQuestions / cropInfo.maxStages;
      
      if (plot.questionsAnswered >= (plot.currentStage + 1) * questionsPerStage) {
        plot.currentStage++;
        console.log(`Plot ${plot.id}: Your ${cropInfo.name} grew to stage ${plot.currentStage}!`);
        
        // This is where the code will eventually swap the sprite image
        // plotElement.src = `${plot.cropType}_stage${plot.currentStage}.png`;
      }
    }
  });
}

// shop system

const seedCatalog = {
  carrot: {
    id: "carrot",
    name: "Carrot",
    buyPrice: 5,
    requiredQuestions: 3, // quick, early game starter
    sellPrice: 10,
    maxStages: 3          // e.g., seed, sprout, ready
  },
  tomato: {
    id: "tomato",
    name: "Tomato",
    buyPrice: 15,
    requiredQuestions: 5, // Mid-tier
    sellPrice: 30,
    maxStages: 4          // e.g., seed, sprout, stalk, ripe
  },
  corn: {
    id: "corn",
    name: "Corn",
    buyPrice: 30,
    requiredQuestions: 10, // Premium crop!
    sellPrice: 60,
    maxStages: 5          // e.g., seed, sprout, stalk, cob, ripe
  }
};

let playerWallet = 10; 
let playerInventory = {
  // Seeds available for planting
  carrotSeeds: 2, tomatoSeeds: 0, cornSeeds: 0,
  // Harvested mature crops available to sell
  harvestedCarrot: 2, harvestedTomato: 0, harvestedCorn: 0
};

let currentShopTab = "buy"; // 'buy' or 'sell'

const shopOpenBtn = document.getElementById("shop-btn");
const shopOverlay = document.getElementById("shop-modal-overlay");
const shopCloseBtn = document.getElementById("close-shop-btn");
const tabBuyBtn = document.getElementById("tab-buy-btn");
const tabSellBtn = document.getElementById("tab-sell-btn");
const itemsContainer = document.getElementById("shop-items-container");
const walletDisplay = document.getElementById("wallet-coins");

shopOpenBtn.addEventListener("click", () => {
  shopOverlay.classList.remove("hidden");
  isGamePaused = true; // Freeze walking input arrays
  updateShopUI();
});

shopCloseBtn.addEventListener("click", () => {
  shopOverlay.classList.add("hidden");
  isGamePaused = false; // Restore movement capabilities
});

tabBuyBtn.addEventListener("click", () => { switchTab("buy"); });
tabSellBtn.addEventListener("click", () => { switchTab("sell"); });

function switchTab(tabName) {
  currentShopTab = tabName;
  if (tabName === "buy") {
    tabBuyBtn.classList.add("active-tab");
    tabSellBtn.classList.remove("active-tab");
  } else {
    tabSellBtn.classList.add("active-tab");
    tabBuyBtn.classList.remove("active-tab");
  }
  updateShopUI();
}

function updateShopUI() {
  walletDisplay.textContent = playerWallet; // Refresh coin display text
  itemsContainer.innerHTML = ""; // Clear existing elements

  Object.values(seedCatalog).forEach(crop => {
    const card = document.createElement("div");
    card.classList.add("shop-card");

    if (currentShopTab === "buy") {
      // --- BUY TAB INTERFACE ---
      const ownedSeeds = playerInventory[`${crop.id}Seeds`] || 0;
      card.innerHTML = `
        <h3>${crop.name}</h3>
        <p>Price: ${crop.buyPrice} 🪙</p>
        <p>Owned: ${ownedSeeds}</p>
        <button class="shop-action-btn">Buy 1</button>
      `;
      // later going to add a thing where you can buy multiple at a time
      const buyActionBtn = card.querySelector("button");
      if (playerWallet < crop.buyPrice) buyActionBtn.disabled = true; // Disable if poor
      buyActionBtn.addEventListener("click", () => buySeedItem(crop));
      
    } else {
      // --- SELL TAB INTERFACE ---
      const ownedCrops = playerInventory[`harvested${crop.id.charAt(0).toUpperCase() + crop.id.slice(1)}`] || 0;
      card.innerHTML = `
        <h3>Ripe ${crop.name.replace(" Seed", "")}</h3>
        <p>Value: ${crop.sellPrice} 🪙</p>
        <p>In Bag: ${ownedCrops}</p>
        <button class="shop-action-btn" style="background-color: #4CAF50;">Sell 1</button>
      `;
      
      const sellActionBtn = card.querySelector("button");
      if (ownedCrops <= 0) sellActionBtn.disabled = true; // Disable if none owned
      sellActionBtn.addEventListener("click", () => sellCropItem(crop));
    }

    itemsContainer.appendChild(card);
  });
}

function buySeedItem(crop) {
  if (playerWallet >= crop.buyPrice) {
    playerWallet -= crop.buyPrice;
    playerInventory[`${crop.id}Seeds`]++;
    updateShopUI();
  }
}

function sellCropItem(crop) {
  const cropKey = `harvested${crop.id.charAt(0).toUpperCase() + crop.id.slice(1)}`;
  if (playerInventory[cropKey] > 0) {
    playerInventory[cropKey]--;
    playerWallet += crop.sellPrice;
    updateShopUI();
  }
}