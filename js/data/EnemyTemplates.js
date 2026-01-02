/**
 * EnemyTemplates.js - Enemy type definitions and configurations
 * 
 * Defines all enemy types available in the game with:
 * - Stats and progression
 * - AI parameters (detection range, wander radius)
 * - Loot rewards
 * - Sprites
 * 
 * New enemies can be added here without changing core systems.
 */

export const EnemyTemplates = {
    goblin: {
        name: 'Goblin',
        sprite: 'goblin',
        description: 'A small, weak creature. Easy prey.',
        
        // Base stats
        maxHP: 15,
        baseATK: 4,
        baseDEF: 1,
        baseCRT: 3,
        
        // AI parameters
        detectionRange: 6,
        wanderRadius: 4,
        
        // Rewards
        experienceReward: 25,
        goldReward: 5
    },
    
    skeleton: {
        name: 'Skeleton',
        sprite: 'skeleton',
        description: 'An undead warrior. Fragile but deadly.',
        
        // Base stats
        maxHP: 20,
        baseATK: 6,
        baseDEF: 2,
        baseCRT: 5,
        
        // AI parameters
        detectionRange: 7,
        wanderRadius: 5,
        
        // Rewards
        experienceReward: 40,
        goldReward: 10
    },
    
    orc: {
        name: 'Ogre',
        sprite: 'ogre.png',
        description: 'A brutish warrior with high HP.',
        
        // Base stats
        maxHP: 35,
        baseATK: 7,
        baseDEF: 3,
        baseCRT: 4,
        
        // AI parameters
        detectionRange: 8,
        wanderRadius: 6,
        
        // Rewards
        experienceReward: 60,
        goldReward: 20
    },
    
    rat: {
        name: 'Giant Rat',
        sprite: 'giantRat',
        description: 'A diseased rodent. Quick but weak.',
        
        // Base stats
        maxHP: 10,
        baseATK: 3,
        baseDEF: 0,
        baseCRT: 8,
        
        // AI parameters
        detectionRange: 7,
        wanderRadius: 5,
        
        // Rewards
        experienceReward: 15,
        goldReward: 3
    },
    
    zombie: {
        name: 'Zombie',
        sprite: 'zombie.png',
        description: 'A slow but resilient undead.',
        
        // Base stats
        maxHP: 28,
        baseATK: 5,
        baseDEF: 2,
        baseCRT: 2,
        
        // AI parameters
        detectionRange: 6,
        wanderRadius: 4,
        
        // Rewards
        experienceReward: 35,
        goldReward: 8
    },
    
    archer: {
        name: 'Archer',
        sprite: 'archer.png',
        description: 'A ranged attacker with decent defense.',
        
        // Base stats
        maxHP: 18,
        baseATK: 7,
        baseDEF: 2,
        baseCRT: 6,
        
        // AI parameters
        detectionRange: 10, // Ranged - higher detection
        wanderRadius: 5,
        
        // Rewards
        experienceReward: 50,
        goldReward: 15
    },
    
    goblinKing: {
        name: 'Goblin King',
        sprite: 'goblin_king.png',
        description: 'An elite goblin with increased stats.',
        
        // Base stats
        maxHP: 35,
        baseATK: 8,
        baseDEF: 3,
        baseCRT: 6,
        
        // AI parameters
        detectionRange: 10,
        wanderRadius: 6,
        
        // Rewards
        experienceReward: 100,
        goldReward: 30
    },
    
    skeletonKnight: {
        name: 'Skeleton Knight',
        sprite: 'skeleton_knight.png',
        description: 'A heavily armored undead warrior.',
        
        // Base stats
        maxHP: 40,
        baseATK: 9,
        baseDEF: 5,
        baseCRT: 4,
        
        // AI parameters
        detectionRange: 8,
        wanderRadius: 6,
        
        // Rewards
        experienceReward: 120,
        goldReward: 40
    }
};

/**
 * Get an enemy template by key
 * @param {string} key - Enemy template key
 * @returns {Object} - Enemy template data
 */
export function getEnemyTemplate(key) {
    const template = EnemyTemplates[key];
    if (!template) {
        console.warn(`Enemy template not found: ${key}. Using goblin as fallback.`);
        return { ...EnemyTemplates.goblin };
    }
    return { ...template };
}

/**
 * Get all available enemy templates
 * @returns {Array} - Array of template keys
 */
export function getAllEnemyTemplateKeys() {
    return Object.keys(EnemyTemplates);
}

/**
 * Get a random enemy template
 * @returns {string} - Random template key
 */
export function getRandomEnemyTemplate() {
    const keys = getAllEnemyTemplateKeys();
    return keys[Math.floor(Math.random() * keys.length)];
}

/**
 * Get enemy templates for a specific floor
 * Easier enemies on lower floors, harder on higher floors
 * @param {number} floor - Current floor number
 * @returns {Array} - Array of template keys suitable for this floor
 */
export function getEnemyTemplatesForFloor(floor) {
    // Progression: easier enemies on early floors
    if (floor <= 5) {
        return ['goblin', 'rat'];
    } else if (floor <= 10) {
        return ['goblin', 'rat', 'skeleton', 'zombie'];
    } else if (floor <= 15) {
        return ['skeleton', 'zombie', 'orc', 'archer'];
    } else if (floor <= 20) {
        return ['skeleton', 'orc', 'archer', 'goblinKing'];
    } else {
        // Endgame: all enemies with elite variants
        return ['orc', 'archer', 'goblinKing', 'skeletonKnight'];
    }
}

/**
 * Calculate enemy stat multiplier for a specific floor
 * Enemies get stronger the deeper you go
 * @param {number} floor - Current floor number
 * @returns {number} - Multiplier for stats (1.0 = floor 1, 1.1 = floor 2, etc.)
 */
export function getEnemyStatMultiplier(floor) {
    const baseFactor = 1.05; // 5% stronger per floor
    return Math.pow(baseFactor, floor - 1);
}

/**
 * Create an enemy from a template with floor scaling
 * @param {string} templateKey - Enemy template key
 * @param {number} floor - Current floor number
 * @param {Object} position - {x, y} position to spawn
 * @returns {Enemy} - Configured enemy instance
 */
export function createEnemyFromTemplate(templateKey, floor, position) {
    const { Enemy } = require('./Enemy.js');
    const template = getEnemyTemplate(templateKey);
    const multiplier = getEnemyStatMultiplier(floor);
    
    const enemyData = {
        ...template,
        x: position.x,
        y: position.y,
        floor: floor,
        
        // Scale stats by floor
        maxHP: Math.ceil(template.maxHP * multiplier),
        currentHP: Math.ceil(template.maxHP * multiplier),
        baseATK: Math.ceil(template.baseATK * multiplier),
        baseDEF: Math.ceil(template.baseDEF * multiplier),
        
        // Scale rewards by floor
        experienceReward: Math.ceil(template.experienceReward * multiplier),
        goldReward: Math.ceil(template.goldReward * multiplier)
    };
    
    return new Enemy(enemyData);
}

export default EnemyTemplates;
