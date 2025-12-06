/**
 * Test script to verify XP calculation fixes
 */

require('dotenv').config();
const { getXPProgress, calculateLevel, getMinXPForLevel } = require('../src/utils/xpCalculations');

console.log('='.repeat(60));
console.log('XP Calculation Test Suite');
console.log('='.repeat(60));

// Test cases with different XP amounts
const testCases = [
    { xp: 25, expectedLevel: 1 },
    { xp: 150, expectedLevel: 2 },
    { xp: 250, expectedLevel: 3 },
    { xp: 350, expectedLevel: 4 },
    { xp: 425, expectedLevel: 5 },
    { xp: 550, expectedLevel: 7 },
    { xp: 1000, expectedLevel: 11 },
    { xp: 2600, expectedLevel: 19 },
];

console.log('\n📊 Testing Level Calculation:\n');
testCases.forEach(({ xp, expectedLevel }) => {
    const calculatedLevel = calculateLevel(xp);
    const match = calculatedLevel === expectedLevel ? '✅' : '❌';
    console.log(`${match} XP: ${xp} → Level ${calculatedLevel} (expected: ${expectedLevel})`);
});

console.log('\n📊 Testing XP Progress Calculation:\n');
testCases.forEach(({ xp }) => {
    const level = calculateLevel(xp);
    const progress = getXPProgress(xp, level);

    console.log(`\nXP: ${xp} | Level: ${level}`);
    console.log(`  ├─ Current Level XP: ${progress.currentLevelXP}`);
    console.log(`  ├─ Remaining XP: ${progress.remainingXP}`);
    console.log(`  ├─ XP Required for Level: ${progress.xpRequiredForLevel}`);
    console.log(`  ├─ Min XP for Current Level: ${progress.minXPForCurrentLevel}`);
    console.log(`  └─ Min XP for Next Level: ${progress.minXPForNextLevel}`);

    // Verify calculations
    const progressPercent = (progress.currentLevelXP / progress.xpRequiredForLevel) * 100;
    console.log(`  Progress: ${progressPercent.toFixed(1)}%`);
});

console.log('\n📊 Level Boundaries:\n');
for (let level = 1; level <= 10; level++) {
    const minXP = getMinXPForLevel(level);
    const nextMinXP = getMinXPForLevel(level + 1);
    console.log(`Level ${level}: ${minXP} - ${nextMinXP - 1} XP (${nextMinXP - minXP} XP needed)`);
}

console.log('\n' + '='.repeat(60));
console.log('Test Complete!');
console.log('='.repeat(60) + '\n');
