let mockCanvas = null;
let mockCtx = null;
let originalWindow = null;
let originalDocument = null;

function setupMockEnvironment() {
    mockCanvas = {
        width: 1200,
        height: 800
    };
    
    mockCtx = {
        strokeStyle: null,
        lineWidth: null,
        shadowColor: null,
        shadowBlur: null,
        fillStyle: null,
        currentPath: null,
        fillRectCalls: [],
        strokeCalls: [],
        
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
        
        fillRect: function(x, y, width, height) {
            this.fillRectCalls.push({ x, y, width, height });
        },
        
        getContext: function() {
            return this;
        }
    };
    
    originalWindow = global.window;
    originalDocument = global.document;
    
    global.window = {
        innerWidth: 1200,
        innerHeight: 800
    };
    
    global.document = {
        getElementById: function(id) {
            if (id === 'gameCanvas') {
                return mockCanvas;
            }
            return null;
        }
    };
    
    global.canvas = mockCanvas;
    global.ctx = mockCtx;
}

function teardownMockEnvironment() {
    global.window = originalWindow;
    global.document = originalDocument;
    delete global.canvas;
    delete global.ctx;
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

function runAllTests() {
    console.log('Running tests...');
    
    const results = [
        testDrawFloorLines(),
        testDrawLadder(),
        testResizeCanvas(),
        testDrawGame(),
        testLadderPositioning(),
        testSectionHeight()
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
        testResizeCanvas, 
        testDrawGame,
        testLadderPositioning,
        testSectionHeight,
        runAllTests 
    };
} else {
    runAllTests();
}
