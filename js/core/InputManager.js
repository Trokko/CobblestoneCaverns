/**
 * InputManager.js - Input-hanteraren
 * 
 * Lyssnar på och hanterar all input från spelaren:
 * - Tangentbord (WASD, piltangenter, hotkeys)
 * - Touch-gester (swipe för mobil)
 * - Mus-klick
 * 
 * Översätter rå input till game actions som andra system förstår!
 * Tänk på den som spelets "öron och ögon" för spelarinput.
 */

import { gameState } from './GameStateManager.js';

class InputManager {
    constructor() {
        this.keyState = {};  // Håller koll på vilka tangenter som är nertryckta
        this.touchState = {  // Touch/swipe state för mobil
            isTouch: false,
            startX: 0,
            startY: 0
        };        
        // Ability selection state
        this.selectedAbility = null;      // Currently selected ability ID
        this.isSelectingTarget = false;   // Are we waiting for a target?
        this.targetingMode = null;        // Type of targeting ('single', 'aoe')
                // Key bindings - vilka tangenter gör vad
        this.keyBindings = {
            // Movement
            'w': 'move-up',
            'ArrowUp': 'move-up',
            's': 'move-down',
            'ArrowDown': 'move-down',
            'ArrowLeft': 'move-left',
            'ArrowRight': 'move-right',
            
            // Actions
            ' ': 'wait',
            'e': 'interact',
            'Enter': 'confirm',
            'Escape': 'cancel',
            
            // Inventory & Stats
            'i': 'inventory',
            'c': 'character',
            
            // Abilities (A, B, C, D keys)
            'a': 'ability-0',
            'b': 'ability-1',
            'c': 'ability-2',
            'd': 'ability-3',
            
            // Quick slots
            '1': 'quickslot-1',
            '2': 'quickslot-2',
            '3': 'quickslot-3',
            '4': 'quickslot-4'
        };
        this.enabled = true;
    }

    /**
     * Initialize input manager
     */
    init() {
        this.setupKeyboardListeners();
        this.setupTouchListeners();
        this.setupMouseListeners();
        
        console.log('Input Manager initialized');
    }

    /**
     * Set up keyboard event listeners
     */
    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    /**
     * Set up touch event listeners
     */
    setupTouchListeners() {
        const gameCanvas = document.getElementById('game-canvas');
        if (!gameCanvas) return;

        gameCanvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        gameCanvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        gameCanvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    }

    /**
     * Set up mouse event listeners
     */
    setupMouseListeners() {
        const gameCanvas = document.getElementById('game-canvas');
        if (!gameCanvas) return;

        gameCanvas.addEventListener('click', (e) => this.handleMouseClick(e));
    }

    /**
     * Handle key down event
     * @param {KeyboardEvent} event
     */
    handleKeyDown(event) {
        if (!this.enabled) return;

        const key = event.key;
        this.keyState[key] = true;

        const action = this.keyBindings[key];
        if (action) {
            event.preventDefault();
            this.processAction(action);
        }
    }

    /**
     * Handle key up event
     * @param {KeyboardEvent} event
     */
    handleKeyUp(event) {
        const key = event.key;
        this.keyState[key] = false;
    }

    /**
     * Hanterar touch start
     * @param {TouchEvent} event
     * 
     * När spelaren börjar röra skärmen sparar vi startpositionen.
     */
    handleTouchStart(event) {
        if (!this.enabled) return;
        event.preventDefault();

        this.touchState.isTouch = true;
        const touch = event.touches[0];
        this.touchState.startX = touch.clientX;
        this.touchState.startY = touch.clientY;
    }

    /**
     * Handle touch move
     * @param {TouchEvent} event
     */
    handleTouchMove(event) {
        if (!this.enabled || !this.touchState.isTouch) return;
        event.preventDefault();
    }

