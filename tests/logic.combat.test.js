const { setupMockEnvironment, teardownMockEnvironment } = require('./test-helpers.js');

function testCombatAttacksAndExplosions() {
    setupMockEnvironment();
    let logic = require("../resources/v1.3/logic.js");
    logic.resizeCanvas();
    logic.player.x = 200;
    logic.player.currentFloor = 2;
    logic.player.isClimbing = false;
    const sectionHeight = mockCanvas.height / 3;
    const enemyHeight = logic.player.height / 2;
    logic.enemies.push({
        x: logic.player.x + logic.player.height * 1.25,
        y: sectionHeight - enemyHeight,
        width: enemyHeight * 1.5,
        height: enemyHeight,
        floor: 2
    });
    logic.player.attack = { type: "kick", direction: "right", frame: 6 };
    logic.updateEnemies(1000);
    if (logic.enemies.length !== 0 || logic.gameState.score !== 1 ||
        logic.gameState.lives !== 3 || logic.crabDeathEffects.length !== 1 ||
        logic.crabDeathEffects[0].velocityX <= 0 || logic.crabDeathEffects[0].rotation !== Math.PI ||
        mockScoreElement.textContent !== "1") {
        console.error("Test failed: kicking a crab should score one and launch it backward");
        teardownMockEnvironment();
        return false;
    }
    logic.player.attack = null;
    const laughStrokeStart = mockCtx.strokeCalls.length;
    const laughTextStart = mockCtx.fillTextCalls.length;
    const laughFillStart = mockCtx.fillCalls.length;
    const laughEllipseStart = mockCtx.ellipseCalls.length;
    logic.drawGame(1000);
    const laughTexts = mockCtx.fillTextCalls.slice(laughTextStart).filter(call => call.text === "HA!");
    const faceRadius = logic.player.height * 0.15 * 1.5;
    const laughFace = mockCtx.ellipseCalls.slice(laughEllipseStart).find(call =>
        Math.abs(call.radiusX - faceRadius * 0.9) < 0.001 && Math.abs(call.radiusY - faceRadius) < 0.001);
    const laughStrokeCalls = mockCtx.strokeCalls.slice(laughStrokeStart);
    const laughEyePaths = laughStrokeCalls.filter(path => {
        if (path.length !== 4 || path[0].type !== "move" || path[1].type !== "line" ||
            path[2].type !== "move" || path[3].type !== "line") return false;
        const firstSlope = (path[1].y - path[0].y) / (path[1].x - path[0].x);
        const secondSlope = (path[3].y - path[2].y) / (path[3].x - path[2].x);
        const averageX = (path[0].x + path[1].x + path[2].x + path[3].x) / 4;
        return firstSlope * secondSlope < 0 && Math.abs(averageX - (logic.player.x - faceRadius * 0.35)) < faceRadius;
    });
    const tearPathIndices = laughStrokeCalls.map((path, index) => ({ path, index }))
        .filter(item => item.path.filter(point => point.type === "quadratic").length === 4);
    const laughTear = tearPathIndices.length ? tearPathIndices[0].path : [];
    const tearEndpoints = laughTear.filter(point => typeof point.x === "number" && typeof point.y === "number");
    const tearCenterX = tearEndpoints.reduce((sum, point) => sum + point.x, 0) / (tearEndpoints.length || 1);
    const tearCenterY = tearEndpoints.reduce((sum, point) => sum + point.y, 0) / (tearEndpoints.length || 1);
    const eyeCenterX = laughEyePaths.length ? laughEyePaths[0].reduce((sum, point) => sum + point.x, 0) / 4 : 0;
    const eyeCenterY = laughEyePaths.length ? laughEyePaths[0].reduce((sum, point) => sum + point.y, 0) / 4 : 0;
    if (laughTexts.length !== 3 || !laughFace || laughFace.rotation < 1.38 || laughFace.rotation > 1.5 ||
        laughEyePaths.length !== 1 || tearPathIndices.length !== 1 || tearCenterX >= eyeCenterX ||
        Math.abs(tearCenterX - eyeCenterX) < faceRadius * 0.4 || tearCenterY <= eyeCenterY ||
        mockCtx.strokeStyles[laughStrokeStart + tearPathIndices[0].index] !== "red" ||
        mockCtx.fillCalls.slice(laughFillStart).some(call => call.fillStyle === "red") ||
        !mockCtx.fillCalls.slice(laughFillStart).some(call => call.fillStyle === "black")) {
        console.error("Test failed: a crab kill should draw the enlarged tilted laughing face, one X eye, a hollow red tear, and three HA messages");
        teardownMockEnvironment();
        return false;
    }
    const firstLaughMouth = mockCtx.fillCalls.slice(laughFillStart).find(call => call.fillStyle === "black");
    logic.drawStickman(logic.player.x, logic.player.y, logic.player.height, logic.player.direction,
        logic.player.animationFrame, logic.player.isClimbing, null, 1065);
    const secondLaughMouth = mockCtx.fillCalls.slice(laughFillStart).filter(call => call.fillStyle === "black")[1];
    if (!firstLaughMouth || !secondLaughMouth || firstLaughMouth.path[0].x !== secondLaughMouth.path[0].x ||
        firstLaughMouth.path[1].x !== secondLaughMouth.path[1].x ||
        firstLaughMouth.path[1].controlY === secondLaughMouth.path[1].controlY ||
        firstLaughMouth.path[2].controlY === secondLaughMouth.path[2].controlY) {
        console.error("Test failed: laughing mouth should open and close vertically while its side tips stay fixed");
        teardownMockEnvironment();
        return false;
    }
    const deathEffectStartTime = logic.crabDeathEffects[0].startTime;
    let flickerStrokeStart = mockCtx.strokeCalls.length;
    logic.drawGame(deathEffectStartTime + 600);
    const visibleFlickerAlpha = mockCtx.strokeAlphas.slice(flickerStrokeStart)
        .filter((alpha, index) => mockCtx.strokeStyles[flickerStrokeStart + index] === "darkgray");
    flickerStrokeStart = mockCtx.strokeCalls.length;
    logic.drawGame(deathEffectStartTime + 680);
    const hiddenFlickerAlpha = mockCtx.strokeAlphas.slice(flickerStrokeStart)
        .filter((alpha, index) => mockCtx.strokeStyles[flickerStrokeStart + index] === "darkgray");
    if (!visibleFlickerAlpha.length || visibleFlickerAlpha.some(alpha => alpha !== 0.3) ||
        !hiddenFlickerAlpha.length || hiddenFlickerAlpha.some(alpha => alpha !== 1)) {
        console.error("Test failed: flipped crab should flicker during the end of its death animation");
        teardownMockEnvironment();
        return false;
    }
    if (mockCtx.strokeCalls.length === 0 || mockCtx.globalAlpha !== 1) {
        console.error("Test failed: flipped crab should draw and restore canvas alpha");
        teardownMockEnvironment();
        return false;
    }
    const deathEffectEndTime = logic.crabDeathEffects[0].startTime + 1000;
    logic.updateEnemies(deathEffectEndTime - 1);
    if (logic.crabDeathEffects.length !== 1) {
        console.error("Test failed: flipped crab should remain visible during its short animation");
        teardownMockEnvironment();
        return false;
    }
    logic.updateEnemies(deathEffectEndTime);
    if (logic.crabDeathEffects.length !== 0) {
        console.error("Test failed: flipped crab should be removed when its animation ends");
        teardownMockEnvironment();
        return false;
    }
    teardownMockEnvironment();

    setupMockEnvironment();
    logic = require("../resources/v1.3/logic.js");
    logic.resizeCanvas();
    logic.player.x = mockCanvas.width * 0.5;
    logic.player.y = 260;
    logic.player.currentFloor = 2;
    logic.player.isClimbing = true;
    logic.player.attack = { type: "punch", direction: "up", frame: 6 };
    const punchSectionHeight = mockCanvas.height / 3;
    const punchEnemyHeight = logic.player.height / 2;
    logic.enemies.push({ x: logic.player.x + 20, y: punchSectionHeight - punchEnemyHeight, width: punchEnemyHeight * 1.5, height: punchEnemyHeight, floor: 2 });
    logic.updateEnemies(1000);
    if (logic.enemies.length !== 0 || logic.gameState.score !== 1 || logic.gameState.lives !== 3) {
        console.error("Test failed: punching a crab should remove it and award one point without losing a life");
        teardownMockEnvironment();
        return false;
    }
    teardownMockEnvironment();
    console.log("testCombatAttacksAndExplosions passed");
    return true;
}

