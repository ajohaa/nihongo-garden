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

function isTextInput(target) {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target.isContentEditable;
}

const backgroundMusic = document.getElementById("background-music");
const musicSlider = document.getElementById("music-slider");
let musicStarted = false;

backgroundMusic.volume = Number(musicSlider.value) / 100;

function startBackgroundMusic() {
  if (musicStarted) return;

  backgroundMusic.play().then(() => {
    musicStarted = true;
    document.removeEventListener("pointerdown", startBackgroundMusic);
    document.removeEventListener("keydown", startBackgroundMusic);
  }).catch(() => {
    // Playback will be retried on the next user interaction if the browser blocks it.
  });
}

musicSlider.addEventListener("input", () => {
  backgroundMusic.volume = Number(musicSlider.value) / 100;
});

document.addEventListener("pointerdown", startBackgroundMusic);
document.addEventListener("keydown", startBackgroundMusic);

window.addEventListener("keydown", (event) => {
  if (isTextInput(event.target)) return;

  if (event.key.toLowerCase() === "e") {
    toggleInventory();
    return;
  }

  if (event.key.toLowerCase() === "f") {
    if (nearbyInteraction?.type === "harvest") harvestCrop(nearbyInteraction.plotId, nearbyInteraction.slotIndex);
    return;
  }

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
const mainScene = document.getElementById("main-scene");
const world = document.getElementById("world");
const playerWidth = 35;
const playerHeight = 35;
let player = {
  x: (world.clientWidth - playerWidth) / 2,
  y: (world.clientHeight - playerHeight) / 2,
  speed: 5
};
let camera = { x: 0, y: 0 };
let lastAngle = '180';
let animationFrame = 0;
let animationTimer = 0;
const ANIMATION_SPEED = 6; // Higher = slower switching (e.g., switch frame every 10 ticks)

function isPlayerPositionBlocked(x, y) {
  const worldRect = world.getBoundingClientRect();
  const playerRect = {
    left: x,
    top: y,
    right: x + playerWidth,
    bottom: y + playerHeight
  };

  return Array.from(document.querySelectorAll(".garden-plot")).some(plotElement => {
    const plotRect = plotElement.getBoundingClientRect();
    const plotBounds = {
      left: plotRect.left - worldRect.left,
      top: plotRect.top - worldRect.top,
      right: plotRect.right - worldRect.left,
      bottom: plotRect.bottom - worldRect.top
    };

    return playerRect.left < plotBounds.right
      && playerRect.right > plotBounds.left
      && playerRect.top < plotBounds.bottom
      && playerRect.bottom > plotBounds.top;
  });
}

function updateCamera() {
  const maximumCameraX = Math.min(0, mainScene.clientWidth - world.clientWidth);
  const maximumCameraY = Math.min(0, mainScene.clientHeight - world.clientHeight);

  const deadZone = {
    left: mainScene.clientWidth * 0.25,
    right: mainScene.clientWidth * 0.75,
    top: mainScene.clientHeight * 0.25,
    bottom: mainScene.clientHeight * 0.75
  };
  const playerScreenLeft = player.x + camera.x;
  const playerScreenTop = player.y + camera.y;
  const playerScreenRight = playerScreenLeft + playerWidth;
  const playerScreenBottom = playerScreenTop + playerHeight;

  if (playerScreenLeft < deadZone.left) {
    camera.x += deadZone.left - playerScreenLeft;
  } else if (playerScreenRight > deadZone.right) {
    camera.x -= playerScreenRight - deadZone.right;
  }

  if (playerScreenTop < deadZone.top) {
    camera.y += deadZone.top - playerScreenTop;
  } else if (playerScreenBottom > deadZone.bottom) {
    camera.y -= playerScreenBottom - deadZone.bottom;
  }

  camera.x = Math.max(maximumCameraX, Math.min(0, camera.x));
  camera.y = Math.max(maximumCameraY, Math.min(0, camera.y));
  world.style.transform = `translate(${camera.x}px, ${camera.y}px)`;
}

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

    // Resolve each axis independently so the player can slide along plot edges.
    const nextX = player.x + dx * player.speed;
    const nextY = player.y + dy * player.speed;
    if (!isPlayerPositionBlocked(nextX, player.y)) player.x = nextX;
    if (!isPlayerPositionBlocked(player.x, nextY)) player.y = nextY;

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

      // Keep the player fully inside the world.
      const minimumPlayerX = 0;
      const maximumPlayerX = world.clientWidth - playerWidth;
      const minimumPlayerY = 0;
      const maximumPlayerY = world.clientHeight - playerHeight;

      if (player.x < minimumPlayerX) player.x = minimumPlayerX;
      if (player.x > maximumPlayerX) {
        player.x = maximumPlayerX;
      }

      if (player.y < minimumPlayerY) player.y = minimumPlayerY;
      if (player.y > maximumPlayerY) {
        player.y = maximumPlayerY;
      }

      // Position the wrapper and handle the horizontal left-flip transform
      playerWrapper.style.transform = `translate(${player.x}px, ${player.y}px) scaleX(${shouldFlip ? -1 : 1})`;
      updateCamera();
      updateInteractionPrompt();
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

let playerLevel = 1;
const maxPlayerLevel = 25;
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
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const saveGameBtn = document.getElementById("save-game-btn");
const kanaReferenceBtn = document.getElementById("kana-reference-btn");
const kanaReferenceOverlay = document.getElementById("kana-reference-overlay");
const closeKanaReferenceBtn = document.getElementById("close-kana-reference-btn");
const kanaReferenceGrid = document.getElementById("kana-reference-grid");
const closeBtn = document.getElementById("close-modal-btn");
const menuScreen = document.getElementById("mode-selection-menu");
const gameScreen = document.getElementById("question-gameplay-screen");
const questionText = document.getElementById("question-text");
const choicesContainer = document.getElementById("choices-container");
const feedbackText = document.getElementById("feedback-text");

const modalTimerBlock = document.getElementById("modal-timer");
const modalTimerText = document.getElementById("modal-timer-countdown");

settingsBtn.addEventListener("click", () => {
  settingsPanel.classList.remove("hidden");
  isGamePaused = true;
});

closeSettingsBtn.addEventListener("click", () => {
  settingsPanel.classList.add("hidden");
  isGamePaused = false;
});

openBtn.addEventListener("click", openQuizModal);
closeBtn.addEventListener("click", closeQuizModal);
kanaReferenceBtn.addEventListener("click", openKanaReference);
closeKanaReferenceBtn.addEventListener("click", closeKanaReference);

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
    const confirmExit = confirm("⚠️ Are you sure you want to exit early? You will not gain any EXP for this session!");
    
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
  updateInteractionPrompt();
  updateHUD();
}

function openKanaReference() {
  if (!overlay.classList.contains("hidden")) return;

  kanaReferenceGrid.innerHTML = "";
  const kanaRows = [
    ["a", "i", "u", "e", "o"],
    ["ka", "ki", "ku", "ke", "ko"],
    ["sa", "shi", "su", "se", "so"],
    ["ta", "chi", "tsu", "te", "to"],
    ["na", "ni", "nu", "ne", "no"],
    ["ha", "hi", "fu", "he", "ho"],
    ["ma", "mi", "mu", "me", "mo"],
    ["ya", "yu", "yo"],
    ["ra", "ri", "ru", "re", "ro"],
    ["wa", "wo", "n"]
  ];

  kanaRows.forEach(rowRomaji => {
    const row = document.createElement("div");
    row.className = "kana-reference-row";

    rowRomaji.forEach(romaji => {
      const kana = kanaBank.find(entry => entry.romaji === romaji);
      if (!kana) return;

      const referenceItem = document.createElement("div");
      referenceItem.className = "kana-reference-item";
      referenceItem.innerHTML = `
        <span class="kana-character">${kana.hiragana}</span>
        <span class="kana-character">${kana.katakana}</span>
        <span class="kana-romaji">${kana.romaji}</span>
      `;
      row.appendChild(referenceItem);
    });

    kanaReferenceGrid.appendChild(row);
  });

  kanaReferenceOverlay.classList.remove("hidden");
  isGamePaused = true;
}

function closeKanaReference() {
  kanaReferenceOverlay.classList.add("hidden");
  isGamePaused = false;
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
  
  questionText.textContent = "⏱️ Time's Up!";
  feedbackText.classList.remove("hidden");
  feedbackText.className = "correct-msg";
  feedbackText.innerHTML = `Great job! You answered <strong>${timedSessionCorrectCount}</strong> questions correctly.<br>🎉 Gained <strong>+${expGained} EXP</strong>!`;
  choicesContainer.innerHTML = "";
  
  gainEXP(expGained);

  const menuReturnBtn = document.createElement("button");
  menuReturnBtn.className = "choice-btn";
  menuReturnBtn.textContent = "Return to Menu";
  menuReturnBtn.style.marginTop = "25px";
  
  menuReturnBtn.addEventListener("click", () => {
    feedbackText.classList.add("hidden"); 
    feedbackText.innerHTML = "";
    
    menuScreen.classList.remove("hidden");
    gameScreen.classList.add("hidden");
  });
  
  choicesContainer.appendChild(menuReturnBtn);
}

function gainEXP(amount) {
  currentEXP += amount;
  
  while (currentEXP >= expNeededForLevelUp) {
    if (playerLevel >= maxPlayerLevel) {
      currentEXP = 0;
      break;
    }
    currentEXP -= expNeededForLevelUp;
    playerLevel++;
    expNeededForLevelUp += 20; 
    showLevelUpPopup();
  }
  updateHUD();
}

function showLevelUpPopup() {
  const levelUpOverlay = document.getElementById("level-up-overlay");
  const levelUpMessage = document.getElementById("level-up-message");
  const unlockedCropsContainer = document.getElementById("unlocked-crops-container");

  levelUpMessage.textContent = `You reached Level ${playerLevel}!`;
  unlockedCropsContainer.innerHTML = "";

  const unlockedCrops = Object.values(seedCatalog)
    .filter(crop => crop.unlockLevel === playerLevel)
    .sort((firstCrop, secondCrop) => firstCrop.name.localeCompare(secondCrop.name));

  if (unlockedCrops.length === 0) {
    unlockedCropsContainer.textContent = "No new crops at this level.";
  } else {
    unlockedCrops.forEach(crop => {
      const cropElement = document.createElement("div");
      cropElement.className = "unlocked-crop";
      cropElement.innerHTML = `
        <img src="crops, seeds, signs, items/${crop.id}-item.png" alt="${crop.name}">
        <span>${crop.name}</span>
      `;
      unlockedCropsContainer.appendChild(cropElement);
    });
  }

  levelUpOverlay.classList.remove("hidden");
  isGamePaused = true;
}

document.getElementById("level-up-close-btn").addEventListener("click", () => {
  document.getElementById("level-up-overlay").classList.add("hidden");
  isGamePaused = false;
});

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
      totalCorrectAnswers++;
      progressGardenGrowth();
    }
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
const dirtTileImages = [
  "dirt/dirt_01.png",
  "dirt/dirt_03.png",
  "dirt/dirt_06.png",
  "dirt/dirt_08.png"
];
const maxGardenPlots = 6;
const plotUpgrades = [
  { plotNumber: 2, unlockLevel: 5, price: 200 },
  { plotNumber: 3, unlockLevel: 10, price: 400 },
  { plotNumber: 4, unlockLevel: 15, price: 600 },
  { plotNumber: 5, unlockLevel: 20, price: 800 },
  { plotNumber: 6, unlockLevel: 25, price: 1000 }
];
const interactionDistance = 90;
const plotsContainer = document.getElementById("plots-container");
let nearbyInteraction = null;
let plantingTarget = null;

