// core gameplay loop
// answer questions to grow your plants
// harvest and sell flowers, fruits and veggies to get coins
// shop has buy and sell options
// buy seeds and more garden plots to plant more stuff

// character movement
let idle = true;
let playerX = 0;
let playerY = 0;
let playerDirection = 180;

// i need arrays to loop through character movement frames for each direction
// then, when a specific key(s) are pressed, it will set the direction variable to that orientation
// then a function will activate, moving the character forward in the specified direction
// when the key(s) are released, the character will remain in the idle version of that direction
// since our sprite only has right-facing frames for movement, we will have to flip the image when moving left using css.

const upAnimationFrames = [
    //images???
];

const downAnimationFrames = [

];

const leftAnimationFrames = [

];

const rightAnimationFrames = [

];

// event listeners (arrow keys and wasd)

window.addEventListener('keydown', (event) => {
    if (event.code === 'Down') {
        if (event.repeat) {
            console.log('down key is being held!');
            // insert movement function
    } else {
            console.log('down key was pressed once');
            // Put initial press logic here
            let frame = `idle${playerDirection}.png`;
        }
    }
});