/**
 * Enemy.js - Enemy entity with AI behavior
 * 
 * Represents an enemy in the dungeon with:
 * - Stats (HP, ATK, DEF, CRT)
 * - AI state machine (wander, chase, attack, idle)
 * - Pathfinding and movement
 * - Combat calculations
 * 
 * Enemies have two main behaviors:
 * 1. Wander - roam randomly when player is far away
 * 2. Chase - pursue player when in detection range
 */

import { CONFIG, TILE_TYPES } from '../config.js';

export class Enemy {
    constructor(data) {
        // Basic info
        this.id = data.id || `enemy_${Date.now()}`;
        this.type = 'enemy';
        this.name = data.name || 'Enemy';
        this.sprite = data.sprite || 'enemy.png';
        
        // Position
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.floor = data.floor || 1;
        
        // Stats
        this.maxHP = data.maxHP || 20;
        this.currentHP = data.currentHP || this.maxHP;
        this.baseATK = data.baseATK || 5;
        this.baseDEF = data.baseDEF || 2;
        this.baseCRT = data.baseCRT || 5;
        
        // Combat stats (same as player)
        this.totalATK = this.baseATK;
        this.totalDEF = this.baseDEF;
        this.totalCRT = this.baseCRT;
        
        // AI State Machine
        this.aiState = 'idle';  // idle, wander, chase, attack
        this.detectionRange = data.detectionRange || 8;
        this.wanderRadius = data.wanderRadius || 5;
        this.lastWanderPos = { x: this.x, y: this.y };
        this.wanderTimer = 0;
        this.wanderChangeInterval = 3; // Change target every N turns
        this.chasePath = [];
        this.targetPlayer = null;
        // Wandering target (a specific tile to roam towards)
        this.wanderTarget = null;
        this.wanderPath = [];
        
        // Combat
        this.experienceReward = data.experienceReward || 50;
        this.goldReward = data.goldReward || 10;
        this.isAlive = true;
    }
    
    /**
     * Execute one turn of enemy behavior
     * @param {Player} player - The player to interact with
     * @param {Dungeon} dungeon - The current dungeon
     * @returns {Promise<void>}
     */
    async takeTurn(player, dungeon) {
        if (!this.isAlive || this.currentHP <= 0) {
            this.isAlive = false;
            return;
        }
        
        // Calculate distance to player
        const distToPlayer = this.getDistanceTo(player.x, player.y);
        
        // Decide AI state based on distance
        if (distToPlayer <= this.detectionRange) {
            // Player detected - switch to chase mode
            this.aiState = 'chase';
            this.targetPlayer = player;
        } else {
            // Player too far - wander or idle
            this.aiState = 'wander';
            this.targetPlayer = null;
        }
        
        // Execute behavior based on current state
        if (this.aiState === 'chase') {
            await this.executeChase(player, dungeon);
        } else if (this.aiState === 'wander') {
            await this.executeWander(dungeon);
        } else {
            // Idle - do nothing
        }
    }
    
    /**
     * Chase the player using simple pathfinding
     * @param {Player} player - The player to chase
     * @param {Dungeon} dungeon - The current dungeon
     */
    async executeChase(player, dungeon) {
        const distToPlayer = this.getDistanceTo(player.x, player.y);

        // If adjacent to player, attack instead of moving
        if (distToPlayer <= 1) {
            // Combat handled elsewhere; try to stay adjacent
            return;
        }

        // Find path to player using BFS
        const path = this.findPathToPlayer(player, dungeon);

        if (path && path.length > 0) {
            // Move one step along the path
            const nextPos = path[0];

            // Check if tile is walkable and not occupied
            if (dungeon.isWalkable(nextPos.x, nextPos.y)) {
                const entityAtPos = dungeon.getEntityAt(nextPos.x, nextPos.y);
                if (!entityAtPos) {
                    this.x = nextPos.x;
                    this.y = nextPos.y;
                }
            }
        } else {
            // No path found to player (maybe blocked) → fallback to wandering behavior
            this.aiState = 'wander';
            this.targetPlayer = null;
            this.wanderTimer = this.wanderChangeInterval; // force pick new wander target next turn
        }
    }
    
    /**
     * Wander around randomly
     * @param {Dungeon} dungeon - The current dungeon
     */
    async executeWander(dungeon) {
        // Increase timer and decide when to pick a new target
        this.wanderTimer++;

        // If we don't have a wander target or it's time to change, pick a new one
        if (!this.wanderTarget || this.wanderTimer >= this.wanderChangeInterval) {
            this.wanderTimer = 0;
            this.wanderTarget = this.pickRandomWanderTarget(dungeon);
            if (this.wanderTarget) {
                // Compute path to target
                this.wanderPath = this.findPathToTile(this.wanderTarget.x, this.wanderTarget.y, dungeon) || [];
            } else {
                this.wanderPath = [];
            }
        }

        // If we have a path towards the wander target, step along it
        if (this.wanderPath && this.wanderPath.length > 0) {
            const nextPos = this.wanderPath.shift();
            if (dungeon.isWalkable(nextPos.x, nextPos.y) && !dungeon.getEntityAt(nextPos.x, nextPos.y)) {
                this.x = nextPos.x;
                this.y = nextPos.y;
            } else {
                // Blocked; abandon this target
                this.wanderTarget = null;
                this.wanderPath = [];
            }

            // If reached target, clear it so a new target will be chosen later
            if (this.wanderTarget && this.x === this.wanderTarget.x && this.y === this.wanderTarget.y) {
                this.wanderTarget = null;
                this.wanderPath = [];
            }
        } else {
            // No path: try a small random step so enemies look alive
            const directions = [
                { dx: 0, dy: -1 },
                { dx: 0, dy: 1 },
                { dx: -1, dy: 0 },
                { dx: 1, dy: 0 }
            ];
            const shuffled = directions.sort(() => Math.random() - 0.5);
            for (const dir of shuffled) {
                const nx = this.x + dir.dx;
                const ny = this.y + dir.dy;
                if (dungeon.isWalkable(nx, ny) && !dungeon.getEntityAt(nx, ny)) {
                    this.x = nx;
                    this.y = ny;
                    break;
                }
            }
        }
    }
    