function createGardenPlot(id) {
  return { id, plants: [null, null, null, null] };
}

let gardenPlots = [createGardenPlot(1)];
gardenPlots[0].plants[0] = {
  cropType: "wheat",
  image: "crops, seeds, signs, items/wheat4.png",
  questionsAnswered: 3,
  currentStage: 3
};

function getCropTier(cropOrId) {
  const crop = typeof cropOrId === "string" ? seedCatalog[cropOrId] : cropOrId;
  if (!crop || !Number.isFinite(crop.unlockLevel)) return 1;
  return Math.max(1, Math.ceil(crop.unlockLevel / 5));
}

function createTierCrop({ id, name, buyPrice, unlockLevel }) {
  const tier = Math.ceil(unlockLevel / 5);
  const questionsPerTier = 3;
  const requiredQuestions = tier * questionsPerTier;
  const maxStages = 4; // Seed + 3 growth stages before harvest

  return {
    id,
    name,
    buyPrice,
    sellPrice: buyPrice + (tier * 2),
    requiredQuestions,
    maxStages,
    unlockLevel
  };
}

function getCropHarvestReward(cropOrId) {
  return getCropTier(cropOrId);
}

function getStageImage(cropType, stage) {
  return `crops, seeds, signs, items/${cropType}${Math.max(1, Math.min(stage, 4))}.png`;
}

