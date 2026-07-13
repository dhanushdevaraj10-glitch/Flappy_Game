// Game Constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -9;
const PIPE_WIDTH = 60;
const PIPE_GAP = 180;
const PIPE_SPEED = 2.5;
const BIRD_SIZE = 35;

// Game Variables
let canvas, ctx;
let bird;
let pipes = [];
let score = 0;
let bestScore = 0;
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let frameCount = 0;

// DOM Elements
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreDisplay = document.getElementById('scoreDisplay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const currentScoreEl = document.querySelector('.current-score');

// Bird Object
class Bird {
    constructor() {
        this.x = 100;
        this.y = CANVAS_HEIGHT / 2;
        this.velocity = 0;
        this.rotation = 0;
    }

    jump() {
        this.velocity = JUMP_STRENGTH;
    }

    update() {
        this.velocity += GRAVITY;
        this.y += this.velocity;

        // Rotation based on velocity
        this.rotation = Math.min(Math.max(this.velocity * 3, -30), 90);

        // Prevent bird from going above canvas
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }

        // Check if bird hit the ground
        if (this.y + BIRD_SIZE > CANVAS_HEIGHT) {
            gameOver();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + BIRD_SIZE / 2, this.y + BIRD_SIZE / 2);
        ctx.rotate(this.rotation * Math.PI / 180);

        // Bird body (circle with gradient)
        const gradient = ctx.createRadialGradient(0, -5, 5, 0, 0, BIRD_SIZE / 2);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.7, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        // Bird outline
        ctx.strokeStyle = '#FF6B00';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(8, -5, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(10, -5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(22, -2);
        ctx.lineTo(22, 2);
        ctx.closePath();
        ctx.fill();

        // Wing
        ctx.fillStyle = '#FFB84D';
        ctx.beginPath();
        ctx.ellipse(-5, 5, 10, 6, Math.sin(frameCount * 0.2) * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FF8C00';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}

// Pipe Object
class Pipe {
    constructor(x) {
        this.x = x;
        this.topHeight = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 100) + 50;
        this.bottomY = this.topHeight + PIPE_GAP;
        this.scored = false;
    }

    update() {
        this.x -= PIPE_SPEED;
    }

    draw() {
        // Pipe gradient
        const gradient = ctx.createLinearGradient(this.x, 0, this.x + PIPE_WIDTH, 0);
        gradient.addColorStop(0, '#4ADE80');
        gradient.addColorStop(0.5, '#22C55E');
        gradient.addColorStop(1, '#16A34A');

        // Top pipe
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, 0, PIPE_WIDTH, this.topHeight);

        // Top pipe cap
        ctx.fillStyle = '#15803D';
        ctx.fillRect(this.x - 5, this.topHeight - 30, PIPE_WIDTH + 10, 30);

        // Bottom pipe
        ctx.fillRect(this.x, this.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - this.bottomY);

        // Bottom pipe cap
        ctx.fillRect(this.x - 5, this.bottomY, PIPE_WIDTH + 10, 30);

        // Pipe highlights
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + 5, 0);
        ctx.lineTo(this.x + 5, this.topHeight);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.bottomY);
        ctx.lineTo(this.x + 5, CANVAS_HEIGHT);
        ctx.stroke();
    }

    collidesWith(bird) {
        const birdLeft = bird.x;
        const birdRight = bird.x + BIRD_SIZE;
        const birdTop = bird.y;
        const birdBottom = bird.y + BIRD_SIZE;

        const pipeLeft = this.x;
        const pipeRight = this.x + PIPE_WIDTH;

        // Check horizontal overlap
        if (birdRight > pipeLeft && birdLeft < pipeRight) {
            // Check vertical collision
            if (birdTop < this.topHeight || birdBottom > this.bottomY) {
                return true;
            }
        }
        return false;
    }

    isOffScreen() {
        return this.x + PIPE_WIDTH < 0;
    }
}

// Initialize Game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Load best score from localStorage
    bestScore = parseInt(localStorage.getItem('flappyBirdBestScore') || '0');
    bestScoreEl.textContent = bestScore;

    // Event Listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);

    // Click/Touch to jump
    canvas.addEventListener('click', handleJump);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleJump();
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && gameState === 'playing') {
            e.preventDefault();
            handleJump();
        }
    });

    // Start animation loop
    animate();
}

