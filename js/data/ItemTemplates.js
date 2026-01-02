/**
 * ItemTemplates.js - Förinställda föremål som kan droppas eller skapas
 * 
 * Definerar alla möjliga items i spelet:
 * - Vapen (svärd, dolkar)
 * - Rustningar (läder, järn)
 * - Förbrukningsartiklar (läkningsdrycker, buff-elixir)
 * 
 * Använd getItemTemplate(key) för att få en kopia av ett item
 */

import Item from '../entities/Item.js';

const ItemTemplates = {
    // ============ WEAPONS ============
    iron_sword: {
        id: 'iron_sword',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        sprite: 'iron_sword',
        color: '#666666',
        description: 'A simple iron blade. Reliable and sturdy.',
        stats: { atk: 5, crt: 0 },
        minFloor: 1,
        dropRate: 0.25
    },

    steel_sword: {
        id: 'steel_sword',
        name: 'Steel Sword',
        type: 'weapon',
        rarity: 'uncommon',
        sprite: 'steel_sword',
        color: '#AAAAAA',
        description: 'A well-crafted steel blade. Better than iron.',
        stats: { atk: 10, crt: 2 },
        minFloor: 5,
        dropRate: 0.15
    },

    golden_sword: {
        id: 'golden_sword',
        name: 'Golden Sword',
        type: 'weapon',
        rarity: 'rare',
        sprite: 'golden_sword',
        color: '#FFD700',
        description: 'A legendary golden blade. Shimmers with magic.',
        stats: { atk: 16, crt: 5 },
        minFloor: 10,
        dropRate: 0.08
    },

    dragon_slayer: {
        id: 'dragon_slayer',
        name: 'Dragon Slayer',
        type: 'weapon',
        rarity: 'epic',
        sprite: 'dragon_slayer',
        color: '#FF0000',
        description: 'Forged in dragon fire. Legendary weapon.',
        stats: { atk: 25, crt: 8 },
        minFloor: 15,
        dropRate: 0.03
    },

    dark_dagger: {
        id: 'dark_dagger',
        name: 'Dark Dagger',
        type: 'weapon',
        rarity: 'rare',
        sprite: 'dark_dagger',
        color: '#330033',
        description: 'A cursed dagger wreathed in shadow.',
        stats: { atk: 8, crt: 12 },
        minFloor: 8,
        dropRate: 0.10
    },

    // ============ ARMOR ============
    leather_armor: {
        id: 'leather_armor',
        name: 'Leather Armor',
        type: 'armor',
        rarity: 'common',
        sprite: 'leather_armor',
        color: '#8B4513',
        description: 'Simple leather protection. Better than nothing.',
        stats: { def: 3, hp: 0 },
        minFloor: 1,
        dropRate: 0.20
    },

    chain_mail: {
        id: 'chain_mail',
        name: 'Chain Mail',
        type: 'armor',
        rarity: 'uncommon',
        sprite: 'chain_mail',
        color: '#666666',
        description: 'Interlocking metal rings. Decent protection.',
        stats: { def: 6, hp: 5 },
        minFloor: 5,
        dropRate: 0.15
    },

    plate_armor: {
        id: 'plate_armor',
        name: 'Plate Armor',
        type: 'armor',
        rarity: 'rare',
        sprite: 'plate_armor',
        color: '#AAAAAA',
        description: 'Heavy plate protection. Excellent defense.',
        stats: { def: 12, hp: 10 },
        minFloor: 10,
        dropRate: 0.08
    },

    mithril_plate: {
        id: 'mithril_plate',
        name: 'Mithril Plate',
        type: 'armor',
        rarity: 'epic',
        sprite: 'mithril_plate',
        color: '#00FFFF',
        description: 'Mystical mithril armor. Nearly unbreakable.',
        stats: { def: 20, hp: 25 },
        minFloor: 15,
        dropRate: 0.04
    },

    // ============ CONSUMABLES ============
    health_potion: {
        id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        rarity: 'common',
        sprite: 'health_potion',
        color: '#FF0000',
        description: 'Restores 30 HP when consumed.',
        canUse: true,
        quantity: 1,
        minFloor: 1,
        dropRate: 0.40,
        useEffect: (player) => {
            const healed = Math.min(30, player.maxHP - player.currentHP);
            player.currentHP = Math.min(player.currentHP + 30, player.maxHP);
            console.log(`Drank potion: Restored ${healed} HP`);
        }
    },

    greater_health_potion: {
        id: 'greater_health_potion',
        name: 'Greater Health Potion',
        type: 'consumable',
        rarity: 'uncommon',
        sprite: 'greater_health_potion',
        color: '#FF5555',
        description: 'Restores 75 HP when consumed.',
        canUse: true,
        quantity: 1,
        minFloor: 8,
        dropRate: 0.15,
        useEffect: (player) => {
            const healed = Math.min(75, player.maxHP - player.currentHP);
            player.currentHP = Math.min(player.currentHP + 75, player.maxHP);
            console.log(`Drank potion: Restored ${healed} HP`);
        }
    },

    strength_elixir: {
        id: 'strength_elixir',
        name: 'Strength Elixir',
        type: 'consumable',
        rarity: 'rare',
        sprite: 'strength_elixir',
        color: '#FF9900',
        description: 'Temporarily increases ATK by 5 for 3 turns.',
        canUse: true,
        quantity: 1,
        minFloor: 10,
        dropRate: 0.08,
        useEffect: (player) => {
            // TODO: Implement temporary stat buffs via status effect system
            player.stats.baseATK += 5;
            console.log('ATK increased by 5!');
        }
    },

    // ============ QUEST/SPECIAL ============
    gold_coin: {
        id: 'gold_coin',
        name: 'Gold Coin',
        type: 'consumable',
        rarity: 'common',
        sprite: 'gold_coin',
        color: '#FFD700',
        description: 'Valuable currency. Sell for 1 gold.',
        canUse: false,
        quantity: 1,
        minFloor: 1,
        dropRate: 0.35
    }
};