function renderGardenPlots() {
  plotsContainer.innerHTML = "";
  const plotRow = document.createElement("div");
  plotRow.className = "plot-row";

  gardenPlots.slice(0, maxGardenPlots).forEach(plot => {
    const plotColumn = document.createElement("div");
    plotColumn.className = "plot-slot";

    const plotElement = document.createElement("div");
    plotElement.className = "garden-plot";
    plotElement.dataset.plotId = plot.id;

    plot.plants.forEach((plant, slotIndex) => {
      const plantWrapper = document.createElement("div");
      plantWrapper.className = "plant-wrapper";
      plantWrapper.dataset.plotId = plot.id;
      plantWrapper.dataset.slotIndex = slotIndex;
      plantWrapper.style.backgroundImage = `url("${dirtTileImages[slotIndex]}")`;

      if (plant?.image) {
        const cropImage = document.createElement("img");
        cropImage.className = "crop-image";
        cropImage.src = plant.image;
        cropImage.alt = plant.cropType || "Growing crop";
        plantWrapper.appendChild(cropImage);
      }

      const interactionButton = document.createElement("button");
      interactionButton.className = "plot-interaction-btn hidden";
      interactionButton.type = "button";
      interactionButton.addEventListener("click", () => handleNearbyInteraction(plot.id, slotIndex));
      plantWrapper.appendChild(interactionButton);

      if (plantingTarget && !plant) {
        plantWrapper.classList.add("planting-slot");
        plantWrapper.addEventListener("click", () => {
          plantCrop(plot.id, slotIndex, plantingTarget.cropType);
        });
      }

      plotElement.appendChild(plantWrapper);
    });

    plotColumn.appendChild(plotElement);
    plotRow.appendChild(plotColumn);
  });

  plotsContainer.appendChild(plotRow);
  requestAnimationFrame(() => {
    if (typeof seedCatalog !== "undefined") updateInteractionPrompt();
  });
}

