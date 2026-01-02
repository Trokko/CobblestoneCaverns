/**
 * ClassTemplates.js - Klassdefinitioner
 * 
 * Här definieras alla spelbara klasser! Varje klass har:
 * - Base stats (HP, ATK, DEF, CRT vid level 1)
 * - Stat growth (hur mycket stats ökar per level)
 * - Startutrustning (vapen, rustning, accessoarer)
 * - Startinventory (potions, items)
 * 
 * Klasserna:
 * - Warrior: Balanserad, bäst för nybörjare (hög DEF)
 * - Barbarian: Hög ATK/HP, låg DEF (high risk/reward)
 * - Rogue: Hög CRT, låg HP (taktiskt spel)
 */

export const ClassTemplates = {
    warrior: {
        name: 'Warrior',
        description: 'A balanced fighter with good defense and moderate damage. Ideal for beginners.',
        sprite: 'warrior_m_1.png',
        
        // Grundstats vid level 1
        baseStats: {
            maxHP: 100,
            currentHP: 100,
            baseATK: 12,
            baseDEF: 8,
            baseCRT: 5, // 5% kritisk chans
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            gold: 0
        },
        
        // Stat-tillväxt per level (jämnt och balanserat)
        statGrowth: {
            maxHP: 10,      // +10 HP per level
            baseATK: 2,     // +2 ATK per level
            baseDEF: 1.5,   // +1.5 DEF per level (rundas av)
            baseCRT: 0.5    // +0.5% CRT per level
        },
        
        // Starting equipment
        startingEquipment: {
            weapon: {
                id: 'iron_sword',
                name: 'Iron Sword',
                type: 'weapon',
                atk: 8,
                def: 0,
                crt: 0,
                sprite: 'sword_iron.png'
            },
            armor: {
                id: 'chain_mail',
                name: 'Chain Mail',
                type: 'armor',
                atk: 0,
                def: 7,
                crt: 0,
                sprite: 'armor_chain.png'
            },
            accessory: null
        },
        
        // Starting inventory items
        startingInventory: [
            {
                id: 'health_potion_minor',
                name: 'Minor Health Potion',
                type: 'consumable',
                effect: 'heal',
                value: 30,
                sprite: 'potion_red.png',
                quantity: 3
            }
        ]
    },
    
    barbarian: {
        name: 'Barbarian',
        description: 'A brutal warrior with high attack and HP but lower defense. High risk, high reward.',
        sprite: 'barbarian_1.png',
        
        // Grundstats vid level 1 (högst HP och ATK!)
        baseStats: {
            maxHP: 120,     // +20 HP över Warrior
            currentHP: 120,
            baseATK: 15,    // +3 ATK över Warrior
            baseDEF: 5,     // -3 DEF under Warrior (glass cannon)
            baseCRT: 8,     // 8% kritisk chans
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            gold: 0
        },
        
        // Stat-tillväxt per level (fokus på offense)
        statGrowth: {
            maxHP: 12,      // +12 HP per level (mest av alla)
            baseATK: 3,     // +3 ATK per level (mest av alla)
            baseDEF: 1,     // +1 DEF per level (minst av alla)
            baseCRT: 0.7    // +0.7% CRT per level
        },
        
        // Starting equipment
        startingEquipment: {
            weapon: {
                id: 'battle_axe',
                name: 'Battle Axe',
                type: 'weapon',
                atk: 12,
                def: 0,
                crt: 5,
                sprite: 'axe_battle.png'
            },
            armor: {
                id: 'leather_armor',
                name: 'Leather Armor',
                type: 'armor',
                atk: 0,
                def: 5,
                crt: 0,
                sprite: 'armor_leather.png'
            },
            accessory: null
        },
        
        // Starting inventory items
        startingInventory: [
            {
                id: 'health_potion_minor',
                name: 'Minor Health Potion',
                type: 'consumable',
                effect: 'heal',
                value: 30,
                sprite: 'potion_red.png',
                quantity: 2
            }
        ]
    },
    
    rogue: {
        name: 'Rogue',
        description: 'A nimble fighter with high critical chance and evasion. Requires tactical gameplay.',
        sprite: 'thief_1.png',
        
        // Grundstats vid level 1 (lägst HP, högst CRT!)
        baseStats: {
            maxHP: 80,      // -20 HP under Warrior (glaskanon)
            currentHP: 80,
            baseATK: 10,    // -2 ATK under Warrior
            baseDEF: 6,     // -2 DEF under Warrior
            baseCRT: 15,    // 15% kritisk chans (3x Warrior!)
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            gold: 0
        },
        
        // Stat-tillväxt per level (fokus på crits)
        statGrowth: {
            maxHP: 8,       // +8 HP per level (minst av alla)
            baseATK: 2.5,   // +2.5 ATK per level (rundas av)
            baseDEF: 1,     // +1 DEF per level
            baseCRT: 1      // +1% CRT per level (mest av alla!)
        },
        
        // Starting equipment
        startingEquipment: {
            weapon: {
                id: 'twin_daggers',
                name: 'Twin Daggers',
                type: 'weapon',
                atk: 6,
                def: 0,
                crt: 10,
                sprite: 'dagger_twin.png'
            },
            armor: {
                id: 'leather_vest',
                name: 'Leather Vest',
                type: 'armor',
                atk: 0,
                def: 4,
                crt: 0,
                sprite: 'armor_leather_light.png'
            },
            accessory: {
                id: 'lucky_charm',
                name: 'Lucky Charm',
                type: 'accessory',
                atk: 0,
                def: 0,
                crt: 5,
                sprite: 'charm_lucky.png'
            }
        },
        
        // Starting inventory items
        startingInventory: [
            {
                id: 'health_potion_minor',
                name: 'Minor Health Potion',
                type: 'consumable',
                effect: 'heal',
                value: 30,
                sprite: 'potion_red.png',
                quantity: 2
            },
            {
                id: 'smoke_bomb',
                name: 'Smoke Bomb',
                type: 'consumable',
                effect: 'escape',
                value: 1,
                sprite: 'bomb_smoke.png',
                quantity: 1
            }
        ]
    }
};

