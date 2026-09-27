const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
    x: 50,
    y: 0,
    width: 20,
    height: 0,
    speed: 5,
    direction: 'right',
    animationFrame: 0,
    isMoving: false,
    isClimbing: false,
    lastClimbDirection: null,
    attack: null,
    currentFloor: 2
};

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    Space: false
};

let spaceWasDown = false;
const ATTACK_DURATION = 12;
const ATTACK_PEAK_FRAME = 6;
const EXTREMITY_HOLD_MS = 500;

function getAnimationTime() {
    return (typeof performance !== 'undefined' && typeof performance.now === 'function')
        ? performance.now()
        : Date.now();
}

const ladders = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const sectionHeight = canvas.height / 3;
    const ladderHeight = sectionHeight;
    player.height = ladderHeight * 0.8;
    
    if (player.currentFloor === 2) {
        player.y = sectionHeight - player.height;
    } else if (player.currentFloor === 1) {
        player.y = sectionHeight * 2 - player.height;
    } else {
        player.y = canvas.height - 15 - player.height;
    }
    
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

function drawStickman(x, y, height, direction, animationFrame, isClimbing, attack = player.attack, now = getAnimationTime()) {
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
    
    let legOffset, armOffset;
    
    if (isClimbing) {
        legOffset = Math.sin(animationFrame * 0.4) * 8;
        armOffset = Math.sin(animationFrame * 0.4) * 12;
    } else if (player.isMoving) {
        legOffset = Math.sin(animationFrame * 0.3) * 10;
        armOffset = Math.sin(animationFrame * 0.3) * 15;
    } else {
        legOffset = 0;
        armOffset = 0;
    }
    
    const shoulderY = bodyTopY + bodyLength * 0.3;
    const isKicking = attack && attack.type === 'kick';
    const isPunching = attack && attack.type === 'punch';
    const activeSide = isKicking
        ? ((attack.direction === 'left' || (attack.direction === 'down' && direction === 'left')) ? -1 : 1)
        : (direction === 'left' ? -1 : 1);
    const progress = attack ? Math.sin(Math.PI * attack.frame / ATTACK_DURATION) : 0;
    let attackTip = null;

    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(centerX, bodyBottomY);
        if (isKicking && side === activeSide) {
            const kickLength = legLength * 5;
            const kickStartX = side * 10;
            const kickStartY = legLength;
            const kickTargetX = attack.direction === 'down'
                ? side * legLength * 0.2
                : side * Math.sqrt(kickLength * kickLength - legLength * legLength * 0.01);
            const kickTargetY = attack.direction === 'down'
                ? Math.sqrt(kickLength * kickLength - kickTargetX * kickTargetX)
                : -legLength * 0.1;
            const kickEndX = centerX + kickStartX + (kickTargetX - kickStartX) * progress;
            const kickEndY = bodyBottomY + kickStartY + (kickTargetY - kickStartY) * progress;
            ctx.lineTo(kickEndX, kickEndY);
            attackTip = { x: kickEndX, y: kickEndY, originX: centerX, originY: bodyBottomY };
        } else {
            ctx.lineTo(centerX + side * (10 - legOffset), bodyBottomY + legLength);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, shoulderY);
        if (isPunching && side === activeSide) {
            const punchHorizontal = side * armLength * 0.45;
            const punchY = attack.direction === 'up'
                ? shoulderY - Math.sqrt(armLength * armLength * 25 - punchHorizontal * punchHorizontal) * progress
                : shoulderY + armLength * 1.8 * progress;
            const punchEndX = centerX + punchHorizontal;
            ctx.lineTo(punchEndX, punchY);
            attackTip = { x: punchEndX, y: punchY, originX: centerX, originY: shoulderY };
        } else {
            ctx.lineTo(centerX + side * (armLength - armOffset), shoulderY + armLength * 0.5);
        }
        ctx.stroke();
    }

    const peakVisible = attackTip && progress >= 0.98 && (
        attack.peakTime === null || attack.peakTime === undefined || now - attack.peakTime <= EXTREMITY_HOLD_MS
    );
    if (peakVisible) {
        if (isKicking) {
            drawFootAtTip(attackTip.x, attackTip.y, attackTip.originX, attackTip.originY, headRadius);
        } else if (isPunching) {
            drawFistAtTip(attackTip.x, attackTip.y, attackTip.originX, attackTip.originY, headRadius);
        }
    }
    
    ctx.shadowBlur = 0;
}

