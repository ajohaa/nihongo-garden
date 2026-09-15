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