function getPlotPlant(plotId, slotIndex) {
  const plot = gardenPlots.find(currentPlot => currentPlot.id === plotId);
  return plot?.plants[slotIndex] || null;
}

function plantCrop(plotId, slotIndex, cropType, image = getStageImage(cropType, 1)) {
  const plot = gardenPlots.find(currentPlot => currentPlot.id === plotId);
  const crop = seedCatalog[cropType];
  const seedKey = `${cropType}Seeds`;
  if (!plot || !crop || slotIndex < 0 || slotIndex >= dirtTileImages.length
    || plot.plants[slotIndex] || !playerInventory[seedKey]
    || plantingTarget?.cropType !== cropType) return false;

  plot.plants[slotIndex] = {
    cropType,
    image,
    questionsAnswered: 0,
    currentStage: 0
  };
  playerInventory[seedKey]--;
  if (playerInventory[seedKey] <= 0) plantingTarget = null;
  inventoryPanel.classList.add("hidden");
  isGamePaused = false;
  renderGardenPlots();
  renderInventory();
  return true;
}

function harvestCrop(plotId, slotIndex) {
  const plant = getPlotPlant(plotId, slotIndex);
  if (!plant || !seedCatalog[plant.cropType] || plant.currentStage < seedCatalog[plant.cropType].maxStages - 1
    || !hasInventorySpace()) return false;

  const cropInfo = seedCatalog[plant.cropType];
  const plot = gardenPlots.find(currentPlot => currentPlot.id === plotId);
  const plantWrapper = document.querySelector(`.plant-wrapper[data-plot-id="${plotId}"][data-slot-index="${slotIndex}"]`);
  const harvestedKey = `harvested${plant.cropType.charAt(0).toUpperCase()}${plant.cropType.slice(1)}`;
  plot.plants[slotIndex] = null;
  playerInventory[harvestedKey] = (playerInventory[harvestedKey] || 0) + 1;
  gainEXP(getCropHarvestReward(cropInfo));
  showHarvestEXP(plantWrapper, getCropHarvestReward(cropInfo));
  nearbyInteraction = null;
  renderGardenPlots();
  renderInventory();
  return true;
}

function showHarvestEXP(plantWrapper, expValue = 1) {
  if (!plantWrapper) return;

  const sceneRect = mainScene.getBoundingClientRect();
  const plantRect = plantWrapper.getBoundingClientRect();
  const expPopup = document.createElement("span");
  expPopup.className = "harvest-exp-popup";
  expPopup.textContent = `+${expValue}⚡`;
  expPopup.style.left = `${plantRect.left - sceneRect.left + plantRect.width / 2}px`;
  expPopup.style.top = `${plantRect.top - sceneRect.top + plantRect.height / 2}px`;
  mainScene.appendChild(expPopup);
  expPopup.addEventListener("animationend", () => expPopup.remove(), { once: true });
}

function handleNearbyInteraction(plotId, slotIndex) {
  const interaction = nearbyInteraction;
  if (!interaction || interaction.plotId !== plotId || interaction.slotIndex !== slotIndex) return;
  if (interaction.type === "harvest") harvestCrop(plotId, slotIndex);
}

