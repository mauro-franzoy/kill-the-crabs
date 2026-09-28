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
    laughUntil: 0,
    currentFloor: 2
};

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    Space: false,
    Shift: false
};

let spaceWasDown = false;
let spacePressedPending = false;
let spacePressedWithShift = false;
const ATTACK_DURATION = 12;
const ATTACK_PEAK_FRAME = 6;
const EXTREMITY_HOLD_MS = 800;
const LAUGH_DURATION_MS = 1200;
const IDLE_PAUSE_TIMEOUT_MS = 10000;
const MAX_VISIBLE_ENEMIES = 10;

function getAnimationTime() {
    return (typeof performance !== 'undefined' && typeof performance.now === 'function')
        ? performance.now()
        : Date.now();
}

const ladders = [];
const enemies = [];
const crabDeathEffects = [];
let brickWallEncounter = null;
const gameState = { score: 0, lives: 3, immuneUntil: 0, gameOver: false, won: false, paused: false, manualPaused: false };
const PLAYER_IMMUNITY_MS = 8000;
const CRAB_DEATH_DURATION_MS = 1000;
const CRAB_DEATH_FLICKER_START_MS = 600;
const CRAB_DEATH_GRAVITY = 650;
const ENEMY_MIN_SPAWN_INTERVAL_MS = 2000;
const ENEMY_MAX_SPAWN_INTERVAL_MS = 5000;
const ENEMY_CLEARANCE_LADDER_WIDTHS = 4;
const BRICK_WALL_BUILD_DURATION_MS = 900;
const CRAB_NET_CAPTURE_DURATION_MS = 500;
const CRAB_COOKING_SCENE_MS = 800;
const CRAB_TABLE_SCENE_MS = 800;
const BRICK_WALL_THICKNESS = 18;
let nextEnemySpawnTime = null;
let pausedDurationMs = 0;
let pausedAtWallTime = null;
let lastKeyboardInputTime = getAnimationTime();

function getGameTime() {
    return getAnimationTime() - pausedDurationMs;
}

function getRandomEnemySpawnInterval() {
    return ENEMY_MIN_SPAWN_INTERVAL_MS + Math.floor(Math.random() * (ENEMY_MAX_SPAWN_INTERVAL_MS - ENEMY_MIN_SPAWN_INTERVAL_MS + 1));
}

function updateGameData() {
    if (typeof document === "undefined" || !document.getElementById) return;
    const scoreElement = document.getElementById("score");
    const livesElement = document.getElementById("lives");
    if (scoreElement) scoreElement.textContent = String(gameState.score);
    if (livesElement) livesElement.textContent = String(gameState.lives);
}

updateGameData();
const gameInstructions = document.getElementById("game-instructions");
if (gameInstructions) {
    setTimeout(() => {
        gameInstructions.hidden = true;
        gameInstructions.style.display = "none";
    }, 10000);
}

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
        x: canvas.width * 0.75,
        y1: sectionHeight,
        y2: sectionHeight * 2,
        width: 40
    });
    
    drawGame();
}

function drawFloorLines(sectionHeight) {
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 15;
    ctx.shadowColor = 'lime';
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
    
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 8;
    ctx.shadowColor = 'blue';
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

function drawStickman(x, y, height, direction, animationFrame, isClimbing, attack = player.attack, now = getGameTime(), playerColor = 'red') {
    const headRadius = height * 0.15;
    const bodyLength = height * 0.4;
    const legLength = height * 0.25;
    const armLength = height * 0.2;
    
    ctx.strokeStyle = playerColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = playerColor;
    ctx.shadowBlur = 5;
    
    const centerX = x;
    const headY = y + headRadius;
    const bodyTopY = headY + headRadius;
    const bodyBottomY = bodyTopY + bodyLength;
    
    const isLaughing = player.laughUntil > now;
    if (isLaughing) {
        const facingSign = direction === "left" ? -1 : 1;
        const faceRadius = headRadius * 1.5;
        const laughElapsed = now - (player.laughUntil - LAUGH_DURATION_MS);
        const laughPulse = (Math.sin(laughElapsed / 65) + 1) / 2;
        const headTilt = facingSign * (1.38 + laughPulse * 0.12);
        const headCenterX = centerX - facingSign * faceRadius * 0.35;
        const previousFont = ctx.font;
        const previousTextAlign = ctx.textAlign;
        const previousTextBaseline = ctx.textBaseline;
        ctx.fillStyle = playerColor;
        ctx.font = "bold " + Math.max(12, Math.round(faceRadius * 0.55)) + "px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const laughText = [
            { text: "HA!", x: 1.95, y: -0.8 },
            { text: "HA!", x: 2.35, y: -0.05 },
            { text: "HA!", x: 1.98, y: 0.62 }
        ];
        for (const word of laughText) {
            ctx.fillText(word.text, centerX - facingSign * faceRadius * word.x, headY + faceRadius * word.y);
        }
        ctx.font = previousFont;
        ctx.textAlign = previousTextAlign;
        ctx.textBaseline = previousTextBaseline;

        ctx.beginPath();
        ctx.ellipse(headCenterX, headY, faceRadius * 0.9, faceRadius, headTilt, 0, Math.PI * 2);
        ctx.stroke();
        const mouthX = headCenterX + facingSign * faceRadius * 0.18;
        const mouthY = headY + faceRadius * 0.22;
        const mouthHalfWidth = faceRadius * 0.48;
        const mouthOpening = faceRadius * (0.12 + laughPulse * 0.3);
        ctx.beginPath();
        ctx.moveTo(mouthX - mouthHalfWidth, mouthY);
        ctx.quadraticCurveTo(mouthX, mouthY - mouthOpening, mouthX + mouthHalfWidth, mouthY);
        ctx.quadraticCurveTo(mouthX, mouthY + mouthOpening, mouthX - mouthHalfWidth, mouthY);
        ctx.closePath();
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = playerColor;
        const eyeY = headY - faceRadius * 0.43;
        const eyeHalfWidth = faceRadius * 0.4;
        const eyeHalfHeight = faceRadius * 0.14;
        ctx.beginPath();
        ctx.moveTo(headCenterX - eyeHalfWidth, eyeY - eyeHalfHeight);
        ctx.lineTo(headCenterX + eyeHalfWidth, eyeY + eyeHalfHeight);
        ctx.moveTo(headCenterX - eyeHalfWidth, eyeY + eyeHalfHeight);
        ctx.lineTo(headCenterX + eyeHalfWidth, eyeY - eyeHalfHeight);
        ctx.stroke();
        const tearHalfWidth = faceRadius * 0.12;
        const tearHeight = faceRadius * 0.22;
        const tearX = headCenterX - facingSign * (eyeHalfWidth + tearHalfWidth + faceRadius * 0.12);
        const tearY = eyeY + faceRadius * 0.2;
        ctx.beginPath();
        ctx.moveTo(tearX, tearY - tearHeight);
        ctx.quadraticCurveTo(tearX + tearHalfWidth, tearY - tearHeight * 0.2, tearX + tearHalfWidth, tearY + tearHeight * 0.35);
        ctx.quadraticCurveTo(tearX + tearHalfWidth, tearY + tearHeight, tearX, tearY + tearHeight);
        ctx.quadraticCurveTo(tearX - tearHalfWidth, tearY + tearHeight, tearX - tearHalfWidth, tearY + tearHeight * 0.35);
        ctx.quadraticCurveTo(tearX - tearHalfWidth, tearY - tearHeight * 0.2, tearX, tearY - tearHeight);
        ctx.closePath();
        ctx.strokeStyle = playerColor;
        ctx.stroke();
        ctx.strokeStyle = playerColor;
        ctx.fillStyle = playerColor;
    } else {
        ctx.beginPath();
        ctx.arc(centerX, headY, headRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
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
    const isKicking = attack && attack.type === 'kick' && !attack.brickWall;
    const isPunching = attack && attack.type === 'punch' && !attack.brickWall;
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
            drawFootAtTip(attackTip.x, attackTip.y, attackTip.originX, attackTip.originY, headRadius, playerColor);
        } else if (isPunching) {
            drawFistAtTip(attackTip.x, attackTip.y, attackTip.originX, attackTip.originY, headRadius, playerColor);
        }
    }
    
    ctx.shadowBlur = 0;
}

