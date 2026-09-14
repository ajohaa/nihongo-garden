// farming
// answer questions to get coins
// use coins to buy seeds
// plant stuff
// let it grow let it grow idk the rest of the lyrics
// sell fruits and veggies
// shop has buy and sell option
// buy more land plots to plant more stuff
// upgrade your farm

// character movement
let idle = true;
let direction = 0;

// i need arrays to loop through character movement frames for each direction
// then, when a specific key is pressed, it will set the direction variable to that orientation
// then a function will activate, moving the character forward in the specified direction until the key is released
// thus leaving the character in the idle version of the direction
// will add diagonal movement later

const upAnimationFrames = [
    //images???
];

const downAnimationFrames = [

];

const leftAnimationFrames = [

];

const rightAnimationFrames = [

];

// event listeners

window.addEventListener('keydown', (event) => {
    if (event.code === 'Down') {
        if (event.repeat) {
            console.log('down key is being held!');
            // insert movement function
    } else {
            console.log('down key was pressed once');
            // Put initial press logic here
            let frame = `idle${direction}.png`;
        }
    }
});


const questionsArray = [

];