function updateInteractionPrompt() {
  const playerElement = document.getElementById("player");
  if (!playerElement) return;

  const playerRect = playerElement.getBoundingClientRect();
  const playerCenter = {
    x: playerRect.left + playerRect.width / 2,
    y: playerRect.top + playerRect.height / 2
  };
  let closestInteraction = null;
  let closestDistance = interactionDistance;

  document.querySelectorAll(".plant-wrapper").forEach(wrapper => {
    const plotId = Number(wrapper.dataset.plotId);
    const slotIndex = Number(wrapper.dataset.slotIndex);
    const plant = getPlotPlant(plotId, slotIndex);
    const wrapperRect = wrapper.getBoundingClientRect();
    const slotCenter = {
      x: wrapperRect.left + wrapperRect.width / 2,
      y: wrapperRect.top + wrapperRect.height / 2
    };
    const distance = Math.hypot(playerCenter.x - slotCenter.x, playerCenter.y - slotCenter.y);
    let type = null;

    if (plant && seedCatalog[plant.cropType] && plant.currentStage >= seedCatalog[plant.cropType].maxStages - 1
      && hasInventorySpace() && distance <= closestDistance) type = "harvest";
    if (!type) return;

    closestDistance = distance;
    closestInteraction = { type, plotId, slotIndex, wrapper };
  });

  document.querySelectorAll(".plot-interaction-btn").forEach(button => {
    button.classList.add("hidden");
  });
  document.querySelectorAll(".plant-wrapper").forEach(wrapper => {
    wrapper.classList.remove("interaction-active");
  });

  nearbyInteraction = closestInteraction;
  if (closestInteraction) {
    const button = closestInteraction.wrapper.querySelector(".plot-interaction-btn");
    button.textContent = "(F) Harvest";
    button.classList.remove("hidden");
    closestInteraction.wrapper.classList.add("interaction-active");
  }
}

renderGardenPlots();

function progressGardenGrowth() {
  gardenPlots.forEach(plot => {
    plot.plants.forEach(plant => {
      const cropInfo = plant && seedCatalog[plant.cropType];
      if (!cropInfo || !Number.isFinite(cropInfo.requiredQuestions) || plant.currentStage >= cropInfo.maxStages - 1) return;

      plant.questionsAnswered++;
      const questionsPerStage = cropInfo.requiredQuestions / (cropInfo.maxStages - 1);

      if (plant.questionsAnswered >= (plant.currentStage + 1) * questionsPerStage) {
        plant.currentStage++;
        plant.image = getStageImage(plant.cropType, plant.currentStage + 1);
        console.log(`${cropInfo.name} grew to stage ${plant.currentStage}!`);
      }
    });
  });
  renderGardenPlots();
  updateInteractionPrompt();
}

// shop system

const seedCatalog = {
  // Tier 1: Levels 1-5 | 3 questions each | +1 EXP harvest
  wheat: createTierCrop({ id: "wheat", name: "Wheat", buyPrice: 5, unlockLevel: 1 }),
  potato: createTierCrop({ id: "potato", name: "Potato", buyPrice: 6, unlockLevel: 2 }),
  turnip: createTierCrop({ id: "turnip", name: "Turnip", buyPrice: 7, unlockLevel: 3 }),
  carrot: createTierCrop({ id: "carrot", name: "Carrot", buyPrice: 8, unlockLevel: 4 }),
  lettuce: createTierCrop({ id: "lettuce", name: "Lettuce", buyPrice: 9, unlockLevel: 5 }),

  // Tier 2: Levels 6-10 | 6 questions each | +2 EXP harvest
  tomato: createTierCrop({ id: "tomato", name: "Tomato", buyPrice: 10, unlockLevel: 6 }),
  corn: createTierCrop({ id: "corn", name: "Corn", buyPrice: 11, unlockLevel: 7 }),
  celery: createTierCrop({ id: "celery", name: "Celery", buyPrice: 12, unlockLevel: 8 }),
  greenbeans: createTierCrop({ id: "greenbeans", name: "Green Beans", buyPrice: 13, unlockLevel: 9 }),
  blackberry: createTierCrop({ id: "blackberry", name: "Blackberry", buyPrice: 14, unlockLevel: 10 }),

  // Tier 3: Levels 11-15 | 9 questions each | +3 EXP harvest
  leek: createTierCrop({ id: "leek", name: "Leek", buyPrice: 15, unlockLevel: 11 }),
  broccoli: createTierCrop({ id: "broccoli", name: "Broccoli", buyPrice: 16, unlockLevel: 12 }),
  redonion: createTierCrop({ id: "redonion", name: "Red Onion", buyPrice: 17, unlockLevel: 13 }),
  garlic: createTierCrop({ id: "garlic", name: "Garlic", buyPrice: 18, unlockLevel: 14 }),
  strawberry: createTierCrop({ id: "strawberry", name: "Strawberry", buyPrice: 19, unlockLevel: 15 }),

  // Tier 4: Levels 16-20 | 12 questions each | +4 EXP harvest
  cauliflower: createTierCrop({ id: "cauliflower", name: "Cauliflower", buyPrice: 20, unlockLevel: 16 }),
  beetroot: createTierCrop({ id: "beetroot", name: "Beetroot", buyPrice: 21, unlockLevel: 17 }),
  redpepper: createTierCrop({ id: "redpepper", name: "Red Pepper", buyPrice: 22, unlockLevel: 18 }),
  asparagus: createTierCrop({ id: "asparagus", name: "Asparagus", buyPrice: 23, unlockLevel: 19 }),
  pumpkin: createTierCrop({ id: "pumpkin", name: "Pumpkin", buyPrice: 24, unlockLevel: 20 }),

  // Tier 5: Levels 21-25 | 15 questions each | +5 EXP harvest
  redcabbage: createTierCrop({ id: "redcabbage", name: "Red Cabbage", buyPrice: 25, unlockLevel: 21 }),
  zucchini: createTierCrop({ id: "zucchini", name: "Zucchini", buyPrice: 26, unlockLevel: 22 }),
  raspberry: createTierCrop({ id: "raspberry", name: "Raspberry", buyPrice: 27, unlockLevel: 23 }),
  chili: createTierCrop({ id: "chili", name: "Chili", buyPrice: 28, unlockLevel: 24 }),
  sunflower: createTierCrop({ id: "sunflower", name: "Sunflower", buyPrice: 29, unlockLevel: 25 })
};

