let timer_start, timer_game, timer_finish, timer_time, timer_hide, equations, difficulty, valid_keys, timerStart;
let game_started = false;
let streak = 0;
let max_streak = 0;
let best_time = 0;
let mistakes = 0;
const maxMistakes = 3;


const sleep = (ms, fn) => {return setTimeout(fn, ms)};

const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let readCookie = () => {
    // Get max streak from cookie
    let regex = new RegExp("max-streak_powerplant_"+difficulty[3]+"=([\\d]+)",'g');
    let cookie = document.cookie;
    if((cookie = regex.exec(cookie)) !== null){
        max_streak = cookie[1];
    }else{
        max_streak = 0;
    }
    // Get max streak from cookie
    let regex_time = new RegExp("best-time_powerplant_"+difficulty[3]+"=([\\d.]+)",'g');
    cookie = document.cookie;
    if((cookie = regex_time.exec(cookie)) !== null){
        best_time = parseFloat(cookie[1]);
    }else{
        best_time = 0;
    }
}

const getDifficulty = () => {
    let difficulty_selected = document.querySelector('input[name="difficulty"]:checked').value;

    switch(difficulty_selected){
        case 'easy':
            return ["0123456789", 3000, 1000, 'easy'];
        case 'medium':
            return ["0123456789", 3000, 1000, 'medium'];
        case 'hard':
            return ["0123456789", 3000, 1000, 'hard'];
        case 'insane':
            return ["0123456789", 3000, 1000, 'insane'];
        case 'god':
            return ["0123456789", 3300, 1250, 'god'];
    }
}

// Difficulty changed
document.querySelectorAll('input[name="difficulty"]').forEach((el) => {
    el.addEventListener('change', function(){
        streak = 0;
        reset();
    });
});
// Resets
document.querySelector('.btn_again').addEventListener('click', function(){
    streak = 0;
    reset();
});

// Generate math equation based on difficulty
function generateEquation(difficulty_level) {
    let num1, num2, operator, answer, equation;
    
    switch(difficulty_level) {
        case 'easy':
            // Simple addition (0-5 + 0-4 to ensure answer is 0-9)
            num1 = random(0, 5);
            num2 = random(0, Math.min(4, 9 - num1));
            operator = '+';
            answer = num1 + num2;
            equation = `${num1}+${num2}`;
            break;
        case 'medium':
            // Addition and subtraction
            if (random(0, 1) === 0) {
                // Addition
                num1 = random(0, 5);
                num2 = random(0, Math.min(4, 9 - num1));
                operator = '+';
                answer = num1 + num2;
                equation = `${num1}+${num2}`;
            } else {
                // Subtraction
                num1 = random(0, 9);
                num2 = random(0, num1);
                operator = '-';
                answer = num1 - num2;
                equation = `${num1}-${num2}`;
            }
            break;
        case 'hard':
        case 'insane':
        case 'god':
            // Addition, subtraction, and multiplication
            let operation = random(0, 2);
            if (operation === 0) {
                // Addition
                num1 = random(0, 5);
                num2 = random(0, Math.min(4, 9 - num1));
                operator = '+';
                answer = num1 + num2;
                equation = `${num1}+${num2}`;
            } else if (operation === 1) {
                // Subtraction
                num1 = random(0, 9);
                num2 = random(0, num1);
                operator = '-';
                answer = num1 - num2;
                equation = `${num1}-${num2}`;
            } else {
                // Multiplication (limited to ensure answer is 0-9)
                num1 = random(1, 3);
                num2 = random(1, Math.floor(9 / num1));
                operator = '×';
                answer = num1 * num2;
                equation = `${num1}×${num2}`;
            }
            break;
    }
    
    return { equation, answer };
}

// Get the <div> element
const barDiv = document.querySelector('.minigame .bar');
// Set the bar to red color to match the design
barDiv.style.backgroundColor = '#491419';

