/**
 * AbilitySystem.js - Class-specific abilities and skills
 * 
 * Manages all class-specific abilities:
 * - Ability definitions for Warrior, Barbarian, and Rogue
 * - Cooldown tracking and mana/resource management
 * - Ability casting and effects
 * - Balance and scaling with player stats
 * 
 * Each class has 3 core abilities + 1 ultimate ability:
 * 
 * WARRIOR (Tank/Defender):
 * - Shield Bash: AOE stun, medium cooldown, scales with DEF
 * - Cleave: Multi-hit attack, medium cooldown, scales with ATK
 * - Parry: Defensive stance, reduce damage, scales with DEF
 * - ULTIMATE - Whirlwind: 360° attack all enemies, long cooldown
 * 
 * BARBARIAN (Damage/Aggression):
 * - Whirlwind Attack: 360° multi-enemy hit, medium cooldown
 * - Reckless Strike: High damage + recoil, short cooldown
 * - Blood Rage: ATK boost + take more damage, buff duration
 * - ULTIMATE - Apocalypse: Massive damage all enemies, long cooldown
 * 
 * ROGUE (Mobility/Precision):
 * - Backstab: High crit, position-based, short cooldown
 * - Evasion: Dodge incoming attacks, short cooldown
 * - Poison Strike: Apply poison effect, medium cooldown
 * - ULTIMATE - Shadow Clone: Duplicate attack, long cooldown
 */

export class AbilitySystem {
    constructor() {
        // Ability cooldown tracking
        this.cooldowns = new Map(); // { 'playerId_abilityId': turnsRemaining }
        
        // Player resource tracking (mana/stamina)
        this.playerResources = new Map(); // { playerId: { current, max, regen } }
        
        // Define all abilities for each class
        this.abilityDefinitions = {
            warrior: [
                {
                    id: 'shield_bash',
                    name: 'Shield Bash',
                    description: 'Bash nearby enemies with your shield, stunning them.',
                    icon: 'ability_shield_bash.png',
                    type: 'stun', // Can be: damage, stun, buff, debuff, heal, aoe
                    cooldown: 3,
                    resourceCost: 0,
                    range: 1, // Adjacent tiles
                    radius: 2, // AOE radius (affects 1 + AOE)
                    damage: 1.2, // 120% of base ATK
                    effect: { type: 'stun', duration: 1 },
                    scaling: 'DEF', // Scales with DEF stat
                    scalingFactor: 0.5, // Each DEF point = 0.5 damage
                    tooltip: 'Stun nearby enemies. Scales with Defense.'
                },
                {
                    id: 'cleave',
                    name: 'Cleave',
                    description: 'A powerful slash hitting multiple enemies in front.',
                    icon: 'ability_cleave.png',
                    type: 'damage',
                    cooldown: 2,
                    resourceCost: 0,
                    range: 2,
                    radius: 1,
                    damage: 1.8, // 180% of base ATK
                    effect: null,
                    scaling: 'ATK',
                    scalingFactor: 1.0,
                    tooltip: 'Multi-hit attack. High damage, medium cooldown.'
                },
                {
                    id: 'parry',
                    name: 'Parry',
                    description: 'Take a defensive stance, reducing incoming damage.',
                    icon: 'ability_parry.png',
                    type: 'buff',
                    cooldown: 4,
                    resourceCost: 0,
                    range: 0, // Self
                    radius: 0,
                    damage: 0,
                    effect: { type: 'weakness', duration: 0 }, // Custom: parry (DEF +50%)
                    scaling: 'DEF',
                    scalingFactor: 0.3,
                    tooltip: 'Reduce damage by 50% for next attack.'
                },
                {
                    id: 'whirlwind_ultimate',
                    name: 'Whirlwind',
                    icon: 'ability_whirlwind.png',
                    type: 'ultimate',
                    cooldown: 8,
                    resourceCost: 0,
                    range: 0,
                    radius: 3, // Large AOE
                    damage: 1.5,
                    effect: null,
                    scaling: 'ATK',
                    scalingFactor: 1.2,
                    tooltip: 'ULTIMATE: Spin attack hitting all nearby enemies!'
                }
            ],
            
            barbarian: [
                {
                    id: 'reckless_strike',
                    name: 'Reckless Strike',
                    description: 'Attack with reckless abandon for massive damage.',
                    icon: 'ability_reckless.png',
                    type: 'damage',
                    cooldown: 2,
                    resourceCost: 0,
                    range: 1,
                    radius: 0,
                    damage: 2.5, // 250% of base ATK - HIGHEST damage
                    effect: { type: 'custom', id: 'recoil', value: 10 }, // Take 10 damage back
                    scaling: 'ATK',
                    scalingFactor: 1.5, // High scaling
                    tooltip: 'Massive damage but take recoil damage!'
                },
                {
                    id: 'whirlwind_attack',
                    name: 'Whirlwind Attack',
                    description: 'Spin in a circle, hitting all nearby enemies.',
                    icon: 'ability_whirlwind_atk.png',
                    type: 'damage',
                    cooldown: 3,
                    resourceCost: 0,
                    range: 0,
                    radius: 2,
                    damage: 1.4,
                    effect: null,
                    scaling: 'ATK',
                    scalingFactor: 1.0,
                    tooltip: 'Hit all nearby enemies.'
                },
                {
                    id: 'blood_rage',
                    name: 'Blood Rage',
                    description: 'Enter a state of rage, increasing ATK significantly.',
                    icon: 'ability_blood_rage.png',
                    type: 'buff',
                    cooldown: 4,
                    resourceCost: 0,
                    range: 0,
                    radius: 0,
                    damage: 0,
                    effect: { type: 'custom', id: 'blood_rage', duration: 3 }, // +50% ATK for 3 turns
                    scaling: 'ATK',
                    scalingFactor: 0.2,
                    tooltip: '+50% ATK for 3 turns, but take more damage!'
                },
                {
                    id: 'apocalypse_ultimate',
                    name: 'Apocalypse',
                    icon: 'ability_apocalypse.png',
                    type: 'ultimate',
                    cooldown: 8,
                    resourceCost: 0,
                    range: 0,
                    radius: 4, // HUGE AOE
                    damage: 3.0, // MASSIVE damage
                    effect: null,
                    scaling: 'ATK',
                    scalingFactor: 2.0,
                    tooltip: 'ULTIMATE: Destroy all enemies in a massive explosion!'
                }
            ],
            
            rogue: [
                {
                    id: 'backstab',
                    name: 'Backstab',
                    description: 'A precise strike that deals extra damage based on critical chance.',
                    icon: 'ability_backstab.png',
                    type: 'damage',
                    cooldown: 2,
                    resourceCost: 0,
                    range: 1,
                    radius: 0,
                    damage: 1.6,
                    effect: null,
                    scaling: 'CRT', // Scales with critical chance!
                    scalingFactor: 2.0, // Double benefit from CRT
                    tooltip: 'Precise attack. Scales with Critical Chance.'
                },
                {
                    id: 'evasion',
                    name: 'Evasion',
                    description: 'Dodge incoming attacks for a short time.',
                    icon: 'ability_evasion.png',
                    type: 'buff',
                    cooldown: 3,
                    resourceCost: 0,
                    range: 0,
                    radius: 0,
                    damage: 0,
                    effect: { type: 'custom', id: 'evasion', duration: 1 }, // Dodge next hit
                    scaling: 'CRT',
                    scalingFactor: 0.1,
                    tooltip: 'Dodge the next attack against you.'
                },
                {
                    id: 'poison_strike',
                    name: 'Poison Strike',
                    description: 'Strike with a poisoned blade, applying poison status.',
                    icon: 'ability_poison.png',
                    type: 'debuff',
                    cooldown: 2,
                    resourceCost: 0,
                    range: 1,
                    radius: 0,
                    damage: 0.8,
                    effect: { type: 'poison', duration: 3 }, // Apply poison for 3 turns
                    scaling: 'ATK',
                    scalingFactor: 0.8,
                    tooltip: 'Apply Poison status effect (3 turns).'
                },
                {
                    id: 'shadow_clone_ultimate',
                    name: 'Shadow Clone',
                    icon: 'ability_shadow.png',
                    type: 'ultimate',
                    cooldown: 8,
                    resourceCost: 0,
                    range: 1,
                    radius: 0,
                    damage: 2.2, // Two attacks combined
                    effect: null,
                    scaling: 'CRT',
                    scalingFactor: 2.5,
                    tooltip: 'ULTIMATE: Shadow duplicate attacks your enemy!'
                }
            ]
        };
    }

