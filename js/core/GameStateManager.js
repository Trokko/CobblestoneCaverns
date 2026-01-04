/**
 * GameStateManager.js - Central spelstatushanterare
 * 
 * Håller koll på allt som händer i spelet:
 * - Vilken skärm som visas (meny, spel, game over)
 * - Turn-baserat system (vems tur är det?)
 * - Action queue (vad ska hända nästa?)
 * - Pause/resume funktionalitet
 * - Status effects och tillståndsförändringar
 * - Globalt speltillstånd
 * 
 * Detta är "hjärnan" - alla andra system kollar här!
 */

import { SCREEN_STATES } from '../config.js';
import { statusEffectSystem } from '../systems/StatusEffectSystem.js';

class GameStateManager {
    constructor() {
        this.currentScreen = SCREEN_STATES.MAIN_MENU;  // Vilken skärm visas?
        this.isPaused = false;                          // Är spelet pausat?
        this.currentTurn = 0;                           // Turn-räknare
        this.currentFloor = 1;                          // Nuvarande våning
        this.isEndlessMode = false;                     // Endless mode efter våning 20
        this.gameStartTime = null;                      // När startade spelet?
        this.player = null;                             // Spelarens karaktär
        this.dungeon = null;                            // Nuvarande dungeon
        this.enemies = [];                              // Aktiva fiender
        this.actionQueue = [];                          // Kö av väntande actions
        this.isProcessingTurn = false;                  // Hindrar samtidiga turns
    }

    /**
     * Initialize game state
     */
    init() {
        this.currentScreen = SCREEN_STATES.MAIN_MENU;
        this.isPaused = false;
        this.currentTurn = 0;
        this.currentFloor = 1;
        this.isEndlessMode = false;
        this.gameStartTime = null;
        this.player = null;
        this.dungeon = null;
        this.enemies = [];
        this.actionQueue = [];
        this.isProcessingTurn = false;
        
        console.log('Game State Manager initialized');
    }

