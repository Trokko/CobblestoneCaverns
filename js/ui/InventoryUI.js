/**
 * InventoryUI.js - Inventory display and management UI
 * 
 * Manages the inventory panel that shows:
 * - Equipped weapon and armor
 * - Held items with quantities
 * - Item rarity colors and icons
 * - Equipment/drop interactions
 * 
 * Integrated with ItemSystem for data management
 */

import { itemSystem } from '../systems/ItemSystem.js';

class InventoryUI {
    constructor() {
        // DOM Elements
        this.panel = null;                 // Inventory panel container
        this.equipmentSlots = {
            weapon: null,                  // Equipped weapon display
            armor: null                    // Equipped armor display
        };
        this.itemsList = null;             // Items container
        this.toggleButton = null;          // Show/hide inventory button

        // State
        this.isOpen = false;
        this.player = null;
        this.currentPlayer = null;

        // Item display cache
        this.itemElements = new Map();     // itemId -> DOM element
    }

    /**
     * Initialize inventory UI
     * Finds or creates necessary DOM elements
     */
    init() {
        // Try to find existing inventory panel or create one
        this.panel = document.getElementById('inventory-panel');
        
        if (!this.panel) {
            this.createInventoryPanel();
        }

        // Cache equipment slot elements
        this.equipmentSlots.weapon = document.getElementById('equipped-weapon');
        this.equipmentSlots.armor = document.getElementById('equipped-armor');
        this.itemsList = document.getElementById('inventory-items');

        // Create toggle button if it doesn't exist
        const hudElement = document.getElementById('game-hud');
        if (hudElement && !document.getElementById('inventory-toggle')) {
            this.createToggleButton();
        }

        // Set up event listeners
        this.setupEventListeners();

        console.log('InventoryUI initialized');
    }

    /**
     * Create the inventory panel HTML structure
     * @private
     */
    createInventoryPanel() {
        const panel = document.createElement('div');
        panel.id = 'inventory-panel';
        panel.className = 'rpgui-container framed inventory-panel';
        panel.innerHTML = `
            <div class="inventory-header">
                <h3>Inventory</h3>
                <button class="inventory-close-btn" id="inventory-close">×</button>
            </div>
            
            <div class="equipment-section">
                <h4>Equipment</h4>
                <div class="equipment-slots">
                    <div class="equipment-slot weapon-slot">
                        <div class="slot-label">Weapon</div>
                        <div id="equipped-weapon" class="equipped-item">
                            <span class="empty-slot">None</span>
                        </div>
                    </div>
                    <div class="equipment-slot armor-slot">
                        <div class="slot-label">Armor</div>
                        <div id="equipped-armor" class="equipped-item">
                            <span class="empty-slot">None</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="items-section">
                <h4>Held Items</h4>
                <div id="inventory-items" class="inventory-items">
                    <div class="empty-inventory">No items yet</div>
                </div>
            </div>
            
            <div class="inventory-footer">
                <div class="inventory-gold">
                    <span class="gold-label">Gold:</span>
                    <span id="inventory-gold" class="gold-amount">0</span>
                </div>
            </div>
        `;

        // Add to HUD if it exists, otherwise to body
        const hud = document.getElementById('game-hud');
        if (hud) {
            hud.appendChild(panel);
        } else {
            document.body.appendChild(panel);
        }

        this.panel = panel;
        this.panel.style.display = 'none'; // Hidden by default
    }

    /**
     * Create toggle button for inventory
     * @private
     */
    createToggleButton() {
        const button = document.createElement('button');
        button.id = 'inventory-toggle';
        button.className = 'inventory-toggle-btn rpgui-button';
        button.innerHTML = '<p>Inventory</p>';
        button.title = 'Press I to toggle inventory';

        const hudQuickSlots = document.querySelector('.hud-quick-slots');
        if (hudQuickSlots) {
            hudQuickSlots.parentElement.insertBefore(button, hudQuickSlots);
        }

        this.toggleButton = button;
    }

