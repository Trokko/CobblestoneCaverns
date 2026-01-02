/**
 * HUDManager.js - Heads-Up Display manager
 * 
 * Sköter HUD:en (det som visas på skärmen under spelet):
 * - HP och XP staplar med färger
 * - Spelarens stats (ATK, DEF, CRT)
 * - Karaktärsinformation (porträtt, klass, level)
 * - Quick slots för snabbväxling av items
 * - Floating text för feedback ("Level Up!", "+50 HP")
 * 
 * All visuell feedback till spelaren går genom här!
 */

class HUDManager {
    constructor() {
        this.elements = {};               // Cacade DOM-element för snabb access
        this.quickSlots = [null, null];   // 2 quick slots för items
        this.currentPlayer = null;        // Referens till spelaren
    }
    
    /**
     * Initierar HUD och cachar DOM-element
     * 
     * Hittar och sparar referenser till alla HUD-element.
     * Detta gör uppdateringar snabbare - vi slipper söka varje gång!
     */
    init() {
        // Character info
        this.elements.charPortrait = document.getElementById('char-portrait');
        this.elements.charClass = document.getElementById('char-class');
        this.elements.charLevel = document.getElementById('char-level');
        this.elements.floorNumber = document.getElementById('floor-number');
        
        // Progress bars
        this.elements.hpText = document.getElementById('hp-text');
        this.elements.hpBarFill = document.getElementById('hp-bar-fill');
        this.elements.xpText = document.getElementById('xp-text');
        this.elements.xpBarFill = document.getElementById('xp-bar-fill');
        
        // Combat stats
        this.elements.statAtk = document.getElementById('stat-atk');
        this.elements.statDef = document.getElementById('stat-def');
        this.elements.statCrt = document.getElementById('stat-crt');
        
        // Quick slots
        this.elements.quickSlot1 = document.getElementById('quick-slot-1');
        this.elements.quickSlot2 = document.getElementById('quick-slot-2');
        
        // Floating stats (upper left corner)
        this.elements.floatCharPortrait = document.getElementById('float-char-portrait');
        this.elements.floatCharClass = document.getElementById('float-char-class');
        this.elements.floatCharLevel = document.getElementById('float-char-level');
        this.elements.floatFloorNumber = document.getElementById('float-floor-number');
        this.elements.floatHpText = document.getElementById('float-hp-text');
        this.elements.floatHpBarFill = document.getElementById('float-hp-bar-fill');
        this.elements.floatXpText = document.getElementById('float-xp-text');
        this.elements.floatXpBarFill = document.getElementById('float-xp-bar-fill');
        this.elements.floatStatAtk = document.getElementById('float-stat-atk');
        this.elements.floatStatDef = document.getElementById('float-stat-def');
        this.elements.floatStatCrt = document.getElementById('float-stat-crt');
        
        console.log('HUDManager initialized');
    }
    
    /**
     * Sätter spelaren och uppdaterar hela HUD:en
     * @param {Player} player - Spelarens entity
     * 
     * Anropas när ett nytt spel startar eller sparfil laddas.
     * Uppdaterar allt direkt så HUD:en matchar spelaren!
     */
    setPlayer(player) {
        if (!player) {
            console.error('HUDManager: Invalid player');
            return;
        }
        
        this.currentPlayer = player;
        this.updateAll();
    }
    
    /**
     * Uppdaterar alla HUD-element från spelardata
     * 
     * Refreshar allt! Används när mycket ändrats samtidigt
     * (t.ex. level up, våningsbyte).
     */
    updateAll() {
        if (!this.currentPlayer) return;
        
        this.updateCharacterInfo();
        this.updateHP();
        this.updateXP();
        this.updateStats();
        this.updateFloor();
    }
    
