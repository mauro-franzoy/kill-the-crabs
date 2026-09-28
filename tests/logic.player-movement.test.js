const { setupMockEnvironment, teardownMockEnvironment } = require('./test-helpers.js');

function testIsNearLadder() {
    setupMockEnvironment();
    
    const logic = require('../logic.js');
    
    const testLadders = [
        { x: 100, y1: 200, y2: 400, width: 40 }
    ];
    
    const resultNear = logic.isNearLadder(100, 300, testLadders);
    if (resultNear !== true) {
        console.error('Test failed: should detect ladder when near, got', resultNear);
        teardownMockEnvironment();
        return false;
    }
    
    const resultFar = logic.isNearLadder(500, 300, testLadders);
    if (resultFar !== false) {
        console.error('Test failed: should not detect ladder when far, got', resultFar);
        teardownMockEnvironment();
        return false;
    }
    
    teardownMockEnvironment();
    console.log('testIsNearLadder passed');
    return true;
}

function testIsOverLadder() {
    setupMockEnvironment();
    
    const logic = require('../logic.js');
    
    const testLadders = [
        { x: 100, y1: 200, y2: 400, width: 40 }
    ];
    
    const resultOver = logic.isOverLadder(100, testLadders);
    if (resultOver === null) {
        console.error('Test failed: should detect ladder when over, got', resultOver);
        teardownMockEnvironment();
        return false;
    }
    
    const resultNotOver = logic.isOverLadder(500, testLadders);
    if (resultNotOver !== null) {
        console.error('Test failed: should not detect ladder when not over, got', resultNotOver);
        teardownMockEnvironment();
        return false;
    }
    
    teardownMockEnvironment();
    console.log('testIsOverLadder passed');
    return true;
}

function testLadderPositioning() {
    setupMockEnvironment();
    
    const logic = require('../logic.js');
    
    logic.resizeCanvas();
    
    const sectionHeight = mockCanvas.height / 3;
    
    const firstLadderX = logic.ladders[0].x;
    const secondLadderX = logic.ladders[1].x;
    
    if (firstLadderX !== 240) {
        console.error('Test failed: first ladder x position should be 240, got', firstLadderX);
        teardownMockEnvironment();
        return false;
    }
    
    if (secondLadderX !== 900) {
        console.error('Test failed: floor 2 to floor 1 ladder x position should be 900, got', secondLadderX);
        teardownMockEnvironment();
        return false;
    }
    
    teardownMockEnvironment();
    console.log('testLadderPositioning passed');
    return true;
}

function testSectionHeight() {
    setupMockEnvironment();
    
    const sectionHeight = mockCanvas.height / 3;
    
    if (sectionHeight !== 266.6666666666667) {
        console.error('Test failed: sectionHeight should be 266.67, got', sectionHeight);
        teardownMockEnvironment();
        return false;
    }
    
    teardownMockEnvironment();
    console.log('testSectionHeight passed');
    return true;
}

