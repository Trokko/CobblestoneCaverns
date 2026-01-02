/**
 * ItemSystem.js - Manages item drops, pickups, and inventory
 * 
 * Handles all item-related mechanics:
 * - Spawning loot when enemies die
 * - Picking up items from floor
 * - Equipment/unequipment
 * - Item usage (consumables)
 * - Inventory management
 */

import { generateLoot, getItemTemplate } from '../data/ItemTemplates.js';

class ItemSystem {
    constructor() {
        if (ItemSystem.instance) {
            return ItemSystem.instance;
        }
        ItemSystem.instance = this;

        this.floorItems = {}; // Map of floor -> array of items on ground
        this.itemLog = [];    // History of item events
    }

    /**
     * Generate loot when enemy dies
     * @param {Enemy} enemy - The defeated enemy
     * @param {number} floor - Current dungeon floor
     * @returns {Item[]} Array of dropped items
     */
    generateEnemyLoot(enemy, floor) {
        const drops = [];

        // Some enemies always drop basic loot
        if (enemy && enemy.experienceReward) {
            // Chance for weapon drop
            if (Math.random() < 0.15) {
                const weaponTypes = ['iron_sword', 'steel_sword', 'golden_sword', 'dark_dagger'];
                const validWeapons = weaponTypes.filter(w => {
                    const template = this.getTemplate(w);
                    return template.minFloor <= floor;
                });
                if (validWeapons.length > 0) {
                    const randomWeapon = validWeapons[Math.floor(Math.random() * validWeapons.length)];
                    drops.push(getItemTemplate(randomWeapon));
                }
            }

            // Chance for armor drop
            if (Math.random() < 0.10) {
                const armorTypes = ['leather_armor', 'chain_mail', 'plate_armor', 'mithril_plate'];
                const validArmor = armorTypes.filter(a => {
                    const template = this.getTemplate(a);
                    return template.minFloor <= floor;
                });
                if (validArmor.length > 0) {
                    const randomArmor = validArmor[Math.floor(Math.random() * validArmor.length)];
                    drops.push(getItemTemplate(randomArmor));
                }
            }

            // Chance for consumable drop
            if (Math.random() < 0.30) {
                const consumableTypes = ['health_potion', 'greater_health_potion', 'strength_elixir'];
                const validConsumables = consumableTypes.filter(c => {
                    const template = this.getTemplate(c);
                    return template.minFloor <= floor;
                });
                if (validConsumables.length > 0) {
                    const randomConsumable = validConsumables[Math.floor(Math.random() * validConsumables.length)];
                    drops.push(getItemTemplate(randomConsumable));
                }
            }

            // Always drop some gold
            const goldAmount = Math.floor(Math.random() * 10 + 5); // 5-15 gold
            this.itemLog.push({
                timestamp: Date.now(),
                type: 'gold_drop',
                amount: goldAmount,
                from: enemy.name
            });
        }

        return drops;
    }

    /**
     * Spawn items on the floor at specific location
     * @param {Item[]} items - Items to spawn
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Dungeon} dungeon - The dungeon to add items to
     */
    spawnItemsOnFloor(items, x, y, dungeon) {
        if (!items || items.length === 0) {
            return;
        }

        if (!dungeon) {
            console.warn('No dungeon provided for item spawning');
            return;
        }

        for (const item of items) {
            // Position item near the drop location (scatter for visibility)
            const offsetX = Math.floor(Math.random() * 3 - 1); // -1, 0, 1
            const offsetY = Math.floor(Math.random() * 3 - 1);
            item.x = x + offsetX;
            item.y = y + offsetY;
            item.onFloor = true;

            // Clamp to dungeon bounds
            item.x = Math.max(0, Math.min(item.x, dungeon.width - 1));
            item.y = Math.max(0, Math.min(item.y, dungeon.height - 1));

            // Add to dungeon entities
            if (dungeon.addEntity) {
                dungeon.addEntity(item);
            }

            this.itemLog.push({
                timestamp: Date.now(),
                type: 'item_dropped',
                item: item.name,
                x: item.x,
                y: item.y
            });
        }
    }

