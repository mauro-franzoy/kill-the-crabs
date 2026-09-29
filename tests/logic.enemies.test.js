const { setupMockEnvironment, teardownMockEnvironment } = require('./test-helpers.js');

function testFindClosestFloor() {
    setupMockEnvironment();
    
    const logic = require('../resources/v1.0.1/logic.js');
    
    const sectionHeight = mockCanvas.height / 3;
    const playerHeight = sectionHeight * 0.8;
    
    const floorY = {
        2: sectionHeight - playerHeight,
        1: sectionHeight * 2 - playerHeight,
        0: mockCanvas.height - 15 - playerHeight
    };
    
    const closestFloor2 = logic.findClosestFloor(floorY[2] + 20, floorY);
    if (closestFloor2 !== 2) {
        console.error('Test failed: closest floor should be 2, got', closestFloor2);
        teardownMockEnvironment();
        return false;
    }
    
    const closestFloor1 = logic.findClosestFloor(floorY[1] + 20, floorY);
    if (closestFloor1 !== 1) {
        console.error('Test failed: closest floor should be 1, got', closestFloor1);
        teardownMockEnvironment();
        return false;
    }
    
    const closestFloor0 = logic.findClosestFloor(floorY[0] + 20, floorY);
    if (closestFloor0 !== 0) {
        console.error('Test failed: closest floor should be 0, got', closestFloor0);
        teardownMockEnvironment();
        return false;
    }
    
    teardownMockEnvironment();
    console.log('testFindClosestFloor passed');
    return true;
}