    /**
     * Update character portrait and class name
     */
    updateCharacterInfo() {
        if (!this.currentPlayer) return;
        
        if (this.elements.charClass) {
            this.elements.charClass.textContent = this.currentPlayer.className;
        }
        if (this.elements.floatCharClass) {
            this.elements.floatCharClass.textContent = this.currentPlayer.className;
        }
        
        if (this.elements.charPortrait) {
            const spritePath = `Assets/Art/uf_heroes/${this.currentPlayer.sprite}`;
            this.elements.charPortrait.src = spritePath;
            this.elements.charPortrait.alt = this.currentPlayer.className;
        }
        if (this.elements.floatCharPortrait) {
            const spritePath = `Assets/Art/uf_heroes/${this.currentPlayer.sprite}`;
            this.elements.floatCharPortrait.src = spritePath;
            this.elements.floatCharPortrait.alt = this.currentPlayer.className;
        }
        
        this.updateLevel();
    }
    
    /**
     * Update character level display
     */
    updateLevel() {
        if (!this.currentPlayer) return;
        
        if (this.elements.charLevel) {
            this.elements.charLevel.textContent = `Lvl ${this.currentPlayer.level}`;
        }
        if (this.elements.floatCharLevel) {
            this.elements.floatCharLevel.textContent = `Lvl ${this.currentPlayer.level}`;
        }
    }
    
