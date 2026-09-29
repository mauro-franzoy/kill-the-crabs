const { setupMockEnvironment, teardownMockEnvironment } = require('./test-helpers.js');

function testDrawFloorLines() {
    setupMockEnvironment();
    
    const logic = require('../resources/v1.0.1/logic.js');
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
    
    const logic = require('../resources/v1.0.1/logic.js');
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
    
    const logic = require('../resources/v1.0.1/logic.js');
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

function testDrawGame() {
    setupMockEnvironment();

    const logic = require('../resources/v1.0.1/logic.js');
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

function testCrabWalkingAndClaws() {
    setupMockEnvironment();
    const logic = require("../resources/v1.0.1/logic.js");
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

function testResizeCanvas() {
    setupMockEnvironment();
    
    const logic = require('../resources/v1.0.1/logic.js');
    
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

module.exports = { testResizeCanvas, testDrawFloorLines, testDrawLadder, testDrawStickman, testDrawGame, testCrabWalkingAndClaws };