document.addEventListener("keydown", function(ev) {
    if (!game_started || equations.length === 0) return;

    let element = equations[0].el;
    let key_pressed = ev.key;
    let top = -590 * parseFloat(element.dataset.progress);

    // ✅ Only accept the correct key AND only inside the hit zone
    if (key_pressed === element.dataset.answer.toString()) {
        if (top < -475 && top > -580) {
            // Correct timing + correct key
            streak++;
            element.style.color = "lime";

            document.querySelector('.streak').innerHTML = streak;

            equations[0].stop();

            new mojs.Html({
                el: element,
                y: top,
                opacity: { 1: 0, duration: 500 },
                duration: 500,
                onComplete() {
                    element.remove();
                },
            }).play();

            equations.splice(0, 1);
        }
        // ⛔ If they pressed the right key but too early/too late → just ignore (no penalty)
    }

    // ⛔ Wrong keys do absolutely nothing
});


let createEquation = () => {
  const equationsElem = document.querySelector('.minigame .equations');
  let div = document.createElement('div');
  div.classList.add('equation'); // no pos classes needed now
    
    // Generate equation based on current difficulty
    let equationData = generateEquation(difficulty[3]);
    div.innerHTML = equationData.equation;
    div.dataset.answer = equationData.answer;
    
    // Set equation color to white for visibility
    div.style.color = '#ffffff';


    equationsElem.append(div);
    const duration = difficulty[1];
    const equationsCnt = equations.length;

    equations.push(new mojs.Html({
        el: div,
        y: { 0: -590, duration, easing: 'linear.none',
             onProgress(p){ div.dataset.progress = p; } },
        opacity: { 0: 1, duration: 200, easing: 'linear.none' },
        duration,
        onComplete() {
            // Unanswered → counts as a mistake
            mistakes++;
            if (mistakes >= maxMistakes) {
                stopTimer();
                document.querySelector('.minigame .splash1').classList.remove('hidden'); // FAILED
                document.querySelector('.minigame .hack')?.classList.add('hidden');
                game_started = false;
            }
            equations.splice(0, 1);
        },
        onUpdate() { if (!game_started) this.pause(); }
    }));

    equations[equationsCnt]
        .then({ opacity: 0, duration: 500, onComplete(){ div.remove(); } })
        .play();
};

function resetGame() {
    mistakes = 0;     // reset mistakes
    streak = 0;       // reset streak
    document.querySelector('.streak').innerHTML = streak;
    reset(true);      // call your reset function and restart
}

function reset(restart = true){
    game_started = false;

    resetTimer();
    clearTimeout(timer_start);
    clearTimeout(timer_game);
    clearTimeout(timer_finish);
    clearTimeout(timer_hide);

    if(restart){
        mistakes = 0;  // ✅ reset mistakes
        streak = 0;    // ✅ reset streak
        document.querySelector('.streak').innerHTML = streak;

        document.querySelector('.minigame .hack').classList.add('hidden');
        document.querySelector('.minigame .splash').classList.remove('hidden');
        document.querySelector('.minigame .equations').innerHTML = '';
        barDiv.style.backgroundColor = '#dc3545'; // Keep red color
        start();
    }
}


function start(){

    document.querySelector('.minigame .splash1').classList.add('hidden');
    document.querySelector('.minigame .splash2').classList.add('hidden');

    timer_start = sleep(3000, function(){
        document.querySelector('.minigame .splash').classList.add('hidden');
        document.querySelector('.minigame .hack').classList.remove('hidden');

        difficulty = getDifficulty();
        readCookie();

        document.querySelector('.streak').innerHTML = streak;

        valid_keys = difficulty[0].split('');
        equations = [];
        game_started = true;

        timer_game = setInterval(createEquation, difficulty[2]);

        startTimer();

    });
}

function startTimer(){
    timerStart = new Date();
    timer_time = setInterval(timer,1);
}  
function timer(){
    let timerNow = new Date();
    let timerDiff = new Date();
    timerDiff.setTime(timerNow - timerStart);
    let ms = timerDiff.getMilliseconds();
    let sec = timerDiff.getSeconds();
    if (ms < 10) {ms = "00"+ms;}else if (ms < 100) {ms = "0"+ms;}
    document.querySelector('.streaks .time').innerHTML = sec+"."+ms;
}
function stopTimer(){
    clearInterval(timer_time);
}
function resetTimer(){
    clearInterval(timer_time);
    document.querySelector('.streaks .time').innerHTML = '0.000';
}

start();