    /**
     * Pick up item from floor
     * @param {Item} item - Item to pick up
     * @param {Player} player - Player picking up item
     * @returns {boolean} Success
     */
    pickupItem(item, player) {
        if (!item || !player) {
            return false;
        }

        if (!item.onFloor) {
            console.warn('Item is not on floor');
            return false;
        }

        // Check inventory space (if implemented)
        if (player.inventory && player.inventory.isFull && player.inventory.isFull()) {
            console.warn('Inventory is full!');
            return false;
        }

        // Add to inventory
        if (player.inventory && player.inventory.addItem) {
            player.inventory.addItem(item);
        } else if (player.items) {
            player.items.push(item);
        }

        item.onFloor = false;
        item.pickedUp = true;
        item.owner = player;

        this.itemLog.push({
            timestamp: Date.now(),
            type: 'item_picked_up',
            item: item.name,
            player: player.name
        });

        return true;
    }

    /**
     * Equip item on player
     * @param {Item} item - Item to equip
     * @param {Player} player - Player equipping item
     * @returns {boolean} Success
     */
    equipItem(item, player) {
        if (!item || !player) {
            return false;
        }

        if (!item.isEquippable()) {
            console.warn(`${item.name} cannot be equipped`);
            return false;
        }

        let unequippedItem = null;

        if (item.type === 'weapon') {
            // Unequip current weapon
            if (player.equippedWeapon) {
                unequippedItem = player.equippedWeapon;
                // Return weapon to inventory if exists
            }
            player.equippedWeapon = item;
            if (player.updateCombatStats) {
                player.updateCombatStats();
            }
        } else if (item.type === 'armor') {
            // Unequip current armor
            if (player.equippedArmor) {
                unequippedItem = player.equippedArmor;
                // Return armor to inventory if exists
            }
            player.equippedArmor = item;
            if (player.updateCombatStats) {
                player.updateCombatStats();
            }
        }

        this.itemLog.push({
            timestamp: Date.now(),
            type: 'item_equipped',
            item: item.name,
            player: player.name,
            unequipped: unequippedItem ? unequippedItem.name : null
        });

        return true;
    }

    /**
     * Use a consumable item
     * @param {Item} item - Consumable to use
     * @param {Player} player - Player using item
     * @returns {boolean} Success
     */
    useItem(item, player) {
        if (!item || !player) {
            return false;
        }

        if (!item.isConsumable()) {
            console.warn(`${item.name} cannot be used as consumable`);
            return false;
        }

        if (!item.canUse) {
            console.warn(`${item.name} cannot be used`);
            return false;
        }

        // Apply effect
        if (item.useEffect) {
            item.useEffect(player);
        }

        this.itemLog.push({
            timestamp: Date.now(),
            type: 'item_used',
            item: item.name,
            player: player.name
        });

        // Remove from inventory
        if (player.inventory && player.inventory.removeItem) {
            player.inventory.removeItem(item);
        } else if (player.items) {
            const index = player.items.indexOf(item);
            if (index > -1) {
                player.items.splice(index, 1);
            }
        }

        return true;
    }

    /**
     * Drop item from inventory
     * @param {Item} item - Item to drop
     * @param {Player} player - Player dropping item
     * @param {Dungeon} dungeon - Current dungeon
     * @returns {boolean} Success
     */
    dropItem(item, player, dungeon) {
        if (!item || !player || !dungeon) {
            return false;
        }

        if (item.onFloor) {
            console.warn('Item is already on floor');
            return false;
        }

        // Remove from inventory
        if (player.inventory && player.inventory.removeItem) {
            player.inventory.removeItem(item);
        } else if (player.items) {
            const index = player.items.indexOf(item);
            if (index > -1) {
                player.items.splice(index, 1);
            }
        }

        // Place on floor at player location
        item.x = player.x;
        item.y = player.y;
        item.onFloor = true;
        item.owner = null;

        // Add to dungeon
        if (dungeon.addEntity) {
            dungeon.addEntity(item);
        }

        this.itemLog.push({
            timestamp: Date.now(),
            type: 'item_dropped',
            item: item.name,
            x: item.x,
            y: item.y,
            player: player.name
        });

        return true;
    }

    /**
     * Get item template by key (helper)
     * @private
     */
    getTemplate(key) {
        return getItemTemplate(key);
    }

    /**
     * Get recent item events
     * @param {number} count - How many recent events to return
     * @returns {Array} Recent item log entries
     */
    getItemLog(count = 10) {
        return this.itemLog.slice(-count);
    }

    /**
     * Clear item log
     */
    clearLog() {
        this.itemLog = [];
    }

    /**
     * Serialize state for saving
     */
    toJSON() {
        return {
            itemLog: this.itemLog
        };
    }

    /**
     * Restore from saved state
     */
    fromJSON(data) {
        if (data && data.itemLog) {
            this.itemLog = data.itemLog;
        }
    }
}

// Create singleton instance
const itemSystem = new ItemSystem();
export { itemSystem };
export default ItemSystem;