function drawFootAtTip(tipX, tipY, originX, originY, headRadius) {
    const directionX = tipX - originX;
    const directionY = tipY - originY;
    const directionLength = Math.hypot(directionX, directionY);
    if (directionLength === 0) return;

    const unitX = directionX / directionLength;
    const unitY = directionY / directionLength;
    const perpendicularX = -unitY;
    const perpendicularY = unitX;
    const footLength = headRadius * 4;
    const halfWidth = headRadius * 0.55;
    const heelX = tipX - unitX * footLength * 0.25;
    const heelY = tipY - unitY * footLength * 0.25;
    const toeX = tipX + unitX * footLength * 0.75;
    const toeY = tipY + unitY * footLength * 0.75;
    const ballX = tipX + unitX * footLength * 0.52;
    const ballY = tipY + unitY * footLength * 0.52;

    ctx.beginPath();
    ctx.moveTo(heelX + perpendicularX * halfWidth * 0.35, heelY + perpendicularY * halfWidth * 0.35);
    ctx.lineTo(ballX + perpendicularX * halfWidth, ballY + perpendicularY * halfWidth);
    ctx.lineTo(toeX + perpendicularX * halfWidth * 0.35, toeY + perpendicularY * halfWidth * 0.35);
    ctx.lineTo(toeX, toeY);
    ctx.lineTo(toeX - perpendicularX * halfWidth * 0.35, toeY - perpendicularY * halfWidth * 0.35);
    ctx.lineTo(ballX - perpendicularX * halfWidth, ballY - perpendicularY * halfWidth);
    ctx.lineTo(heelX - perpendicularX * halfWidth * 0.35, heelY - perpendicularY * halfWidth * 0.35);
    ctx.closePath();
    ctx.fillStyle = '#FF0000';
    ctx.fill();
    ctx.strokeStyle = '#800000';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ballX - perpendicularX * halfWidth * 0.85, ballY - perpendicularY * halfWidth * 0.85);
    ctx.lineTo(toeX - perpendicularX * halfWidth * 0.3, toeY - perpendicularY * halfWidth * 0.3);
    ctx.stroke();
    ctx.strokeStyle = '#FF0000';
}

