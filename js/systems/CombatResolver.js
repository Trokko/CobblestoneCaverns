/**
 * CombatResolver.js - Turn-based combat system
 * 
 * Handles all combat interactions:
 * - Melee attacks between player and enemies
 * - Damage calculation with defense modifiers
 * - Critical hits and effects
 * - Combat logging and events
 * - Death handling and loot
 * - Status effect application
 * 
 * The combat system is designed to be:
 * - Fair (both sides use same damage formula)
 * - Tactical (positioning matters, effects matter)
 * - Rewarding (clear feedback on hits)
 */

import { CONFIG } from '../config.js';
import { itemSystem } from './ItemSystem.js';
import { statusEffectSystem } from './StatusEffectSystem.js';
import { abilitySystem } from './AbilitySystem.js';

export class CombatResolver {
    constructor() {
        this.lastCombatLog = null;
        this.combatHistory = [];
    }

    /**
     * Resolve a melee attack from attacker to defender
     * @param {Object} attacker - The attacking entity (Player or Enemy)
     * @param {Object} defender - The defending entity (Player or Enemy)
     * @returns {Object} - Combat result with detailed information
     */
    resolveAttack(attacker, defender) {
        if (!attacker || !defender) {
            return this.createCombatResult({
                success: false,
                reason: 'Invalid attacker or defender'
            });
        }

        // Calculate attack
        const attackRoll = attacker.calculateAttack();
        
        // Apply status effect modifiers (e.g., burn reduces ATK)
        let finalDamage = attackRoll.damage;
        
        // Modify damage based on defender's status effects (e.g., bleed takes more)
        finalDamage = statusEffectSystem.modifyIncomingDamage(defender, finalDamage);
        
        // Defender takes damage with their defense
        const defenderDied = defender.takeDamage(finalDamage);

        // Build combat result
        const result = {
            success: true,
            attacker: attacker.name,
            defender: defender.name,
            
            // Attack details
            attackDamage: finalDamage,
            baseDamage: attackRoll.damage,
            isCritical: attackRoll.isCritical,
            baseATK: attacker.totalATK,
            defenderDEF: defender.totalDEF,
            
            // Defense calculation
            damageReduction: Math.min(defender.totalDEF / (defender.totalDEF + 100), 0.75),
            
            // Outcome
            defenderHP: Math.max(0, defender.currentHP),
            defenderMaxHP: defender.maxHP,
            defenderDied: defenderDied,
            
            // Timestamp
            timestamp: Date.now()
        };

        // Try to apply status effects on critical hits (doubled chance)
        statusEffectSystem.applyEffectsOnHit(attacker, defender, result);

        // Store in history
        this.combatHistory.push(result);
        this.lastCombatLog = result;

        return result;
    }

    /**
     * Resolve an ability cast from caster to target(s)
     * @param {Object} caster - The player casting the ability
     * @param {string} abilityId - The ability ID to cast
     * @param {Array<Object>} targets - Array of target enemies
     * @param {Object} dungeon - Current dungeon (for entity removal on death)
     * @returns {Object} - Ability result with detailed information
     */
    resolveAbility(caster, abilityId, targets = [], dungeon = null) {
        // Validate ability exists
        const ability = abilitySystem.getAbility(abilityId);
        if (!ability) {
            return {
                success: false,
                reason: `Ability '${abilityId}' not found`,
                timestamp: Date.now()
            };
        }

        // Validate targets
        if (!targets || targets.length === 0) {
            return {
                success: false,
                reason: 'No valid targets selected',
                timestamp: Date.now()
            };
        }

        // Check cooldown
        if (!abilitySystem.isAbilityReady(caster.id, abilityId)) {
            const remaining = abilitySystem.getCooldownRemaining(caster.id, abilityId);
            return {
                success: false,
                reason: `${ability.name} is on cooldown (${remaining} turns remaining)`,
                onCooldown: true,
                timestamp: Date.now()
            };
        }

        // Cast the ability
        const castResult = abilitySystem.castAbility(caster, abilityId, targets);
        
        if (!castResult.success) {
            return {
                success: false,
                reason: castResult.reason,
                timestamp: Date.now()
            };
        }

        // Store in combat history with ability context
        const historyEntry = {
            success: true,
            type: 'ability',
            ability: ability.name,
            abilityId: abilityId,
            caster: caster.name,
            targets: targets.map(t => t.name),
            damage: castResult.damagePerTarget,
            effects: castResult.effects,
            results: castResult.results,
            timestamp: Date.now()
        };

        this.combatHistory.push(historyEntry);
        this.lastCombatLog = historyEntry;

        // Handle deaths if dungeon provided
        if (dungeon) {
            castResult.results.forEach((result, index) => {
                if (result.targetDied && targets[index]) {
                    this.applyDeathEffects(targets[index], caster, dungeon);
                }
            });
        }

        return {
            success: true,
            ability: ability.name,
            abilityId: abilityId,
            caster: caster.name,
            damageDealt: castResult.damagePerTarget,
            targetsHit: targets.length,
            results: castResult.results,
            cooldownApplied: ability.cooldown,
            timestamp: Date.now()
        };
    }

    /**
     * Check if two entities can fight (are adjacent)
     * @param {Object} entity1 - First entity
     * @param {Object} entity2 - Second entity
     * @returns {boolean} - True if entities are adjacent (Chebyshev distance <= 1)
     */
    areAdjacent(entity1, entity2) {
        const dx = Math.abs(entity1.x - entity2.x);
        const dy = Math.abs(entity1.y - entity2.y);
        
        // Chebyshev distance (max of dx, dy)
        // 0 = same tile, 1 = adjacent, 2+ = not adjacent
        return Math.max(dx, dy) === 1;
    }

