const canvas = document.getElementById('heartTree');
const ctx = canvas.getContext('2d');
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const mainContainer = document.getElementById('mainContainer');
const successContainer = document.getElementById('successContainer');

// Canvas setup
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let tree = [];
let fallingHearts = [];

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initTree();
});

// Utility
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Tree Configuration
const maxDepth = 10;
const branchWidth = 10;
const branchColor = '#4a0e16'; // Darker, richer wood color

class Branch {
    constructor(x, y, len, angle, depth, parentWidth) {
        this.x = x;
        this.y = y;
        this.len = len;
        this.angle = angle;
        this.depth = depth;
        // Taper branches more naturally
        this.width = parentWidth * 0.75;
        this.endX = 0;
        this.endY = 0;
        this.baseAngle = angle;
        this.swaySpeed = randomRange(0.002, 0.004); // Slower, more majestic sway
        this.swayOffset = randomRange(0, Math.PI * 2);

        this.left = null;
        this.right = null;

        this.hasHeart = depth < 3;
        this.heartSize = this.hasHeart ? randomRange(8, 16) : 0; // Slightly bigger hearts
        // More vibrant and varied palette
        const colors = ['#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#c9184a'];
        this.heartColor = colors[Math.floor(Math.random() * colors.length)];

        if (depth > 0) {
            const nextLen = len * randomRange(0.7, 0.9);
            // More natural organic spread
            const spread = randomRange(20, 45);
            const leftAngle = angle - spread * randomRange(0.8, 1.2);
            const rightAngle = angle + spread * randomRange(0.8, 1.2);

            this.left = new Branch(0, 0, nextLen, leftAngle, depth - 1, this.width);
            this.right = new Branch(0, 0, nextLen, rightAngle, depth - 1, this.width);
        }
    }

    update(parentEnd, time) {
        if (parentEnd) {
            this.x = parentEnd.x;
            this.y = parentEnd.y;
        }

        const sway = Math.sin(time * this.swaySpeed + this.swayOffset) * 2 * (10 - this.depth) / 10;
        const currentAngleRad = (this.angle + sway) * Math.PI / 180;

        this.endX = this.x + this.len * Math.cos(currentAngleRad);
        this.endY = this.y + this.len * Math.sin(currentAngleRad);

        if (this.left) this.left.update({ x: this.endX, y: this.endY }, time);
        if (this.right) this.right.update({ x: this.endX, y: this.endY }, time);
    }

    draw() {
        // Main branch stroke
        ctx.beginPath();
        ctx.strokeStyle = branchColor;
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();

        // 3D Highlight for thicker branches (trunk and main limbs)
        if (this.width > 4) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; // Subtle highlight
            ctx.lineWidth = this.width * 0.3;
            ctx.lineCap = 'round';
            // Offset slightly to the left to simulate lighting
            ctx.moveTo(this.x - this.width * 0.2, this.y);
            ctx.lineTo(this.endX - this.width * 0.2, this.endY);
            ctx.stroke();
        }

        if (this.hasHeart) {
            drawHeart(this.endX, this.endY, this.heartSize, this.heartColor);
        }

        if (this.left) this.left.draw();
        if (this.right) this.right.draw();
    }
}

function drawHeart(x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-size / 2, -size / 2, -size, size / 3, 0, size);
    ctx.bezierCurveTo(size, size / 3, size / 2, -size / 2, 0, 0);
    ctx.fill();
    ctx.restore();
}

// Falling Hearts System
class FallingHeart {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.size = randomRange(5, 15);
        this.speedY = randomRange(1, 3);
        this.speedX = randomRange(-0.5, 0.5);
        const colors = ['#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#c9184a'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.rotation = Math.random() * 360;
        this.rotationSpeed = randomRange(-2, 2);
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.y * 0.01);
        this.rotation += this.rotationSpeed;

        if (this.y > canvas.height) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        drawHeart(0, 0, this.size, this.color);
        ctx.restore();
    }
}

let rootObj;

function initTree() {
    // Increased base length slightly since we have fewer layers
    const startLen = canvas.height * 0.22;
    // Start with a much thicker trunk
    rootObj = new Branch(canvas.width / 2, canvas.height, startLen, -90, maxDepth, 40);

    fallingHearts = [];
    for (let i = 0; i < 45; i++) {
        fallingHearts.push(new FallingHeart());
        fallingHearts[i].y = Math.random() * canvas.height;
    }
}

function animate(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (rootObj) {
        rootObj.update(null, time);
        rootObj.draw();
    }

    fallingHearts.forEach(h => {
        h.update();
        h.draw();
    });

    requestAnimationFrame(animate);
}

initTree();
requestAnimationFrame(animate);

// --- User Interaction Logic ---

let yesBtnScale = 1;
let noBtnMoved = false;

function moveNoButton() {
    const btnRect = noBtn.getBoundingClientRect();

    // Fix: Move to body to avoid overflow/clipping issues
    if (!noBtnMoved) {
        noBtnMoved = true;
        noBtn.style.position = 'fixed';
        noBtn.style.zIndex = '10000'; // Super high z-index
        document.body.appendChild(noBtn);
    }

    const maxX = window.innerWidth - btnRect.width - 40;
    const maxY = window.innerHeight - btnRect.height - 40;

    const randomX = Math.random() * Math.max(0, maxX) + 20;
    const randomY = Math.random() * Math.max(0, maxY) + 20;

    noBtn.style.left = randomX + 'px';
    noBtn.style.top = randomY + 'px';

    yesBtnScale += 0.5;
    yesBtn.style.transform = `scale(${yesBtnScale})`;

    // If Yes button is huge, hide No button
    if (yesBtnScale > 15) {
        noBtn.style.display = 'none';
    }
}

noBtn.addEventListener('mouseover', moveNoButton);
noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    moveNoButton();
});
noBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    moveNoButton();
});

yesBtn.addEventListener('click', () => {
    mainContainer.style.display = 'none';
    successContainer.classList.remove('hidden');
    successContainer.classList.add('visible');

    // Add more hearts
    for (let i = 0; i < 50; i++) {
        fallingHearts.push(new FallingHeart());
    }

    if (noBtn) noBtn.style.display = 'none';
});