// Start Game
function startGame() {
    gameState = 'playing';
    startScreen.classList.add('hidden');
    scoreDisplay.classList.remove('hidden');

    // Initialize bird and pipes
    bird = new Bird();
    pipes = [];
    score = 0;
    frameCount = 0;
    currentScoreEl.textContent = score;

    // Create initial pipes
    for (let i = 0; i < 3; i++) {
        pipes.push(new Pipe(CANVAS_WIDTH + i * 250));
    }
}

// Restart Game
function restartGame() {
    gameOverScreen.classList.add('hidden');
    startGame();
}

// Handle Jump
function handleJump() {
    if (gameState === 'playing') {
        bird.jump();
    }
}

// Game Over
function gameOver() {
    if (gameState !== 'playing') return;

    gameState = 'gameOver';
    scoreDisplay.classList.add('hidden');

    // Update best score
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('flappyBirdBestScore', bestScore.toString());
    }

    // Show game over screen
    finalScoreEl.textContent = score;
    bestScoreEl.textContent = bestScore;

    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
    }, 500);
}

// Update Score
function updateScore() {
    score++;
    currentScoreEl.textContent = score;
    currentScoreEl.style.animation = 'none';
    setTimeout(() => {
        currentScoreEl.style.animation = 'scoreUpdate 0.3s ease-in-out';
    }, 10);
}

// Draw Background
function drawBackground() {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Clouds
    drawCloud(80, 80, frameCount * 0.2);
    drawCloud(250, 120, frameCount * 0.15);
    drawCloud(150, 200, frameCount * 0.25);

    // Ground
    const groundGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - 50, 0, CANVAS_HEIGHT);
    groundGradient.addColorStop(0, '#90EE90');
    groundGradient.addColorStop(0.3, '#7CCD7C');
    groundGradient.addColorStop(1, '#6B8E23');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

    // Grass details
    ctx.fillStyle = '#4A7C4E';
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
        const offset = (frameCount * PIPE_SPEED + i) % 20;
        ctx.fillRect(i - offset, CANVAS_HEIGHT - 50, 10, 5);
    }
}

// Draw Cloud
function drawCloud(x, y, offset) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const cloudX = (x + offset) % (CANVAS_WIDTH + 100) - 50;

    ctx.beginPath();
    ctx.arc(cloudX, y, 20, 0, Math.PI * 2);
    ctx.arc(cloudX + 25, y, 25, 0, Math.PI * 2);
    ctx.arc(cloudX + 50, y, 20, 0, Math.PI * 2);
    ctx.fill();
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'playing') {
        frameCount++;

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw background
        drawBackground();

        // Update and draw pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].update();
            pipes[i].draw();

            // Check collision
            if (pipes[i].collidesWith(bird)) {
                gameOver();
            }

            // Check score
            if (!pipes[i].scored && bird.x > pipes[i].x + PIPE_WIDTH) {
                pipes[i].scored = true;
                updateScore();
            }

            // Remove off-screen pipes and add new ones
            if (pipes[i].isOffScreen()) {
                pipes.splice(i, 1);
                pipes.push(new Pipe(pipes[pipes.length - 1].x + 250));
            }
        }

        // Update and draw bird
        bird.update();
        bird.draw();
    } else if (gameState === 'start') {
        // Draw static background on start screen
        drawBackground();

        // Draw a preview bird
        const previewBird = new Bird();
        previewBird.y = CANVAS_HEIGHT / 2 + Math.sin(frameCount * 0.05) * 20;
        previewBird.draw();

        frameCount++;
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