    /**
     * Check if two entities are at same position
     * @param {Object} entity1 - First entity
     * @param {Object} entity2 - Second entity
     * @returns {boolean} - True if entities are at same tile
     */
    areSamePosition(entity1, entity2) {
        return entity1.x === entity2.x && entity1.y === entity2.y;
    }

    /**
     * Get combat distance between two entities
     * @param {Object} entity1 - First entity
     * @param {Object} entity2 - Second entity
     * @returns {number} - Distance in tiles (0 = same, 1 = adjacent, etc.)
     */
    getCombatDistance(entity1, entity2) {
        const dx = Math.abs(entity1.x - entity2.x);
        const dy = Math.abs(entity1.y - entity2.y);
        return Math.max(dx, dy);
    }

    /**
     * Apply death effects (remove enemy, award loot, drop items)
     * @param {Object} deadEnemy - The enemy that died
     * @param {Object} killer - The player who defeated it
     * @param {Object} dungeon - The current dungeon
     * @returns {Object} - Loot and rewards
     */
    applyDeathEffects(deadEnemy, killer, dungeon) {
        if (!deadEnemy || deadEnemy.isAlive || deadEnemy.currentHP > 0) {
            return null; // Not actually dead
        }

        // Remove enemy from dungeon
        dungeon.removeEntity(deadEnemy);

        // Calculate rewards
        const rewards = {
            xp: deadEnemy.experienceReward || 0,
            gold: deadEnemy.goldReward || 0,
            items: [],
            timestamp: Date.now()
        };

        // Award XP to player
        const leveledUp = killer.addXP(rewards.xp);

        // Award gold to player
        killer.gold += rewards.gold;

        // Update player stats
        killer.stats.monstersKilled++;

        // Generate and spawn loot
        const loot = itemSystem.generateEnemyLoot(deadEnemy, killer.floor || 1);
        if (loot && loot.length > 0) {
            itemSystem.spawnItemsOnFloor(loot, deadEnemy.x, deadEnemy.y, dungeon);
            rewards.items = loot.map(item => item.name);
        }

        // Log the kill
        const itemStr = rewards.items.length > 0 ? ` | Loot: ${rewards.items.join(', ')}` : '';
        console.log(
            `Enemy defeated: ${deadEnemy.name} | XP: +${rewards.xp} | Gold: +${rewards.gold}${itemStr}`
        );

        return {
            ...rewards,
            leveledUp: leveledUp,
            killer: killer.name,
            victim: deadEnemy.name
        };
    }

    /**
     * Create a standardized combat result object
     * @param {Object} data - Combat data
     * @returns {Object} - Formatted combat result
     */
    createCombatResult(data) {
        return {
            success: data.success || false,
            reason: data.reason || null,
            timestamp: Date.now(),
            ...data
        };
    }

    /**
     * Format combat message for display
     * @param {Object} result - Combat result from resolveAttack
     * @returns {string} - Human-readable combat message
     */
    formatCombatMessage(result, isPlayerAttacker = false) {
        if (!result.success) {
            return `Combat failed: ${result.reason}`;
        }

        const attackerName = isPlayerAttacker ? 'You' : result.attacker;
        const defenderName = result.defender;
        const damage = result.attackDamage;
        const critical = result.isCritical ? ' CRITICAL!' : '';
        const killed = result.defenderDied ? ' [KILLED]' : '';
        const verb = isPlayerAttacker ? 'attack' : 'attacks';

        return `${attackerName} ${verb} ${defenderName} for ${damage} damage${critical}${killed}`;
    }

    /**
     * Get last combat log entry
     * @returns {Object|null} - Last combat result
     */
    getLastCombat() {
        return this.lastCombatLog;
    }

    /**
     * Get combat history
     * @param {number} limit - Maximum number of entries (default: 10)
     * @returns {Array} - Array of recent combat results
     */
    getCombatHistory(limit = 10) {
        return this.combatHistory.slice(-limit);
    }

    /**
     * Clear combat history
     */
    clearHistory() {
        this.combatHistory = [];
        this.lastCombatLog = null;
    }

    /**
     * Get combat statistics
     * @param {string} combatantName - Name of combatant to filter (optional)
     * @returns {Object} - Combat stats
     */
    getCombatStats(combatantName = null) {
        const logs = combatantName
            ? this.combatHistory.filter(
                  log => log.attacker === combatantName || log.defender === combatantName
              )
            : this.combatHistory;

        const stats = {
            totalCombats: logs.length,
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            criticalHits: 0,
            kills: 0
        };

        logs.forEach(log => {
            if (log.attacker === combatantName) {
                stats.totalDamageDealt += log.attackDamage;
                if (log.isCritical) stats.criticalHits++;
                if (log.defenderDied) stats.kills++;
            }
            if (log.defender === combatantName) {
                stats.totalDamageTaken += log.attackDamage;
            }
        });

        return stats;
    }

    /**
     * Simulate multiple combat rounds (for testing)
     * @param {Object} attacker - Attacking entity
     * @param {Object} defender - Defending entity
     * @returns {Array} - Array of combat results from each round
     */
    simulateCombat(attacker, defender) {
        const results = [];
        const maxRounds = 100; // Prevent infinite loops
        
        let round = 0;
        while (round < maxRounds && defender.currentHP > 0) {
            const result = this.resolveAttack(attacker, defender);
            results.push(result);
            round++;
        }

        return results;
    }
}

// Export singleton instance
export const combatResolver = new CombatResolver();

export default CombatResolver;
