/**
 * StatusEffectSystem.js - Status effects and debuff management
 * 
 * Manages all temporary status effects applied to entities:
 * - Poison (damage per turn)
 * - Burn (reduced attack)
 * - Stun (skip next turn)
 * - Freeze (cannot move)
 * 
 * Features:
 * - Multi-effect stacking
 * - Turn-based duration tracking
 * - Damage application per turn
 * - Stat modification
 * - Visual/audio feedback integration
 */

class StatusEffectSystem {
    constructor() {
        // Status effect definitions
        this.effectTemplates = this.initializeEffectTemplates();
    }

    /**
     * Initialize effect templates with their properties
     * @returns {Object} Map of effect types to their properties
     */
    initializeEffectTemplates() {
        return {
            poison: {
                name: 'Poison',
                description: 'Takes damage each turn',
                icon: '☠️',
                color: '#00FF00',
                duration: 3,           // 3 turns
                damagePerTurn: 2,
                canStack: false,
                chance: 0.20           // 20% chance to apply on hit
            },
            burn: {
                name: 'Burn',
                description: 'Reduced attack damage',
                icon: '🔥',
                color: '#FF6B00',
                duration: 2,           // 2 turns
                atkReduction: 4,       // Reduce ATK by 4
                canStack: false,
                chance: 0.15           // 15% chance to apply on hit
            },
            stun: {
                name: 'Stun',
                description: 'Skips next turn',
                icon: '⭐',
                color: '#FFFF00',
                duration: 1,           // 1 turn (skips next action)
                skipsNextTurn: true,
                canStack: false,
                chance: 0.10           // 10% chance to apply on hit
            },
            freeze: {
                name: 'Freeze',
                description: 'Cannot move',
                icon: '❄️',
                color: '#00CCFF',
                duration: 2,           // 2 turns
                preventMove: true,
                canStack: false,
                chance: 0.08           // 8% chance to apply on hit
            },
            bleed: {
                name: 'Bleed',
                description: 'Increased damage taken',
                icon: '🩸',
                color: '#FF0000',
                duration: 3,           // 3 turns
                incomingDamageMultiplier: 1.2,  // 20% more damage taken
                canStack: false,
                chance: 0.12           // 12% chance to apply on hit
            },
            weakness: {
                name: 'Weakness',
                description: 'Reduced defense',
                icon: '💔',
                color: '#FF1493',
                duration: 2,           // 2 turns
                defReduction: 3,       // Reduce DEF by 3
                canStack: false,
                chance: 0.10           // 10% chance to apply on hit
            }
        };
    }

    /**
     * Apply a status effect to an entity
     * @param {Object} entity - Entity to affect (Player or Enemy)
     * @param {string} effectType - Type of effect (poison, burn, stun, freeze)
     * @param {number} duration - Override duration (optional)
     * @returns {boolean} - Whether effect was applied
     */
    applyEffect(entity, effectType, duration = null) {
        const template = this.effectTemplates[effectType];
        if (!template) {
            console.warn(`Unknown status effect: ${effectType}`);
            return false;
        }

        // Initialize effects array if needed
        if (!entity.statusEffects) {
            entity.statusEffects = [];
        }

        // Check if effect already exists (no stacking unless allowed)
        const existing = entity.statusEffects.find(e => e.type === effectType);
        if (existing && !template.canStack) {
            // Refresh duration instead
            existing.remainingTurns = duration || template.duration;
            return true;
        }

        // Create new effect instance
        const effect = {
            type: effectType,
            name: template.name,
            description: template.description,
            icon: template.icon,
            color: template.color,
            remainingTurns: duration || template.duration,
            damagePerTurn: template.damagePerTurn || 0,
            atkReduction: template.atkReduction || 0,
            defReduction: template.defReduction || 0,
            skipsNextTurn: template.skipsNextTurn || false,
            preventMove: template.preventMove || false,
            incomingDamageMultiplier: template.incomingDamageMultiplier || 1,
            appliedTurn: 0
        };

        entity.statusEffects.push(effect);

        // Apply immediate stat changes
        this.updateEntityStats(entity);

        return true;
    }

    /**
     * Remove a specific status effect from an entity
     * @param {Object} entity - Entity to affect
     * @param {string} effectType - Type of effect to remove
     */
    removeEffect(entity, effectType) {
        if (!entity.statusEffects) return;

        entity.statusEffects = entity.statusEffects.filter(e => e.type !== effectType);
        this.updateEntityStats(entity);
    }

    /**
     * Remove all status effects from an entity
     * @param {Object} entity - Entity to clear
     */
    clearAllEffects(entity) {
        if (!entity.statusEffects) return;
        entity.statusEffects = [];
        this.updateEntityStats(entity);
    }