function drawFistAtTip(tipX, tipY, originX, originY, headRadius) {
    const directionX = tipX - originX;
    const directionY = tipY - originY;
    const directionLength = Math.hypot(directionX, directionY);
    if (directionLength === 0) return;

    const unitX = directionX / directionLength;
    const unitY = directionY / directionLength;
    const perpendicularX = -unitY;
    const perpendicularY = unitX;
    const fistLength = headRadius * 1.5;
    const fistHalfWidth = headRadius * 0.6;
    const wristX = tipX - unitX * fistLength * 0.4;
    const wristY = tipY - unitY * fistLength * 0.4;
    const knucklesX = tipX + unitX * fistLength * 0.25;
    const knucklesY = tipY + unitY * fistLength * 0.25;

    ctx.beginPath();
    ctx.moveTo(wristX + perpendicularX * fistHalfWidth * 0.55, wristY + perpendicularY * fistHalfWidth * 0.55);
    ctx.lineTo(tipX + perpendicularX * fistHalfWidth, tipY + perpendicularY * fistHalfWidth);
    ctx.lineTo(knucklesX + perpendicularX * fistHalfWidth * 0.9, knucklesY + perpendicularY * fistHalfWidth * 0.9);
    ctx.lineTo(knucklesX + unitX * fistLength * 0.2 + perpendicularX * fistHalfWidth * 0.55,
        knucklesY + unitY * fistLength * 0.2 + perpendicularY * fistHalfWidth * 0.55);
    ctx.lineTo(knucklesX + unitX * fistLength * 0.2 - perpendicularX * fistHalfWidth * 0.55,
        knucklesY + unitY * fistLength * 0.2 - perpendicularY * fistHalfWidth * 0.55);
    ctx.lineTo(knucklesX - perpendicularX * fistHalfWidth * 0.9, knucklesY - perpendicularY * fistHalfWidth * 0.9);
    ctx.lineTo(tipX - perpendicularX * fistHalfWidth, tipY - perpendicularY * fistHalfWidth);
    ctx.lineTo(wristX - perpendicularX * fistHalfWidth * 0.55, wristY - perpendicularY * fistHalfWidth * 0.55);
    ctx.closePath();
    ctx.fillStyle = '#FF0000';
    ctx.fill();
    ctx.strokeStyle = '#800000';
    ctx.stroke();

    for (let knuckle = -1; knuckle <= 1; knuckle++) {
        const offset = knuckle * fistHalfWidth * 0.38;
        ctx.beginPath();
        ctx.moveTo(tipX + unitX * fistLength * 0.02 + perpendicularX * offset,
            tipY + unitY * fistLength * 0.02 + perpendicularY * offset);
        ctx.lineTo(tipX + unitX * fistLength * 0.2 + perpendicularX * offset,
            tipY + unitY * fistLength * 0.2 + perpendicularY * offset);
        ctx.stroke();
    }
    ctx.strokeStyle = '#FF0000';
}

