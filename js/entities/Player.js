/**
 * Player.js - Spelarkaraktären
 * 
 * Representerar spelaren med allt som behövs:
 * - Stats (HP, ATK, DEF, CRT)
 * - Levling och XP-progression
 * - Inventory och equipment
 * - Combat-beräkningar
 * - Achievements och statistik
 * 
 * Detta är spelarens hjärta - alla egenskaper och förmågor!
 */

import { getClassTemplate, calculateXPForNextLevel } from '../data/ClassTemplates.js';
import Item from './Item.js';
import { CONFIG } from '../config.js';

export class Player {
    constructor(classKey) {
        // Hämta klassen template (Warrior, Rogue, Barbarian)
        const template = getClassTemplate(classKey);
        if (!template) {
            throw new Error(`Invalid class key: ${classKey}`);
        }
        
        // Grundinformation
        this.classKey = classKey;
        this.className = template.name;
        this.name = template.name; // For combat log
        this.sprite = template.sprite;
        
        // Kopiera bas-stats från templaten
        this.maxHP = template.baseStats.maxHP;
        this.currentHP = template.baseStats.currentHP;
        this.baseATK = template.baseStats.baseATK;
        this.baseDEF = template.baseStats.baseDEF;
        this.baseCRT = template.baseStats.baseCRT;
        this.level = template.baseStats.level;
        this.xp = template.baseStats.xp;
        this.xpToNextLevel = template.baseStats.xpToNextLevel;
        this.gold = template.baseStats.gold;
        
        // Store stat growth for leveling
        this.statGrowth = { ...template.statGrowth };
        
        // Equipment slots (deep copy to avoid reference issues)
        this.equipment = {
            weapon: template.startingEquipment.weapon ? { ...template.startingEquipment.weapon } : null,
            armor: template.startingEquipment.armor ? { ...template.startingEquipment.armor } : null,
            accessory: template.startingEquipment.accessory ? { ...template.startingEquipment.accessory } : null
        };
        
        // Inventory (deep copy with quantity support)
        this.inventory = template.startingInventory.map(itemConfig => new Item(itemConfig));
        
        // Combat stats (calculated from base + equipment)
        this.updateCombatStats();
        
        // Position in dungeon (grid-based)
        this.x = 0;
        this.y = 0;
        this.floor = 1;
        
        // Achievement tracking
        this.achievements = [];
        this.stats = {
            monstersKilled: 0,
            bossesKilled: 0,
            floorsCleared: 0,
            goldCollected: 0,
            itemsCollected: 0,
            deathCount: 0
        };
    }
    
    /**
     * Uppdaterar combat stats baserat på bas-stats och utrustning
     * 
     * Summerar bonusar från vapen, rustning och accessoar.
     * Anropas automatiskt när utrustning byts!
     */
    updateCombatStats() {
        let bonusATK = 0; // Attack-bonus från utrustning
        let bonusDEF = 0; // Försvars-bonus
        let bonusCRT = 0; // Kritisk träff-bonus
        
        // Sum equipment bonuses
        if (this.equipment.weapon) {
            bonusATK += this.equipment.weapon.atk || 0;
            bonusDEF += this.equipment.weapon.def || 0;
            bonusCRT += this.equipment.weapon.crt || 0;
        }
        if (this.equipment.armor) {
            bonusATK += this.equipment.armor.atk || 0;
            bonusDEF += this.equipment.armor.def || 0;
            bonusCRT += this.equipment.armor.crt || 0;
        }
        if (this.equipment.accessory) {
            bonusATK += this.equipment.accessory.atk || 0;
            bonusDEF += this.equipment.accessory.def || 0;
            bonusCRT += this.equipment.accessory.crt || 0;
        }
        
        // Calculate final combat stats
        this.totalATK = this.baseATK + bonusATK;
        this.totalDEF = this.baseDEF + bonusDEF;
        this.totalCRT = this.baseCRT + bonusCRT;
    }
    