    /**
     * Get all abilities for a specific class
     * @param {string} classKey - The class (warrior, barbarian, rogue)
     * @returns {Array} - Array of ability definitions
     */
    getAbilitiesForClass(classKey) {
        return this.abilityDefinitions[classKey] || [];
    }

    /**
     * Get a specific ability definition by ID
     * @param {string} abilityId - The ability ID
     * @returns {Object|null} - The ability definition or null
     */
    getAbility(abilityId) {
        for (const classAbilities of Object.values(this.abilityDefinitions)) {
            const ability = classAbilities.find(a => a.id === abilityId);
            if (ability) return ability;
        }
        return null;
    }

    /**
     * Check if an ability is off cooldown
     * @param {string} playerId - The player ID
     * @param {string} abilityId - The ability ID
     * @returns {boolean} - True if ability is ready to cast
     */
    isAbilityReady(playerId, abilityId) {
        const cooldownKey = `${playerId}_${abilityId}`;
        const cooldownRemaining = this.cooldowns.get(cooldownKey) || 0;
        return cooldownRemaining <= 0;
    }

    /**
     * Get cooldown remaining in turns
     * @param {string} playerId - The player ID
     * @param {string} abilityId - The ability ID
     * @returns {number} - Turns remaining (0 if ready)
     */
    getCooldownRemaining(playerId, abilityId) {
        const cooldownKey = `${playerId}_${abilityId}`;
        return Math.max(0, this.cooldowns.get(cooldownKey) || 0);
    }