    /**
     * Hanterar touch end - detekterar swipe-riktning
     * @param {TouchEvent} event
     * 
     * När spelaren släpper kollar vi hur långt de swipeat.
     * Swipe upp/ner/vänster/höger = rörelse!
     * Kort tap = wait/interact.
     */
    handleTouchEnd(event) {
        if (!this.enabled || !this.touchState.isTouch) return;
        event.preventDefault();

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - this.touchState.startX;
        const deltaY = touch.clientY - this.touchState.startY;
        
        const minSwipeDistance = 30;

        if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
            // Determine direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    this.processAction('move-right');
                } else {
                    this.processAction('move-left');
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    this.processAction('move-down');
                } else {
                    this.processAction('move-up');
                }
            }
        } else {
            // Tap - wait/interact
            this.processAction('wait');
        }

        this.touchState.isTouch = false;
    }

    /**
     * Handle mouse click on canvas
     * @param {MouseEvent} event
     */
    handleMouseClick(event) {
        if (!this.enabled) return;

        const canvas = event.target;
        const rect = canvas.getBoundingClientRect();
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;

        // Convert screen coordinates to tile coordinates
        const tileSize = 32; // Assuming 32x32 tiles
        const tileX = Math.floor(screenX / tileSize);
        const tileY = Math.floor(screenY / tileSize);

        // If we're in ability targeting mode, target that ability
        if (this.isSelectingTarget && this.selectedAbility) {
            this.targetAbility(tileX, tileY);
        } else {
            // Otherwise, just log the click
            console.log(`Mouse click at tile (${tileX}, ${tileY})`);
        }
    }

    /**
     * Behandlar en input-action
     * @param {string} action - Action-namn (t.ex. 'move-up', 'inventory')
     * 
     * Central switch-sats som skickar actions vidare till rätt handler.
     * All input hamnar här - det är knutpunkten!
     */
    processAction(action) {
        // Tillåt bara pause när spelet är pausat
        if (gameState.isPaused && action !== 'pause' && action !== 'cancel') return;

        console.log(`Action: ${action}`);

        switch (action) {
            case 'move-up':
                this.handleMovement(0, -1);
                break;
            case 'move-down':
                this.handleMovement(0, 1);
                break;
            case 'move-left':
                this.handleMovement(-1, 0);
                break;
            case 'move-right':
                this.handleMovement(1, 0);
                break;
            case 'wait':
                gameState.processTurn();
                break;
            case 'interact':
                this.handleInteract();
                break;
            case 'confirm':
                this.handleConfirm();
                break;
            case 'cancel':
                this.handleCancel();
                break;
            case 'pause':
                gameState.togglePause();
                break;
            case 'inventory':
                this.toggleInventory();
                break;
            case 'character':
                this.toggleCharacterScreen();
                break;
            case 'ability-0':
            case 'ability-1':
            case 'ability-2':
            case 'ability-3':
                const abilityIndex = parseInt(action.split('-')[1]);
                this.selectAbilityByIndex(abilityIndex);
                break;
            case 'quickslot-1':
                this.useQuickSlot(0);
                break;
            case 'quickslot-2':
                this.useQuickSlot(1);
                break;
            default:
                console.warn(`Unhandled action: ${action}`);
        }
    }
    
    /**
     * Använd item från quick slot
     * @param {number} slotIndex - Quick slot index (0 eller 1)
     * 
     * Quick slots är genvägar till ofta använda items.
     * Tryck 1 eller 2 för att snabbt använda potions mitt i strid!
     */
    useQuickSlot(slotIndex) {
        if (!window.hudManager) return;
        
        const item = window.hudManager.getQuickSlot(slotIndex);
        if (item && gameState.player) {
            // Queue action to use item
            gameState.queueAction('useItem', { itemId: item.id });
            gameState.processTurn();
        } else {
            console.log(`Quick slot ${slotIndex + 1} is empty`);
        }
    }

    /**
     * Hanterar spelarens rörelse
     * @param {number} dx - Förändring i X (-1, 0, eller 1)
     * @param {number} dy - Förändring i Y (-1, 0, eller 1)
     * 
     * Skickar vidare rörelskommandot till GameManager som
     * kollar kollisioner och uppdaterar spelarens position.
     */
    handleMovement(dx, dy) {
        if (window.gameManager) {
            window.gameManager.movePlayer(dx, dy);
        } else {
            console.warn('GameManager not available');
        }
    }

    /**
     * Handle wait action
     */
    handleWait() {
        // Will be implemented with turn system
        console.log('Wait');
    }

    /**
     * Handle interact action
     */
    handleInteract() {
        // Will be implemented with entities
        console.log('Interact');
    }

    /**
     * Handle pause/unpause
     */
    handlePause() {
        if (gameState.isPaused) {
            gameState.resumeGame();
        } else {
            gameState.pauseGame();
        }
    }

    /**
     * Handle inventory toggle
     */
    handleInventory() {
        console.log('Toggle inventory');
    }

    /**
     * Handle character screen toggle
     */
    handleCharacter() {
        console.log('Toggle character screen');
    }

    /**
     * Handle quick slot activation
     * @param {number} slot - Slot number (1-4)
     */
    handleQuickSlot(slot) {
        console.log(`Activate quick slot ${slot}`);
    }

    /**
     * Select an ability by index (A/B/C/D keys)
     * @param {number} abilityIndex - Index of ability (0-3)
     */
    selectAbilityByIndex(abilityIndex) {
        if (!gameState.player || !window.abilitySystem) {
            console.warn('Cannot select ability: player or abilitySystem not available');
            return;
        }

        // Get abilities for player's class
        const abilities = window.abilitySystem.getAbilitiesForClass(gameState.player.classKey);
        if (abilityIndex >= abilities.length) {
            console.warn(`Ability index ${abilityIndex} out of range`);
            return;
        }

        const ability = abilities[abilityIndex];
        const playerId = gameState.player.id || 'player';

        // Check if ability is on cooldown
        if (!window.abilitySystem.isAbilityReady(playerId, ability.id)) {
            const remaining = window.abilitySystem.getCooldownRemaining(playerId, ability.id);
            console.log(`${ability.name} is on cooldown (${remaining} turns remaining)`);
            if (window.hudManager) {
                window.hudManager.showFloatingText(`${ability.name} on cooldown!`, 'error');
            }
            return;
        }

        // Select the ability
        this.selectedAbility = ability.id;
        this.isSelectingTarget = true;
        this.targetingMode = ability.radius > 0 ? 'aoe' : 'single';

        // Update HUD
        if (window.hudManager) {
            window.hudManager.selectAbility(ability.id);
        }

        console.log(`Selected ability: ${ability.name}`);
    }

    /**
     * Handle ability targeting on canvas click
     * @param {number} targetX - Target X coordinate (dungeon tile)
     * @param {number} targetY - Target Y coordinate (dungeon tile)
     */
    targetAbility(targetX, targetY) {
        if (!this.selectedAbility || !this.isSelectingTarget) {
            console.warn('No ability selected or not in targeting mode');
            return;
        }

        if (!gameState.dungeon || !gameState.player) {
            console.warn('Dungeon or player not available');
            return;
        }

        const ability = window.abilitySystem.getAbility(this.selectedAbility);
        if (!ability) {
            console.warn('Ability not found');
            return;
        }

        // Find enemies in range/AOE
        const targets = this.getTargetsInRange(targetX, targetY, ability);
        if (targets.length === 0) {
            console.log('No targets in range');
            return;
        }

        // Execute the ability
        this.executeAbility(ability, targets);
    }

    /**
     * Get targets in range of ability based on targeting mode
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @param {Object} ability - The ability being cast
     * @returns {Array} - Array of target enemies
     */
    getTargetsInRange(targetX, targetY, ability) {
        const targets = [];

        // Find nearby enemies
        for (const enemy of gameState.enemies) {
            if (!enemy.isAlive || !enemy.isAlive()) continue;

            const distance = Math.max(
                Math.abs(enemy.x - targetX),
                Math.abs(enemy.y - targetY)
            );

            // Check if enemy is within ability's range and radius
            if (distance <= ability.range) {
                targets.push(enemy);
            }
        }

        return targets;
    }

    /**
     * Execute the selected ability against targets
     * @param {Object} ability - The ability definition
     * @param {Array} targets - Array of target enemies
     */
    executeAbility(ability, targets) {
        if (!gameState.player || !window.combatResolver) {
            console.warn('Cannot execute ability: player or combatResolver not available');
            return;
        }

        // Resolve the ability through combat resolver
        const result = window.combatResolver.resolveAbility(
            gameState.player,
            ability.id,
            targets,
            gameState.dungeon
        );

        // Show feedback
        if (window.hudManager) {
            window.hudManager.showAbilityCastFeedback(result);
        }

        // Clear selection
        this.clearAbilitySelection();

        // Process turn after ability cast
        gameState.processTurn();
    }

    /**
     * Cancel ability selection
     */
    clearAbilitySelection() {
        this.selectedAbility = null;
        this.isSelectingTarget = false;
        this.targetingMode = null;

        if (window.hudManager) {
            window.hudManager.clearAbilitySelection();
        }
    }

    /**
     * Handle cancel action (escape key)
     */
    handleCancel() {
        // If in targeting mode, cancel ability selection
        if (this.isSelectingTarget) {
            this.clearAbilitySelection();
            console.log('Ability selection cancelled');
        } else {
            // Otherwise, open pause menu
            gameState.togglePause();
        }
    }

    /**
     * Handle confirm action (Enter key)
     */
    handleConfirm() {
        // Used for menu confirmations
        console.log('Confirm action');
    }

    /**
     * Check if currently selecting target for ability
     * @returns {boolean}
     */
    isTargeting() {
        return this.isSelectingTarget && this.selectedAbility !== null;
    }

    /**
     * Get currently selected ability
     * @returns {Object|null} - The ability definition or null
     */
    getSelectedAbility() {
        if (!this.selectedAbility) return null;
        return window.abilitySystem?.getAbility(this.selectedAbility);
    }

    /**
     * Enable input processing
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable input processing
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Check if a key is currently pressed
     * @param {string} key - Key to check
     * @returns {boolean}
     */
    isKeyPressed(key) {
        return this.keyState[key] || false;
    }

    /**
     * Clear all key states
     */
    clearKeys() {
        this.keyState = {};
    }
}

// Create singleton instance
export const inputManager = new InputManager();