    /**
     * Byt till en annan skärm
     * @param {string} screenName - Namnet på skärmen att byta till
     * 
     * Döljer alla skärmar och visar den nya.
     * Används för navigation mellan meny, spel, hjälp osv.
     */
    changeScreen(screenName) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        // Show new screen
        const newScreen = document.getElementById(screenName);
        if (newScreen) {
            newScreen.classList.add('active');
            this.currentScreen = screenName;
            console.log(`Switched to screen: ${screenName}`);
        } else {
            console.error(`Screen not found: ${screenName}`);
        }
    }

    /**
     * Behandla en speltur
     * 
     * Det här är hjärtat i det turn-baserade systemet!
     * Kör i ordning:
     * 1. Behandla action queue (spelarens actions)
     * 2. Behandla status effects (gift, eld etc)
     * 3. Låt alla fiender ta sin tur
     * 4. Kolla om spelaren dog
     */
    async processTurn() {
        if (this.isPaused || this.isProcessingTurn) return;

        this.isProcessingTurn = true;
        this.currentTurn++;
        
        try {
            // Process action queue
            await this.processActionQueue();
            
            // Process player abilities (cooldown reduction and resource regeneration)
            if (this.player && window.abilitySystem) {
                const playerId = this.player.id || 'player';
                
                // Reduce ability cooldowns
                window.abilitySystem.reduceCooldowns(playerId);
                
                // Regenerate resources (stamina/mana)
                window.abilitySystem.regenerateResources(playerId);
                
                // Update ability display in HUD
                if (window.hudManager) {
                    window.hudManager.updateAbilities();
                }
            }
            
            // Process player status effects
            if (this.player) {
                // Check if stunned (skip turn)
                if (statusEffectSystem.shouldSkipTurn(this.player)) {
                    if (window.combatFeedback) {
                        window.combatFeedback.addCombatLogEntry('Player is stunned and skipped their turn!', 'effect');
                    }
                }
                
                // Apply per-turn damage from status effects
                const effectDamage = statusEffectSystem.processEffectsTurn(this.player);
                if (effectDamage.totalDamage > 0) {
                    if (window.hudManager) {
                        window.hudManager.showEffectDamage('Status Effect', effectDamage.totalDamage);
                    }
                    if (window.combatFeedback) {
                        const effects = Object.entries(effectDamage.damageBreakdown)
                            .map(([type, damage]) => `${type}(${damage})`)
                            .join(', ');
                        window.combatFeedback.addCombatLogEntry(`Took ${effectDamage.totalDamage} damage from: ${effects}`, 'effect');
                    }
                }
                
                // Update HUD to show current effects
                if (window.hudManager) {
                    window.hudManager.updateStatusEffects();
                }
            }

            // Process enemy turns
            for (const enemy of this.enemies) {
                if (enemy.isAlive && enemy.isAlive()) {
                    // Apply per-turn damage from status effects
                    const enemyEffectDamage = statusEffectSystem.processEffectsTurn(enemy);
                    if (enemyEffectDamage.totalDamage > 0 && window.combatFeedback) {
                        const effects = Object.entries(enemyEffectDamage.damageBreakdown)
                            .map(([type, damage]) => `${type}(${damage})`)
                            .join(', ');
                        window.combatFeedback.addCombatLogEntry(
                            `${enemy.name} takes ${enemyEffectDamage.totalDamage} damage from: ${effects}`,
                            'effect'
                        );
                    }

                    // Check if enemy should skip turn (stunned)
                    if (statusEffectSystem.shouldSkipTurn(enemy)) {
                        if (window.combatFeedback) {
                            window.combatFeedback.addCombatLogEntry(`${enemy.name} is stunned and skips their turn!`, 'effect');
                        }
                        continue; // Skip this enemy's turn
                    }

                    // Check if enemy can move (frozen)
                    if (!statusEffectSystem.canMove(enemy) && window.combatFeedback) {
                        window.combatFeedback.addCombatLogEntry(`${enemy.name} is frozen and cannot move!`, 'effect');
                    }

                    // Check if enemy is in combat with player
                    if (enemy.inCombat && window.gameManager) {
                        // Enemy counterattacks during their turn
                        window.gameManager.resolveEnemyCounterAttack(enemy);
                    } else if (enemy.takeTurn) {
                        // Normal AI behavior (wander/chase) - respects movement restrictions
                        await enemy.takeTurn(this.player, this.dungeon);
                        // Debug: log enemy AI state and position
                        try {
                            const msg = `Enemy Turn: ${enemy.name} (${enemy.id}) state=${enemy.aiState} pos=${enemy.x},${enemy.y}`;
                            console.debug(msg);
                            if (window.appendDevLog) window.appendDevLog(msg);
                        } catch (err) {
                            console.error('Error logging enemy state', err);
                        }
                    }
                }
            }

            // Check for player death
            if (this.player && this.player.currentHP <= 0) {
                this.gameOver();
            }
        } finally {
            this.isProcessingTurn = false;
        }
    }
    
    /**
     * Lägg till en action i kön
     * @param {string} actionType - Typ av action (move, attack, useItem etc)
     * @param {Object} data - Action-specifik data
     * 
     * Actions köas och utförs sedan i ordning när turen behandlas.
     * Detta ger kontroll över execution-ordning!
     */
    queueAction(actionType, data = {}) {
        this.actionQueue.push({
            type: actionType,
            data: data,
            timestamp: Date.now()
        });
    }
    
    /**
     * Process all queued actions
     */
    async processActionQueue() {
        while (this.actionQueue.length > 0) {
            const action = this.actionQueue.shift();
            await this.executeAction(action);
        }
    }
    
    /**
     * Utför en enskild action
     * @param {Object} action - Action att utföra
     * 
     * Switch-sats som hanterar alla typer av actions:
     * - move: Flytta spelaren
     * - attack: Attackera fiende
     * - useItem: Använd föremål
     * - interact: Interagera med objekt
     */
    async executeAction(action) {
        switch (action.type) {
            case 'move':
                // Player movement logic (will be implemented in Week 6)
                console.log('Player move:', action.data);
                break;
                
            case 'attack':
                // Player attack logic (will be implemented in Week 8)
                console.log('Player attack:', action.data);
                break;
                
            case 'useItem':
                // Use item from quick slot or inventory
                if (this.player && action.data.itemId) {
                    const result = this.player.useItem(action.data.itemId);
                    if (result) {
                        console.log('Item used:', result);
                        // Update HUD if available
                        if (window.hudManager) {
                            window.hudManager.updateHP();
                            window.hudManager.showFloatingText(
                                `+${result.amount}`,
                                result.type
                            );
                        }
                    }
                }
                break;
                
            case 'interact':
                // Interact with object (merchant, chest, stairs, etc.)
                console.log('Player interact:', action.data);
                break;
                
            default:
                console.warn('Unknown action type:', action.type);
        }
    }
    
    /**
     * Clear action queue
     */
    clearActionQueue() {
        this.actionQueue = [];
    }

    /**
     * Pausa spelet
     * 
     * Stoppar all gameplay och pausar musiken.
     * Användbart när spelaren behöver en paus!
     */
    pauseGame() {
        this.isPaused = true;
        console.log('Game paused');
        
        // Trigger pause event if needed
        if (window.audioManager) {
            window.audioManager.pauseMusic();
        }
    }

    /**
     * Resume the game
     */
    resumeGame() {
        this.isPaused = false;
        console.log('Game resumed');
        
        // Trigger resume event if needed
        if (window.audioManager) {
            window.audioManager.resumeMusic();
        }
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    /**
     * Start a new game
     * @param {Object} player - Player character
     */
    startNewGame(player) {
        this.player = player;
        this.currentFloor = 1;
        this.currentTurn = 0;
        this.isEndlessMode = false;
        this.gameStartTime = Date.now();
        this.enemies = [];
        
        console.log('New game started with', player.class);
    }

    /**
     * Gå vidare till nästa våning
     * 
     * Inkrementerar våningsnummer, nollställer turns och fiender.
     * Efter våning 20 aktiveras endless mode - ingen gräns längre!
     */
    nextFloor() {
        this.currentFloor++;
        this.currentTurn = 0;
        this.enemies = [];
        
        // Check for endless mode
        if (this.currentFloor > 20) {
            this.isEndlessMode = true;
        }
        
        console.log(`Advanced to floor ${this.currentFloor}`);
    }

    /**
     * Game Over!
     * 
     * Pausar spelet och samlar ihop statistik att visa spelaren.
     * Hur långt kom de? Hur mycket guld samlade de?
     */
    gameOver() {
        this.isPaused = true;
        
        const stats = {
            floor: this.currentFloor,
            kills: this.player.totalKills || 0,
            gold: this.player.totalGoldCollected || 0,
            playtime: this.getPlaytime()
        };
        
        this.displayGameOverScreen(stats);
        
        // Delete saved progress
        this.deleteSaveData();
    }

    /**
     * Display game over screen
     * @param {Object} stats - Final game stats
     */
    displayGameOverScreen(stats) {
        const finalStatsEl = document.getElementById('final-stats');
        if (finalStatsEl) {
            finalStatsEl.innerHTML = `
                <p>Floor Reached: ${stats.floor}</p>
                <p>Monsters Killed: ${stats.kills}</p>
                <p>Gold Collected: ${stats.gold}</p>
                <p>Playtime: ${stats.playtime}</p>
            `;
        }
        
        this.changeScreen(SCREEN_STATES.GAME_OVER);
    }

    /**
     * Get playtime in readable format
     * @returns {string} Formatted playtime
     */
    getPlaytime() {
        if (!this.gameStartTime) return '0m 0s';
        
        const totalSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes}m ${seconds}s`;
    }

    /**
     * Save game to Firestore
     */
    async saveGame() {
        // Implementation will be added when Firebase is integrated
        console.log('Save game triggered');
    }

    /**
     * Load game from Firestore
     */
    async loadGame() {
        // Implementation will be added when Firebase is integrated
        console.log('Load game triggered');
    }

    /**
     * Delete save data from Firestore
     */
    async deleteSaveData() {
        // Implementation will be added when Firebase is integrated
        console.log('Save data deleted');
    }

    /**
     * Reset game state
     */
    resetGame() {
        this.init();
        this.changeScreen(SCREEN_STATES.MAIN_MENU);
    }
}

// Create singleton instance
export const gameState = new GameStateManager();