    /**
     * Set up event listeners for inventory interactions
     * @private
     */
    setupEventListeners() {
        // Toggle button
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => this.toggleInventory());
        }

        // Close button
        const closeBtn = document.getElementById('inventory-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeInventory());
        }

        // Keyboard shortcut (I key)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'i' || e.key === 'I') {
                this.toggleInventory();
            }
        });

        // Item click handlers will be added dynamically in updateItems()
    }

    /**
     * Set the current player for inventory display
     * @param {Player} player - The player entity
     */
    setPlayer(player) {
        this.player = player;
        this.currentPlayer = player;
        this.updateAll();
    }

    /**
     * Update entire inventory display
     */
    updateAll() {
        if (!this.player) return;
        
        this.updateEquipmentSlots();
        this.updateItems();
        this.updateGold();
    }

    /**
     * Update equipment slot displays
     * @private
     */
    updateEquipmentSlots() {
        if (!this.player) return;

        // Weapon slot
        if (this.equipmentSlots.weapon) {
            const weapon = this.player.equippedWeapon;
            if (weapon) {
                const weaponHTML = this.createEquipmentHTML(weapon);
                this.equipmentSlots.weapon.innerHTML = weaponHTML;
                this.equipmentSlots.weapon.classList.add('has-item');
            } else {
                this.equipmentSlots.weapon.innerHTML = '<span class="empty-slot">None</span>';
                this.equipmentSlots.weapon.classList.remove('has-item');
            }
        }

        // Armor slot
        if (this.equipmentSlots.armor) {
            const armor = this.player.equippedArmor;
            if (armor) {
                const armorHTML = this.createEquipmentHTML(armor);
                this.equipmentSlots.armor.innerHTML = armorHTML;
                this.equipmentSlots.armor.classList.add('has-item');
            } else {
                this.equipmentSlots.armor.innerHTML = '<span class="empty-slot">None</span>';
                this.equipmentSlots.armor.classList.remove('has-item');
            }
        }
    }

    /**
     * Update held items list
     * @private
     */
    updateItems() {
        if (!this.itemsList || !this.player) return;

        const items = this.player.inventory || this.player.items || [];
        
        // Clear existing items
        this.itemsList.innerHTML = '';
        this.itemElements.clear();

        if (items.length === 0) {
            this.itemsList.innerHTML = '<div class="empty-inventory">No items yet</div>';
            return;
        }

        // Sort items by rarity and name
        const sortedItems = [...items].sort((a, b) => {
            const rarityOrder = { legendary: 4, epic: 3, rare: 2, uncommon: 1, common: 0 };
            const rarityDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
            if (rarityDiff !== 0) return rarityDiff;
            return a.name.localeCompare(b.name);
        });

        // Add each item
        for (const item of sortedItems) {
            const itemElement = this.createItemElement(item);
            this.itemsList.appendChild(itemElement);
            this.itemElements.set(item.id, itemElement);
        }
    }

    /**
     * Create HTML for an inventory item
     * @param {Item} item - Item to display
     * @returns {HTMLElement} Item element
     * @private
     */
    createItemElement(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = `inventory-item rarity-${item.rarity}`;
        itemDiv.id = `item-${item.id}`;

        // Build stat string
        let statsStr = '';
        if (item.stats) {
            const statParts = [];
            if (item.stats.atk) statParts.push(`+${item.stats.atk} ATK`);
            if (item.stats.def) statParts.push(`+${item.stats.def} DEF`);
            if (item.stats.crt) statParts.push(`+${item.stats.crt} CRT`);
            if (item.stats.hp) statParts.push(`+${item.stats.hp} HP`);
            if (statParts.length > 0) {
                statsStr = `<div class="item-stats">${statParts.join(', ')}</div>`;
            }
        }

        // Build HTML
        itemDiv.innerHTML = `
            <div class="item-content">
                <div class="item-header">
                    <span class="item-name">${item.getDisplayName()}</span>
                    <span class="item-rarity-badge">${item.rarity.toUpperCase()}</span>
                </div>
                <div class="item-type">${item.itemType}</div>
                ${statsStr}
                <div class="item-description">${item.description || ''}</div>
            </div>
            <div class="item-actions">
                ${item.isEquippable() ? `<button class="item-btn equip-btn" data-item-id="${item.id}">Equip</button>` : ''}
                ${item.isConsumable() && item.canUse ? `<button class="item-btn use-btn" data-item-id="${item.id}">Use</button>` : ''}
                <button class="item-btn drop-btn" data-item-id="${item.id}">Drop</button>
            </div>
        `;

        // Add event listeners
        const equipBtn = itemDiv.querySelector('.equip-btn');
        if (equipBtn) {
            equipBtn.addEventListener('click', () => this.equipItem(item));
        }

        const useBtn = itemDiv.querySelector('.use-btn');
        if (useBtn) {
            useBtn.addEventListener('click', () => this.useItem(item));
        }

        const dropBtn = itemDiv.querySelector('.drop-btn');
        if (dropBtn) {
            dropBtn.addEventListener('click', () => this.dropItem(item));
        }

        return itemDiv;
    }

    /**
     * Create HTML for equipped item display
     * @param {Item} item - Item to display
     * @returns {string} HTML string
     * @private
     */
    createEquipmentHTML(item) {
        if (!item) return '<span class="empty-slot">None</span>';

        let statsStr = '';
        if (item.stats) {
            const statParts = [];
            if (item.stats.atk) statParts.push(`+${item.stats.atk} ATK`);
            if (item.stats.def) statParts.push(`+${item.stats.def} DEF`);
            if (item.stats.crt) statParts.push(`+${item.stats.crt} CRT`);
            if (item.stats.hp) statParts.push(`+${item.stats.hp} HP`);
            if (statParts.length > 0) {
                statsStr = `<div class="equipment-stats">${statParts.join(' • ')}</div>`;
            }
        }

        return `
            <div class="equipment-item-content rarity-${item.rarity}">
                <div class="equipment-name">${item.name}</div>
                ${statsStr}
            </div>
        `;
    }

    /**
     * Update gold display
     * @private
     */
    updateGold() {
        if (!this.player) return;

        const goldElement = document.getElementById('inventory-gold');
        if (goldElement) {
            goldElement.textContent = this.player.gold || 0;
        }
    }

    /**
     * Handle equip button click
     * @param {Item} item - Item to equip
     */
    equipItem(item) {
        if (!this.player || !item) return;

        if (!item.isEquippable()) {
            console.warn('Cannot equip non-equippable item');
            return;
        }

        // Use ItemSystem to equip
        itemSystem.equipItem(item, this.player);

        // Update displays
        this.updateEquipmentSlots();
        
        // Update HUD stats
        if (window.hudManager) {
            window.hudManager.updateStats();
        }

        console.log(`Equipped: ${item.name}`);
    }

    /**
     * Handle use button click (consumable)
     * @param {Item} item - Item to use
     */
    useItem(item) {
        if (!this.player || !item) return;

        if (!item.isConsumable()) {
            console.warn('Cannot use non-consumable item');
            return;
        }

        // Use ItemSystem to consume
        const result = itemSystem.useItem(item, this.player);

        if (result) {
            // Update displays
            this.updateItems();
            
            // Update HUD
            if (window.hudManager) {
                window.hudManager.updateHP();
            }

            console.log(`You used: ${item.name}`);
        }
    }

    /**
     * Handle drop button click
     * @param {Item} item - Item to drop
     */
    dropItem(item) {
        if (!this.player || !item) return;

        // Use ItemSystem to drop
        const result = itemSystem.dropItem(item, this.player, window.gameManager?.dungeon);

        if (result) {
            // Update inventory display
            this.updateItems();
            console.log(`Dropped: ${item.name}`);
        } else {
            console.warn('Could not drop item');
        }
    }

    /**
     * Toggle inventory visibility
     */
    toggleInventory() {
        if (this.isOpen) {
            this.closeInventory();
        } else {
            this.openInventory();
        }
    }

    /**
     * Open inventory panel
     */
    openInventory() {
        if (!this.panel) return;
        
        this.updateAll(); // Refresh data before showing
        this.panel.style.display = 'block';
        this.isOpen = true;
        
        if (this.toggleButton) {
            this.toggleButton.classList.add('active');
        }
    }

    /**
     * Close inventory panel
     */
    closeInventory() {
        if (!this.panel) return;
        
        this.panel.style.display = 'none';
        this.isOpen = false;
        
        if (this.toggleButton) {
            this.toggleButton.classList.remove('active');
        }
    }

    /**
     * Refresh inventory display (called when items change)
     */
    refresh() {
        if (this.isOpen) {
            this.updateAll();
        }
    }

    /**
     * Show floating pickup notification (optional)
     * @param {string} itemName - Name of picked up item
     */
    showPickupNotification(itemName) {
        // This will be called by GameManager when items are picked up
        if (this.isOpen) {
            // If inventory is open, refresh it
            this.updateItems();
        }
    }
}

// Create singleton instance
const inventoryUI = new InventoryUI();
export { inventoryUI };
export default InventoryUI;