/**
 * Get a fresh copy of an item template
 * @param {string} key - Template key (e.g., 'iron_sword')
 * @returns {Item} New Item instance
 */
export function getItemTemplate(key) {
    const template = ItemTemplates[key];
    if (!template) {
        console.warn(`Item template not found: ${key}`);
        return null;
    }
    return new Item(template);
}

/**
 * Get random item valid for a specific floor
 * @param {number} floor - Current dungeon floor
 * @returns {Item} Random item or null
 */
export function getRandomItemForFloor(floor) {
    const validItems = Object.keys(ItemTemplates).filter(key => {
        const template = ItemTemplates[key];
        return template.minFloor <= floor && Math.random() < template.dropRate;
    });

    if (validItems.length === 0) {
        return null;
    }

    const randomKey = validItems[Math.floor(Math.random() * validItems.length)];
    return getItemTemplate(randomKey);
}

/**
 * Get multiple random items with weighted probability
 * @param {number} floor - Current dungeon floor
 * @param {number} count - How many items to attempt to generate
 * @returns {Item[]} Array of items
 */
export function generateLoot(floor, count = 1) {
    const loot = [];
    for (let i = 0; i < count; i++) {
        const item = getRandomItemForFloor(floor);
        if (item) {
            loot.push(item);
        }
    }
    return loot;
}

/**
 * Get all item templates for a specific type
 * @param {string} type - Item type ('weapon', 'armor', 'consumable', etc)
 * @returns {string[]} Array of template keys
 */
export function getItemsByType(type) {
    return Object.keys(ItemTemplates).filter(key => ItemTemplates[key].type === type);
}

/**
 * Get all items available at or before a floor
 * @param {number} floor - Maximum floor number
 * @returns {string[]} Array of template keys
 */
export function getAvailableItems(floor) {
    return Object.keys(ItemTemplates).filter(key => ItemTemplates[key].minFloor <= floor);
}

export default ItemTemplates;
