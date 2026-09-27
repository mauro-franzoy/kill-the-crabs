let mockCanvas = null;
let mockCtx = null;
let originalWindow = null;
let originalDocument = null;

function setupMockEnvironment() {
    mockCanvas = {
        width: 1200,
        height: 800,
        getContext: function() {
            return mockCtx;
        }
    };
    
    mockCtx = {
        strokeStyle: null,
        lineWidth: null,
        shadowColor: null,
        shadowBlur: null,
        fillStyle: null,
        currentPath: null,
        fillRectCalls: [],
        fillCalls: [],
        strokeCalls: [],
        arcCalls: [],
        ellipseCalls: [],
        
        beginPath: function() {
            this.currentPath = [];
        },
        
        moveTo: function(x, y) {
            if (this.currentPath) {
                this.currentPath.push({ type: 'move', x, y });
            }
        },
        
        lineTo: function(x, y) {
            if (this.currentPath) {
                this.currentPath.push({ type: 'line', x, y });
            }
        },
        
        stroke: function() {
            this.strokeCalls.push([...this.currentPath]);
            this.lastPath = this.currentPath;
        },

        closePath: function() {
            if (this.currentPath) this.currentPath.push({ type: 'close' });
        },

        fill: function() {
            this.fillCalls.push({ path: [...this.currentPath], fillStyle: this.fillStyle });
        },
        
        fillRect: function(x, y, width, height) {
            this.fillRectCalls.push({ x, y, width, height });
        },
        
        arc: function(x, y, radius, startAngle, endAngle) {
            this.arcCalls.push({ x, y, radius, startAngle, endAngle });
        },

        ellipse: function(x, y, radiusX, radiusY, rotation, startAngle, endAngle) {
            this.ellipseCalls.push({ x, y, radiusX, radiusY, rotation, startAngle, endAngle });
        },
        
        getContext: function() {
            return this;
        }
    };
    
    originalWindow = global.window;
    originalDocument = global.document;
    
    global.window = {
        innerWidth: 1200,
        innerHeight: 800,
        addEventListener: function() {}
    };
    
    global.document = {
        getElementById: function(id) {
            if (id === 'gameCanvas') {
                return mockCanvas;
            }
            return null;
        },
        addEventListener: function() {}
    };
    
    global.requestAnimationFrame = function() {};
    global.canvas = mockCanvas;
    global.ctx = mockCtx;
}

function teardownMockEnvironment() {
    global.window = originalWindow;
    global.document = originalDocument;
    delete global.requestAnimationFrame;
    delete global.canvas;
    delete global.ctx;
    try { delete require.cache[require.resolve("./logic.js")]; } catch(e){}
}

function testDrawFloorLines() {
    setupMockEnvironment();
    
    const logic = require('./logic.js');
    const sectionHeight = mockCanvas.height / 3;
    
    logic.drawFloorLines(sectionHeight);
    
    if (mockCtx.strokeStyle !== '#00FF00') {
        console.error('Test failed: strokeStyle should be #00FF00, got', mockCtx.strokeStyle);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.lineWidth !== 15) {
        console.error('Test failed: lineWidth should be 15, got', mockCtx.lineWidth);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.shadowColor !== '#00FF00') {
        console.error('Test failed: shadowColor should be #00FF00, got', mockCtx.shadowColor);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.shadowBlur !== 0) {
        console.error('Test failed: shadowBlur should be reset to 0, got', mockCtx.shadowBlur);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.strokeCalls.length !== 3) {
        console.error('Test failed: should have 3 stroke calls, got', mockCtx.strokeCalls.length);
        teardownMockEnvironment();
        return false;
    }
    
    teardownMockEnvironment();
    console.log('testDrawFloorLines passed');
    return true;
}

function testDrawLadder() {
    setupMockEnvironment();
    
    const logic = require('./logic.js');
    const x = 100;
    const y1 = 200;
    const y2 = 400;
    
    logic.drawLadder(x, y1, y2, 20);
    
    if (mockCtx.strokeStyle !== '#0000FF') {
        console.error('Test failed: strokeStyle should be #0000FF, got', mockCtx.strokeStyle);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.lineWidth !== 8) {
        console.error('Test failed: lineWidth should be 8, got', mockCtx.lineWidth);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.shadowColor !== '#0000FF') {
        console.error('Test failed: shadowColor should be #0000FF, got', mockCtx.shadowColor);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.shadowBlur !== 0) {
        console.error('Test failed: shadowBlur should be reset to 0, got', mockCtx.shadowBlur);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.strokeCalls.length !== 6) {
        console.error('Test failed: should have 6 stroke calls (2 rails + 4 rungs), got', mockCtx.strokeCalls.length);
        teardownMockEnvironment();
        return false;
    }
    
    teardownMockEnvironment();
    console.log('testDrawLadder passed');
    return true;
}