function testPlayerHeightAndFloorPositioning() {
    setupMockEnvironment();
    
    const sectionHeight = mockCanvas.height / 3;
    const ladderHeight = sectionHeight;
    const playerHeight = ladderHeight * 0.8;
    
    if (Math.abs(playerHeight - 213.33333333333334) > 0.001) {
        console.error('Test failed: player height should be 213.33, got', playerHeight);
        teardownMockEnvironment();
        return false;
    }
    
    const floorY2 = sectionHeight - playerHeight;
    const floorY1 = sectionHeight * 2 - playerHeight;
    const floorY0 = mockCanvas.height - 15 - playerHeight;
    
    if (Math.abs(floorY2 - 53.33333333333334) > 0.001) {
        console.error('Test failed: floor 2 Y should be 53.33, got', floorY2);
        teardownMockEnvironment();
        return false;
    }
    
    if (floorY1 !== 320) {
        console.error('Test failed: floor 1 Y should be 320, got', floorY1);
        teardownMockEnvironment();
        return false;
    }
    
    if (Math.abs(floorY0 - 571.6666666666666) > 0.001) {
        console.error('Test failed: floor 0 Y should be 571.67, got', floorY0);
        teardownMockEnvironment();
        return false;
    }
    
    const playerBottomOnFloor2 = floorY2 + playerHeight;
    const floor2Y = sectionHeight;
    if (playerBottomOnFloor2 !== floor2Y) {
        console.error('Test failed: player bottom should touch floor 2, got', playerBottomOnFloor2);
        teardownMockEnvironment();
        return false;
    }
    
    const playerBottomOnFloor1 = floorY1 + playerHeight;
    const floor1Y = sectionHeight * 2;
    if (playerBottomOnFloor1 !== floor1Y) {
        console.error('Test failed: player bottom should touch floor 1, got', playerBottomOnFloor1);
        teardownMockEnvironment();
        return false;
    }
    
    const playerBottomOnFloor0 = floorY0 + playerHeight;
    const floor0Y = mockCanvas.height - 15;
    if (playerBottomOnFloor0 !== floor0Y) {
        console.error('Test failed: player bottom should touch floor 0, got', playerBottomOnFloor0);
        teardownMockEnvironment();
        return false;
    }
    
    teardownMockEnvironment();
    console.log('testPlayerHeightAndFloorPositioning passed');
    return true;
}

function testLadderFloor2ToFloor1Descending() {
    setupMockEnvironment();
    
    const logic = require('../logic.js');
    logic.resizeCanvas();
    
    const sectionHeight = mockCanvas.height / 3;
    const playerHeight = sectionHeight * 0.8;
    const floor2Y = sectionHeight - playerHeight;
    const floor1Y = sectionHeight * 2 - playerHeight;
    const ladderX = logic.ladders[1].x;
    
    logic.player.x = ladderX;
    logic.player.y = floor2Y;
    logic.player.currentFloor = 2;
    logic.player.isClimbing = false;
    logic.keys.ArrowDown = true;
    logic.keys.ArrowUp = false;
    logic.keys.ArrowLeft = false;
    logic.keys.ArrowRight = false;
    
    logic.updatePlayer();
    
    if (logic.player.y <= floor2Y) {
        console.error('Test failed: player should have descended from floor 2, got', logic.player.y);
        teardownMockEnvironment();
        return false;
    }
    
    for (let i = 0; i < 100; i++) {
        logic.updatePlayer();
    }
    
    if (Math.abs(logic.player.y - floor1Y) > 0.001) {
        console.error('Test failed: player should be placed over floor 1 Y', floor1Y, 'got', logic.player.y);
        teardownMockEnvironment();
        return false;
    }
    
    const playerBottom = logic.player.y + logic.player.height;
    const floor1Surface = sectionHeight * 2;
    if (Math.abs(playerBottom - floor1Surface) > 0.001) {
        console.error('Test failed: player bottom should touch floor 1, got', playerBottom, 'expected', floor1Surface);
        teardownMockEnvironment();
        return false;
    }
    
    const yAtFloor1 = logic.player.y;
    for (let i = 0; i < 10; i++) {
        logic.updatePlayer();
    }
    
    if (logic.player.y !== yAtFloor1) {
        console.error('Test failed: player should not be able to descend further than floor 1, got', logic.player.y, 'expected', yAtFloor1);
        teardownMockEnvironment();
        return false;
    }
    
    logic.keys.ArrowDown = false;
    logic.updatePlayer();
    
    if (logic.player.currentFloor !== 1) {
        console.error('Test failed: player current floor should be 1, got', logic.player.currentFloor);
        teardownMockEnvironment();
        return false;
    }
    
    teardownMockEnvironment();
    console.log('testLadderFloor2ToFloor1Descending passed');
    return true;
}