    /**
     * Add experience points and handle leveling up
     * @param {number} amount - XP to add
     * @returns {boolean} True if leveled up
     */
    addXP(amount) {
        this.xp += amount;
        
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
            return true;
        }
        return false;
    }
    
    /**
     * Levlar upp spelaren och ökar stats
     * 
     * Händer när XP når tröskeln! Spelaren:
     * - Får bättre stats (enligt klassens statGrowth)
     * - Healas till full HP
     * - Behöver mer XP till nästa level (exponentiell kurva)
     * 
     * Level ups är belönande - spelaren blir märkbart starkare!
     */
    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        
        // Increase base stats
        this.maxHP += Math.floor(this.statGrowth.maxHP);
        this.baseATK += Math.floor(this.statGrowth.baseATK);
        this.baseDEF += Math.floor(this.statGrowth.baseDEF);
        this.baseCRT += Math.floor(this.statGrowth.baseCRT * 10) / 10; // Keep one decimal
        
        // Heal to full on level up
        this.currentHP = this.maxHP;
        
        // Update XP requirement for next level
        this.xpToNextLevel = calculateXPForNextLevel(this.level);
        
        // Recalculate combat stats
        this.updateCombatStats();
        
        console.log(`Level up! Now level ${this.level}`);
    }
    
    /**
     * Ta skada och hantera död
     * @param {number} damage - Skademängd
     * @returns {boolean} - Sant om spelaren dog
     * 
     * Defense minskar skadan (max 75% reduktion).
     * Formeln: actualDamage = damage * (1 - DEF/(DEF+100))
     * Detta ger diminishing returns - DEF är bra men inte OP!
     */
    takeDamage(damage) {
        // Beräkna defense-reduktion (max 75%)
        const damageReduction = Math.min(this.totalDEF / (this.totalDEF + 100), 0.75);
        const actualDamage = Math.max(1, Math.floor(damage * (1 - damageReduction)));
        
        this.currentHP = Math.max(0, this.currentHP - actualDamage);
        
        if (this.currentHP === 0) {
            this.stats.deathCount++;
            return true; // Player died
        }
        return false;
    }
    
    /**
     * Heala spelaren
     * @param {number} amount - Heal-mängd
     * @returns {number} - Faktisk mängd healad
     * 
     * Kan inte heala över max HP (ingen överhealing).
     * Returnerar faktisk heal för att visa i UI.
     */
    heal(amount) {
        const oldHP = this.currentHP;
        this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
        return this.currentHP - oldHP;
    }
    
    /**
     * Beräknar attack (innan fiendens försvar)
     * @returns {Object} - Attack-resultat med skada och isCritical flagga
     * 
     * Kritisk träff multiplicerar skadan enligt CONFIG.CRITICAL_MULTIPLIER!
     * CRT-stat är chans i procent (10 CRT = 10% crit chance).
     */
    calculateAttack() {
        const isCritical = Math.random() * 100 < this.totalCRT;
        const baseDamage = this.totalATK;
        const damageMultiplier = isCritical ? CONFIG.CRITICAL_MULTIPLIER : 1;
        const damage = Math.max(1, Math.floor(baseDamage * damageMultiplier));
        
        return { damage, isCritical };
    }
    
    /**
     * Lägg till föremål i inventory
     * @param {Object} item - Föremålet att lägga till
     * @returns {boolean} - Sant om det lyckades
     * 
     * Stackbara items (potions etc) läggs ihop.
     * Unika items får var sin plats.
     */
    addItem(item) {
        // Kolla om föremålet redan finns (för stackbara items)
        const existingItem = this.inventory.find(i => i.id === item.id);
        
        if (existingItem && item.quantity !== undefined) {
            existingItem.quantity += item.quantity;
        } else {
            this.inventory.push({ ...item });
        }
        
        this.stats.itemsCollected++;
        return true;
    }
    
    /**
     * Remove item from inventory
     * @param {string} itemId - ID of item to remove
     * @param {number} quantity - Amount to remove (default 1)
     * @returns {boolean} True if removed successfully
     */
    removeItem(itemId, quantity = 1) {
        const itemIndex = this.inventory.findIndex(i => i.id === itemId);
        
        if (itemIndex === -1) return false;
        
        const item = this.inventory[itemIndex];
        
        if (item.quantity !== undefined) {
            item.quantity -= quantity;
            if (item.quantity <= 0) {
                this.inventory.splice(itemIndex, 1);
            }
        } else {
            this.inventory.splice(itemIndex, 1);
        }
        
        return true;
    }
    
    /**
     * Använd ett consumable item
     * @param {string} itemId - ID på föremålet
     * @returns {Object|null} - Effekt-resultat eller null om misslyckades
     * 
     * Olika effekter:
     * - heal: Återställer HP
     * - escape: Teleporterar bort från strid
     * 
     * Föremålet tas bort från inventory efter användning!
     */
    useItem(itemId) {
        const item = this.inventory.find(i => i.id === itemId);
        
        if (!item || item.type !== 'consumable') return null;
        
        let result = null;
        
        switch (item.effect) {
            case 'heal':
                const healed = this.heal(item.value);
                result = { type: 'heal', amount: healed };
                break;
            case 'escape':
                result = { type: 'escape' };
                break;
            default:
                return null;
        }
        
        // Remove one from inventory
        this.removeItem(itemId, 1);
        
        return result;
    }
    
    /**
     * Ta på utrustning från inventory
     * @param {string} itemId - ID på föremålet
     * @returns {boolean} - Sant om det lyckades
     * 
     * Om något redan är utrstat i den sloten läggs det
     * tillbaka i inventory. Uppdaterar combat stats automatiskt!
     */
    equipItem(itemId) {
        const itemIndex = this.inventory.findIndex(i => i.id === itemId);
        
        if (itemIndex === -1) return false;
        
        const item = this.inventory[itemIndex];
        const slot = item.type;
        
        // Check if it's an equippable type
        if (!['weapon', 'armor', 'accessory'].includes(slot)) return false;
        
        // Unequip current item in that slot
        if (this.equipment[slot]) {
            this.inventory.push({ ...this.equipment[slot] });
        }
        
        // Equip new item
        this.equipment[slot] = { ...item };
        this.inventory.splice(itemIndex, 1);
        
        // Recalculate combat stats
        this.updateCombatStats();
        
        return true;
    }
    
    /**
     * Unequip an item
     * @param {string} slot - Equipment slot (weapon, armor, accessory)
     * @returns {boolean} True if unequipped successfully
     */
    unequipItem(slot) {
        if (!this.equipment[slot]) return false;
        
        // Add to inventory
        this.inventory.push({ ...this.equipment[slot] });
        this.equipment[slot] = null;
        
        // Recalculate combat stats
        this.updateCombatStats();
        
        return true;
    }
    
    /**
     * Add gold
     * @param {number} amount - Gold to add
     */
    addGold(amount) {
        this.gold += amount;
        this.stats.goldCollected += amount;
    }
    
    /**
     * Remove gold
     * @param {number} amount - Gold to remove
     * @returns {boolean} True if had enough gold
     */
    removeGold(amount) {
        if (this.gold < amount) return false;
        this.gold -= amount;
        return true;
    }
    
    /**
     * Serialisera spelardata för sparfunktion
     * @returns {Object} - Serialiserad spelardata
     * 
     * Packar ihop all viktig data så den kan sparas till Firebase.
     * Allt spelaren äger och är bevaras!
     */
    toJSON() {
        return {
            classKey: this.classKey,
            className: this.className,
            sprite: this.sprite,
            maxHP: this.maxHP,
            currentHP: this.currentHP,
            baseATK: this.baseATK,
            baseDEF: this.baseDEF,
            baseCRT: this.baseCRT,
            level: this.level,
            xp: this.xp,
            xpToNextLevel: this.xpToNextLevel,
            gold: this.gold,
            statGrowth: this.statGrowth,
            equipment: this.equipment,
            inventory: this.inventory,
            x: this.x,
            y: this.y,
            floor: this.floor,
            achievements: this.achievements,
            stats: this.stats
        };
    }
    
    /**
     * Load player data from saved object
     * @param {Object} data - Saved player data
     * @returns {Player} Loaded player instance
     */
    static fromJSON(data) {
        const player = new Player(data.classKey);
        
        // Restore all properties
        Object.assign(player, data);
        
        // Recalculate combat stats
        player.updateCombatStats();
        
        return player;
    }
}
