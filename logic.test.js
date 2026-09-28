let mockCanvas = null;
let mockCtx = null;
let originalWindow = null;
let originalDocument = null;
let mockScoreElement = null;
let mockLivesElement = null;

function setupMockEnvironment() {
    mockScoreElement = { textContent: "0" };
    mockLivesElement = { textContent: "3" };
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
        filter: "none",
        fillStyle: null,
        globalAlpha: 1,
        font: null,
        textAlign: null,
        textBaseline: null,
        currentPath: null,
        fillRectCalls: [],
        fillTextCalls: [],
        fillCalls: [],
        strokeCalls: [],
        strokeStyles: [],
        strokeFilters: [],
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
            this.strokeStyles.push(this.strokeStyle);
            this.strokeFilters.push(this.filter);
            this.lastPath = this.currentPath;
        },

        closePath: function() {
            if (this.currentPath) this.currentPath.push({ type: 'close' });
        },

        fill: function() {
            this.fillCalls.push({ path: [...this.currentPath], fillStyle: this.fillStyle });
        },
        
        fillRect: function(x, y, width, height) {
            this.fillRectCalls.push({ x, y, width, height, fillStyle: this.fillStyle });
        },

        fillText: function(text, x, y) {
            this.fillTextCalls.push({ text, x, y, fillStyle: this.fillStyle, font: this.font, textAlign: this.textAlign, textBaseline: this.textBaseline, filter: this.filter });
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
            if (id === "score") return mockScoreElement;
            if (id === "lives") return mockLivesElement;
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
    
    if (mockCtx.strokeStyle !== 'lime') {
        console.error('Test failed: strokeStyle should be lime, got', mockCtx.strokeStyle);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.lineWidth !== 15) {
        console.error('Test failed: lineWidth should be 15, got', mockCtx.lineWidth);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.shadowColor !== 'lime') {
        console.error('Test failed: shadowColor should be lime, got', mockCtx.shadowColor);
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
    
    if (mockCtx.strokeStyle !== 'blue') {
        console.error('Test failed: strokeStyle should be blue, got', mockCtx.strokeStyle);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.lineWidth !== 8) {
        console.error('Test failed: lineWidth should be 8, got', mockCtx.lineWidth);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.shadowColor !== 'blue') {
        console.error('Test failed: shadowColor should be blue, got', mockCtx.shadowColor);
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
    
    if (mockCtx.strokeStyle !== 'red') {
        console.error('Test failed: strokeStyle should be red, got', mockCtx.strokeStyle);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.lineWidth !== 4) {
        console.error('Test failed: lineWidth should be 4, got', mockCtx.lineWidth);
        teardownMockEnvironment();
        return false;
    }
    
    if (mockCtx.shadowColor !== 'red') {
        console.error('Test failed: shadowColor should be red, got', mockCtx.shadowColor);
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

    const background = mockCtx.fillRectCalls[0];
    if (!background || background.fillStyle !== 'black' || mockCtx.fillRectCalls.length !== 1) {
        console.error('Test failed: drawGame should fill the canvas black');
        teardownMockEnvironment();
        return false;
    }

    if (background.x !== 0 || background.y !== 0 ||
        background.width !== mockCanvas.width || background.height !== mockCanvas.height) {
        console.error('Test failed: black background should cover the entire canvas');
        teardownMockEnvironment();
        return false;
    }

    const words = mockCtx.fillTextCalls;
    const expectedWords = ['kill', 'the', 'crabs'];
    const sectionHeight = mockCanvas.height / 3;
    const expectedY = [sectionHeight / 2, sectionHeight * 1.5, (sectionHeight * 2 + mockCanvas.height - 15) / 2];
    if (words.length !== expectedWords.length || words.some((word, index) =>
        word.text !== expectedWords[index] || word.x !== mockCanvas.width / 2 ||
        Math.abs(word.y - expectedY[index]) > 0.001 || word.fillStyle !== 'yellow' ||
        word.textAlign !== 'center' || word.textBaseline !== 'middle' || word.font !== 'bold 160px Arial' || word.filter !== 'blur(4px)' || !word.text)) {
        console.error('Test failed: each floor should show its centered yellow lowercase word');
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
    
    const logic = require('./logic.js');
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
    const kickFoot = mockCtx.strokeCalls.slice(floorStrokeStart)[2];
    const horizontalKickLength = kickFoot
        ? Math.hypot(kickFoot[1].x - kickFoot[0].x, kickFoot[1].y - kickFoot[0].y)
        : 0;
    const horizontalUnitX = kickFoot ? (kickFoot[1].x - kickFoot[0].x) / horizontalKickLength : 0;
    const horizontalUnitY = kickFoot ? (kickFoot[1].y - kickFoot[0].y) / horizontalKickLength : 0;
    const shoePath = mockCtx.strokeCalls.slice(floorStrokeStart)[6];
    const shoeLength = shoePath
        ? (shoePath[2].x - shoePath[0].x) * horizontalUnitX + (shoePath[2].y - shoePath[0].y) * horizontalUnitY
        : 0;
    const shoeFill = mockCtx.fillCalls[footFillStart];
    if (!kickFoot || kickFoot[1].x >= kickFoot[0].x || Math.abs(horizontalKickLength - 160 * 0.25 * 5) > 0.001 ||
        !shoeFill || shoeFill.fillStyle !== 'red' || mockCtx.fillCalls.length - footFillStart !== 1 ||
        Math.abs(shoeLength - 160 * 0.15 * 4) > 0.001) {
        console.error('Test failed: peak left kick should show a foot twice the head diameter at its tip');
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
    if (!upPunch || upPunch[1].y >= upPunch[0].y || Math.abs(upwardPunchLength - 160 * 0.2 * 5) > 0.001 ||
        !fistFill || fistFill.fillStyle !== 'red' || fistFill.path.length < 9 ||
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

function testCombatAttacksAndExplosions() {
    setupMockEnvironment();
    let logic = require("./logic.js");
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
        logic.gameState.lives !== 3 || logic.explosionEffects.length !== 1 ||
        mockScoreElement.textContent !== "1") {
        console.error("Test failed: kicking a crab should remove it, score one, and start an explosion");
        teardownMockEnvironment();
        return false;
    }
    logic.drawGame(1000);
    if (!mockCtx.fillCalls.some(call => call.fillStyle === "yellow") || mockCtx.globalAlpha !== 1) {
        console.error("Test failed: crab explosion should draw an animated burst and restore canvas alpha");
        teardownMockEnvironment();
        return false;
    }
    logic.updateEnemies(1299);
    if (logic.explosionEffects.length !== 1) {
        console.error("Test failed: crab explosion should remain visible during its short animation");
        teardownMockEnvironment();
        return false;
    }
    logic.updateEnemies(1300);
    if (logic.explosionEffects.length !== 0) {
        console.error("Test failed: crab explosion should be removed when its animation ends");
        teardownMockEnvironment();
        return false;
    }
    teardownMockEnvironment();

    setupMockEnvironment();
    logic = require("./logic.js");
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

function testVictoryAtFifteenKills() {
    setupMockEnvironment();
    const logic = require("./logic.js");
    logic.resizeCanvas();
    logic.player.x = 200;
    logic.player.currentFloor = 2;
    logic.player.isClimbing = false;
    logic.player.attack = { type: "kick", direction: "right", frame: 6 };
    logic.gameState.score = 14;
    const enemyHeight = logic.player.height / 2;
    const sectionHeight = mockCanvas.height / 3;
    logic.enemies.push({
        x: logic.player.x + logic.player.height * 1.25,
        y: sectionHeight - enemyHeight,
        width: enemyHeight * 1.5,
        height: enemyHeight,
        floor: 2
    });
    const originalRandom = Math.random;
    Math.random = function() { return 0.5; };
    try {
        logic.updateEnemies(1000);
        if (logic.gameState.score !== 15 || !logic.gameState.gameOver || !logic.gameState.won) {
            console.error("Test failed: reaching 15 kills should trigger a win and end the game");
            return false;
        }
        const frozenPlayerX = logic.player.x;
        logic.updatePlayer(1010);
        if (logic.player.x !== frozenPlayerX) {
            console.error("Test failed: the game should freeze after reaching the winning score");
            return false;
        }
        const firstStroke = mockCtx.strokeFilters.length;
        logic.drawGame(1000);
        if (!mockCtx.strokeFilters.slice(firstStroke).includes("blur(16px)")) {
            console.error("Test failed: the scene should be blurred behind the victory message");
            return false;
        }
        const backing = mockCtx.fillRectCalls.slice(-1)[0];
        const message = mockCtx.fillTextCalls.slice(-1)[0];
        if (!backing || backing.fillStyle !== "black" || backing.width !== 1140 || backing.height !== 270 ||
            !message || message.text !== "YOU WIN!!!" || message.fillStyle !== "darkgreen" ||
            message.filter !== "none" || message.x !== mockCanvas.width / 2 || message.y !== mockCanvas.height / 2) {
            console.error("Test failed: a centered YOU WIN!!! message should appear on a black rectangle");
            return false;
        }
    } finally {
        Math.random = originalRandom;
        teardownMockEnvironment();
    }
    console.log("testVictoryAtFifteenKills passed");
    return true;
}
function testPlayerDamageImmunityAndGameOver() {
    setupMockEnvironment();
    const logic = require("./logic.js");
    logic.resizeCanvas();
    logic.player.x = 500;
    logic.player.currentFloor = 2;
    logic.player.attack = null;
    const sectionHeight = mockCanvas.height / 3;
    const enemyHeight = logic.player.height / 2;
    logic.enemies.push({
        x: logic.player.x,
        y: sectionHeight - enemyHeight,
        width: 60,
        height: 60,
        floor: 2
    });
    const originalRandom = Math.random;
    Math.random = function() { return 0.5; };
    try {
        logic.updateEnemies(1000);
        if (logic.gameState.lives !== 2 || logic.gameState.immuneUntil !== 9000 || mockLivesElement.textContent !== "2") {
            console.error("Test failed: touching the player should remove one life and grant eight seconds of immunity");
            return false;
        }
        logic.drawGame(1000);
        if (!mockCtx.strokeStyles.includes("red")) {
            console.error("Test failed: the player should blink red at the start of immunity");
            return false;
        }
        let strokesBeforeBlink = mockCtx.strokeCalls.length;
        logic.drawGame(1250);
        if (mockCtx.strokeStyles.slice(strokesBeforeBlink).some(color => color === "red" || color === "magenta")) {
            console.error("Test failed: the player should disappear during the blink interval");
            return false;
        }
        strokesBeforeBlink = mockCtx.strokeCalls.length;
        logic.drawGame(1500);
        if (!mockCtx.strokeStyles.slice(strokesBeforeBlink).includes("magenta")) {
            console.error("Test failed: the player should blink magenta during immunity");
            return false;
        }
        logic.updateEnemies(8999);
        if (logic.gameState.lives !== 2) {
            console.error("Test failed: the player should remain immune until eight seconds have elapsed");
            return false;
        }
        logic.updateEnemies(9000);
        if (logic.gameState.lives !== 1 || logic.gameState.immuneUntil !== 17000) {
            console.error("Test failed: a crab should hurt the player again after immunity ends");
            return false;
        }
        logic.updateEnemies(16999);
        if (logic.gameState.lives !== 1) {
            console.error("Test failed: the second immunity period should prevent repeated damage");
            return false;
        }
        logic.updateEnemies(17000);
        if (logic.gameState.lives !== 0 || !logic.gameState.gameOver || mockLivesElement.textContent !== "0") {
            console.error("Test failed: losing the last life should end the game");
            return false;
        }
        const frozenPlayerX = logic.player.x;
        const frozenEnemyPositions = logic.enemies.map(enemy => enemy.x);
        logic.keys.ArrowRight = true;
        logic.updatePlayer(9010);
        logic.updateEnemies(9010);
        if (logic.player.x !== frozenPlayerX ||
            logic.enemies.some((enemy, index) => enemy.x !== frozenEnemyPositions[index])) {
            console.error("Test failed: player and crabs should freeze after game over");
            return false;
        }
        const gameOverStrokeStart = mockCtx.strokeFilters.length;
        logic.drawGame(17000);
        if (!mockCtx.strokeFilters.slice(gameOverStrokeStart).includes("blur(16px)")) {
            console.error("Test failed: the game scene should be blurred behind the game-over message");
            return false;
        }
        const gameOverBox = mockCtx.fillRectCalls.slice(-1)[0];
        if (!gameOverBox || gameOverBox.fillStyle !== "black" ||
            gameOverBox.x !== mockCanvas.width / 2 - 570 || gameOverBox.y !== mockCanvas.height / 2 - 135 ||
            gameOverBox.width !== 1140 || gameOverBox.height !== 270) {
            console.error("Test failed: game over should have a centered black backing rectangle");
            return false;
        }
        const finalMessage = mockCtx.fillTextCalls.slice(-1)[0];
        if (!finalMessage || finalMessage.text !== "GAME OVER" ||
            finalMessage.fillStyle !== "darkgreen" || finalMessage.font !== "900 192px Arial" || finalMessage.filter !== "none" ||
            finalMessage.x !== mockCanvas.width / 2 || finalMessage.y !== mockCanvas.height / 2) {
            console.error("Test failed: game over should display large centered dark green text");
            return false;
        }
    } finally {
        Math.random = originalRandom;
        teardownMockEnvironment();
    }
    console.log("testPlayerDamageImmunityAndGameOver passed");
    return true;
}
function testCrabWalkingAndClaws() {
    setupMockEnvironment();
    const logic = require("./logic.js");
    const crab = { x: 300, y: 200, width: 90, height: 60, isMoving: true };
    try {
        let firstStart = mockCtx.strokeCalls.length;
        logic.drawCrab(crab, 0);
        const firstFrame = mockCtx.strokeCalls.slice(firstStart);
        firstStart = mockCtx.strokeCalls.length;
        logic.drawCrab(crab, 110);
        const secondFrame = mockCtx.strokeCalls.slice(firstStart);
        const firstFoot = firstFrame[0][2];
        const secondFoot = secondFrame[0][2];
        const firstClawGap = Math.hypot(firstFrame[5][1].x - firstFrame[5][3].x, firstFrame[5][1].y - firstFrame[5][3].y);
        const secondClawGap = Math.hypot(secondFrame[5][1].x - secondFrame[5][3].x, secondFrame[5][1].y - secondFrame[5][3].y);
        if (firstFoot.x === secondFoot.x && firstFoot.y === secondFoot.y) {
            console.error("Test failed: moving crab legs should swing as it walks");
            return false;
        }
        if (Math.abs(firstClawGap - secondClawGap) < 0.001) {
            console.error("Test failed: crab claws should open and close over time");
            return false;
        }

        crab.isMoving = false;
        firstStart = mockCtx.strokeCalls.length;
        logic.drawCrab(crab, 0);
        const idleFirstFrame = mockCtx.strokeCalls.slice(firstStart);
        firstStart = mockCtx.strokeCalls.length;
        logic.drawCrab(crab, 110);
        const idleSecondFrame = mockCtx.strokeCalls.slice(firstStart);
        if (idleFirstFrame[0][2].x !== idleSecondFrame[0][2].x ||
            idleFirstFrame[0][2].y !== idleSecondFrame[0][2].y) {
            console.error("Test failed: stationary crab legs should remain still");
            return false;
        }
    } finally {
        teardownMockEnvironment();
    }
    console.log("testCrabWalkingAndClaws passed");
    return true;
}
function testEnemySpawningAndDrawing() {
    setupMockEnvironment();

    const logic = require("./logic.js");
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
        testCombatAttacksAndExplosions(),
        testVictoryAtFifteenKills(),
        testPlayerDamageImmunityAndGameOver(),
        testCrabWalkingAndClaws(),
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
        testCombatAttacksAndExplosions,
        testVictoryAtFifteenKills,
        testPlayerDamageImmunityAndGameOver,
        testCrabWalkingAndClaws,
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
