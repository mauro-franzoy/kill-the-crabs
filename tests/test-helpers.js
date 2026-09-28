let mockCanvas = null;
let mockCtx = null;
let originalWindow = null;
let originalDocument = null;
let mockScoreElement = null;
let mockLivesElement = null;
let mockGameInstructions = null;
let originalSetTimeout = null;
let originalPerformance = null;
let mockNow = 0;
let mockAnimationFrameCallbacks = [];
let mockDocumentListeners = null;

for (const name of ['mockCanvas', 'mockCtx', 'originalWindow', 'originalDocument', 'mockScoreElement', 'mockLivesElement', 'mockGameInstructions', 'originalSetTimeout', 'originalPerformance', 'mockNow', 'mockAnimationFrameCallbacks', 'mockDocumentListeners']) {
    Object.defineProperty(globalThis, name, { configurable: true, get: () => eval(name), set: value => {
        switch (name) {
            case 'mockCanvas': mockCanvas = value; break;
            case 'mockCtx': mockCtx = value; break;
            case 'originalWindow': originalWindow = value; break;
            case 'originalDocument': originalDocument = value; break;
            case 'mockScoreElement': mockScoreElement = value; break;
            case 'mockLivesElement': mockLivesElement = value; break;
            case 'mockGameInstructions': mockGameInstructions = value; break;
            case 'originalSetTimeout': originalSetTimeout = value; break;
            case 'originalPerformance': originalPerformance = value; break;
            case 'mockNow': mockNow = value; break;
            case 'mockAnimationFrameCallbacks': mockAnimationFrameCallbacks = value; break;
            case 'mockDocumentListeners': mockDocumentListeners = value; break;
        }
    }});
}

function setupMockEnvironment() {
    mockScoreElement = { textContent: "0" };
    mockLivesElement = { textContent: "3" };
    mockGameInstructions = null;
    mockNow = 1000;
    mockAnimationFrameCallbacks = [];
    mockDocumentListeners = {};
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
        strokeAlphas: [],
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

        quadraticCurveTo: function(controlX, controlY, x, y) {
            if (this.currentPath) {
                this.currentPath.push({ type: 'quadratic', controlX, controlY, x, y });
            }
        },
        
        stroke: function() {
            this.strokeCalls.push([...this.currentPath]);
            this.strokeStyles.push(this.strokeStyle);
            this.strokeFilters.push(this.filter);
            this.strokeAlphas.push(this.globalAlpha);
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
    originalSetTimeout = global.setTimeout;
    originalPerformance = global.performance;
    global.performance = { now: function() { return mockNow; } };
    
    global.window = {
        innerWidth: 1200,
        innerHeight: 800,
        addEventListener: function() {}
    };
    
    global.document = {
        getElementById: function(id) {
            if (id === "score") return mockScoreElement;
            if (id === "lives") return mockLivesElement;
            if (id === "game-instructions") return mockGameInstructions;
            if (id === 'gameCanvas') {
                return mockCanvas;
            }
            return null;
        },
        addEventListener: function(type, listener) { mockDocumentListeners[type] = listener; }
    };
    
    global.requestAnimationFrame = function(callback) { mockAnimationFrameCallbacks.push(callback); };
    global.canvas = mockCanvas;
    global.ctx = mockCtx;
    Object.assign(globalThis, { mockCanvas, mockCtx, originalWindow, originalDocument, mockScoreElement, mockLivesElement, mockGameInstructions, originalSetTimeout, originalPerformance, mockNow, mockAnimationFrameCallbacks, mockDocumentListeners });
}

function teardownMockEnvironment() {
    global.window = originalWindow;
    global.document = originalDocument;
    global.setTimeout = originalSetTimeout;
    global.performance = originalPerformance;
    delete global.requestAnimationFrame;
    delete global.canvas;
    delete global.ctx;
    try { delete require.cache[require.resolve("../logic.js")]; } catch(e){}
}


const sharedNames = ['mockCanvas', 'mockCtx', 'originalWindow', 'originalDocument', 'mockScoreElement', 'mockLivesElement', 'mockGameInstructions', 'originalSetTimeout', 'originalPerformance', 'mockNow', 'mockAnimationFrameCallbacks', 'mockDocumentListeners'];

module.exports = { setupMockEnvironment, teardownMockEnvironment };
