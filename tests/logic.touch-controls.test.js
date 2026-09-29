const { setupMockEnvironment, teardownMockEnvironment } = require('./test-helpers.js');

function testTouchHitAndCookControls() {
    setupMockEnvironment();
    const touchListeners = {};
    const touchControls = { addEventListener(type, listener) { touchListeners[type] = listener; } };
    const originalGetElementById = document.getElementById;
    document.getElementById = function(id) {
        if (id === 'touch-controls') return touchControls;
        return originalGetElementById.call(this, id);
    };

    const logic = require('../resources/v1.3/logic.js');
    logic.resizeCanvas();

    function tap(action) {
        const button = {
            dataset: { touchAction: action },
            closest(selector) { return selector === '[data-touch-action], [data-direction]' ? this : null; },
            setPointerCapture() {}
        };
        let prevented = false;
        touchListeners.pointerdown({
            target: button,
            pointerId: 1,
            preventDefault() { prevented = true; }
        });
        logic.updatePlayer(mockNow);
        return { prevented, attack: logic.player.attack };
    }

    const directionButton = {
        dataset: { direction: 'ArrowRight' },
        closest(selector) { return selector === '[data-touch-action], [data-direction]' || selector === '[data-direction]' ? this : null; },
        setPointerCapture() {}
    };
    let movementPrevented = false;
    touchListeners.pointerdown({
        target: directionButton,
        pointerId: 2,
        preventDefault() { movementPrevented = true; }
    });
    if (!movementPrevented || !logic.keys.ArrowRight) {
        console.error('Test failed: holding the right touch control should press the right movement key');
        teardownMockEnvironment();
        return false;
    }
    touchListeners.pointerup({ target: directionButton });
    if (logic.keys.ArrowRight) {
        console.error('Test failed: releasing the right touch control should release the movement key');
        teardownMockEnvironment();
        return false;
    }

    const hit = tap('hit');
    if (!hit.prevented || !hit.attack || hit.attack.brickWall !== false) {
        console.error('Test failed: tapping Hit should trigger a regular attack and prevent browser gestures');
        teardownMockEnvironment();
        return false;
    }

    logic.player.attack = null;
    const cook = tap('cook');
    if (!cook.prevented || !cook.attack || cook.attack.brickWall !== true) {
        console.error('Test failed: tapping Cook should trigger the special cooking attack');
        teardownMockEnvironment();
        return false;
    }

    teardownMockEnvironment();
    console.log('testTouchHitAndCookControls passed');
    return true;
}

module.exports = { testTouchHitAndCookControls };