function isOverLadder(playerX, playerY, ladderArray) {
    let yToCheck = playerY;
    let laddersToCheck = ladderArray;
    
    if (Array.isArray(playerY)) {
        laddersToCheck = playerY;
        yToCheck = undefined;
    }
    laddersToCheck = laddersToCheck || ladders;
    const ladderTolerance = 30;
    
    for (const ladder of laddersToCheck) {
        const leftX = ladder.x - ladder.width / 2;
        const rightX = ladder.x + ladder.width / 2;
        
        if (playerX >= leftX - ladderTolerance && playerX <= rightX + ladderTolerance) {
            if (typeof yToCheck === 'number') {
                const sectionHeight = (typeof canvas !== 'undefined' && canvas && canvas.height) ? canvas.height / 3 : 800 / 3;
                const canvasHeight = (typeof canvas !== 'undefined' && canvas && canvas.height) ? canvas.height : 800;
                const pHeight = (typeof player !== 'undefined' && player.height) ? player.height : (sectionHeight * 0.8);
                const floor0Y = canvasHeight - 15 - pHeight;
                const topY = ladder.y1 - pHeight;
                const bottomY = (ladder.y2 >= canvasHeight - 15) ? floor0Y : (ladder.y2 - pHeight);
                
                if (yToCheck >= topY - 10 && yToCheck <= bottomY + 10) {
                    return ladder;
                }
            } else {
                return ladder;
            }
        }
    }
    return null;
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

function updatePlayer(now = getAnimationTime()) {
    player.isMoving = false;
    player.isClimbing = false;
    
    const sectionHeight = canvas.height / 3;
    const floorY = {
        2: sectionHeight - player.height,
        1: sectionHeight * 2 - player.height,
        0: canvas.height - 15 - player.height
    };
    
    const overLadder = isOverLadder(player.x, player.y);
    
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
    
    if (overLadder) {
        const topLimit = overLadder.y1 - player.height;
        const bottomLimit = (overLadder.y2 >= canvas.height - 15)
            ? floorY[0]
            : (overLadder.y2 - player.height);
        
        if (keys.ArrowUp) {
            player.lastClimbDirection = 'up';
            if (player.y > topLimit) {
                player.y = Math.max(topLimit, player.y - player.speed);
                player.isClimbing = true;
                player.isMoving = true;
                player.animationFrame++;
            }
        }
        
        if (keys.ArrowDown) {
            player.lastClimbDirection = 'down';
            if (player.y < bottomLimit) {
                player.y = Math.min(bottomLimit, player.y + player.speed);
                player.isClimbing = true;
                player.isMoving = true;
                player.animationFrame++;
            }
        }
    }
    
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

    if (keys.Space && !spaceWasDown) {
        const attackLadder = isOverLadder(player.x, player.y);
        const insideLadder = attackLadder && (
            player.isClimbing || keys.ArrowUp || keys.ArrowDown ||
            (player.y > attackLadder.y1 - player.height + 10 &&
                player.y < attackLadder.y2 - player.height - 10)
        );
        if (insideLadder) {
            const climbDirection = keys.ArrowUp
                ? 'up'
                : (keys.ArrowDown ? 'down' : (player.lastClimbDirection || 'up'));
            player.attack = climbDirection === 'up'
                ? { type: 'punch', direction: 'up', frame: 0, peakTime: null }
                : { type: 'kick', direction: 'down', frame: 0, peakTime: null };
        } else {
            player.attack = { type: 'kick', direction: player.direction, frame: 0, peakTime: null };
        }
    }
    spaceWasDown = keys.Space;

    if (player.attack) {
        if (player.attack.peakTime !== null && player.attack.peakTime !== undefined &&
            now - player.attack.peakTime <= EXTREMITY_HOLD_MS) {
            player.attack.frame = ATTACK_PEAK_FRAME;
        } else {
            player.attack.frame++;
            if (player.attack.frame === ATTACK_PEAK_FRAME) {
                player.attack.peakTime = now;
            }
            if (player.attack.frame >= ATTACK_DURATION) {
                player.attack = null;
            }
        }
    }
    
    if (!player.isClimbing) {
        const closestFloor = findClosestFloor(player.y, floorY);
        player.y = floorY[closestFloor];
        player.currentFloor = closestFloor;
    }
    
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function findClosestFloor(playerY, floorY) {
    let closestFloor = 0;
    let minDistance = Math.abs(playerY - floorY[0]);
    
    for (let floor = 1; floor <= 2; floor++) {
        const distance = Math.abs(playerY - floorY[floor]);
        if (distance < minDistance) {
            minDistance = distance;
            closestFloor = floor;
        }
    }
    
    return closestFloor;
}

function drawGame(now = getAnimationTime()) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const sectionHeight = canvas.height / 3;
    
    drawFloorLines(sectionHeight);
    
    for (const ladder of ladders) {
        drawLadder(ladder.x, ladder.y1, ladder.y2, ladder.width);
    }
    
    drawStickman(player.x, player.y, player.height, player.direction, player.animationFrame, player.isClimbing, player.attack, now);
}

function gameLoop(timestamp) {
    const now = typeof timestamp === 'number' ? timestamp : getAnimationTime();
    updatePlayer(now);
    drawGame(now);
    if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(gameLoop);
    }
}

if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('keydown', (e) => {
        const key = e.code === 'Space' || e.key === ' ' ? 'Space' : e.key;
        if (keys.hasOwnProperty(key)) {
            keys[key] = true;
            if (e.preventDefault) {
                e.preventDefault();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        const key = e.code === 'Space' || e.key === ' ' ? 'Space' : e.key;
        if (keys.hasOwnProperty(key)) {
            keys[key] = false;
        }
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        player,
        keys,
        ladders,
        resizeCanvas,
        drawFloorLines,
        drawLadder,
        drawStickman,
        isOverLadder,
        isNearLadder,
        updatePlayer,
        findClosestFloor,
        drawGame
    };
}

if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('resize', resizeCanvas);
}
if (typeof module === "undefined") {
    resizeCanvas();
    gameLoop();
}