function testCrabDeathFollowsHitDirection() {
    const scenarios = [
        { direction: "left", type: "kick", playerDirection: "left", enemyX: playerX => playerX - 213.3333333333,
            enemyY: (sectionHeight, enemyHeight) => sectionHeight - enemyHeight, expectedX: -1, expectedY: 0 },
        { direction: "down", type: "kick", playerDirection: "right", enemyX: playerX => playerX,
            enemyY: sectionHeight => sectionHeight, expectedX: 0, expectedY: 1 },
        { direction: "up", type: "punch", playerDirection: "right", enemyX: playerX => playerX + 20,
            enemyY: (sectionHeight, enemyHeight, playerY) => playerY - enemyHeight * 1.1, expectedX: 0, expectedY: -1 }
    ];
    for (const scenario of scenarios) {
        setupMockEnvironment();
        const logic = require("../resources/v1.3/logic.js");
        logic.resizeCanvas();
        logic.player.x = 600;
        logic.player.direction = scenario.playerDirection;
        const sectionHeight = mockCanvas.height / 3;
        const enemyHeight = logic.player.height / 2;
        logic.enemies.push({ x: scenario.enemyX(logic.player.x),
            y: scenario.enemyY(sectionHeight, enemyHeight, logic.player.y), width: enemyHeight * 1.5,
            height: enemyHeight, floor: 2 });
        logic.player.attack = { type: scenario.type, direction: scenario.direction, frame: 6 };
        logic.updateEnemies(1000);
        const effect = logic.crabDeathEffects[0];
        const matchesX = scenario.expectedX === 0 ? effect && effect.velocityX === 0 :
            effect && Math.sign(effect.velocityX) === scenario.expectedX;
        const matchesY = scenario.expectedY === 0 ? effect && effect.velocityY < 0 :
            effect && Math.sign(effect.velocityY) === scenario.expectedY;
        if (logic.enemies.length !== 0 || !matchesX || !matchesY) {
            console.error("Test failed: crab death should launch in the direction of a " + scenario.direction + " attack");
            teardownMockEnvironment();
            return false;
        }
        teardownMockEnvironment();
    }
    console.log("testCrabDeathFollowsHitDirection passed");
    return true;
}

module.exports = { testCombatAttacksAndExplosions, testCrabDeathFollowsHitDirection };