function testSpacebarAttackAnimations() {
    setupMockEnvironment();

    const logic = require('../logic.js');
    logic.resizeCanvas();
    logic.player.x = 100;
    logic.player.direction = 'left';
    logic.keys.ArrowLeft = false;
    logic.keys.ArrowRight = false;
    logic.keys.ArrowUp = false;
    logic.keys.ArrowDown = false;
    logic.keys.Space = true;
    logic.updatePlayer();

    if (!logic.player.attack || logic.player.attack.type !== 'kick' || logic.player.attack.direction !== 'left') {
        console.error('Test failed: spacebar on a floor should kick in the last horizontal direction');
        teardownMockEnvironment();
        return false;
    }

    const floorAttackDirections = [
        { key: "ArrowUp", direction: "up", type: "punch" },
        { key: "ArrowDown", direction: "down", type: "kick" },
        { key: "ArrowLeft", direction: "left", type: "kick" },
        { key: "ArrowRight", direction: "right", type: "kick" }
    ];
    for (const attackDirection of floorAttackDirections) {
        logic.keys.Space = false;
        for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) logic.keys[key] = false;
        logic.updatePlayer();
        logic.keys[attackDirection.key] = true;
        logic.keys.Space = true;
        logic.updatePlayer();
        if (!logic.player.attack || logic.player.attack.direction !== attackDirection.direction ||
            logic.player.attack.type !== attackDirection.type) {
            console.error("Test failed: arrow plus space should select the matching attack direction on a floor");
            teardownMockEnvironment();
            return false;
        }
    }
    logic.keys.Space = false;
    for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) logic.keys[key] = false;
    logic.updatePlayer();

    const floorStrokeStart = mockCtx.strokeCalls.length;
    const footFillStart = mockCtx.fillCalls.length;
    const toeEllipseStart = mockCtx.ellipseCalls.length;
    logic.drawStickman(100, 200, 160, 'left', 0, false, { type: 'kick', direction: 'left', frame: 6 });
    const kickFoot = mockCtx.strokeCalls.slice(floorStrokeStart)[2];
    const horizontalKickLength = kickFoot
        ? Math.hypot(kickFoot[1].x - kickFoot[0].x, kickFoot[1].y - kickFoot[0].y)
        : 0;
    const horizontalUnitX = kickFoot ? (kickFoot[1].x - kickFoot[0].x) / horizontalKickLength : 0;
    const horizontalUnitY = kickFoot ? (kickFoot[1].y - kickFoot[0].y) / horizontalKickLength : 0;
    const shoePath = mockCtx.strokeCalls.slice(floorStrokeStart)[6];
    const toeEllipses = mockCtx.ellipseCalls.slice(toeEllipseStart);
    const shoeLength = shoePath && toeEllipses.length
        ? Math.max(...shoePath.filter(point => typeof point.y === 'number').map(point => point.y)) -
            Math.min(...toeEllipses.map(toe => toe.y - toe.radiusY))
        : 0;
    const shoeFill = mockCtx.fillCalls[footFillStart];
    const bigToe = toeEllipses[0];
    const otherToe = toeEllipses[1];
    if (!kickFoot || kickFoot[1].x >= kickFoot[0].x || Math.abs(horizontalKickLength - 160 * 0.25 * 5) > 0.001 ||
        !shoeFill || shoeFill.fillStyle !== 'red' || mockCtx.fillCalls.length - footFillStart !== 6 ||
        toeEllipses.length !== 5 || toeEllipses.some(toe => toe.radiusY <= toe.radiusX || toe.y >= kickFoot[1].y) ||
        toeEllipses.slice(1).some((toe, index) =>
            Math.abs(toe.radiusX - 160 * 0.15 * 0.85 * 1.5 * 0.28) > 0.001 ||
            Math.abs(toe.radiusY - 160 * 0.15 * 4 * 1.5 * [0.18, 0.16, 0.14, 0.12][index]) > 0.001) ||
        Math.abs(bigToe.radiusX - 160 * 0.15 * 0.85 * 1.5 * 0.44) > 0.001 ||
        Math.abs(bigToe.radiusY - 160 * 0.15 * 4 * 1.5 * 0.22) > 0.001 ||
        bigToe.x <= kickFoot[1].x || bigToe.rotation <= 0 ||
        Math.abs(shoeLength - 160 * 0.15 * 4 * 1.5 * 1.22) > 0.001) {
        console.error('Test failed: peak kick should show a side-view foot with five upward toes and a thicker inward-curved big toe');
        teardownMockEnvironment();
        return false;
    }

    const nonPeakKickStart = mockCtx.strokeCalls.length;
    const nonPeakFootFillStart = mockCtx.fillCalls.length;
    logic.drawStickman(100, 200, 160, 'left', 0, false, { type: 'kick', direction: 'left', frame: 3 });
    if (mockCtx.strokeCalls.length - nonPeakKickStart !== 6 || mockCtx.fillCalls.length !== nonPeakFootFillStart) {
        console.error('Test failed: kick should show the foot only at peak extension');
        teardownMockEnvironment();
        return false;
    }

    logic.keys.Space = false;
    logic.updatePlayer();
    logic.player.x = logic.ladders[1].x;
    logic.player.y = 150;
    logic.keys.ArrowUp = true;
    logic.keys.Space = true;
    logic.updatePlayer();

    if (!logic.player.attack || logic.player.attack.type !== 'punch' || logic.player.attack.direction !== 'up') {
        console.error('Test failed: spacebar while climbing upward should punch upward');
        teardownMockEnvironment();
        return false;
    }

    const upStrokeStart = mockCtx.strokeCalls.length;
    const upFillStart = mockCtx.fillCalls.length;
    logic.drawStickman(100, 200, 160, 'left', 0, true, { type: 'punch', direction: 'up', frame: 6 });
    const upPunch = mockCtx.strokeCalls.slice(upStrokeStart)[3];
    const upwardPunchLength = upPunch
        ? Math.hypot(upPunch[1].x - upPunch[0].x, upPunch[1].y - upPunch[0].y)
        : 0;
    const fistFill = mockCtx.fillCalls[upFillStart];
    const punchDirectionX = (upPunch[1].x - upPunch[0].x) / upwardPunchLength;
    const punchDirectionY = (upPunch[1].y - upPunch[0].y) / upwardPunchLength;
    const fistPoints = fistFill ? fistFill.path.filter(point => typeof point.x === 'number' && typeof point.y === 'number') : [];
    const fistProjections = fistPoints.map(point => point.x * punchDirectionX + point.y * punchDirectionY);
    const fistWidths = fistPoints.map(point => point.x * -punchDirectionY + point.y * punchDirectionX);
    const fistShapeLength = fistProjections.length ? Math.max(...fistProjections) - Math.min(...fistProjections) : 0;
    const fistShapeWidth = fistWidths.length ? Math.max(...fistWidths) - Math.min(...fistWidths) : 0;
    const visibleKnuckleLines = mockCtx.strokeStyles.slice(upStrokeStart).filter(style => style === 'darkred').length;
    if (!upPunch || upPunch[1].y >= upPunch[0].y || Math.abs(upwardPunchLength - 160 * 0.2 * 5) > 0.001 ||
        !fistFill || fistFill.fillStyle !== 'red' || fistFill.path.length < 9 ||
        Math.abs(fistShapeLength - 0.85 * 160 * 0.15 * 3 * 1.5) > 0.001 ||
        Math.abs(fistShapeWidth - 1.95 * 160 * 0.15 * 1.2 * 1.5) > 0.001 || visibleKnuckleLines !== 5 ||
        fistFill.path.filter(point => point.type === 'quadratic' &&
            Math.abs(point.x * punchDirectionX + point.y * punchDirectionY - Math.max(...fistProjections)) < 0.001).length !== 4 ||
        mockCtx.fillCalls.length - upFillStart !== 1) {
        console.error('Test failed: peak upward punch should show a fist at its tip');
        teardownMockEnvironment();
        return false;
    }

    const nonPeakPunchFillStart = mockCtx.fillCalls.length;
    logic.drawStickman(100, 200, 160, 'left', 0, true, { type: 'punch', direction: 'up', frame: 3 });
    if (mockCtx.fillCalls.length !== nonPeakPunchFillStart) {
        console.error('Test failed: punch should show the fist only at peak extension');
        teardownMockEnvironment();
        return false;
    }

    logic.keys.Space = false;
    logic.keys.ArrowUp = false;
    logic.keys.ArrowDown = true;
    logic.updatePlayer();
    logic.keys.ArrowDown = false;
    logic.keys.Space = true;
    logic.updatePlayer();

    if (!logic.player.attack || logic.player.attack.type !== 'kick' || logic.player.attack.direction !== 'down') {
        console.error('Test failed: spacebar after descending should kick downward');
        teardownMockEnvironment();
        return false;
    }

    logic.keys.Space = false;
    logic.updatePlayer();
    logic.keys.ArrowLeft = true;
    logic.keys.Space = true;
    logic.updatePlayer();
    if (!logic.player.attack || logic.player.attack.direction !== "left" || logic.player.attack.type !== "kick") {
        console.error("Test failed: arrow plus space should select a horizontal attack beside a ladder");
        teardownMockEnvironment();
        return false;
    }
    logic.keys.Space = false;
    logic.keys.ArrowLeft = false;
    logic.updatePlayer();

    const downStrokeStart = mockCtx.strokeCalls.length;
    logic.drawStickman(100, 200, 160, 'left', 0, true, { type: 'kick', direction: 'down', frame: 6 });
    const downKick = mockCtx.strokeCalls.slice(downStrokeStart)[2];
    const downwardKickLength = downKick
        ? Math.hypot(downKick[1].x - downKick[0].x, downKick[1].y - downKick[0].y)
        : 0;
    if (!downKick || downKick[1].y <= downKick[0].y || Math.abs(downwardKickLength - 160 * 0.25 * 5) > 0.001) {
        console.error('Test failed: downward kick should extend the leg to five times its normal length');
        teardownMockEnvironment();
        return false;
    }

    logic.keys.Space = false;
    logic.player.attack = { type: 'kick', direction: 'left', frame: 6, peakTime: 1000 };
    logic.updatePlayer(1799);
    if (logic.player.attack.frame !== 6) {
        console.error('Test failed: attack pose should hold through the 800 ms display');
        teardownMockEnvironment();
        return false;
    }
    logic.updatePlayer(1801);
    if (logic.player.attack.frame !== 7) {
        console.error('Test failed: attack pose should retract after 800 ms');
        teardownMockEnvironment();
        return false;
    }

    const timedKick = { type: 'kick', direction: 'left', frame: 6, peakTime: 1000 };
    const timedKickFillStart = mockCtx.fillCalls.length;
    logic.drawStickman(100, 200, 160, 'left', 0, false, timedKick, 1799);
    logic.drawStickman(100, 200, 160, 'left', 0, false, timedKick, 1801);
    if (mockCtx.fillCalls.length - timedKickFillStart !== 6) {
        console.error('Test failed: filled foot and toes should stay visible for 800 ms');
        teardownMockEnvironment();
        return false;
    }

    const timedPunch = { type: 'punch', direction: 'up', frame: 6, peakTime: 1000 };
    const timedPunchFillStart = mockCtx.fillCalls.length;
    logic.drawStickman(100, 200, 160, 'left', 0, true, timedPunch, 1799);
    logic.drawStickman(100, 200, 160, 'left', 0, true, timedPunch, 1801);
    if (mockCtx.fillCalls.length - timedPunchFillStart !== 1) {
        console.error('Test failed: filled fist should stay visible for 800 ms');
        teardownMockEnvironment();
        return false;
    }

    teardownMockEnvironment();
    console.log('testSpacebarAttackAnimations passed');
    return true;
}

module.exports = { testIsNearLadder, testIsOverLadder, testLadderPositioning, testSectionHeight, testPlayerHeightAndFloorPositioning, testLadderFloor2ToFloor1Descending, testSpacebarAttackAnimations };
