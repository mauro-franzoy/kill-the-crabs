const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
    x: 100,
    y: 0,
    width: 20,
    height: 0,
    speed: 5,
    direction: 'right',
    animationFrame: 0,
    isMoving: false,
    isClimbing: false
};

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

const ladders = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const sectionHeight = canvas.height / 3;
    player.height = (sectionHeight * 2) * 0.8;
    player.y = canvas.height - player.height - 15;
    
    ladders.length = 0;
    ladders.push({
        x: canvas.width * 0.2,
        y1: sectionHeight * 2,
        y2: canvas.height,
        width: 40
    });
    ladders.push({
        x: canvas.width * 0.5,
        y1: sectionHeight,
        y2: sectionHeight * 2,
        width: 40
    });
    
    drawGame();
}

function drawFloorLines(sectionHeight) {
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 15;
    ctx.shadowColor = '#00FF00';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.moveTo(0, sectionHeight);
    ctx.lineTo(canvas.width, sectionHeight);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, sectionHeight * 2);
    ctx.lineTo(canvas.width, sectionHeight * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 15);
    ctx.lineTo(canvas.width, canvas.height - 15);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
}

function drawLadder(x, y1, y2, width) {
    const ladderWidth = 40;
    const leftX = x - ladderWidth / 2;
    const rightX = x + ladderWidth / 2;
    const rungCount = 4;
    const rungSpacing = (y2 - y1) / (rungCount + 1);
    
    ctx.strokeStyle = '#0000FF';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#0000FF';
    ctx.shadowBlur = 5;
    
    ctx.beginPath();
    ctx.moveTo(leftX, y1);
    ctx.lineTo(leftX, y2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(rightX, y1);
    ctx.lineTo(rightX, y2);
    ctx.stroke();
    
    for (let i = 1; i <= rungCount; i++) {
        const rungY = y1 + rungSpacing * i;
        ctx.beginPath();
        ctx.moveTo(leftX, rungY);
        ctx.lineTo(rightX, rungY);
        ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
}

function drawStickman(x, y, height, direction, animationFrame) {
    const headRadius = height * 0.15;
    const bodyLength = height * 0.4;
    const legLength = height * 0.25;
    const armLength = height * 0.2;
    
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 5;
    
    const centerX = x;
    const headY = y + headRadius;
    const bodyTopY = headY + headRadius;
    const bodyBottomY = bodyTopY + bodyLength;
    
    ctx.beginPath();
    ctx.arc(centerX, headY, headRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, bodyTopY);
    ctx.lineTo(centerX, bodyBottomY);
    ctx.stroke();
    
    const legOffset = player.isMoving ? Math.sin(animationFrame * 0.3) * 10 : 0;
    
    ctx.beginPath();
    ctx.moveTo(centerX, bodyBottomY);
    ctx.lineTo(centerX - 10 + legOffset, bodyBottomY + legLength);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, bodyBottomY);
    ctx.lineTo(centerX + 10 - legOffset, bodyBottomY + legLength);
    ctx.stroke();
    
    const armOffset = player.isMoving ? Math.sin(animationFrame * 0.3) * 15 : 0;
    
    ctx.beginPath();
    ctx.moveTo(centerX, bodyTopY + bodyLength * 0.3);
    ctx.lineTo(centerX - armLength + armOffset, bodyTopY + bodyLength * 0.3 + armLength * 0.5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, bodyTopY + bodyLength * 0.3);
    ctx.lineTo(centerX + armLength - armOffset, bodyTopY + bodyLength * 0.3 + armLength * 0.5);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
}

function isNearLadder(playerX, playerY, ladderArray) {
    const ladderTolerance = 30;
    const laddersToCheck = ladderArray || ladders;
    
    for (const ladder of laddersToCheck) {
        const leftX = ladder.x - ladder.width / 2;
        const rightX = ladder.x + ladder.width / 2;
        
        if (playerX >= leftX - ladderTolerance && playerX <= rightX + ladderTolerance &&
            playerY >= ladder.y1 && playerY <= ladder.y2) {
            return true;
        }
    }
    return false;
}

function updatePlayer() {
    player.isMoving = false;
    player.isClimbing = false;
    
    if (keys.ArrowLeft) {
        player.x -= player.speed;
        player.direction = 'left';
        player.isMoving = true;
        player.animationFrame++;
    }
    
    if (keys.ArrowRight) {
        player.x += player.speed;
        player.direction = 'right';
        player.isMoving = true;
        player.animationFrame++;
    }
    
    if (keys.ArrowUp && isNearLadder(player.x, player.y)) {
        player.y -= player.speed;
        player.isClimbing = true;
        player.isMoving = true;
        player.animationFrame++;
    }
    
    if (keys.ArrowDown && isNearLadder(player.x, player.y)) {
        player.y += player.speed;
        player.isClimbing = true;
        player.isMoving = true;
        player.animationFrame++;
    }
    
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function drawGame() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const sectionHeight = canvas.height / 3;
    
    drawFloorLines(sectionHeight);
    
    for (const ladder of ladders) {
        drawLadder(ladder.x, ladder.y1, ladder.y2, ladder.width);
    }
    
    drawStickman(player.x, player.y, player.height, player.direction, player.animationFrame);
}

function gameLoop() {
    updatePlayer();
    drawGame();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        resizeCanvas,
        drawFloorLines,
        drawLadder,
        drawStickman,
        isNearLadder,
        updatePlayer,
        drawGame
    };
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
gameLoop();