let playerWallet = 10; 
let playerInventory = {
  // Seeds available for planting
  wheatSeeds: 0,
  // Harvested mature crops available to sell
  harvestedWheat: 0
};

const inventoryCapacity = 8;
const inventoryButton = document.getElementById("inventory-btn");
const inventoryPanel = document.getElementById("inventory-panel");
const inventorySlots = document.getElementById("inventory-slots");

function getInventoryItems() {
  const items = [];

  Object.values(seedCatalog).forEach(crop => {
    const seedCount = playerInventory[`${crop.id}Seeds`] || 0;
    const harvestedCount = getHarvestedCropCount(crop);

    if (seedCount > 0) {
      items.push({ crop, kind: "seed", count: seedCount, image: `crops, seeds, signs, items/${crop.id}-seeds.png`, label: `${crop.name} seed` });
    }
    if (harvestedCount > 0) {
      items.push({ crop, kind: "harvested", count: harvestedCount, image: `crops, seeds, signs, items/${crop.id}-item.png`, label: crop.name });
    }
  });

  return items.slice(0, inventoryCapacity);
}

function hasInventorySpace() {
  return getInventoryItems().length < inventoryCapacity;
}

function renderInventory() {
  inventorySlots.innerHTML = "";
  const ownedItems = getInventoryItems();

  for (let slotIndex = 0; slotIndex < inventoryCapacity; slotIndex++) {
    const inventoryItem = document.createElement("div");
    inventoryItem.className = "inventory-item";

    const slot = document.createElement("div");
    slot.className = "inventory-slot";

    const item = ownedItems[slotIndex];
    if (item) {
      const itemImage = document.createElement("img");
      itemImage.src = item.image;
      itemImage.alt = item.label;
      itemImage.title = item.label;
      slot.appendChild(itemImage);

      const quantity = document.createElement("span");
      quantity.className = "inventory-quantity";
      quantity.textContent = item.count;
      inventoryItem.appendChild(quantity);

      if (!plantingTarget && item.kind === "seed") {
        slot.classList.add("planting-choice");
        slot.title = `Plant ${item.label}`;
        slot.addEventListener("click", () => {
          plantingTarget = { cropType: item.crop.id };
          inventoryPanel.classList.add("hidden");
          isGamePaused = false;
          renderGardenPlots();
        });
      }
    }

    inventoryItem.prepend(slot);
    inventorySlots.appendChild(inventoryItem);
  }
}

function toggleInventory() {
  if (plantingTarget) {
    plantingTarget = null;
    inventoryPanel.classList.add("hidden");
    isGamePaused = false;
    renderGardenPlots();
    return;
  }

  inventoryPanel.classList.toggle("hidden");
  if (!inventoryPanel.classList.contains("hidden")) {
    isGamePaused = true;
    renderInventory();
  } else {
    isGamePaused = false;
  }
}

inventoryButton.addEventListener("click", toggleInventory);

renderInventory();
updateHUD();

let currentShopTab = "buy"; // 'buy' or 'sell'
const buyQuantities = {};