    /**
     * Update HP bar
     * @param {boolean} animate - Whether to animate the change
     */
    updateHP(animate = true) {
        if (!this.currentPlayer) return;
        
        const currentHP = this.currentPlayer.currentHP;
        const maxHP = this.currentPlayer.maxHP;
        const percentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));
        
        if (this.elements.hpText) {
            this.elements.hpText.textContent = `${currentHP}/${maxHP}`;
        }
        if (this.elements.floatHpText) {
            this.elements.floatHpText.textContent = `${currentHP}/${maxHP}`;
        }
        
        if (this.elements.hpBarFill) {
            // Use RPGUI's data-value attribute
            this.elements.hpBarFill.setAttribute('data-value', percentage.toFixed(0));
            // Also set width directly for immediate visual feedback
            this.elements.hpBarFill.style.width = `${percentage}%`;
            
            // Color coding based on HP percentage
            const hpBarContainer = this.elements.hpBarFill.parentElement;
            if (hpBarContainer) {
                hpBarContainer.classList.remove('green', 'orange', 'red');
                if (percentage <= 25) {
                    hpBarContainer.classList.add('critical');
                } else if (percentage <= 50) {
                    hpBarContainer.classList.add('warning');
                } else {
                    hpBarContainer.classList.add('healthy');
                }
            }
        }
        
        if (this.elements.floatHpBarFill) {
            this.elements.floatHpBarFill.setAttribute('data-value', percentage.toFixed(0));
            this.elements.floatHpBarFill.style.width = `${percentage}%`;
        }
    }
    
    /**
     * Update XP bar
     * @param {boolean} animate - Whether to animate the change
     */
    updateXP(animate = true) {
        if (!this.currentPlayer) return;
        
        const currentXP = this.currentPlayer.xp;
        const xpToNext = this.currentPlayer.xpToNextLevel;
        const percentage = Math.max(0, Math.min(100, (currentXP / xpToNext) * 100));
        
        if (this.elements.xpText) {
            this.elements.xpText.textContent = `${currentXP}/${xpToNext}`;
        }
        if (this.elements.floatXpText) {
            this.elements.floatXpText.textContent = `${currentXP}/${xpToNext}`;
        }
        
        if (this.elements.xpBarFill) {
            // Use RPGUI's data-value attribute
            this.elements.xpBarFill.setAttribute('data-value', percentage.toFixed(0));
            // Also set width directly for immediate visual feedback
            this.elements.xpBarFill.style.width = `${percentage}%`;
        }
        
        if (this.elements.floatXpBarFill) {
            this.elements.floatXpBarFill.setAttribute('data-value', percentage.toFixed(0));
            this.elements.floatXpBarFill.style.width = `${percentage}%`;
        }
    }
    
    /**
     * Update combat stats (ATK, DEF, CRT)
     */
    updateStats() {
        if (!this.currentPlayer) return;
        
        // Update combat stats (which include equipment bonuses)
        if (this.elements.statAtk) {
            this.elements.statAtk.textContent = this.currentPlayer.totalATK || this.currentPlayer.baseATK;
        }
        if (this.elements.floatStatAtk) {
            this.elements.floatStatAtk.textContent = this.currentPlayer.totalATK || this.currentPlayer.baseATK;
        }
        
        if (this.elements.statDef) {
            this.elements.statDef.textContent = this.currentPlayer.totalDEF || this.currentPlayer.baseDEF;
        }
        if (this.elements.floatStatDef) {
            this.elements.floatStatDef.textContent = this.currentPlayer.totalDEF || this.currentPlayer.baseDEF;
        }
        
        if (this.elements.statCrt) {
            const crt = this.currentPlayer.totalCRT || this.currentPlayer.baseCRT;
            this.elements.statCrt.textContent = `${crt}%`;
        }
        if (this.elements.floatStatCrt) {
            const crt = this.currentPlayer.totalCRT || this.currentPlayer.baseCRT;
            this.elements.floatStatCrt.textContent = `${crt}%`;
        }
    }
    
    /**
     * Update floor number
     */
    updateFloor() {
        if (!this.currentPlayer) return;
        
        if (this.elements.floorNumber) {
            this.elements.floorNumber.textContent = this.currentPlayer.floor;
        }
        if (this.elements.floatFloorNumber) {
            this.elements.floatFloorNumber.textContent = this.currentPlayer.floor;
        }
    }

    /**
     * Display player's active status effects
     */
    updateStatusEffects() {
        if (!this.currentPlayer) return;

        // Get or create status effects display element
        let statusDisplay = document.getElementById('player-status-effects');
        if (!statusDisplay) {
            statusDisplay = document.createElement('div');
            statusDisplay.id = 'player-status-effects';
            statusDisplay.className = 'status-effects-display';
            const floorElement = this.elements.floorNumber?.parentElement;
            if (floorElement) {
                floorElement.parentElement.appendChild(statusDisplay);
            }
        }

        // Clear existing display
        statusDisplay.innerHTML = '';

        // Add active effects
        if (this.currentPlayer.statusEffects && this.currentPlayer.statusEffects.length > 0) {
            this.currentPlayer.statusEffects.forEach(effect => {
                const effectEl = document.createElement('div');
                effectEl.className = `status-effect status-${effect.type}`;
                effectEl.setAttribute('title', `${effect.name}: ${effect.description}`);
                effectEl.innerHTML = `
                    <span class="effect-icon">${effect.icon}</span>
                    <span class="effect-duration">${effect.remainingTurns}</span>
                `;
                statusDisplay.appendChild(effectEl);
            });
        }
    }

    /**
     * Show status effect applied feedback
     * @param {Object} effect - The effect that was applied
     * @param {string} targetName - Name of entity affected
     */
    showEffectApplied(effect, targetName) {
        if (window.combatFeedback) {
            window.combatFeedback.addCombatLogEntry(
                `${targetName} is ${effect.name.toLowerCase()}!`,
                'effect'
            );
        }

        this.showFloatingText(`${effect.icon} ${effect.name}`, 'effect');
        this.updateStatusEffects();
    }

    /**
     * Show status effect damage feedback
     * @param {string} effectName - Name of effect causing damage
     * @param {number} damage - Damage dealt
     */
    showEffectDamage(effectName, damage) {
        if (window.combatFeedback) {
            window.combatFeedback.addCombatLogEntry(
                `${effectName} damage: ${damage}`,
                'effect'
            );
        }

        this.updateHP(true);
    }

    /**
     * Display player's available abilities with cooldown status
     * Also shows mana/resource bar
     */
    updateAbilities() {
        if (!this.currentPlayer) return;

        // Get or create abilities display element
        let abilitiesDisplay = document.getElementById('player-abilities');
        if (!abilitiesDisplay) {
            abilitiesDisplay = document.createElement('div');
            abilitiesDisplay.id = 'player-abilities';
            abilitiesDisplay.className = 'abilities-display';
            const statsSection = this.elements.statAtk?.parentElement?.parentElement;
            if (statsSection) {
                statsSection.appendChild(abilitiesDisplay);
            }
        }

        // Clear existing display
        abilitiesDisplay.innerHTML = '';

        // Get player's abilities (imported from AbilitySystem)
        const { abilitySystem } = window;
        if (!abilitySystem) return;

        const abilities = abilitySystem.getAbilitiesForClass(this.currentPlayer.classKey);
        const playerId = this.currentPlayer.id || 'player';

        // Add each ability
        abilities.forEach((ability, index) => {
            const abilityEl = document.createElement('div');
            abilityEl.className = `ability-button ability-${ability.id}`;
            abilityEl.setAttribute('data-ability-id', ability.id);
            abilityEl.setAttribute('title', `${ability.name}: ${ability.description}`);

            // Check cooldown
            const cooldownRemaining = abilitySystem.getCooldownRemaining(playerId, ability.id);
            const isReady = cooldownRemaining === 0;

            // Add cooldown indicator if on cooldown
            let cooldownHTML = '';
            if (cooldownRemaining > 0) {
                cooldownHTML = `<span class="cooldown-badge">${cooldownRemaining}</span>`;
                abilityEl.classList.add('on-cooldown');
            } else {
                abilityEl.classList.add('ready');
            }

            abilityEl.innerHTML = `
                <div class="ability-icon">${ability.icon || '⚔️'}</div>
                <div class="ability-name">${ability.name}</div>
                ${cooldownHTML}
                <div class="ability-shortcut">
                    ${String.fromCharCode(65 + index)} <!-- A, B, C, D -->
                </div>
            `;

            // Add click handler for ability selection
            abilityEl.addEventListener('click', () => {
                this.selectAbility(ability.id);
            });

            abilitiesDisplay.appendChild(abilityEl);
        });

        // Add resource bar (mana/stamina)
        const resourceBar = document.createElement('div');
        resourceBar.className = 'ability-resources';
        const resources = abilitySystem.getResources(playerId);
        
        if (resources) {
            const resourcePercent = (resources.current / resources.max) * 100;
            resourceBar.innerHTML = `
                <div class="resource-label">Stamina</div>
                <div class="resource-bar">
                    <div class="resource-fill" style="width: ${resourcePercent}%"></div>
                </div>
                <div class="resource-text">${resources.current}/${resources.max}</div>
            `;
            abilitiesDisplay.appendChild(resourceBar);
        }
    }

    /**
     * Show ability cast feedback
     * @param {Object} abilityResult - Result from combatResolver.resolveAbility()
     */
    showAbilityCastFeedback(abilityResult) {
        if (!abilityResult.success) {
            this.showFloatingText(abilityResult.reason, 'error');
            if (window.combatFeedback) {
                window.combatFeedback.addCombatLogEntry(abilityResult.reason, 'error');
            }
            return;
        }

        // Show ability name in floating text
        this.showFloatingText(`${abilityResult.ability} cast!`, 'ability');

        // Log to combat feedback
        if (window.combatFeedback) {
            window.combatFeedback.addCombatLogEntry(
                `You cast ${abilityResult.ability}!`,
                'ability'
            );

            // Log damage for each target
            abilityResult.results.forEach(result => {
                if (result.damageDealt > 0) {
                    window.combatFeedback.addCombatLogEntry(
                        `${result.targetName} takes ${result.damageDealt} damage`,
                        'damage'
                    );
                }
                if (result.targetDied) {
                    window.combatFeedback.addCombatLogEntry(
                        `${result.targetName} defeated!`,
                        'kill'
                    );
                }
            });
        }

        // Update UI to show cooldown
        this.updateAbilities();
    }

    /**
     * Select an ability for targeting
     * @param {string} abilityId - The ability to select
     */
    selectAbility(abilityId) {
        // Remove previous selection
        const allAbilityButtons = document.querySelectorAll('.ability-button');
        allAbilityButtons.forEach(btn => btn.classList.remove('selected'));

        // Highlight selected ability
        const selectedBtn = document.querySelector(`[data-ability-id="${abilityId}"]`);
        if (selectedBtn && !selectedBtn.classList.contains('on-cooldown')) {
            selectedBtn.classList.add('selected');
            
            // Trigger ability selection event for input manager
            if (window.inputManager) {
                window.inputManager.selectAbility(abilityId);
            }

            // Show ability description
            const { abilitySystem } = window;
            if (abilitySystem) {
                const ability = abilitySystem.getAbility(abilityId);
                if (ability && window.combatFeedback) {
                    window.combatFeedback.addCombatLogEntry(
                        `Selected: ${ability.name}`,
                        'info'
                    );
                }
            }
        } else if (selectedBtn && selectedBtn.classList.contains('on-cooldown')) {
            this.showFloatingText('Ability on cooldown!', 'error');
        }
    }

    /**
     * Clear ability selection
     */
    clearAbilitySelection() {
        const allAbilityButtons = document.querySelectorAll('.ability-button');
        allAbilityButtons.forEach(btn => btn.classList.remove('selected'));
    }
    
    /**
     * Set item in quick slot
     * @param {number} slotIndex - Slot index (0 or 1)
     * @param {Object} item - Item object or null to clear
     */
    setQuickSlot(slotIndex, item) {
        if (slotIndex < 0 || slotIndex > 1) {
            console.error('Invalid quick slot index:', slotIndex);
            return;
        }
        
        this.quickSlots[slotIndex] = item;
        this.updateQuickSlot(slotIndex);
    }
    
    /**
     * Update quick slot display
     * @param {number} slotIndex - Slot index (0 or 1)
     */
    updateQuickSlot(slotIndex) {
        const slotElement = slotIndex === 0 ? this.elements.quickSlot1 : this.elements.quickSlot2;
        if (!slotElement) return;
        
        const item = this.quickSlots[slotIndex];
        const imgElement = slotElement.querySelector('.slot-item');
        const quantityElement = slotElement.querySelector('.slot-quantity');
        
        if (item) {
            // Show item
            if (imgElement) {
                imgElement.src = `Assets/Art/uf_items/${item.sprite}`;
                imgElement.alt = item.name;
                imgElement.style.display = 'block';
            }
            
            // Show quantity if item is stackable
            if (quantityElement && item.quantity !== undefined) {
                quantityElement.textContent = item.quantity;
                quantityElement.style.display = 'block';
            } else if (quantityElement) {
                quantityElement.style.display = 'none';
            }
            
            // Add tooltip
            slotElement.setAttribute('data-tooltip', item.name);
        } else {
            // Clear slot
            if (imgElement) {
                imgElement.style.display = 'none';
            }
            if (quantityElement) {
                quantityElement.style.display = 'none';
            }
            slotElement.removeAttribute('data-tooltip');
        }
    }
    
    /**
     * Get item from quick slot
     * @param {number} slotIndex - Slot index (0 or 1)
     * @returns {Object|null} Item or null
     */
    getQuickSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex > 1) return null;
        return this.quickSlots[slotIndex];
    }
    
    /**
     * Clear all quick slots
     */
    clearQuickSlots() {
        this.setQuickSlot(0, null);
        this.setQuickSlot(1, null);
    }
    
    /**
     * Show damage/heal floating text on HUD
     * @param {string} text - Text to display
     * @param {string} type - Type: 'damage', 'heal', 'critical', 'miss'
     */
    showFloatingText(text, type = 'damage') {
        // Delegate to UIManager if available
        if (window.uiManager && window.uiManager.showFloatingText) {
            // Position near character portrait
            const portrait = this.elements.charPortrait;
            if (portrait) {
                const rect = portrait.getBoundingClientRect();
                window.uiManager.showFloatingText(
                    text,
                    rect.left + rect.width / 2,
                    rect.top,
                    type
                );
            }
        }
    }

    /**
     * Show attack feedback in HUD (attack animation and stat update)
     * @param {Object} result - Combat result from CombatResolver
     */
    showAttackFeedback(result) {
        if (!result) return;

        // Show the damage amount
        const text = result.isCritical ? `${result.attackDamage}!` : `${result.attackDamage}`;
        this.showFloatingText(text, result.isCritical ? 'critical' : 'hit');

        // Flash HP bar for visual feedback
        this.flashHPBar(result.isCritical ? '#FF6B6B' : '#FFD700');

        // Update HP display
        this.updateHP(true);
    }

    /**
     * Show damage taken feedback in HUD
     * @param {number} damage - Amount of damage taken
     */
    showDamageTakenFeedback(damage) {
        this.showFloatingText(`-${damage}`, 'damage');
        this.flashHPBar('#FF3333');
        this.updateHP(true);
    }

    /**
     * Show heal feedback in HUD
     * @param {number} amount - Amount healed
     */
    showHealFeedback(amount) {
        this.showFloatingText(`+${amount}`, 'heal');
        this.flashHPBar('#00FF00');
        this.updateHP(true);
    }

    /**
     * Show critical hit effect
     * Shakes the character portrait and increases brightness temporarily
     */
    showCriticalHitEffect() {
        if (!this.elements.charPortrait) return;

        // Add shake animation
        this.elements.charPortrait.classList.add('critical-shake');
        setTimeout(() => {
            this.elements.charPortrait.classList.remove('critical-shake');
        }, 300);

        // Add brightness boost
        const originalFilter = this.elements.charPortrait.style.filter;
        this.elements.charPortrait.style.filter = 'brightness(1.5)';
        setTimeout(() => {
            this.elements.charPortrait.style.filter = originalFilter;
        }, 300);
    }

    /**
     * Show death animation for enemy (called when enemy dies)
     * @param {string} enemyName - Name of defeated enemy
     */
    showEnemyDeathEffect(enemyName) {
        this.showFloatingText(`${enemyName} defeated!`, 'kill');
    }

    /**
     * Show level up animation with full effect
     * @param {number} newLevel - New level reached
     */
    showLevelUpAnimation(newLevel) {
        // Existing level up effect
        this.showLevelUpEffect();

        // Extra visual feedback
        if (this.elements.charLevel) {
            this.elements.charLevel.style.color = '#FFD700';
            setTimeout(() => {
                this.elements.charLevel.style.color = '';
            }, 500);
        }

        // Play sound if available
        if (window.audioManager) {
            window.audioManager.playSfx('levelup');
        }
    }
    
    /**
     * Flash HP bar (for damage/heal feedback)
     * @param {string} color - Color to flash
     */
    flashHPBar(color = '#ff0000') {
        if (!this.elements.hpBarFill) return;
        
        const originalColor = this.elements.hpBarFill.style.background;
        this.elements.hpBarFill.style.background = color;
        
        setTimeout(() => {
            this.elements.hpBarFill.style.background = originalColor;
        }, 200);
    }
    
    /**
     * Show level up animation
     */
    showLevelUpEffect() {
        if (this.elements.charLevel) {
            this.elements.charLevel.classList.add('bounce');
            setTimeout(() => {
                this.elements.charLevel.classList.remove('bounce');
            }, 500);
        }
        
        if (window.uiManager) {
            window.uiManager.showAlert(
                'Level Up!',
                `You are now level ${this.currentPlayer.level}!`
            );
        }
    }
    
    /**
     * Reset HUD (clear player data)
     */
    reset() {
        this.currentPlayer = null;
        this.clearQuickSlots();
        
        // Reset to default values
        if (this.elements.charClass) this.elements.charClass.textContent = '';
        if (this.elements.charLevel) this.elements.charLevel.textContent = 'Lvl 1';
        if (this.elements.floorNumber) this.elements.floorNumber.textContent = '1';
        if (this.elements.hpText) this.elements.hpText.textContent = '0/0';
        if (this.elements.xpText) this.elements.xpText.textContent = '0/0';
        if (this.elements.hpBarFill) this.elements.hpBarFill.style.width = '0%';
        if (this.elements.xpBarFill) this.elements.xpBarFill.style.width = '0%';
        if (this.elements.statAtk) this.elements.statAtk.textContent = '0';
        if (this.elements.statDef) this.elements.statDef.textContent = '0';
        if (this.elements.statCrt) this.elements.statCrt.textContent = '0%';
    }
}

// Create singleton instance
export const hudManager = new HUDManager();