    /**
     * Process status effects for one turn
     * Applies damage, decrements duration, removes expired effects
     * @param {Object} entity - Entity to process
     * @returns {Object} - Effect damage summary
     */
    processEffectsTurn(entity) {
        if (!entity.statusEffects || entity.statusEffects.length === 0) {
            return { totalDamage: 0, damageBreakdown: {} };
        }

        const summary = {
            totalDamage: 0,
            damageBreakdown: {}
        };

        // Process each active effect
        for (let i = entity.statusEffects.length - 1; i >= 0; i--) {
            const effect = entity.statusEffects[i];

            // Apply per-turn damage
            if (effect.damagePerTurn > 0) {
                const damage = Math.max(1, Math.floor(effect.damagePerTurn));
                summary.totalDamage += damage;
                summary.damageBreakdown[effect.type] = (summary.damageBreakdown[effect.type] || 0) + damage;
            }

            // Decrement duration
            effect.remainingTurns--;

            // Remove if expired
            if (effect.remainingTurns <= 0) {
                entity.statusEffects.splice(i, 1);
            }
        }

        // Apply damage if any
        if (summary.totalDamage > 0) {
            entity.currentHP = Math.max(0, entity.currentHP - summary.totalDamage);
        }

        // Update stats in case effects changed
        this.updateEntityStats(entity);

        return summary;
    }

    /**
     * Update entity's combat stats based on active effects
     * @param {Object} entity - Entity to update
     */
    updateEntityStats(entity) {
        if (!entity.statusEffects || entity.statusEffects.length === 0) {
            // No effects - use base stats
            entity.totalATK = entity.baseATK;
            entity.totalDEF = entity.baseDEF;
            return;
        }

        // Start with base stats
        let atkModifier = 0;
        let defModifier = 0;

        // Apply all effect modifiers
        entity.statusEffects.forEach(effect => {
            atkModifier -= effect.atkReduction || 0;
            defModifier -= effect.defReduction || 0;
        });

        // Apply equipment bonuses if entity has them
        const atkFromEquip = entity.equipment ? (entity.equipment.weapon?.atkBonus || 0) : 0;
        const defFromEquip = entity.equipment ? (entity.equipment.armor?.defBonus || 0) : 0;

        // Set final stats (minimum 1)
        entity.totalATK = Math.max(1, (entity.baseATK || 0) + atkFromEquip + atkModifier);
        entity.totalDEF = Math.max(0, (entity.baseDEF || 0) + defFromEquip + defModifier);
    }

    /**
     * Check if entity can move (not frozen/stunned)
     * @param {Object} entity - Entity to check
     * @returns {boolean} - Whether entity can move
     */
    canMove(entity) {
        if (!entity.statusEffects) return true;

        return !entity.statusEffects.some(e => 
            e.preventMove || e.skipsNextTurn
        );
    }

    /**
     * Check if entity should skip their next turn
     * @param {Object} entity - Entity to check
     * @returns {boolean} - Whether entity should skip
     */
    shouldSkipTurn(entity) {
        if (!entity.statusEffects) return false;

        const stunned = entity.statusEffects.find(e => e.skipsNextTurn);
        if (stunned) {
            // Remove stun after checking (it only lasts one turn)
            this.removeEffect(entity, 'stun');
            return true;
        }

        return false;
    }

    /**
     * Modify incoming damage based on status effects
     * @param {Object} entity - Entity taking damage
     * @param {number} baseDamage - Base damage amount
     * @returns {number} - Modified damage amount
     */
    modifyIncomingDamage(entity, baseDamage) {
        if (!entity.statusEffects) return baseDamage;

        let multiplier = 1;

        entity.statusEffects.forEach(effect => {
            if (effect.incomingDamageMultiplier) {
                multiplier *= effect.incomingDamageMultiplier;
            }
        });

        return Math.ceil(baseDamage * multiplier);
    }

    /**
     * Try to apply random status effects after a hit
     * @param {Object} attacker - The attacker
     * @param {Object} defender - The defender
     * @param {Object} attackResult - Combat result object
     */
    applyEffectsOnHit(attacker, defender, attackResult) {
        if (!attackResult || !attackResult.success) return;

        // Only apply on critical hits or with special effects
        if (!attackResult.isCritical) return;

        // Try to apply random effects based on chance
        const effectTypes = Object.keys(this.effectTemplates);

        effectTypes.forEach(effectType => {
            const template = this.effectTemplates[effectType];
            const chance = attackResult.isCritical ? template.chance * 2 : template.chance;

            if (Math.random() < chance) {
                this.applyEffect(defender, effectType);
            }
        });
    }

    /**
     * Get all active effects on an entity
     * @param {Object} entity - Entity to check
     * @returns {Array} - Array of active effects
     */
    getActiveEffects(entity) {
        return entity.statusEffects || [];
    }

    /**
     * Get effect description for display
     * @param {Object} effect - Effect object
     * @returns {string} - Formatted description
     */
    formatEffectDisplay(effect) {
        return `${effect.icon} ${effect.name} (${effect.remainingTurns} turns)`;
    }

    /**
     * Get all effects as formatted strings
     * @param {Object} entity - Entity to check
     * @returns {Array} - Array of formatted effect strings
     */
    getEffectsForDisplay(entity) {
        if (!entity.statusEffects) return [];
        return entity.statusEffects.map(e => this.formatEffectDisplay(e));
    }

    /**
     * Clear stun effect (used after turn processing)
     * @param {Object} entity - Entity to unstun
     */
    clearStun(entity) {
        this.removeEffect(entity, 'stun');
    }
}

// Export singleton instance
const statusEffectSystem = new StatusEffectSystem();
export { statusEffectSystem };
export default StatusEffectSystem;