/**
 * Hämta klass-template via nyckel
 * 
 * @param {string} classKey - Klass-nyckel (warrior, barbarian, rogue)
 * @returns {Object|null} - Klass-template eller null om ej funnen
 */
export function getClassTemplate(classKey) {
    return ClassTemplates[classKey] || null;
}

/**
 * Hämta alla tillgängliga klass-nycklar
 * 
 * @returns {Array<string>} - Array med klass-nycklar ['warrior', 'barbarian', 'rogue']
 */
export function getAvailableClasses() {
    return Object.keys(ClassTemplates);
}

/**
 * Beräkna stats för en given level
 * 
 * @param {string} classKey - Klass-nyckel
 * @param {number} level - Mål-level
 * @returns {Object} - Beräknade stats för leveln
 * 
 * Formel: baseStat + (statGrowth * (level - 1))
 * Exempel: Warrior level 5 HP = 100 + (10 * 4) = 140 HP
 */
export function calculateStatsForLevel(classKey, level) {
    const template = getClassTemplate(classKey);
    if (!template) return null;
    
    const levelsGained = level - 1; // Level 1 = 0 gains, Level 5 = 4 gains
    
    return {
        maxHP: template.baseStats.maxHP + Math.floor(template.statGrowth.maxHP * levelsGained),
        baseATK: template.baseStats.baseATK + Math.floor(template.statGrowth.baseATK * levelsGained),
        baseDEF: template.baseStats.baseDEF + Math.floor(template.statGrowth.baseDEF * levelsGained),
        baseCRT: template.baseStats.baseCRT + Math.floor(template.statGrowth.baseCRT * levelsGained * 10) / 10, // Behåll en decimal
        level: level,
        xpToNextLevel: calculateXPForNextLevel(level)
    };
}

/**
 * Beräkna XP krävt för nästa level
 * 
 * @param {number} currentLevel - Nuvarande level
 * @returns {number} - XP krävt för nästa level
 * 
 * Formel: 100 * 1.2^(level - 1)
 * Level 1→2: 100 XP
 * Level 2→3: 120 XP
 * Level 3→4: 144 XP
 * Level 4→5: 173 XP
 * osv...
 * 
 * Exponentiell scaling = senare levels tar längre tid!
 */
export function calculateXPForNextLevel(currentLevel) {
    return Math.floor(100 * Math.pow(1.2, currentLevel - 1));
}
