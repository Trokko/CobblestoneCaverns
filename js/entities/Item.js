/**
 * Item.js - Föremål som kan plockas upp och användas
 * 
 * Representerar alla slags items i spelet:
 * - Utrustning (svärd, rustning)
 * - Förbrukningsartiklar (läkningsjonrar, buff-elixir)
 * - Trophies (för loot/samlande)
 * 
 * Items spawnas från fiendedöd och kan hittas på golvet
 */

class Item {
    constructor(config) {
        this.id = config.id || `item_${Date.now()}`;
        this.name = config.name || 'Unknown Item';
        this.itemType = config.type || 'consumable'; // 'weapon', 'armor', 'consumable', 'quest'
        this.type = 'item'; // For dungeon entity system
        this.rarity = config.rarity || 'common'; // 'common', 'uncommon', 'rare', 'epic', 'legendary'
        
        // Visual
        this.sprite = config.sprite || 'default_item';
        this.color = config.color || '#FFD700';
        this.description = config.description || '';
        
        // Stats
        this.stats = config.stats || {}; // { atk: 5, def: 2, hp: 10, etc }
        
        // Effects
        this.canUse = config.canUse || false; // Can be used from inventory
        this.useEffect = config.useEffect || null; // Function to call when used
        this.quantity = config.quantity || 1; // For stackable items
        
        // Rarity color mapping for visual feedback
        this.rarityColors = {
            common: '#CCCCCC',
            uncommon: '#00FF00',
            rare: '#0099FF',
            epic: '#9933FF',
            legendary: '#FF6600'
        };
        
        // Position in world (if dropped)
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.onFloor = config.onFloor !== undefined ? config.onFloor : true;
        
        // Instance data
        this.createdAt = Date.now();
        this.pickedUp = false;
        this.owner = null; // Reference to player if in inventory
    }

    /**
     * Get visual color based on rarity
     */
    getColor() {
        return this.rarityColors[this.rarity] || this.color;
    }

    /**
     * Get formatted name with rarity prefix
     */
    getDisplayName() {
        const rarityMap = {
            common: '',
            uncommon: '[U] ',
            rare: '[R] ',
            epic: '[E] ',
            legendary: '[L] '
        };
        return (rarityMap[this.rarity] || '') + this.name;
    }

    /**
     * Check if this item can be equipped
     */
    isEquippable() {
        return this.itemType === 'weapon' || this.itemType === 'armor';
    }

    /**
     * Check if this item is consumable
     */
    isConsumable() {
        return this.itemType === 'consumable';
    }

    /**
     * Apply item effects to a target (player)
     * @param {Player} target - The player using this item
     */
    applyEffect(target) {
        if (!target) return false;

        // Apply stat bonuses
        if (this.stats && this.itemType === 'weapon') {
            console.log(`Equipped ${this.name}: +${this.stats.atk || 0} ATK`);
            // Actual equipment is handled by Player.equipItem()
        }

        // Execute custom use effect
        if (this.useEffect && typeof this.useEffect === 'function') {
            this.useEffect(target);
            return true;
        }

        return false;
    }

    /**
     * Serialize for saving
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.itemType,
            rarity: this.rarity,
            sprite: this.sprite,
            stats: this.stats,
            quantity: this.quantity,
            x: this.x,
            y: this.y,
            onFloor: this.onFloor,
            pickedUp: this.pickedUp
        };
    }

    /**
     * Restore from saved data
     */
    static fromJSON(data) {
        return new Item(data);
    }

    /**
     * Get comparison value for sorting (rarity, then name)
     */
    getSortValue() {
        const rarityValues = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
        return (rarityValues[this.rarity] || 0) * 1000 + this.name.charCodeAt(0);
    }
}

export default Item;