    /**
     * Reduce all cooldowns by 1 turn (call this each game turn)
     * @param {string} playerId - The player ID
     */
    reduceCooldowns(playerId) {
        const playerCooldowns = Array.from(this.cooldowns.entries()).filter(
            ([key]) => key.startsWith(`${playerId}_`)
        );

        for (const [key, remaining] of playerCooldowns) {
            if (remaining > 0) {
                this.cooldowns.set(key, remaining - 1);
            }
        }
    }

    /**
     * Cast an ability and calculate its effects
     * @param {Object} caster - The player entity
     * @param {string} abilityId - The ability ID to cast
     * @param {Array<Object>} targets - Array of target entities
     * @returns {Object} - Ability result with all effects
     */
    castAbility(caster, abilityId, targets = []) {
        const ability = this.getAbility(abilityId);
        
        if (!ability) {
            return {
                success: false,
                reason: `Ability '${abilityId}' not found`
            };
        }

        // Check if ability is off cooldown
        if (!this.isAbilityReady(caster.id, abilityId)) {
            return {
                success: false,
                reason: `${ability.name} is on cooldown for ${this.getCooldownRemaining(caster.id, abilityId)} more turns`,
                onCooldown: true
            };
        }

        // Check resource cost (mana/stamina)
        const playerResources = this.playerResources.get(caster.id);
        if (ability.resourceCost > 0) {
            if (!playerResources || playerResources.current < ability.resourceCost) {
                return {
                    success: false,
                    reason: `Not enough mana. Need ${ability.resourceCost}, have ${playerResources?.current || 0}`
                };
            }
        }

        // Calculate damage with scaling
        let damagePerTarget = 0;
        if (ability.damage > 0) {
            damagePerTarget = this.calculateAbilityDamage(caster, ability);
        }

        // Apply cooldown
        const cooldownKey = `${caster.id}_${abilityId}`;
        this.cooldowns.set(cooldownKey, ability.cooldown);

        // Deduct resources
        if (ability.resourceCost > 0 && playerResources) {
            playerResources.current -= ability.resourceCost;
        }

        // Apply effects to each target
        const results = targets.map(target => this.applyAbilityEffects(caster, target, ability, damagePerTarget));

        return {
            success: true,
            ability: ability.name,
            abilityId: abilityId,
            caster: caster.name,
            castTime: Date.now(),
            damagePerTarget: damagePerTarget,
            effects: ability.effect,
            results: results,
            cooldownSet: ability.cooldown
        };
    }

    /**
     * Calculate ability damage with stat scaling
     * @param {Object} caster - The player entity
     * @param {Object} ability - The ability definition
     * @returns {number} - Total damage value
     */
    calculateAbilityDamage(caster, ability) {
        let baseDamage = caster.totalATK * ability.damage;
        let scalingBonus = 0;

        // Apply stat-based scaling
        if (ability.scaling === 'ATK') {
            scalingBonus = caster.totalATK * ability.scalingFactor;
        } else if (ability.scaling === 'DEF') {
            scalingBonus = caster.totalDEF * ability.scalingFactor;
        } else if (ability.scaling === 'CRT') {
            // Crit scales as percentage value (e.g., 15% = 0.15)
            scalingBonus = (caster.totalCRT / 100) * caster.totalATK * ability.scalingFactor;
        }

        return Math.round(baseDamage + scalingBonus);
    }

    /**
     * Apply ability effects to a single target
     * @param {Object} caster - The ability caster
     * @param {Object} target - The target entity
     * @param {Object} ability - The ability definition
     * @param {number} damage - Calculated damage
     * @returns {Object} - Result of applying effects
     */
    applyAbilityEffects(caster, target, ability, damage) {
        const result = {
            targetName: target.name,
            success: true,
            damageDealt: 0,
            effectsApplied: []
        };

        // Apply damage
        if (damage > 0) {
            const died = target.takeDamage(damage);
            result.damageDealt = damage;
            result.targetDied = died;
        }

        // Apply status effect if specified
        if (ability.effect && ability.effect.type) {
            result.effectsApplied.push({
                type: ability.effect.type,
                duration: ability.effect.duration
            });
        }

        return result;
    }

    /**
     * Initialize player resources (mana/stamina)
     * @param {string} playerId - The player ID
     * @param {number} maxResource - Maximum mana/stamina
     * @param {number} regenPerTurn - Regeneration per turn
     */
    initializeResources(playerId, maxResource = 100, regenPerTurn = 10) {
        this.playerResources.set(playerId, {
            current: maxResource,
            max: maxResource,
            regen: regenPerTurn
        });
    }

    /**
     * Regenerate resources at the end of each turn
     * @param {string} playerId - The player ID
     */
    regenerateResources(playerId) {
        const resources = this.playerResources.get(playerId);
        if (resources) {
            resources.current = Math.min(resources.max, resources.current + resources.regen);
        }
    }

    /**
     * Get remaining resource (mana/stamina) for display
     * @param {string} playerId - The player ID
     * @returns {Object|null} - { current, max } or null if not initialized
     */
    getResources(playerId) {
        return this.playerResources.get(playerId) || null;
    }
}

// Export singleton instance
export const abilitySystem = new AbilitySystem();