const shopOpenBtn = document.getElementById("shop-btn");
const shopOverlay = document.getElementById("shop-modal-overlay");
const shopCloseBtn = document.getElementById("close-shop-btn");
const tabBuyBtn = document.getElementById("tab-buy-btn");
const tabSellBtn = document.getElementById("tab-sell-btn");
const itemsContainer = document.getElementById("shop-items-container");
const walletDisplay = document.getElementById("wallet-coins");
const shopSearchInput = document.getElementById("shop-search");

shopOpenBtn.addEventListener("click", () => {
  shopOverlay.classList.remove("hidden");
  isGamePaused = true; // Freeze walking input arrays
  updateShopUI();
});

shopCloseBtn.addEventListener("click", () => {
  shopOverlay.classList.add("hidden");
  isGamePaused = false; // Restore movement capabilities
  updateInteractionPrompt();
});

tabBuyBtn.addEventListener("click", () => { switchTab("buy"); });
tabSellBtn.addEventListener("click", () => { switchTab("sell"); });
shopSearchInput.addEventListener("input", updateShopUI);

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

  const searchTerm = shopSearchInput.value.trim().toLowerCase();
  const isBuyTab = currentShopTab === "buy";

  const nextPlot = plotUpgrades[gardenPlots.length - 1];
  if (isBuyTab && nextPlot && playerLevel >= nextPlot.unlockLevel
    && (searchTerm === "" || `garden plot ${nextPlot.plotNumber}`.includes(searchTerm))) {
    const plotCard = document.createElement("div");
    plotCard.className = "shop-card shop-upgrade-card";
    const canBuyPlot = playerWallet >= nextPlot.price;
    plotCard.innerHTML = `
      <h3>Garden Plot ${nextPlot.plotNumber}</h3>
      <p>Price: ${nextPlot.price} 🪙</p>
      <p>${canBuyPlot ? "Available" : "Not enough coins"}</p>
      <button class="shop-action-btn">Buy Plot</button>
    `;
    const plotActionButton = plotCard.querySelector("button");
    plotActionButton.disabled = !canBuyPlot;
    plotActionButton.addEventListener("click", buyNextGardenPlot);
    itemsContainer.appendChild(plotCard);
  }

  const crops = Object.values(seedCatalog)
    .filter(crop => {
      const hasPrice = isBuyTab ? Number.isFinite(crop.buyPrice) : Number.isFinite(crop.sellPrice);
      const isUnlocked = Number.isFinite(crop.unlockLevel) && playerLevel >= crop.unlockLevel;
      return hasPrice && isUnlocked && crop.name.toLowerCase().includes(searchTerm);
    })
    .sort((firstCrop, secondCrop) => {
      const firstConfigured = isBuyTab
        ? Number.isFinite(firstCrop.buyPrice)
        : Number.isFinite(firstCrop.sellPrice);
      const secondConfigured = isBuyTab
        ? Number.isFinite(secondCrop.buyPrice)
        : Number.isFinite(secondCrop.sellPrice);
      const firstOwned = isBuyTab ? 0 : getHarvestedCropCount(firstCrop);
      const secondOwned = isBuyTab ? 0 : getHarvestedCropCount(secondCrop);

      return Number(secondConfigured) - Number(firstConfigured)
        || secondOwned - firstOwned
        || firstCrop.unlockLevel - secondCrop.unlockLevel
        || firstCrop.name.localeCompare(secondCrop.name);
    });

  if (crops.length === 0 && itemsContainer.children.length === 0) {
    itemsContainer.innerHTML = '<p class="shop-empty-message">No crops match your search.</p>';
    return;
  }

  crops.forEach(crop => {
    const card = document.createElement("div");
    card.classList.add("shop-card");

    if (currentShopTab === "buy") {
      // --- BUY TAB INTERFACE ---
      const ownedSeeds = playerInventory[`${crop.id}Seeds`] || 0;
      const hasBuyPrice = Number.isFinite(crop.buyPrice);
      const buyQuantity = buyQuantities[crop.id] || 1;
      const hasInsufficientFunds = hasBuyPrice && playerWallet < crop.buyPrice * buyQuantity;
      card.innerHTML = `
      <img src="crops, seeds, signs, items/${crop.id}-seeds.png" alt="${crop.name} Seed" style="width: 80px; height: 80px; object-fit: contain; image-rendering: pixelated;">
        <h3>${crop.name} Seed</h3>
        <p>Price: ${hasBuyPrice ? `${crop.buyPrice} 🪙` : "Unavailable"}</p>
        <p>Owned: ${ownedSeeds}</p>
        <div class="buy-quantity-controls">
          <button class="quantity-btn" type="button" aria-label="Decrease purchase quantity">-</button>
          <button class="shop-action-btn">${hasBuyPrice ? `Buy ${buyQuantity}` : "Locked"}</button>
          <button class="quantity-btn" type="button" aria-label="Increase purchase quantity">+</button>
        </div>
        ${hasInsufficientFunds ? '<p class="insufficient-funds-message">Insufficient funds</p>' : ""}
      `;
      const decreaseQuantityBtn = card.querySelector(".quantity-btn");
      const buyActionBtn = card.querySelector(".shop-action-btn");
      const increaseQuantityBtn = card.querySelectorAll(".quantity-btn")[1];
      const canStoreSeeds = ownedSeeds > 0 || hasInventorySpace();
      const canBuyQuantity = hasBuyPrice && canStoreSeeds && playerWallet >= crop.buyPrice * buyQuantity;
      const canPurchaseCrop = hasBuyPrice && playerLevel >= crop.unlockLevel
        && canStoreSeeds && playerWallet >= crop.buyPrice;
      decreaseQuantityBtn.disabled = buyQuantity <= 1 || !canPurchaseCrop;
      buyActionBtn.disabled = !canBuyQuantity;
      increaseQuantityBtn.disabled = !canPurchaseCrop;
      decreaseQuantityBtn.addEventListener("click", () => {
        buyQuantities[crop.id] = Math.max(1, buyQuantity - 1);
        updateShopUI();
      });
      increaseQuantityBtn.addEventListener("click", () => {
        buyQuantities[crop.id] = buyQuantity + 1;
        updateShopUI();
      });
      buyActionBtn.addEventListener("click", () => buySeedItem(crop, buyQuantity));
      
    } else {
      // --- SELL TAB INTERFACE ---
      const ownedCrops = getHarvestedCropCount(crop);
      const hasSellPrice = Number.isFinite(crop.sellPrice);
      card.innerHTML = `
        <img src="crops, seeds, signs, items/${crop.id}-item.png" alt="${crop.name} Crop" style="width: 80px; height: 80px; object-fit: contain; image-rendering: pixelated;">
        <h3>${crop.name.replace(" Seed", "")}</h3>
        <p>Value: ${hasSellPrice ? `${crop.sellPrice} 🪙` : "Unavailable"}</p>
        <p>In Bag: ${ownedCrops}</p>
        <button class="shop-action-btn shop-sell-action-btn">${hasSellPrice ? "Sell 1" : "Locked"}</button>
      `;
      
      const sellActionBtn = card.querySelector("button");
      if (!hasSellPrice || ownedCrops <= 0) sellActionBtn.disabled = true; // Disable un-configured crops or empty inventory
      sellActionBtn.addEventListener("click", () => sellCropItem(crop));
    }

    itemsContainer.appendChild(card);
  });
}

