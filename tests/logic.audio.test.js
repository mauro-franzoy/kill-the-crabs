const { setupMockEnvironment, teardownMockEnvironment } = require('./test-helpers.js');

function testGeneratedGameSounds() {
    setupMockEnvironment();
    const playedTones = [];
    const spokenPhrases = [];
    function createAudioParam() {
        return {
            setValueAtTime() {},
            exponentialRampToValueAtTime() {}
        };
    }
    window.AudioContext = function MockAudioContext() {
        this.currentTime = 1;
        this.destination = {};
        this.state = 'running';
        this.createOscillator = () => {
            const oscillator = {
                frequency: createAudioParam(),
                connect() {},
                start() {},
                stop() {}
            };
            Object.defineProperty(oscillator, 'type', {
                set(value) { playedTones.push(value); }
            });
            return oscillator;
        };
        this.createGain = () => ({ gain: createAudioParam(), connect() {} });
    };
    window.speechSynthesis = {
        cancel() {},
        speak(utterance) { spokenPhrases.push(utterance.text); }
    };
    window.SpeechSynthesisUtterance = function MockUtterance(text) { this.text = text; };

    const logic = require('../resources/v1.3/logic.js');
    logic.playGameSound('punch');
    logic.playGameSound('boil');
    logic.playGameSound('glass');
    logic.playGameSound('laugh');

    if (playedTones.length < 11 || spokenPhrases[0] !== 'Ha ha ha!') {
        console.error('Test failed: generated effects should create synthesized tones and speak the laugh');
        teardownMockEnvironment();
        return false;
    }

    teardownMockEnvironment();
    console.log('testGeneratedGameSounds passed');
    return true;
}

module.exports = { testGeneratedGameSounds };
