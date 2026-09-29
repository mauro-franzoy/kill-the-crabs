const groups = [
    require('./logic.game-state.test.js'),
    require('./logic.rendering.test.js'),
    require('./logic.player-movement.test.js'),
    require('./logic.combat.test.js'),
    require('./logic.enemies.test.js'),
    require('./logic.touch-controls.test.js'),
];

const tests = Object.assign({}, ...groups);
function runAllTests() {
    console.log('Running tests...');
    const results = Object.values(tests).map(test => test());
    const allPassed = results.every(result => result === true);
    console.log(allPassed ? 'All tests passed!' : 'Some tests failed!');
    return allPassed;
}

module.exports = { ...tests, runAllTests };
if (require.main === module) runAllTests();