function buyNextGardenPlot() {
  const nextPlot = plotUpgrades[gardenPlots.length - 1];
  if (!nextPlot || playerLevel < nextPlot.unlockLevel || playerWallet < nextPlot.price) return;

  playerWallet -= nextPlot.price;
  gardenPlots.push(createGardenPlot(nextPlot.plotNumber));
  updateHUD();
  renderGardenPlots();
  updateShopUI();
}

function getHarvestedCropCount(crop) {
  const cropKey = `harvested${crop.id.charAt(0).toUpperCase() + crop.id.slice(1)}`;
  return playerInventory[cropKey] || 0;
}

function buySeedItem(crop, quantity = 1) {
  const seedKey = `${crop.id}Seeds`;
  const ownedSeeds = playerInventory[seedKey] || 0;
  const canStoreSeeds = ownedSeeds > 0 || hasInventorySpace();
  if (Number.isFinite(crop.buyPrice) && Number.isFinite(crop.unlockLevel)
    && playerLevel >= crop.unlockLevel && playerWallet >= crop.buyPrice * quantity && canStoreSeeds) {
    playerWallet -= crop.buyPrice * quantity;
    playerInventory[seedKey] = ownedSeeds + quantity;
    buyQuantities[crop.id] = 1;
    updateHUD();
    renderInventory();
    updateShopUI();
  }
}

function sellCropItem(crop) {
  const cropKey = `harvested${crop.id.charAt(0).toUpperCase() + crop.id.slice(1)}`;
  if (Number.isFinite(crop.sellPrice) && playerInventory[cropKey] > 0) {
    playerInventory[cropKey]--;
    playerWallet += crop.sellPrice;
    updateHUD();
    renderInventory();
    updateInteractionPrompt();
    updateShopUI();
  }
}