function testEnemySpawningAndDrawing() {
    setupMockEnvironment();

    const logic = require("../resources/v1.0.1/logic.js");
    logic.resizeCanvas();
    logic.player.x = 590;
    logic.enemies.length = 0;
    let randomValue = 0.5;
    let randomValues = [];
    const originalRandom = Math.random;
    Math.random = function() { return randomValues.length ? randomValues.shift() : randomValue; };

    try {
        randomValues = [0.25];
        logic.updateEnemies(1000);
        logic.updateEnemies(3749);
        if (logic.enemies.length !== 0) {
            console.error("Test failed: enemies should wait for the randomly selected spawn interval");
            return false;
        }

        randomValues = [0.99, 0, 0.25, 0];
        logic.updateEnemies(3750);
        if (logic.enemies.length !== 1) {
            console.error("Test failed: the first spawn group should contain one crab");
            return false;
        }

        const firstEnemy = logic.enemies[0];
        const playerCenterX = logic.player.x + logic.player.width / 2;
        const minimumDistance = logic.ladders[0].width * 4;
        const sectionHeight = mockCanvas.height / 3;
        if (firstEnemy.height !== logic.player.height / 2 || !firstEnemy.isMoving ||
            Math.abs(firstEnemy.x - playerCenterX) < minimumDistance ||
            Math.abs(firstEnemy.y + firstEnemy.height - sectionHeight) > 0.001) {
            console.error("Test failed: crab should be half player height, on a floor, and far enough from player");
            return false;
        }

        logic.updateEnemies(8719);
        if (logic.enemies.length !== 1) {
            console.error("Test failed: the next group should wait for its randomly selected interval");
            return false;
        }
        const firstXBeforeSpawn = firstEnemy.x;
        randomValues = [0.9999, 0.99, 0.25, 0, 0.25, 0, 0.25, 0];
        logic.updateEnemies(8720);
        if (logic.enemies.length !== 4 ||
            Math.abs(firstEnemy.x - firstXBeforeSpawn - logic.player.speed / 2) > 0.001) {
            console.error("Test failed: a random group of three crabs should spawn and existing crabs should chase at half player speed");
            return false;
        }

        const secondEnemy = logic.enemies[1];
        logic.player.isClimbing = true;
        randomValue = 0.25;
        const firstRoamStartX = firstEnemy.x;
        logic.updateEnemies(8721);
        if (firstEnemy.roamDirection !== -1 ||
            Math.abs(firstEnemy.x - (firstRoamStartX - logic.player.speed / 2)) > 0.001) {
            console.error("Test failed: crab should randomly roam left at half player speed while the player climbs");
            return false;
        }

        randomValue = 0.75;
        secondEnemy.isRoaming = false;
        const secondRoamStartX = secondEnemy.x;
        logic.updateEnemies(8722);
        if (firstEnemy.roamDirection !== -1 ||
            secondEnemy.roamDirection !== 1 ||
            Math.abs(firstEnemy.x - (firstRoamStartX - logic.player.speed)) > 0.001 ||
            Math.abs(secondEnemy.x - (secondRoamStartX + logic.player.speed / 2)) > 0.001) {
            console.error("Test failed: roaming direction should persist and be randomized independently");
            return false;
        }

        const leftEdge = firstEnemy.width / 2;
        firstEnemy.x = leftEdge + 1;
        firstEnemy.roamDirection = -1;
        firstEnemy.isRoaming = true;
        logic.updateEnemies(11003);
        if (firstEnemy.x !== leftEdge || firstEnemy.roamDirection !== 1) {
            console.error("Test failed: roaming crab should reverse at the left canvas edge");
            return false;
        }
        logic.updateEnemies(11004);
        if (Math.abs(firstEnemy.x - (leftEdge + logic.player.speed / 2)) > 0.001) {
            console.error("Test failed: crab should head back from the left edge");
            return false;
        }

        const rightEdge = mockCanvas.width - firstEnemy.width / 2;
        firstEnemy.x = rightEdge - 1;
        firstEnemy.roamDirection = 1;
        firstEnemy.isRoaming = true;
        logic.updateEnemies(11005);
        if (firstEnemy.x !== rightEdge || firstEnemy.roamDirection !== -1) {
            console.error("Test failed: roaming crab should reverse at the right canvas edge");
            return false;
        }
        logic.updateEnemies(11006);
        if (Math.abs(firstEnemy.x - (rightEdge - logic.player.speed / 2)) > 0.001) {
            console.error("Test failed: crab should head back from the right edge");
            return false;
        }

        logic.player.isClimbing = false;
        randomValue = 0.25;
        firstEnemy.floor = logic.player.currentFloor === 2 ? 1 : 2;
        firstEnemy.x = playerCenterX - 10;
        firstEnemy.isRoaming = false;
        const differentFloorStartX = firstEnemy.x;
        logic.updateEnemies(11007);
        if (firstEnemy.roamDirection !== -1 ||
            Math.abs(firstEnemy.x - (differentFloorStartX - logic.player.speed / 2)) > 0.001) {
            console.error("Test failed: crab should roam instead of following a player on another floor");
            return false;
        }

        firstEnemy.floor = logic.player.currentFloor;
        firstEnemy.x = playerCenterX - 10;
        firstEnemy.isRoaming = true;
        logic.updateEnemies(11008);
        if (firstEnemy.isRoaming || Math.abs(firstEnemy.x - (playerCenterX - 10 + logic.player.speed / 2)) > 0.001) {
            console.error("Test failed: crab should pursue a grounded player on the same floor at half speed");
            return false;
        }
        firstEnemy.x = playerCenterX - 1;
        logic.updateEnemies(11009);
        if (firstEnemy.x !== playerCenterX || !firstEnemy.isMoving) {
            console.error("Test failed: crab should move to the player without overshooting");
            return false;
        }
        logic.updateEnemies(11010);
        if (firstEnemy.isMoving) {
            console.error("Test failed: crab should be marked stationary after reaching the player");
            return false;
        }

        while (logic.enemies.length < 9) {
            logic.enemies.push({ x: 100, y: sectionHeight - logic.player.height / 2, width: firstEnemy.width,
                height: firstEnemy.height, floor: 2, isMoving: false, isRoaming: false });
        }
        randomValue = 0.99;
        logic.updateEnemies(20000);
        if (logic.enemies.length !== 10) {
            console.error("Test failed: a spawn group should stop at ten visible crabs");
            return false;
        }
        logic.updateEnemies(25000);
        if (logic.enemies.length !== 10) {
            console.error("Test failed: spawning should remain paused while ten crabs are visible");
            return false;
        }

        const fillStart = mockCtx.fillCalls.length;
        const ellipseStart = mockCtx.ellipseCalls.length;
        const strokeStart = mockCtx.strokeCalls.length;
        logic.drawCrab(firstEnemy);
        if (mockCtx.fillCalls.length !== fillStart ||
            mockCtx.ellipseCalls.length - ellipseStart !== 1 ||
            mockCtx.strokeStyle !== "darkgray" ||
            mockCtx.strokeCalls.length === strokeStart) {
            console.error("Test failed: crab should draw as a hollow dark gray outline");
            return false;
        }
        const gameStrokeStart = mockCtx.strokeCalls.length;
        logic.drawGame(11009);
        if (mockCtx.strokeCalls.length <= gameStrokeStart || mockCtx.fillRectCalls[0].fillStyle !== "black") {
            console.error("Test failed: drawGame should render hollow crabs on a black background");
            return false;
        }
    } finally {
        Math.random = originalRandom;
        teardownMockEnvironment();
    }

    console.log("testEnemySpawningAndDrawing passed");
    return true;
}

module.exports = { testFindClosestFloor, testEnemySpawningAndDrawing };