function drawFootAtTip(tipX, tipY, originX, originY, headRadius, color = 'red') {
    const directionX = tipX - originX;
    if (directionX === 0 && tipY === originY) return;

    const footLength = headRadius * 4 * 1.5;
    const halfWidth = headRadius * 0.85 * 1.5;
    const bodySide = directionX >= 0 ? -1 : 1;
    const heelY = tipY + footLength * 0.16;
    const archY = tipY - footLength * 0.34;
    const toeBaseY = tipY - footLength * 0.62;

    ctx.beginPath();
    ctx.moveTo(tipX - halfWidth * 0.28, heelY);
    ctx.quadraticCurveTo(tipX - halfWidth * 0.6, tipY + footLength * 0.14,
        tipX - halfWidth * 0.65, tipY + footLength * 0.04);
    ctx.lineTo(tipX - halfWidth * 0.54, archY);
    ctx.quadraticCurveTo(tipX - halfWidth * 1.1, toeBaseY, tipX - halfWidth, toeBaseY);
    ctx.lineTo(tipX + halfWidth, toeBaseY);
    ctx.quadraticCurveTo(tipX + halfWidth * 0.9, archY,
        tipX + halfWidth * 0.38, tipY - footLength * 0.3);
    ctx.lineTo(tipX + halfWidth * 0.28, tipY + footLength * 0.04);
    ctx.quadraticCurveTo(tipX + halfWidth * 0.5, tipY + footLength * 0.14,
        tipX + halfWidth * 0.28, heelY);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();

    const toeLengths = [0.22, 0.18, 0.16, 0.14, 0.12];
    const toeOffsets = [0.68, 0.34, 0, -0.34, -0.68];
    for (let toe = 0; toe < toeLengths.length; toe++) {
        const isBigToe = toe === 0;
        const toeX = tipX + bodySide * halfWidth * (toeOffsets[toe] + (isBigToe ? 0.06 : 0));
        const toeRadiusX = halfWidth * (isBigToe ? 0.44 : 0.28);
        const toeRadiusY = footLength * toeLengths[toe];
        const toeY = toeBaseY - toeRadiusY;
        const toeBend = isBigToe ? bodySide * 0.24 : 0;

        ctx.beginPath();
        ctx.ellipse(toeX, toeY, toeRadiusX, toeRadiusY, toeBend, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.stroke();
    }
}

function drawFistAtTip(tipX, tipY, originX, originY, headRadius, color = "red") {
    const directionX = tipX - originX;
    const directionY = tipY - originY;
    const directionLength = Math.hypot(directionX, directionY);
    if (directionLength === 0) return;

    const unitX = directionX / directionLength;
    const unitY = directionY / directionLength;
    const perpendicularX = -unitY;
    const perpendicularY = unitX;
    const fistLength = headRadius * 3 * 1.5;
    const fistHalfWidth = headRadius * 1.2 * 1.5;
    const pointAt = (along, across) => ({
        x: tipX + unitX * fistLength * along + perpendicularX * fistHalfWidth * across,
        y: tipY + unitY * fistLength * along + perpendicularY * fistHalfWidth * across
    });
    const knuckleCenters = [-0.72, -0.24, 0.24, 0.72];

    ctx.beginPath();
    let point = pointAt(-0.4, -0.55);
    ctx.moveTo(point.x, point.y);
    point = pointAt(-0.25, -0.95);
    let control = pointAt(-0.34, -0.9);
    ctx.quadraticCurveTo(control.x, control.y, point.x, point.y);
    point = pointAt(0.12, -0.95);
    ctx.lineTo(point.x, point.y);

    for (let index = 0; index < knuckleCenters.length; index++) {
        const center = knuckleCenters[index];
        if (index > 0) {
            const previousEnd = knuckleCenters[index - 1] + 0.14;
            const nextStart = center - 0.14;
            control = pointAt(0.29, (previousEnd + nextStart) / 2);
            point = pointAt(0.32, nextStart);
            ctx.quadraticCurveTo(control.x, control.y, point.x, point.y);
        }
        control = pointAt(0.42, center - 0.1);
        point = pointAt(0.45, center);
        ctx.quadraticCurveTo(control.x, control.y, point.x, point.y);
        control = pointAt(0.42, center + 0.1);
        point = pointAt(0.32, center + 0.14);
        ctx.quadraticCurveTo(control.x, control.y, point.x, point.y);
    }

    control = pointAt(0.3, 0.95);
    point = pointAt(0.12, 1);
    ctx.quadraticCurveTo(control.x, control.y, point.x, point.y);
    point = pointAt(-0.18, 0.9);
    ctx.lineTo(point.x, point.y);
    control = pointAt(-0.4, 0.78);
    point = pointAt(-0.4, 0.55);
    ctx.quadraticCurveTo(control.x, control.y, point.x, point.y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.strokeStyle = "darkred";
    for (const center of knuckleCenters) {
        const creaseStart = pointAt(0.18, center - 0.1);
        const creaseControl = pointAt(0.34, center - 0.06);
        const creaseEnd = pointAt(0.33, center + 0.07);
        ctx.beginPath();
        ctx.moveTo(creaseStart.x, creaseStart.y);
        ctx.quadraticCurveTo(creaseControl.x, creaseControl.y, creaseEnd.x, creaseEnd.y);
        ctx.stroke();
    }

    const thumbStart = pointAt(-0.08, -0.72);
    const thumbControl = pointAt(0.08, -0.48);
    const thumbEnd = pointAt(0.24, -0.2);
    ctx.beginPath();
    ctx.moveTo(thumbStart.x, thumbStart.y);
    ctx.quadraticCurveTo(thumbControl.x, thumbControl.y, thumbEnd.x, thumbEnd.y);
    ctx.stroke();
    ctx.strokeStyle = color;
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

function updatePlayer(now = getGameTime()) {
    if (gameState.gameOver) return;
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

    if ((keys.Space && !spaceWasDown) || spacePressedPending) {
        const brickWallAttack = keys.Shift || spacePressedWithShift;
        const attackDirection = keys.ArrowUp
            ? "up"
            : (keys.ArrowDown ? "down" : (keys.ArrowLeft ? "left" : (keys.ArrowRight ? "right" : null)));
        if (attackDirection) {
            player.attack = attackDirection === "up"
                ? { type: "punch", direction: attackDirection, frame: 0, peakTime: null, brickWall: brickWallAttack }
                : { type: "kick", direction: attackDirection, frame: 0, peakTime: null, brickWall: brickWallAttack };
        } else {
            const attackLadder = isOverLadder(player.x, player.y);
            const insideLadder = attackLadder && (
                player.isClimbing ||
                (player.y > attackLadder.y1 - player.height + 10 &&
                    player.y < attackLadder.y2 - player.height - 10)
            );
            const fallbackDirection = insideLadder ? (player.lastClimbDirection || "up") : player.direction;
            player.attack = fallbackDirection === "up"
                ? { type: "punch", direction: "up", frame: 0, peakTime: null, brickWall: brickWallAttack }
                : { type: "kick", direction: fallbackDirection, frame: 0, peakTime: null, brickWall: brickWallAttack };
        }
        spacePressedPending = false;
        spacePressedWithShift = false;
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
    if (brickWallEncounter) {
        const halfWidth = Math.max(player.width / 2, player.height * 0.15);
        player.x = Math.max(brickWallEncounter.left + BRICK_WALL_THICKNESS + halfWidth,
            Math.min(brickWallEncounter.right - BRICK_WALL_THICKNESS - halfWidth, player.x));
        player.isClimbing = false;
        player.currentFloor = brickWallEncounter.floor;
        player.y = brickWallEncounter.floorY - player.height;
    }
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

function updateEnemies(now = getGameTime()) {
    if (gameState.gameOver) return;
    if (enemies.length >= MAX_VISIBLE_ENEMIES) {
        nextEnemySpawnTime = null;
    } else if (nextEnemySpawnTime === null) {
        nextEnemySpawnTime = now + getRandomEnemySpawnInterval();
    } else if (now >= nextEnemySpawnTime) {
        nextEnemySpawnTime = now + getRandomEnemySpawnInterval();
        const enemyHeight = player.height / 2;
        const enemyWidth = enemyHeight * 1.5;
        const spawnCount = Math.min(1 + Math.floor(Math.random() * 3), MAX_VISIBLE_ENEMIES - enemies.length);
        if (enemyHeight > 0 && enemyWidth <= canvas.width) {
            const minX = enemyWidth / 2;
            const maxX = canvas.width - enemyWidth / 2;
            const playerCenterX = player.x + player.width / 2;
            const ladderWidth = ladders.length > 0 ? ladders[0].width : 40;
            const clearance = ladderWidth * ENEMY_CLEARANCE_LADDER_WIDTHS;
            let validRanges = [
                [minX, Math.min(maxX, playerCenterX - clearance)],
                [Math.max(minX, playerCenterX + clearance), maxX]
            ].filter(([rangeStart, rangeEnd]) => rangeEnd >= rangeStart);
            if (brickWallEncounter) {
                validRanges = [
                    [minX, Math.min(maxX, brickWallEncounter.left - enemyWidth / 2)],
                    [Math.max(minX, brickWallEncounter.right + enemyWidth / 2), maxX]
                ].filter(([rangeStart, rangeEnd]) => rangeEnd >= rangeStart);
            }
            const totalRange = validRanges.reduce((sum, [rangeStart, rangeEnd]) => sum + rangeEnd - rangeStart, 0);
            if (totalRange > 0) {
                for (let spawnIndex = 0; spawnIndex < spawnCount; spawnIndex++) {
                    let randomX = Math.random() * totalRange;
                    let enemyX = minX;
                    for (const [rangeStart, rangeEnd] of validRanges) {
                        const rangeLength = rangeEnd - rangeStart;
                        if (randomX <= rangeLength) {
                            enemyX = rangeStart + randomX;
                            break;
                        }
                        randomX -= rangeLength;
                    }

                    const sectionHeight = canvas.height / 3;
                    const floorSurfaces = [sectionHeight, sectionHeight * 2, canvas.height - 15];
                    const floorSurface = floorSurfaces[Math.floor(Math.random() * floorSurfaces.length)];
                    enemies.push({
                        x: enemyX,
                        y: floorSurface - enemyHeight,
                        width: enemyWidth,
                        height: enemyHeight,
                        floor: 2 - floorSurfaces.indexOf(floorSurface),
                        roamDirection: null,
                        isRoaming: false,
                        isMoving: false
                    });
                }
            }
        }
    }

    const movementSpeed = player.speed / 2;
    const playerCenterX = player.x + player.width / 2;
    for (const enemy of enemies) {
        const previousX = enemy.x;
        const minX = enemy.width / 2;
        const maxX = canvas.width - enemy.width / 2;
        if (brickWallEncounter && enemy.floor === brickWallEncounter.floor) {
            const midpoint = (brickWallEncounter.left + brickWallEncounter.right) / 2;
            if (!enemy.arenaSide) enemy.arenaSide = enemy.x <= midpoint ? -1 : 1;
            const boundary = enemy.arenaSide < 0
                ? Math.max(minX, brickWallEncounter.left - enemy.width / 2)
                : Math.min(maxX, brickWallEncounter.right + enemy.width / 2);
            if (enemy.arenaSide < 0) {
                enemy.x = Math.min(enemy.x, boundary);
                if (enemy.roamDirection === null || enemy.roamDirection === undefined) enemy.roamDirection = -1;
                enemy.x += enemy.roamDirection * movementSpeed;
                if (enemy.x <= minX) {
                    enemy.x = minX;
                    enemy.roamDirection = 1;
                } else if (enemy.x >= boundary) {
                    enemy.x = boundary;
                    enemy.roamDirection = -1;
                }
            } else {
                enemy.x = Math.max(enemy.x, boundary);
                if (enemy.roamDirection === null || enemy.roamDirection === undefined) enemy.roamDirection = 1;
                enemy.x += enemy.roamDirection * movementSpeed;
                if (enemy.x >= maxX) {
                    enemy.x = maxX;
                    enemy.roamDirection = -1;
                } else if (enemy.x <= boundary) {
                    enemy.x = boundary;
                    enemy.roamDirection = 1;
                }
            }
            enemy.isMoving = enemy.x !== previousX;
            continue;
        }
        const shouldRoam = player.isClimbing || enemy.floor !== player.currentFloor;

        if (shouldRoam) {
            if (!enemy.isRoaming) {
                enemy.roamDirection = Math.random() < 0.5 ? -1 : 1;
                enemy.isRoaming = true;
            }
            enemy.x += enemy.roamDirection * movementSpeed;
            if (enemy.x <= minX) {
                enemy.x = minX;
                enemy.roamDirection = 1;
            } else if (enemy.x >= maxX) {
                enemy.x = maxX;
                enemy.roamDirection = -1;
            }
        } else {
            enemy.isRoaming = false;
            const distanceToPlayer = playerCenterX - enemy.x;
            enemy.x += Math.sign(distanceToPlayer) * Math.min(movementSpeed, Math.abs(distanceToPlayer));
            enemy.x = Math.max(minX, Math.min(maxX, enemy.x));
        }
        enemy.isMoving = enemy.x !== previousX;
    }
    updateCrabDeathEffects(now);
    resolveEnemyCollisions(now);
}

function getAttackContactShape() {
    const attack = player.attack;
    if (!attack) return null;

    const progress = Math.sin(Math.PI * attack.frame / ATTACK_DURATION);
    if (progress <= 0.05) return null;

    const headRadius = player.height * 0.15;
    const legLength = player.height * 0.25;
    const armLength = player.height * 0.2;
    const centerX = player.x;
    const headY = player.y + headRadius;
    const bodyTopY = headY + headRadius;
    const bodyBottomY = bodyTopY + player.height * 0.4;
    const shoulderY = bodyTopY + player.height * 0.4 * 0.3;
    const side = attack.type === "kick"
        ? ((attack.direction === "left" || (attack.direction === "down" && player.direction === "left")) ? -1 : 1)
        : (player.direction === "left" ? -1 : 1);

    if (attack.type === "kick") {
        const kickLength = legLength * 5;
        const kickStartX = side * 10;
        const kickStartY = legLength;
        const kickTargetX = attack.direction === "down"
            ? side * legLength * 0.2
            : side * Math.sqrt(kickLength * kickLength - legLength * legLength * 0.01);
        const kickTargetY = attack.direction === "down"
            ? Math.sqrt(kickLength * kickLength - kickTargetX * kickTargetX)
            : -legLength * 0.1;
        const tipX = centerX + kickStartX + (kickTargetX - kickStartX) * progress;
        const tipY = bodyBottomY + kickStartY + (kickTargetY - kickStartY) * progress;
        const vectorX = tipX - centerX;
        const vectorY = tipY - bodyBottomY;
        const vectorLength = Math.hypot(vectorX, vectorY);
        if (vectorLength === 0) return null;
        const toeX = tipX + vectorX / vectorLength * headRadius * 3;
        const toeY = tipY + vectorY / vectorLength * headRadius * 3;
        return { type: "kick", x1: centerX, y1: bodyBottomY, x2: toeX, y2: toeY };
    }

    if (attack.type === "punch") {
        const punchHorizontal = side * armLength * 0.45;
        const punchY = attack.direction === "up"
            ? shoulderY - Math.sqrt(armLength * armLength * 25 - punchHorizontal * punchHorizontal) * progress
            : shoulderY + armLength * 1.8 * progress;
        return {
            type: "punch",
            x: centerX + punchHorizontal,
            y: punchY,
            radius: headRadius * 0.8
        };
    }

    return null;
}

function segmentIntersectsRectangle(x1, y1, x2, y2, rectangle) {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    let minT = 0;
    let maxT = 1;
    const clips = [
        [-deltaX, x1 - rectangle.left],
        [deltaX, rectangle.right - x1],
        [-deltaY, y1 - rectangle.top],
        [deltaY, rectangle.bottom - y1]
    ];

    for (const [p, q] of clips) {
        if (p === 0) {
            if (q < 0) return false;
            continue;
        }
        const t = q / p;
        if (p < 0) {
            if (t > maxT) return false;
            minT = Math.max(minT, t);
        } else {
            if (t < minT) return false;
            maxT = Math.min(maxT, t);
        }
    }
    return true;
}

function circleIntersectsRectangle(x, y, radius, rectangle) {
    const closestX = Math.max(rectangle.left, Math.min(x, rectangle.right));
    const closestY = Math.max(rectangle.top, Math.min(y, rectangle.bottom));
    return Math.hypot(x - closestX, y - closestY) <= radius;
}

function getEnemyRectangle(enemy) {
    return {
        left: enemy.x - enemy.width / 2,
        right: enemy.x + enemy.width / 2,
        top: enemy.y,
        bottom: enemy.y + enemy.height
    };
}

function attackTouchesEnemy(attackShape, enemyRectangle) {
    if (attackShape.type === "kick") {
        return segmentIntersectsRectangle(attackShape.x1, attackShape.y1, attackShape.x2, attackShape.y2, enemyRectangle);
    }
    return circleIntersectsRectangle(attackShape.x, attackShape.y, attackShape.radius, enemyRectangle);
}

function playerBodyTouchesEnemy(enemyRectangle) {
    const halfWidth = Math.max(player.width / 2, player.height * 0.15);
    const playerRectangle = {
        left: player.x - halfWidth,
        right: player.x + halfWidth,
        top: player.y,
        bottom: player.y + player.height
    };
    return playerRectangle.left < enemyRectangle.right &&
        playerRectangle.right > enemyRectangle.left &&
        playerRectangle.top < enemyRectangle.bottom &&
        playerRectangle.bottom > enemyRectangle.top;
}

function getAttackTravelDirection() {
    const direction = player.attack && player.attack.direction;
    if (direction === "left") return { x: -1, y: 0 };
    if (direction === "right") return { x: 1, y: 0 };
    if (direction === "up") return { x: 0, y: -1 };
    if (direction === "down") return { x: 0, y: 1 };
    return { x: player.direction === "left" ? -1 : 1, y: 0 };
}

function updateCrabDeathEffects(now) {
    for (let index = crabDeathEffects.length - 1; index >= 0; index--) {
        const effect = crabDeathEffects[index];
        if (now - effect.startTime >= CRAB_DEATH_DURATION_MS) {
            crabDeathEffects.splice(index, 1);
            continue;
        }
        const deltaSeconds = Math.max(0, now - effect.lastUpdatedAt) / 1000;
        effect.x += effect.velocityX * deltaSeconds;
        effect.y += effect.velocityY * deltaSeconds + 0.5 * effect.gravity * deltaSeconds * deltaSeconds;
        effect.velocityY += effect.gravity * deltaSeconds;
        effect.rotation += effect.rotationSpeed * deltaSeconds;
        effect.lastUpdatedAt = now;
    }
}

function resolveEnemyCollisions(now) {
    const attackShape = getAttackContactShape();
    const immune = now < gameState.immuneUntil;

    for (let index = enemies.length - 1; index >= 0; index--) {
        const enemy = enemies[index];
        const enemyRectangle = getEnemyRectangle(enemy);
        if (attackShape && attackTouchesEnemy(attackShape, enemyRectangle)) {
            if (!brickWallEncounter && player.attack.brickWall && enemy.floor === player.currentFloor) {
                enemies.splice(index, 1);
                beginBrickWallEncounter(enemy, now);
                continue;
            }
            enemies.splice(index, 1);
            const hitDirection = getAttackTravelDirection();
            crabDeathEffects.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                width: enemy.width,
                height: enemy.height,
                velocityX: hitDirection.x * 360,
                velocityY: hitDirection.y * 360 - (hitDirection.y === 0 ? 180 : 0),
                gravity: CRAB_DEATH_GRAVITY,
                rotation: Math.PI,
                rotationSpeed: hitDirection.x !== 0 ? hitDirection.x * 1.8 : -hitDirection.y * 1.8,
                startTime: now,
                lastUpdatedAt: now
            });
            gameState.score += 1;
            player.laughUntil = now + LAUGH_DURATION_MS;
            updateGameData();
            if (gameState.score >= 15) {
                gameState.won = true;
                gameState.gameOver = true;
                break;
            }
            continue;
        }

        if (immune || !playerBodyTouchesEnemy(enemyRectangle)) continue;
        gameState.lives = Math.max(0, gameState.lives - 1);
        gameState.immuneUntil = now + PLAYER_IMMUNITY_MS;
        updateGameData();
        if (gameState.lives === 0) {
            gameState.gameOver = true;
        }
        break;
    }


}

function beginBrickWallEncounter(enemy, now) {
    const sectionHeight = canvas.height / 3;
    const floorY = [canvas.height - 15, sectionHeight * 2, sectionHeight][enemy.floor];
    const playerCenterX = player.x + player.width / 2;
    const desiredWidth = enemy.width * 3 + BRICK_WALL_THICKNESS * 2;
    const enclosureWidth = Math.min(canvas.width, desiredWidth);
    const enclosureCenter = (playerCenterX + enemy.x) / 2;
    const left = Math.max(0, Math.min(canvas.width - enclosureWidth, enclosureCenter - enclosureWidth / 2));
    const right = left + enclosureWidth;
    brickWallEncounter = {
        crab: { ...enemy, isMoving: false, isRoaming: false },
        floor: enemy.floor,
        floorY,
        top: floorY - sectionHeight + 8,
        left,
        right,
        startTime: now,
        captureTime: now,
        openingAttack: player.attack
    };
    player.isMoving = false;
    for (const other of enemies) {
        if (other.floor !== enemy.floor) continue;
        const midpoint = (left + right) / 2;
        const hasLeftOutside = left >= other.width / 2;
        const hasRightOutside = right + other.width / 2 <= canvas.width;
        other.arenaSide = !hasLeftOutside ? 1
            : (!hasRightOutside ? -1 : (other.x <= midpoint ? -1 : 1));
        if (other.arenaSide < 0) other.x = Math.min(other.x, left - other.width / 2);
        else other.x = Math.max(other.x, right + other.width / 2);
    }
}

function addCrabDeathEffect(enemy, now) {
    const hitDirection = getAttackTravelDirection();
    crabDeathEffects.push({
        x: enemy.x,
        y: enemy.y + enemy.height / 2,
        width: enemy.width,
        height: enemy.height,
        velocityX: hitDirection.x * 360,
        velocityY: hitDirection.y * 360 - (hitDirection.y === 0 ? 180 : 0),
        gravity: CRAB_DEATH_GRAVITY,
        rotation: Math.PI,
        rotationSpeed: hitDirection.x !== 0 ? hitDirection.x * 1.8 : -hitDirection.y * 1.8,
        startTime: now,
        lastUpdatedAt: now
    });
}

function drawCrab(enemy, now = getGameTime()) {
    const centerX = enemy.x;
    const centerY = enemy.y + enemy.height * 0.52;
    const halfWidth = enemy.width / 2;
    const height = enemy.height;
    const outlineColor = 'darkgray';

    ctx.lineWidth = 3;
    ctx.strokeStyle = outlineColor;

    for (const side of [-1, 1]) {
        for (let leg = 0; leg < 3; leg++) {
            const attachX = centerX + side * enemy.width * 0.17;
            const attachY = enemy.y + height * (0.52 + leg * 0.055);
            const legPhase = now / 90 + leg * Math.PI / 2 + (side === 1 ? Math.PI : 0);
            const legSwing = enemy.isMoving ? Math.sin(legPhase) * height * 0.1 : 0;
            const jointX = centerX + side * enemy.width * (0.31 + leg * 0.015) + legSwing * 0.5;
            const jointY = enemy.y + height * (0.61 + leg * 0.07) - Math.max(0, Math.cos(legPhase)) * height * 0.025 * (enemy.isMoving ? 1 : 0);
            const footX = centerX + side * enemy.width * 0.44 + legSwing;
            const footY = enemy.y + height * (0.86 + leg * 0.05) - Math.max(0, Math.cos(legPhase)) * height * 0.035 * (enemy.isMoving ? 1 : 0);
            ctx.beginPath();
            ctx.moveTo(attachX, attachY);
            ctx.lineTo(jointX, jointY);
            ctx.lineTo(footX, footY);
            ctx.stroke();
        }

        const clawX = centerX + side * enemy.width * 0.42;
        const clawY = enemy.y + height * 0.29;
        ctx.beginPath();
        ctx.moveTo(centerX + side * enemy.width * 0.18, enemy.y + height * 0.43);
        ctx.lineTo(centerX + side * enemy.width * 0.31, enemy.y + height * 0.34);
        ctx.lineTo(clawX, clawY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(clawX, clawY, height * 0.1, 0, Math.PI * 2);
        ctx.stroke();

        const clawOpen = (Math.sin(now / 220) + 1) / 2;
        const clawSpread = height * (0.025 + clawOpen * 0.1);
        const clawTipDistance = height * (0.09 + clawOpen * 0.1);
        ctx.beginPath();
        ctx.moveTo(clawX + side * height * 0.06, clawY);
        ctx.lineTo(clawX + side * clawTipDistance, clawY - clawSpread);
        ctx.moveTo(clawX + side * height * 0.06, clawY);
        ctx.lineTo(clawX + side * clawTipDistance, clawY + clawSpread);
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, enemy.width * 0.28, height * 0.25, 0, 0, Math.PI * 2);
    ctx.stroke();

    for (const side of [-1, 1]) {
        const eyeX = centerX + side * enemy.width * 0.08;
        const eyeY = enemy.y + height * 0.23;
        ctx.beginPath();
        ctx.moveTo(eyeX, enemy.y + height * 0.36);
        ctx.lineTo(eyeX, eyeY + height * 0.035);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, height * 0.035, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawCrabDeathAnimation(effect, now) {
    const elapsed = now - effect.startTime;
    const previousAlpha = ctx.globalAlpha;
    if (elapsed >= CRAB_DEATH_FLICKER_START_MS &&
        Math.floor((elapsed - CRAB_DEATH_FLICKER_START_MS) / 80) % 2 === 0) {
        ctx.globalAlpha = previousAlpha * 0.3;
    }

    const deadCrab = {
        x: 0,
        y: -effect.height * 0.52,
        width: effect.width,
        height: effect.height,
        isMoving: false
    };
    if (ctx.save && ctx.translate && ctx.rotate && ctx.restore) {
        ctx.save();
        ctx.translate(effect.x, effect.y);
        ctx.rotate(effect.rotation);
        drawCrab(deadCrab, now);
        ctx.restore();
    } else {
        deadCrab.x = effect.x;
        deadCrab.y += effect.y;
        drawCrab(deadCrab, now);
    }
    ctx.globalAlpha = previousAlpha;
}
function drawBrickWallEncounter(encounter, now) {
    const progress = Math.min(1, Math.max(0, (now - encounter.startTime) / BRICK_WALL_BUILD_DURATION_MS));
    const wallHeight = (encounter.floorY - encounter.top) * progress;
    const wallTop = encounter.floorY - wallHeight;
    const left = encounter.left;
    const right = encounter.right;
    const brickHeight = 22;
    const brickWidth = 42;
    const drawBrickColumn = x => {
        for (let y = encounter.floorY - brickHeight; y >= wallTop; y -= brickHeight) {
            const row = Math.floor((encounter.floorY - y) / brickHeight);
            ctx.fillStyle = row % 2 === 0 ? '#9b3d2e' : '#843126';
            ctx.fillRect(x, Math.max(wallTop, y), BRICK_WALL_THICKNESS, Math.min(brickHeight - 2, encounter.floorY - Math.max(wallTop, y)));
            ctx.strokeStyle = '#d08b68';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + BRICK_WALL_THICKNESS, y);
            ctx.stroke();
        }
    };
    drawBrickColumn(left);
    drawBrickColumn(right - BRICK_WALL_THICKNESS);
    const lintelWidth = (right - left - BRICK_WALL_THICKNESS * 2) * progress;
    const lintelLeft = (left + right - lintelWidth) / 2;
    for (let x = lintelLeft; x < lintelLeft + lintelWidth; x += brickWidth) {
        ctx.fillStyle = Math.floor((x - lintelLeft) / brickWidth) % 2 === 0 ? '#9b3d2e' : '#843126';
        ctx.fillRect(x, wallTop, Math.min(brickWidth - 2, lintelLeft + lintelWidth - x), BRICK_WALL_THICKNESS);
        ctx.strokeStyle = '#d08b68';
        ctx.lineWidth = 2;
        ctx.strokeRect?.(x, wallTop, Math.min(brickWidth - 2, lintelLeft + lintelWidth - x), BRICK_WALL_THICKNESS);
    }
}

function drawButterflyNet(encounter, playerHeight) {
    const crab = encounter.crab;
    const crabScale = 0.55;
    const crabWidth = crab.width * crabScale;
    const crabHeight = crab.height * crabScale;
    const netCenterX = crab.x;
    const netCenterY = encounter.floorY - crabHeight * 0.52;
    const handleX = player.x + (player.direction === 'left' ? -1 : 1) * playerHeight * 0.18;
    const handleY = encounter.floorY - playerHeight * 0.45;
    const rimWidth = crabWidth * 1.22;
    const rimHeight = crabHeight * 1.12;

    ctx.strokeStyle = '#6b4b2a';
    ctx.lineWidth = Math.max(4, playerHeight * 0.025);
    ctx.beginPath();
    ctx.moveTo(handleX, handleY);
    ctx.lineTo(netCenterX, netCenterY);
    ctx.stroke();

    ctx.strokeStyle = '#d8e8e8';
    ctx.lineWidth = Math.max(3, playerHeight * 0.018);
    ctx.beginPath();
    ctx.ellipse(netCenterX, netCenterY, rimWidth / 2, rimHeight / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (const offset of [-0.25, 0, 0.25]) {
        ctx.beginPath();
        ctx.moveTo(netCenterX + rimWidth * offset, netCenterY - rimHeight * 0.42);
        ctx.lineTo(netCenterX + rimWidth * offset * 0.55, netCenterY + rimHeight * 0.42);
        ctx.stroke();
    }
}

function drawCrabCookingPot(encounter, now, chefHeight) {
    const crab = encounter.crab;
    const centerX = crab.x;
    const floorY = encounter.floorY;
    const stoveHeight = chefHeight * 0.5;
    const stoveWidth = chefHeight * 0.95;
    const stoveTop = floorY - stoveHeight;
    const potWidth = chefHeight * 0.66;
    const potHeight = chefHeight * 0.62;
    const potTop = stoveTop - potHeight * 0.78;
    const rimY = potTop + potHeight * 0.16;

    // Compact freestanding stove, half the chef's rendered height.
    ctx.fillStyle = '#555555';
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - stoveWidth / 2, stoveTop + 8);
    ctx.lineTo(centerX + stoveWidth / 2, stoveTop + 8);
    ctx.lineTo(centerX + stoveWidth * 0.42, floorY - 4);
    ctx.lineTo(centerX - stoveWidth * 0.42, floorY - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#242424';
    ctx.beginPath();
    ctx.ellipse(centerX, stoveTop + 5, stoveWidth * 0.4, chefHeight * 0.035, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(centerX + side * stoveWidth * 0.25, stoveTop + stoveHeight * 0.55,
            chefHeight * 0.035, 0, Math.PI * 2);
        ctx.fillStyle = '#dddddd';
        ctx.fill();
        ctx.stroke();
    }

    // Moving steam remains visible above the pot.
    const steamPhase = now / 180;
    ctx.strokeStyle = '#eeeeee';
    ctx.lineWidth = Math.max(3, chefHeight * 0.025);
    for (let index = -1; index <= 1; index++) {
        const steamX = centerX + index * potWidth * 0.24;
        const sway = Math.sin(steamPhase + index) * potWidth * 0.12;
        ctx.beginPath();
        ctx.moveTo(steamX, potTop - chefHeight * 0.025);
        ctx.quadraticCurveTo(steamX - sway, potTop - chefHeight * 0.2,
            steamX + sway, potTop - chefHeight * 0.36);
        ctx.quadraticCurveTo(steamX + sway * 1.5, potTop - chefHeight * 0.5,
            steamX - sway * 0.4, potTop - chefHeight * 0.62);
        ctx.stroke();
    }

    // Tall cylindrical pot sitting on the stove.
    ctx.fillStyle = '#858585';
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - potWidth / 2, potTop + potHeight * 0.12);
    ctx.lineTo(centerX - potWidth * 0.44, potTop + potHeight * 0.88);
    ctx.quadraticCurveTo(centerX, potTop + potHeight * 1.02,
        centerX + potWidth * 0.44, potTop + potHeight * 0.88);
    ctx.lineTo(centerX + potWidth / 2, potTop + potHeight * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(centerX, rimY, potWidth / 2, chefHeight * 0.035, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#333333';
    ctx.fill();
    ctx.stroke();

    // The crab is hidden in the pot except for its cooked red claws.
    for (const side of [-1, 1]) {
        const clawX = centerX + side * potWidth * 0.34;
        const clawY = rimY - chefHeight * 0.04;
        ctx.strokeStyle = '#d52b2b';
        ctx.fillStyle = '#e33434';
        ctx.lineWidth = Math.max(4, chefHeight * 0.035);
        ctx.beginPath();
        ctx.moveTo(centerX + side * potWidth * 0.18, rimY + chefHeight * 0.06);
        ctx.lineTo(clawX, clawY);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(clawX, clawY, chefHeight * 0.065, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(clawX + side * chefHeight * 0.03, clawY - chefHeight * 0.03);
        ctx.lineTo(clawX + side * chefHeight * 0.11, clawY - chefHeight * 0.075);
        ctx.moveTo(clawX + side * chefHeight * 0.03, clawY + chefHeight * 0.03);
        ctx.lineTo(clawX + side * chefHeight * 0.11, clawY + chefHeight * 0.075);
        ctx.stroke();
    }
}

function drawChefHat(x, y, height) {
    const headRadius = height * 0.15;
    const headY = y + headRadius;
    const hatWidth = headRadius * 2.5;
    const hatHeight = headRadius * 1.7;
    const hatBottom = headY - headRadius * 0.72;

    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - hatWidth / 2, hatBottom);
    ctx.lineTo(x - hatWidth * 0.4, headY - hatHeight * 0.55);
    ctx.quadraticCurveTo(x - hatWidth * 0.55, headY - hatHeight * 1.35,
        x - hatWidth * 0.12, headY - hatHeight);
    ctx.quadraticCurveTo(x, headY - hatHeight * 1.55,
        x + hatWidth * 0.12, headY - hatHeight);
    ctx.quadraticCurveTo(x + hatWidth * 0.55, headY - hatHeight * 1.35,
        x + hatWidth * 0.4, headY - hatHeight * 0.55);
    ctx.lineTo(x + hatWidth / 2, hatBottom);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(x - hatWidth / 2, hatBottom, hatWidth, headRadius * 0.24);
    ctx.strokeRect?.(x - hatWidth / 2, hatBottom, hatWidth, headRadius * 0.24);
}

function drawChefApron(x, y, height) {
    const headRadius = height * 0.15;
    const bodyTop = y + headRadius * 2.3;
    const bodyBottom = bodyTop + height * 0.34;
    const apronWidth = height * 0.21;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d8d8d8';
    ctx.lineWidth = Math.max(2, height * 0.012);
    ctx.beginPath();
    ctx.moveTo(x - apronWidth * 0.34, bodyTop);
    ctx.lineTo(x + apronWidth * 0.34, bodyTop);
    ctx.lineTo(x + apronWidth * 0.55, bodyBottom);
    ctx.lineTo(x - apronWidth * 0.55, bodyBottom);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - apronWidth * 0.34, bodyTop + height * 0.02);
    ctx.lineTo(x - apronWidth * 0.26, bodyTop - height * 0.025);
    ctx.moveTo(x + apronWidth * 0.34, bodyTop + height * 0.02);
    ctx.lineTo(x + apronWidth * 0.26, bodyTop - height * 0.025);
    ctx.stroke();
}

function drawCookedCrab(x, y, size) {
    ctx.fillStyle = '#df3434';
    ctx.strokeStyle = '#9c1f1f';
    ctx.lineWidth = Math.max(2, size * 0.035);
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.3, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (const side of [-1, 1]) {
        for (let leg = 0; leg < 3; leg++) {
            const startY = y - size * 0.02 + leg * size * 0.055;
            ctx.beginPath();
            ctx.moveTo(x + side * size * 0.2, startY);
            ctx.lineTo(x + side * size * 0.42, startY + (leg - 1) * size * 0.12);
            ctx.stroke();
        }
        const clawX = x + side * size * 0.36;
        const clawY = y - size * 0.19;
        ctx.beginPath();
        ctx.moveTo(x + side * size * 0.18, y - size * 0.1);
        ctx.lineTo(clawX, clawY);
        ctx.arc(clawX + side * size * 0.055, clawY, size * 0.09, Math.PI, Math.PI * 2);
        ctx.stroke();
    }
}

function drawTableScene(encounter, now) {
    const sceneHeight = Math.min(player.height * 0.62, (encounter.floorY - encounter.top) * 0.72);
    const innerLeft = encounter.left + BRICK_WALL_THICKNESS + sceneHeight * 0.1;
    const innerRight = encounter.right - BRICK_WALL_THICKNESS - sceneHeight * 0.1;
    const roomWidth = Math.max(sceneHeight, innerRight - innerLeft);
    const playerX = player.x;
    const playerY = encounter.floorY - sceneHeight;
    const tableY = encounter.floorY - sceneHeight * 0.43;
    const tableLeft = Math.max(innerLeft, (innerLeft + innerRight - roomWidth * 0.9) / 2);
    const tableWidth = Math.min(roomWidth * 0.9, innerRight - innerLeft);

    // Keep the chair, chef, table, and plate at the captured encounter location.
    ctx.fillStyle = '#70452b';
    ctx.fillRect(playerX - sceneHeight * 0.23, playerY + sceneHeight * 0.38,
        sceneHeight * 0.46, sceneHeight * 0.62);
    ctx.fillStyle = '#95613b';
    ctx.fillRect(playerX - sceneHeight * 0.3, tableY - sceneHeight * 0.08,
        sceneHeight * 0.6, sceneHeight * 0.12);
    drawStickman(playerX, playerY, sceneHeight, 'right', 0, false, null, now, 'red');
    drawChefApron(playerX, playerY, sceneHeight);
    drawChefHat(playerX, playerY, sceneHeight);

    // The tabletop masks the chef's legs to create a seated pose.
    ctx.fillStyle = '#7c4828';
    ctx.fillRect(tableLeft, tableY, tableWidth, sceneHeight * 0.12);
    ctx.fillStyle = '#59351f';
    ctx.fillRect(tableLeft + tableWidth * 0.05, tableY + sceneHeight * 0.12,
        tableWidth * 0.9, sceneHeight * 0.32);
    ctx.fillRect(tableLeft + tableWidth * 0.08, tableY + sceneHeight * 0.44,
        sceneHeight * 0.07, encounter.floorY - tableY - sceneHeight * 0.44);
    ctx.fillRect(tableLeft + tableWidth * 0.85, tableY + sceneHeight * 0.44,
        sceneHeight * 0.07, encounter.floorY - tableY - sceneHeight * 0.44);

    const plateX = Math.max(tableLeft + sceneHeight * 0.48,
        Math.min(tableLeft + tableWidth - sceneHeight * 0.48, playerX + sceneHeight * 0.52));
    const plateY = tableY - sceneHeight * 0.025;
    ctx.fillStyle = '#f8f5ed';
    ctx.strokeStyle = '#a8a8a8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(plateX, plateY, sceneHeight * 0.42, sceneHeight * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(plateX, plateY - sceneHeight * 0.025, sceneHeight * 0.3, sceneHeight * 0.08, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawCookedCrab(plateX, plateY - sceneHeight * 0.2, sceneHeight * 0.8);
    drawDiningUtensils(playerX, tableY, plateX, sceneHeight);
}

function drawDiningUtensils(playerX, tableY, plateX, size) {
    const forkHandX = playerX + size * 0.12;
    const knifeHandX = playerX + size * 0.18;
    const handsY = tableY + size * 0.035;
    const forkTipX = plateX - size * 0.2;
    const knifeTipX = plateX + size * 0.2;
    const utensilY = tableY - size * 0.12;

    // Red stick-figure arms reach over the table to hold both utensils.
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = Math.max(4, size * 0.035);
    ctx.beginPath();
    ctx.moveTo(playerX - size * 0.04, tableY - size * 0.15);
    ctx.lineTo(forkHandX, handsY);
    ctx.moveTo(playerX + size * 0.04, tableY - size * 0.15);
    ctx.lineTo(knifeHandX, handsY + size * 0.035);
    ctx.stroke();
    ctx.fillStyle = '#d32f2f';
    for (const handX of [forkHandX, knifeHandX]) {
        ctx.beginPath();
        ctx.arc(handX, handsY, size * 0.035, 0, Math.PI * 2);
        ctx.fill();
    }

    // Fork and knife angle from the chef's hands toward the plate.
    ctx.strokeStyle = '#dedede';
    ctx.lineWidth = Math.max(2, size * 0.018);
    ctx.beginPath();
    ctx.moveTo(forkHandX, handsY);
    ctx.lineTo(forkTipX, utensilY);
    ctx.moveTo(forkTipX - size * 0.025, utensilY - size * 0.055);
    ctx.lineTo(forkTipX, utensilY);
    ctx.lineTo(forkTipX + size * 0.025, utensilY - size * 0.055);
    ctx.moveTo(forkTipX, utensilY);
    ctx.lineTo(forkTipX, utensilY - size * 0.065);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(knifeHandX, handsY + size * 0.035);
    ctx.lineTo(knifeTipX, utensilY + size * 0.015);
    ctx.stroke();
    ctx.fillStyle = '#eeeeee';
    ctx.beginPath();
    ctx.moveTo(knifeTipX - size * 0.015, utensilY + size * 0.025);
    ctx.lineTo(knifeTipX + size * 0.06, utensilY - size * 0.045);
    ctx.lineTo(knifeTipX + size * 0.025, utensilY + size * 0.055);
    ctx.closePath();
    ctx.fill();
}

function drawFloorWords(sectionHeight) {
    const previousFilter = ctx.filter || "none";
    ctx.filter = previousFilter === "none" ? "blur(4px)" : previousFilter + " blur(4px)";
    const floorWords = [
        { text: 'kill', y: sectionHeight / 2 },
        { text: 'the', y: sectionHeight * 1.5 },
        { text: 'crabs', y: (sectionHeight * 2 + canvas.height - 15) / 2 }
    ];

    ctx.fillStyle = 'yellow';
    ctx.font = 'bold 160px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const floorWord of floorWords) {
        ctx.fillText(floorWord.text, canvas.width / 2, floorWord.y);
    }
    ctx.filter = previousFilter;
}

function drawGame(now = getGameTime()) {
    ctx.filter = (gameState.gameOver || (gameState.paused && !gameState.manualPaused)) ? 'blur(16px)' : 'none';
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const sectionHeight = canvas.height / 3;
    
    drawFloorLines(sectionHeight);
    drawFloorWords(sectionHeight);
    
    for (const ladder of ladders) {
        drawLadder(ladder.x, ladder.y1, ladder.y2, ladder.width);
    }

    for (const enemy of enemies) {
        drawCrab(enemy, now);
    }
    for (const deathEffect of crabDeathEffects) {
        drawCrabDeathAnimation(deathEffect, now);
    }
    if (brickWallEncounter) {
        drawBrickWallEncounter(brickWallEncounter, now);
        const chefHeight = player.height * 0.62;
        const captureElapsed = now - brickWallEncounter.captureTime;
        if (captureElapsed < CRAB_NET_CAPTURE_DURATION_MS) {
            const capturedCrab = brickWallEncounter.crab;
            const crabScale = 0.55;
            drawCrab({ ...capturedCrab, width: capturedCrab.width * crabScale,
                height: capturedCrab.height * crabScale,
                y: brickWallEncounter.floorY - capturedCrab.height * crabScale,
                isMoving: false }, now);
        } else if (captureElapsed < CRAB_NET_CAPTURE_DURATION_MS + CRAB_COOKING_SCENE_MS) {
            drawCrabCookingPot(brickWallEncounter, now, chefHeight);
        }
    }
    
    const immunityAge = PLAYER_IMMUNITY_MS - (gameState.immuneUntil - now);
    const blinkPhase = Math.floor(immunityAge / 250) % 4;
    const captureElapsed = brickWallEncounter ? now - brickWallEncounter.captureTime : -1;
    const diningScene = brickWallEncounter &&
        captureElapsed >= CRAB_NET_CAPTURE_DURATION_MS + CRAB_COOKING_SCENE_MS;
    if (diningScene) {
        drawTableScene(brickWallEncounter, now);
    } else if (brickWallEncounter || now >= gameState.immuneUntil || blinkPhase % 2 === 0) {
        const playerColor = now < gameState.immuneUntil && blinkPhase === 2 ? 'magenta' : 'red';
        const chefHeight = brickWallEncounter ? player.height * 0.62 : player.height;
        const chefY = brickWallEncounter ? brickWallEncounter.floorY - chefHeight : player.y;
        drawStickman(player.x, chefY, chefHeight, player.direction, player.animationFrame,
            false, brickWallEncounter ? null : player.attack, now, playerColor);
        if (brickWallEncounter) {
            drawChefApron(player.x, chefY, chefHeight);
            drawChefHat(player.x, chefY, chefHeight);
        }
    }
    if (brickWallEncounter && captureElapsed >= 0 && captureElapsed < CRAB_NET_CAPTURE_DURATION_MS) {
        drawButterflyNet(brickWallEncounter, player.height * 0.62);
    }
    if (gameState.paused && !gameState.manualPaused) {
        ctx.filter = "none";
        ctx.fillStyle = "black";
        ctx.fillRect(canvas.width / 2 - 570, canvas.height / 2 - 135, 1140, 270);
        ctx.fillStyle = "darkgreen";
        ctx.font = "900 88px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("SPACEBAR TO RESUME", canvas.width / 2, canvas.height / 2);
    } else if (gameState.gameOver) {
        ctx.filter = "none";
        ctx.fillStyle = "black";
        ctx.fillRect(canvas.width / 2 - 570, canvas.height / 2 - 135, 1140, 270);
        ctx.fillStyle = "darkgreen";
        ctx.font = "900 192px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(gameState.won ? "YOU WIN!!!" : "GAME OVER", canvas.width / 2, canvas.height / 2);
    }
    ctx.filter = "none";
}

function updateCrabCookingAnimation(now) {
    if (!brickWallEncounter) return;
    const elapsed = now - brickWallEncounter.captureTime;
    const completeAt = CRAB_NET_CAPTURE_DURATION_MS + CRAB_COOKING_SCENE_MS + CRAB_TABLE_SCENE_MS;
    if (elapsed < completeAt) return;

    brickWallEncounter = null;
    player.attack = null;
    player.isMoving = false;
    spacePressedPending = false;
    spacePressedWithShift = false;
    gameState.score += 1;
    updateGameData();
    if (gameState.score >= 15) {
        gameState.won = true;
        gameState.gameOver = true;
    }
}

function gameLoop(timestamp) {
    const wallNow = typeof timestamp === "number" ? timestamp : getAnimationTime();
    const now = gameState.paused && pausedAtWallTime !== null
        ? pausedAtWallTime - pausedDurationMs
        : wallNow - pausedDurationMs;
    if (!gameState.gameOver && !gameState.paused && wallNow - lastKeyboardInputTime >= IDLE_PAUSE_TIMEOUT_MS) {
        gameState.paused = true;
        gameState.manualPaused = false;
        pausedAtWallTime = wallNow;
    }
    if (!gameState.gameOver && !gameState.paused) {
        if (brickWallEncounter) {
            updateCrabCookingAnimation(now);
        } else {
            updatePlayer(now);
            updateEnemies(now);
            updateCrabCookingAnimation(now);
        }
    } else if (!gameState.paused && crabDeathEffects.length > 0) {
        updateCrabDeathEffects(now);
    }
    drawGame(now);
    if (!gameState.paused && ((!gameState.gameOver || player.laughUntil > now || crabDeathEffects.length > 0)) && typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(gameLoop);
    }
}
if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('keydown', (e) => {
        const key = e.code === 'Space' || e.key === ' ' ? 'Space' :
            ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') ? 'Shift' :
                ((e.key || '').toLowerCase() === 'p' ? 'Pause' : e.key));
        if (key === 'Pause') {
            if (!e.repeat && !gameState.gameOver) {
                const wallNow = getAnimationTime();
                if (gameState.paused) {
                    pausedDurationMs += wallNow - pausedAtWallTime;
                    pausedAtWallTime = null;
                    gameState.paused = false;
                    gameState.manualPaused = false;
                    lastKeyboardInputTime = wallNow;
                    for (const pressedKey of Object.keys(keys)) keys[pressedKey] = false;
                    spaceWasDown = false;
                    spacePressedPending = false;
                    spacePressedWithShift = false;
                    if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(gameLoop);
                } else {
                    gameState.paused = true;
                    gameState.manualPaused = true;
                    pausedAtWallTime = wallNow;
                    for (const pressedKey of Object.keys(keys)) keys[pressedKey] = false;
                    spaceWasDown = false;
                    spacePressedPending = false;
                    spacePressedWithShift = false;
                }
            }
            if (e.preventDefault) e.preventDefault();
            return;
        }
        if (keys.hasOwnProperty(key)) {
            if (gameState.paused) {
                if (key === "Space" && !gameState.gameOver) {
                    const wallNow = getAnimationTime();
                    pausedDurationMs += wallNow - pausedAtWallTime;
                    pausedAtWallTime = null;
                    gameState.paused = false;
                    gameState.manualPaused = false;
                    lastKeyboardInputTime = wallNow;
                    for (const pressedKey of Object.keys(keys)) keys[pressedKey] = false;
                    spaceWasDown = false;
                    spacePressedPending = false;
                    spacePressedWithShift = false;
                    if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(gameLoop);
                }
                if (e.preventDefault) e.preventDefault();
                return;
            }
            const wasDown = keys[key];
            keys[key] = true;
            if (key === "Space" && !wasDown) {
                spacePressedPending = true;
                if (keys.Shift) spacePressedWithShift = true;
            }
            if (key === "Shift" && keys.Space) {
                spacePressedWithShift = true;
                if (player.attack) player.attack.brickWall = true;
            }
            lastKeyboardInputTime = getAnimationTime();
            if (e.preventDefault) {
                e.preventDefault();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        const key = e.code === 'Space' || e.key === ' ' ? 'Space' : ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') ? 'Shift' : e.key);
        if (keys.hasOwnProperty(key)) {
            keys[key] = false;
            lastKeyboardInputTime = getAnimationTime();
        }
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        player,
        keys,
        ladders,
        enemies,
        crabDeathEffects,
        get brickWallEncounter() { return brickWallEncounter; },
        explosionEffects: crabDeathEffects,
        gameState,
        resizeCanvas,
        drawFloorLines,
        drawLadder,
        drawStickman,
        isOverLadder,
        isNearLadder,
        updatePlayer,
        updateEnemies,
        drawCrab,
        findClosestFloor,
        drawGame,
        gameLoop
    };
}

if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('resize', resizeCanvas);
}
if (typeof module === "undefined") {
    resizeCanvas();
    gameLoop();
}