    /**
     * Find path to player using breadth-first search (BFS)
     * @param {Player} player - The target player
     * @param {Dungeon} dungeon - The current dungeon
     * @returns {Array} - Array of {x, y} positions leading to player
     */
    findPathToPlayer(player, dungeon) {
        return this.findPathToTile(player.x, player.y, dungeon);
    }

    /**
     * Find a path to an arbitrary tile using BFS
     * @param {number} tx - Target x
     * @param {number} ty - Target y
     * @param {Dungeon} dungeon
     * @returns {Array|null} - path as array of {x,y} excluding start
     */
    findPathToTile(tx, ty, dungeon) {
        // Simple BFS pathfinding
        const queue = [[{ x: this.x, y: this.y }]];
        const visited = new Set();
        visited.add(`${this.x},${this.y}`);

        const maxSearchSteps = 200; // Allow a slightly larger search for wander targets
        let searchSteps = 0;

        while (queue.length > 0 && searchSteps < maxSearchSteps) {
            searchSteps++;
            const path = queue.shift();
            const current = path[path.length - 1];

            // Check if we reached the target tile
            if (current.x === tx && current.y === ty) {
                // Return path without the starting position
                return path.slice(1);
            }

            // Explore neighbors (up, down, left, right)
            const neighbors = [
                { x: current.x, y: current.y - 1 }, // up
                { x: current.x, y: current.y + 1 }, // down
                { x: current.x - 1, y: current.y }, // left
                { x: current.x + 1, y: current.y }  // right
            ];

            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;

                if (!visited.has(key) && dungeon.isWalkable(neighbor.x, neighbor.y)) {
                    visited.add(key);
                    const newPath = [...path, neighbor];
                    queue.push(newPath);
                }
            }
        }

        // No path found
        return null;
    }
    
    /**
     * Calculate distance to a position (using Chebyshev distance for grid-based)
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @returns {number} - Distance in tiles
     */
    getDistanceTo(targetX, targetY) {
        const dx = Math.abs(this.x - targetX);
        const dy = Math.abs(this.y - targetY);
        // Chebyshev distance (max of dx, dy) for 8-directional movement
        return Math.max(dx, dy);
    }

    /**
     * Pick a random wander target within the enemy's wander radius
     * @param {Dungeon} dungeon
     * @returns {Object|null} - {x, y} or null if none found
     */
    pickRandomWanderTarget(dungeon) {
        const candidates = [];
        for (let dx = -this.wanderRadius; dx <= this.wanderRadius; dx++) {
            for (let dy = -this.wanderRadius; dy <= this.wanderRadius; dy++) {
                const tx = this.lastWanderPos.x + dx;
                const ty = this.lastWanderPos.y + dy;
                if (dungeon.isWalkable(tx, ty) && Math.max(Math.abs(dx), Math.abs(dy)) <= this.wanderRadius) {
                    // Avoid selecting current tile
                    if (tx === this.x && ty === this.y) continue;
                    candidates.push({ x: tx, y: ty });
                }
            }
        }

        if (candidates.length === 0) return null;
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    /**
     * Calculate attack damage (similar to Player)
     * @returns {Object} - Attack result with damage and isCritical
     */
    calculateAttack() {
        const isCritical = Math.random() * 100 < this.totalCRT;
        const baseDamage = this.totalATK;
        const damageMultiplier = isCritical ? CONFIG.CRITICAL_MULTIPLIER : 1;
        
        return {
            damage: Math.max(1, Math.floor(baseDamage * damageMultiplier)),
            isCritical
        };
    }
    
    /**
     * Take damage and possibly die
     * @param {number} damage - Damage amount to take
     * @returns {boolean} - True if enemy died
     */
    takeDamage(damage) {
        // Calculate defense reduction (max 75%)
        const damageReduction = Math.min(this.totalDEF / (this.totalDEF + 100), 0.75);
        const actualDamage = Math.max(1, Math.floor(damage * (1 - damageReduction)));
        
        this.currentHP = Math.max(0, this.currentHP - actualDamage);
        
        if (this.currentHP === 0) {
            this.isAlive = false;
            return true; // Enemy died
        }
        return false;
    }
    
    /**
     * Heal the enemy
     * @param {number} amount - Heal amount
     * @returns {number} - Actual amount healed
     */
    heal(amount) {
        const oldHP = this.currentHP;
        this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
        return this.currentHP - oldHP;
    }
    
    /**
     * Serialize enemy for saving
     * @returns {Object} - Serialized enemy data
     */
    serialize() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            sprite: this.sprite,
            x: this.x,
            y: this.y,
            floor: this.floor,
            maxHP: this.maxHP,
            currentHP: this.currentHP,
            baseATK: this.baseATK,
            baseDEF: this.baseDEF,
            baseCRT: this.baseCRT,
            detectionRange: this.detectionRange,
            wanderRadius: this.wanderRadius,
            experienceReward: this.experienceReward,
            goldReward: this.goldReward
        };
    }
    
    /**
     * Static method to create an enemy from serialized data
     * @param {Object} data - Serialized data
     * @returns {Enemy} - New enemy instance
     */
    static deserialize(data) {
        return new Enemy(data);
    }
}

export default Enemy;
