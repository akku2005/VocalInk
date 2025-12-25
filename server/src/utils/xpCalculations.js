/**
 * XP Calculation Utilities
 * Provides helper functions for calculating XP progress based on the leveling system
 */

/**
 * Calculate level based on XP (matches user.model.js logic)
 */
function calculateLevel(xp) {
    if (xp < 100) return 1;
    if (xp < 500) return Math.floor(xp / 100) + 1;
    if (xp < 2500) return Math.floor(Math.sqrt(xp / 50)) + 1;
    return Math.floor(Math.sqrt(xp / 75)) + 1;
}

/**
 * Calculate the minimum XP required to reach a given level
 * This must match the logic in calculateLevel exactly
 */
function getMinXPForLevel(level) {
    if (level <= 1) return 0;

    // Levels 2-5 use simple linear formula (100 XP per level)
    if (level <= 5) return (level - 1) * 100;

    // For level 6+, need to iterate to find the boundary
    // because the formula changes at xp=500 and xp=2500
    let xp = 500; // Start at where formula changes

    // Iterate until we find the minimum XP for the target level
    while (calculateLevel(xp) < level) {
        xp += 10;
    }

    // Backtrack to find exact boundary
    while (xp > 0 && calculateLevel(xp - 1) >= level) {
        xp--;
    }

    return xp;
}

/**
 * Get XP progress information for a user
 * @param {number} totalXP - User's total XP
 * @param {number} currentLevel - User's current level
 * @returns {Object} XP progress details
 */
function getXPProgress(totalXP, currentLevel) {
    const minXPForCurrentLevel = getMinXPForLevel(currentLevel);
    const minXPForNextLevel = getMinXPForLevel(currentLevel + 1);

    const currentLevelXP = totalXP - minXPForCurrentLevel;
    const xpRequiredForLevel = minXPForNextLevel - minXPForCurrentLevel;
    const remainingXP = minXPForNextLevel - totalXP;

    return {
        currentLevelXP,       // XP earned within current level
        remainingXP,          // XP still needed to reach next level
        xpRequiredForLevel,   // Total XP needed to complete this level
        minXPForCurrentLevel, // Minimum XP to be at current level
        minXPForNextLevel     // XP needed to reach next level
    };
}

module.exports = {
    calculateLevel,
    getMinXPForLevel,
    getXPProgress
};
