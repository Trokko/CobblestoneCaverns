/**
 * CombatFeedback.js - Visual feedback system for combat
 * 
 * Handles all visual and textual feedback during combat:
 * - Floating damage numbers above entities
 * - Critical hit effects (enlarged numbers, special styling)
 * - Combat log display in HUD
 * - Death effects and rewards
 * - Sound effects coordination
 * 
 * Works alongside CombatResolver which handles the mechanics.
 * This system focuses on the "feel" and presentation.
 */

class CombatFeedback {
    constructor() {
        this.floatingTexts = [];  // Array of active floating text elements
        this.combatLog = [];      // Recent combat messages
        this.maxLogEntries = 16;  // Maximum messages to display (doubled for taller combat log)
        this.canvas = null;       // Reference to game canvas for positioning
        this.audioManager = null; // For playing combat sounds
    }

    /**
     * Initialize feedback system
     * @param {HTMLCanvasElement} gameCanvas - The game canvas for positioning
     * @param {Object} audioManager - Audio manager for sound effects
     */
    init(gameCanvas, audioManager) {
        this.canvas = gameCanvas;
        this.audioManager = audioManager;
        this.createFloatingTextContainer();
        console.log('CombatFeedback system initialized');
    }

    /**
     * Create container for floating text elements
     * This div will hold all the damage numbers and effects
     */
    createFloatingTextContainer() {
        let container = document.getElementById('floating-text-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'floating-text-container';
            container.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
            `;
            document.body.appendChild(container);
        }
        this.floatingTextContainer = container;
    }

    /**
     * Display floating damage number above entity
     * @param {Object} entity - The entity that took damage (has x, y position)
     * @param {number} damage - Amount of damage dealt
     * @param {boolean} isCritical - Whether this was a critical hit
     * @param {number} canvasOffsetX - Canvas offset X in viewport
     * @param {number} canvasOffsetY - Canvas offset Y in viewport
     */
    showDamageNumber(entity, damage, isCritical, canvasOffsetX = 0, canvasOffsetY = 0) {
        if (!this.canvas || !this.floatingTextContainer) return;

        const TILE_SIZE = 32; // Assuming 32x32 tiles
        
        // Convert world position to screen position
        const screenX = entity.x * TILE_SIZE + TILE_SIZE / 2 + canvasOffsetX;
        const screenY = entity.y * TILE_SIZE + TILE_SIZE / 2 + canvasOffsetY;

        // Create floating text element
        const floatingText = document.createElement('div');
        floatingText.className = `floating-damage ${isCritical ? 'critical' : 'normal'}`;
        floatingText.textContent = isCritical ? `${damage}!` : `${damage}`;
        floatingText.style.cssText = `
            position: fixed;
            left: ${screenX}px;
            top: ${screenY}px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            font-weight: bold;
            font-size: ${isCritical ? '24px' : '18px'};
            color: ${isCritical ? '#FF6B6B' : '#FFD700'};
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            z-index: 1001;
            opacity: 1;
        `;

        this.floatingTextContainer.appendChild(floatingText);

        // Add to tracking array
        const floatingObj = {
            element: floatingText,
            startTime: Date.now(),
            duration: isCritical ? 1200 : 1000, // Critical hits stay longer
            startX: screenX,
            startY: screenY
        };

        this.floatingTexts.push(floatingObj);

        // Animate the text
        this.animateFloatingText(floatingObj);

        // Play sound effect
        if (this.audioManager) {
            if (isCritical) {
                this.audioManager.playSfx('critical');
            } else {
                this.audioManager.playSfx('hit');
            }
        }
    }

    /**
     * Animate floating text upward with fade out
     * @param {Object} floatingObj - Object with element, timing, and position data
     */
    animateFloatingText(floatingObj) {
        const animate = () => {
            const elapsed = Date.now() - floatingObj.startTime;
            const progress = Math.min(elapsed / floatingObj.duration, 1);

            if (progress < 1) {
                // Move up and fade out
                const offsetY = progress * -40; // Move up 40 pixels
                const opacity = Math.max(0, 1 - progress);
                
                floatingObj.element.style.transform = `translate(-50%, calc(-50% + ${offsetY}px))`;
                floatingObj.element.style.opacity = opacity;

                requestAnimationFrame(animate);
            } else {
                // Remove element when animation is complete
                floatingObj.element.remove();
                this.floatingTexts = this.floatingTexts.filter(t => t !== floatingObj);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Add message to combat log
     * @param {string} message - The message to display
     * @param {string} type - Type of message ('attack', 'critical', 'hit', 'death', 'reward', etc.)
     */
    addCombatLogEntry(message, type = 'attack') {
        const entry = {
            message,
            type,
            timestamp: Date.now()
        };

        this.combatLog.unshift(entry);
        
        // Keep only recent entries
        if (this.combatLog.length > this.maxLogEntries) {
            this.combatLog.pop();
        }

        // Update HUD display if available
        this.updateCombatLogDisplay();

        // Log to console for debugging
        console.log(`[COMBAT] ${message}`);
    }

    /**
     * Update the combat log display in the HUD
     */
    updateCombatLogDisplay() {
        const logElement = document.getElementById('combat-log');
        if (!logElement) return;

        logElement.innerHTML = '';

        this.combatLog.forEach(entry => {
            const messageEl = document.createElement('div');
            messageEl.className = `log-entry log-${entry.type}`;
            messageEl.textContent = entry.message;
            logElement.appendChild(messageEl);
        });
    }

    /**
     * Show attack feedback (player attacks enemy)
     * @param {Object} result - Combat result from CombatResolver.resolveAttack()
     */
    showAttackFeedback(result, isPlayerAttacker = false) {
        if (!result || !result.success) return;

        const { attacker, defender, attackDamage, isCritical } = result;

        // Create message
        const attackerName = isPlayerAttacker ? 'You' : attacker;
        const verb = isPlayerAttacker ? 'attack' : 'attacks';
        let message = `${attackerName} ${verb} ${defender} for ${attackDamage} damage`;
        if (isCritical) {
            message += ' - CRITICAL HIT!';
        }

        this.addCombatLogEntry(message, isCritical ? 'critical' : 'attack');
    }

    /**
     * Show death feedback
     * @param {string} enemyName - Name of defeated enemy
     * @param {Object} rewards - Rewards object {xp, gold, items}
     */
    showDeathFeedback(enemyName, rewards) {
        // Create a single combined message
        if (rewards && (rewards.xp || rewards.gold)) {
            const parts = [];
            if (rewards.xp) parts.push(`${rewards.xp} XP`);
            if (rewards.gold) parts.push(`${rewards.gold} Gold`);
            
            const rewardText = parts.join(' and ');
            this.addCombatLogEntry(`You killed ${enemyName} and gained ${rewardText}!`, 'kill');
            
            // Show items separately if any
            if (rewards.items && rewards.items.length > 0) {
                this.addCombatLogEntry(`Loot dropped: ${rewards.items.join(', ')}`, 'reward');
            }
        } else {
            // Fallback if no rewards
            this.addCombatLogEntry(`You killed ${enemyName}!`, 'kill');
        }

        // Play death sound
        if (this.audioManager) {
            this.audioManager.playSfx('death');
        }
    }

    /**
     * Show player damage taken feedback
     * @param {number} damage - Amount of damage taken
     */
    showPlayerDamageFeedback(damage) {
        this.addCombatLogEntry(`Player takes ${damage} damage!`, 'damage');
    }

    /**
     * Show screen flash effect for critical hits or important events
     * @param {string} color - Color of the flash (default: 'red')
     * @param {number} duration - Duration in milliseconds
     */
    showScreenFlash(color = 'red', duration = 150) {
        const canvas = this.canvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Flash decreases in intensity over time
            const alpha = (1 - progress) * 0.3;
            
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Show status effect applied
     * @param {Object} effect - The effect that was applied
     * @param {string} targetName - Name of entity affected
     */
    showEffectApplied(effect, targetName) {
        const message = `${targetName} is afflicted with ${effect.name}!`;
        this.addCombatLogEntry(message, 'effect');

        // Play effect sound if available
        if (this.audioManager) {
            this.audioManager.playSfx('effect');
        }
    }

    /**
     * Get recent combat log for display
     * @param {number} limit - Number of entries to return
     * @returns {Array} - Array of recent combat log entries
     */
    getRecentLog(limit = 5) {
        return this.combatLog.slice(0, limit);
    }

    /**
     * Clear combat log
     */
    clearLog() {
        this.combatLog = [];
        this.updateCombatLogDisplay();
    }

    /**
     * Clean up all floating texts
     */
    clearFloatingTexts() {
        this.floatingTexts.forEach(obj => {
            obj.element.remove();
        });
        this.floatingTexts = [];
    }

    /**
     * Update floating text positions (called every frame if needed)
     * This is optional - animations use RAF internally
     */
    update() {
        // Floating texts animate themselves via RAF
        // This method is here for potential frame-based timing if needed
    }
}

// Export singleton instance
const combatFeedback = new CombatFeedback();
export { combatFeedback };
export default CombatFeedback;
