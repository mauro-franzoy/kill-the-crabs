const { setupMockEnvironment, teardownMockEnvironment } = require('./test-helpers.js');

function testGameInstructionsDisappearAfterTenSeconds() {
    setupMockEnvironment();
    const scheduledTimeouts = [];
    mockGameInstructions = { hidden: false, style: { display: "flex" } };
    global.setTimeout = function(callback, delay) {
        scheduledTimeouts.push({ callback, delay });
        return 1;
    };

    try {
        require("../resources/v1.0.1/logic.js");
        const timer = scheduledTimeouts[0];
        if (!timer || timer.delay !== 10000 || mockGameInstructions.hidden || mockGameInstructions.style.display !== "flex") {
            console.error("Test failed: instructions should remain visible until the 10-second timer");
            return false;
        }
        timer.callback();
        if (!mockGameInstructions.hidden || mockGameInstructions.style.display !== "none") {
            console.error("Test failed: instructions should be hidden after 10 seconds");
            return false;
        }
    } finally {
        teardownMockEnvironment();
    }

    console.log("testGameInstructionsDisappearAfterTenSeconds passed");
    return true;
}

function testIdlePauseAndResume() {
    setupMockEnvironment();
    const logic = require("../resources/v1.0.1/logic.js");
    logic.resizeCanvas();
    logic.player.x = 300;
    logic.keys.ArrowRight = true;
    logic.enemies.push({ x: 100, y: 100, width: 60, height: 60, floor: 1, isMoving: false });

    try {
        logic.gameLoop(10999);
        mockAnimationFrameCallbacks.length = 0;
        if (logic.gameState.paused) {
            console.error("Test failed: the game should continue until ten seconds without keyboard input");
            return false;
        }
        const playerXAtTimeout = logic.player.x;
        const enemyXAtTimeout = logic.enemies[0].x;
        logic.gameLoop(11000);
        if (!logic.gameState.paused || logic.player.x !== playerXAtTimeout || logic.enemies[0].x !== enemyXAtTimeout) {
            console.error("Test failed: ten seconds without keyboard input should pause and freeze gameplay");
            return false;
        }
        const pausedMessage = mockCtx.fillTextCalls.slice(-1)[0];
        if (!pausedMessage || pausedMessage.text !== "SPACEBAR TO RESUME" ||
            !mockCtx.strokeFilters.includes("blur(16px)")) {
            console.error("Test failed: idle pause should show its resume banner over a blurred scene");
            return false;
        }
        if (mockAnimationFrameCallbacks.length !== 0) {
            console.error("Test failed: idle pause should stop scheduling animation frames");
            return false;
        }

        mockNow = 12000;
        mockDocumentListeners.keydown({ code: "Space", key: " ", preventDefault: function() {} });
        if (logic.gameState.paused || mockAnimationFrameCallbacks.length !== 1 ||
            Object.values(logic.keys).some(isPressed => isPressed)) {
            console.error("Test failed: Space should resume gameplay and clear held keys");
            return false;
        }
        mockNow = 12010;
        mockDocumentListeners.keydown({ code: "ArrowRight", key: "ArrowRight", preventDefault: function() {} });
        const resumeFrame = mockAnimationFrameCallbacks.shift();
        resumeFrame(12010);
        if (logic.player.x !== playerXAtTimeout + logic.player.speed || logic.gameState.paused) {
            console.error("Test failed: gameplay should advance after resuming and pressing a movement key");
            return false;
        }
    } finally {
        teardownMockEnvironment();
    }
    console.log("testIdlePauseAndResume passed");
    return true;
}

function testVictoryAtFifteenKills() {
    setupMockEnvironment();
    const logic = require("../resources/v1.0.1/logic.js");
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
    const logic = require("../resources/v1.0.1/logic.js");
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

module.exports = { testGameInstructionsDisappearAfterTenSeconds, testIdlePauseAndResume, testVictoryAtFifteenKills, testPlayerDamageImmunityAndGameOver };