function testDrawStickman() {
    setupMockEnvironment();
    
    const logic = require('./logic.js');
    const x = 100;
    const y = 200;
    const height = 160;
    const direction = 'right';
    const animationFrame = 0;
    const isClimbing = false;
    
    logic.drawStickman(x, y, height, direction, animationFrame, isClimbing);
    
    if (mockCtx.strokeStyle !== '#FF0000') {
        console.error('Test failed: strokeStyle should be #FF0000, got', mockCtx.strokeStyle);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.lineWidth !== 4) {
        console.error('Test failed: lineWidth should be 4, got', mockCtx.lineWidth);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.shadowColor !== '#FF0000') {
        console.error('Test failed: shadowColor should be #FF0000, got', mockCtx.shadowColor);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.arcCalls.length !== 1) {
        console.error('Test failed: should have 1 arc call for head, got', mockCtx.arcCalls.length);
        teardownMockEnvironment();
        return false;
    }
    
    teardownMockEnvironment();
    console.log('testDrawStickman passed');
    return true;
}

function testIsNearLadder() {
    setupMockEnvironment();
    
    const logic = require('./logic.js');
    
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
    
    const logic = require('./logic.js');
    
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

function testFindClosestFloor() {
    setupMockEnvironment();
    
    const logic = require('./logic.js');
    
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

function testResizeCanvas() {
    setupMockEnvironment();
    
    const logic = require('./logic.js');
    
    logic.resizeCanvas();
    
    if (mockCanvas.width !== window.innerWidth) {
        console.error('Test failed: canvas width should match window width');
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCanvas.height !== window.innerHeight) {
        console.error('Test failed: canvas height should match window height');
        teardownMockEnvironment();
        return false;
    }
    
    teardownMockEnvironment();
    console.log('testResizeCanvas passed');
    return true;
}

function testDrawGame() {
    setupMockEnvironment();
    
    const logic = require('./logic.js');
    
    logic.drawGame();
    
    if (mockCtx.fillStyle !== '#000000') {
        console.error('Test failed: fillStyle should be #000000, got', mockCtx.fillStyle);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.fillRectCalls.length !== 1) {
        console.error('Test failed: should have one fillRect call, got', mockCtx.fillRectCalls.length);
        teardownMockEnvironment();
        return false;
    }
    
    const fillCall = mockCtx.fillRectCalls[0];
    if (fillCall.x !== 0 || fillCall.y !== 0 || 
        fillCall.width !== mockCanvas.width || fillCall.height !== mockCanvas.height) {
        console.error('Test failed: fillRect should cover entire canvas');
        teardownMockEnvironment();
        return false;
    }
    
    teardownMockEnvironment();
    console.log('testDrawGame passed');
    return true;
}

function testLadderPositioning() {
    setupMockEnvironment();
    
    const logic = require('./logic.js');
    
    logic.drawGame();
    
    const sectionHeight = mockCanvas.height / 3;
    
    const firstLadderX = mockCanvas.width * 0.2;
    const secondLadderX = mockCanvas.width * 0.5;
    
    if (firstLadderX !== 240) {
        console.error('Test failed: first ladder x position should be 240, got', firstLadderX);
        teardownMockEnvironment();
        return false;
    }
    
    if (secondLadderX !== 600) {
        console.error('Test failed: second ladder x position should be 600, got', secondLadderX);
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
    
    if (Math.abs(floorY0 - 586.6666666666666) > 0.001) {
        console.error('Test failed: floor 0 Y should be 586.67, got', floorY0);
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
    
    const logic = require('./logic.js');
    logic.resizeCanvas();
    
    const sectionHeight = mockCanvas.height / 3;
    const playerHeight = sectionHeight * 0.8;
    const floor2Y = sectionHeight - playerHeight;
    const floor1Y = sectionHeight * 2 - playerHeight;
    const ladderX = mockCanvas.width * 0.5;
    
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

    const logic = require('./logic.js');
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

    const floorStrokeStart = mockCtx.strokeCalls.length;
    const footFillStart = mockCtx.fillCalls.length;
    logic.drawStickman(100, 200, 160, 'left', 0, false, { type: 'kick', direction: 'left', frame: 6 });
    const kickFoot = mockCtx.strokeCalls.slice(floorStrokeStart)[1];
    const horizontalKickLength = kickFoot
        ? Math.hypot(kickFoot[1].x - kickFoot[0].x, kickFoot[1].y - kickFoot[0].y)
        : 0;
    const horizontalUnitX = kickFoot ? (kickFoot[1].x - kickFoot[0].x) / horizontalKickLength : 0;
    const horizontalUnitY = kickFoot ? (kickFoot[1].y - kickFoot[0].y) / horizontalKickLength : 0;
    const shoePath = mockCtx.strokeCalls.slice(floorStrokeStart)[5];
    const shoeLength = shoePath
        ? (shoePath[2].x - shoePath[0].x) * horizontalUnitX + (shoePath[2].y - shoePath[0].y) * horizontalUnitY
        : 0;
    const shoeFill = mockCtx.fillCalls[footFillStart];
    if (!kickFoot || kickFoot[1].x >= kickFoot[0].x || Math.abs(horizontalKickLength - 160 * 0.25 * 5) > 0.001 ||
        !shoeFill || shoeFill.fillStyle !== '#FF0000' || mockCtx.fillCalls.length - footFillStart !== 1 ||
        Math.abs(shoeLength - 160 * 0.15 * 4) > 0.001) {
        console.error('Test failed: peak left kick should show a foot twice the head diameter at its tip');
        teardownMockEnvironment();
        return false;
    }

    const nonPeakKickStart = mockCtx.strokeCalls.length;
    const nonPeakFootFillStart = mockCtx.fillCalls.length;
    logic.drawStickman(100, 200, 160, 'left', 0, false, { type: 'kick', direction: 'left', frame: 3 });
    if (mockCtx.strokeCalls.length - nonPeakKickStart !== 5 || mockCtx.fillCalls.length !== nonPeakFootFillStart) {
        console.error('Test failed: kick should show the foot only at peak extension');
        teardownMockEnvironment();
        return false;
    }

    logic.keys.Space = false;
    logic.updatePlayer();
    logic.player.x = mockCanvas.width * 0.5;
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
    const upPunch = mockCtx.strokeCalls.slice(upStrokeStart)[2];
    const upwardPunchLength = upPunch
        ? Math.hypot(upPunch[1].x - upPunch[0].x, upPunch[1].y - upPunch[0].y)
        : 0;
    const fistFill = mockCtx.fillCalls[upFillStart];
    if (!upPunch || upPunch[1].y >= upPunch[0].y || Math.abs(upwardPunchLength - 160 * 0.2 * 5) > 0.001 ||
        !fistFill || fistFill.fillStyle !== '#FF0000' || fistFill.path.length < 9 ||
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

    const downStrokeStart = mockCtx.strokeCalls.length;
    logic.drawStickman(100, 200, 160, 'left', 0, true, { type: 'kick', direction: 'down', frame: 6 });
    const downKick = mockCtx.strokeCalls.slice(downStrokeStart)[1];
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
    logic.updatePlayer(1499);
    if (logic.player.attack.frame !== 6) {
        console.error('Test failed: attack pose should hold through the half-second display');
        teardownMockEnvironment();
        return false;
    }
    logic.updatePlayer(1501);
    if (logic.player.attack.frame !== 7) {
        console.error('Test failed: attack pose should retract after half a second');
        teardownMockEnvironment();
        return false;
    }

    const timedKick = { type: 'kick', direction: 'left', frame: 6, peakTime: 1000 };
    const timedKickFillStart = mockCtx.fillCalls.length;
    logic.drawStickman(100, 200, 160, 'left', 0, false, timedKick, 1499);
    logic.drawStickman(100, 200, 160, 'left', 0, false, timedKick, 1501);
    if (mockCtx.fillCalls.length - timedKickFillStart !== 1) {
        console.error('Test failed: filled foot should stay visible for half a second');
        teardownMockEnvironment();
        return false;
    }

    const timedPunch = { type: 'punch', direction: 'up', frame: 6, peakTime: 1000 };
    const timedPunchFillStart = mockCtx.fillCalls.length;
    logic.drawStickman(100, 200, 160, 'left', 0, true, timedPunch, 1499);
    logic.drawStickman(100, 200, 160, 'left', 0, true, timedPunch, 1501);
    if (mockCtx.fillCalls.length - timedPunchFillStart !== 1) {
        console.error('Test failed: filled fist should stay visible for half a second');
        teardownMockEnvironment();
        return false;
    }

    teardownMockEnvironment();
    console.log('testSpacebarAttackAnimations passed');
    return true;
}

function testEnemySpawningAndDrawing() {
    setupMockEnvironment();

    const logic = require('./logic.js');
    logic.resizeCanvas();
    logic.player.x = 590;
    logic.enemies.length = 0;
    const originalRandom = Math.random;
    Math.random = function() { return 0.25; };

    try {
        logic.updateEnemies(1000);
        logic.updateEnemies(5999);
        if (logic.enemies.length !== 0) {
            console.error('Test failed: enemies should spawn only after five seconds');
            return false;
        }

        logic.updateEnemies(6000);
        if (logic.enemies.length !== 1) {
            console.error('Test failed: one enemy should spawn after five seconds');
            return false;
        }

        const firstEnemy = logic.enemies[0];
        const firstPosition = { x: firstEnemy.x, y: firstEnemy.y };
        const playerCenterX = logic.player.x + logic.player.width / 2;
        const minimumDistance = logic.ladders[0].width * 4;
        const sectionHeight = mockCanvas.height / 3;
        if (firstEnemy.height !== logic.player.height / 2 ||
            Math.abs(firstEnemy.x - playerCenterX) < minimumDistance ||
            Math.abs(firstEnemy.y + firstEnemy.height - sectionHeight) > 0.001) {
            console.error('Test failed: crab should be half player height, on a floor, and far enough from player');
            return false;
        }

        logic.updateEnemies(10999);
        if (logic.enemies.length !== 1) {
            console.error('Test failed: no second enemy should spawn before the next five-second interval');
            return false;
        }
        logic.updateEnemies(11000);
        if (logic.enemies.length !== 2 || firstEnemy.x !== firstPosition.x || firstEnemy.y !== firstPosition.y) {
            console.error('Test failed: another enemy should spawn while existing enemies stay still');
            return false;
        }

        const fillStart = mockCtx.fillCalls.length;
        const ellipseStart = mockCtx.ellipseCalls.length;
        logic.drawCrab(firstEnemy);
        const crabFills = mockCtx.fillCalls.slice(fillStart);
        if (!crabFills.some(call => call.fillStyle === '#8B4513') ||
            mockCtx.ellipseCalls.length - ellipseStart !== 1) {
            console.error('Test failed: crab should draw a brown filled shell');
            return false;
        }

        const gameFillStart = mockCtx.fillCalls.length;
        logic.drawGame(11000);
        if (!mockCtx.fillCalls.slice(gameFillStart).some(call => call.fillStyle === '#8B4513')) {
            console.error('Test failed: drawGame should render spawned crabs');
            return false;
        }
    } finally {
        Math.random = originalRandom;
        teardownMockEnvironment();
    }

    console.log('testEnemySpawningAndDrawing passed');
    return true;
}

function runAllTests() {
    console.log('Running tests...');
    
    const results = [
        testDrawFloorLines(),
        testDrawLadder(),
        testDrawStickman(),
        testIsNearLadder(),
        testIsOverLadder(),
        testResizeCanvas(),
        testDrawGame(),
        testLadderPositioning(),
        testSectionHeight(),
        testPlayerHeightAndFloorPositioning(),
        testLadderFloor2ToFloor1Descending(),
        testSpacebarAttackAnimations(),
        testEnemySpawningAndDrawing(),
        testFindClosestFloor()
    ];
    
    const allPassed = results.every(result => result === true);
    
    if (allPassed) {
        console.log('All tests passed!');
    } else {
        console.log('Some tests failed!');
    }
    
    return allPassed;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        testDrawFloorLines, 
        testDrawLadder, 
        testDrawStickman,
        testIsNearLadder,
        testIsOverLadder,
        testResizeCanvas, 
        testDrawGame,
        testLadderPositioning,
        testSectionHeight,
        testPlayerHeightAndFloorPositioning,
        testLadderFloor2ToFloor1Descending,
        testSpacebarAttackAnimations,
        testEnemySpawningAndDrawing,
        testFindClosestFloor,
        runAllTests
    };
    if (require.main === module) {
        runAllTests();
    }
} else {
    runAllTests();
}
