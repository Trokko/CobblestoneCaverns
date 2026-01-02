# Enemy System Implementation Guide

## Overview

The Enemy system has been fully implemented for Cobblestone Caverns with the following features:

- **Wander AI**: Enemies patrol randomly when the player is not nearby
- **Chase AI**: Enemies pursue the player when detected within range
- **Pathfinding**: BFS (Breadth-First Search) algorithm for intelligent chasing
- **Combat Stats**: HP, ATK, DEF, CRT with floor scaling
- **Diverse Types**: 8+ enemy templates with varying difficulty
- **Progressive Difficulty**: Enemy stats scale with floor number

## Files Created/Modified

### New Files

1. **`js/entities/Enemy.js`** - Main Enemy class with AI implementation
   - `takeTurn(player, dungeon)` - Execute one turn of AI behavior
   - `executeChase(player, dungeon)` - Chase the player using pathfinding
   - `executeWander(dungeon)` - Random patrol behavior
   - `findPathToPlayer(player, dungeon)` - BFS pathfinding algorithm
   - Combat methods: `calculateAttack()`, `takeDamage()`, `heal()`

2. **`js/data/EnemyTemplates.js`** - Enemy type definitions and factory functions
   - 8 enemy types: Goblin, Skeleton, Orc, Rat, Zombie, Archer, Goblin King, Skeleton Knight
   - `getEnemyTemplate(key)` - Get template by key
   - `getEnemyTemplatesForFloor(floor)` - Get enemies appropriate for floor
   - `getEnemyStatMultiplier(floor)` - Calculate stat scaling
   - `createEnemyFromTemplate(key, floor, position)` - Factory function

### Modified Files

3. **`js/entities/Dungeon.js`** - Added enemy spawning
   - `spawnEnemies()` - Spawns 1-3 enemies per room (except first room)
   - `getRandomPositionInRoom(room)` - Find safe spawn positions
   - Integrated with dungeon generation

4. **`js/core/GameManager.js`** - Integrated enemies into game state
   - Updated `loadFloor()` to populate `gameState.enemies` with dungeon entities
   - Enemies automatically update each turn via GameStateManager

## AI System Architecture

### State Machine

```
┌─────────────┐
│    IDLE     │  Enemy does nothing (default state)
└──────┬──────┘
       │
       ├─────────────────────────────────────────────────┐
       │                                                 │
   (distance <= detectionRange)        (distance > detectionRange)
       │                                                 │
       ▼                                                 ▼
┌─────────────┐                                   ┌─────────────┐
│    CHASE    │                                   │    WANDER   │
│ - Pathfind  │                                   │ - Move      │
│ - Follow    │                                   │   randomly  │
└─────────────┘                                   └─────────────┘
```

### Behavior Details

#### Wander Behavior
- Enemy randomly selects a direction every 3 turns
- Changes direction based on wall collisions
- Stays within `wanderRadius` conceptually (can move anywhere)
- Low CPU cost, simple implementation

#### Chase Behavior
- Player detected within `detectionRange` (6-10 tiles based on enemy)
- Uses BFS pathfinding to find shortest path to player
- Moves one tile per turn along path
- Pathfinding limited to 50 search steps for performance
- Will give up and wander if no path found

### Pathfinding Algorithm

The `findPathToPlayer()` method uses Breadth-First Search (BFS):

```javascript
Queue = [[start_position]]
Visited = {start}

while Queue not empty:
  current_path = Queue.shift()
  current_pos = last position in current_path
  
  if current_pos == player_pos:
    return path[1:]  // exclude start position
  
  for each neighbor of current_pos:
    if neighbor not visited and neighbor is walkable:
      visited.add(neighbor)
      Queue.push(current_path + [neighbor])

return null  // no path found
```

**Why BFS?**
- Guarantees shortest path
- Grid-based movement (not Euclidean)
- 4-directional movement (up, down, left, right)
- Performance acceptable with search depth limit

## Enemy Templates

### Early Game (Floors 1-5)
- **Goblin**: 15 HP, 4 ATK, 1 DEF - Basic weak enemy
- **Rat**: 10 HP, 3 ATK, 0 DEF - Quick but fragile

### Mid Game (Floors 6-15)
- **Skeleton**: 20 HP, 6 ATK, 2 DEF - Balanced undead
- **Zombie**: 28 HP, 5 ATK, 2 DEF - Tanky but slow
- **Orc**: 35 HP, 7 ATK, 3 DEF - Strong fighter
- **Archer**: 18 HP, 7 ATK, 2 DEF - Ranged (higher detection)

### Late Game (Floors 16+)
- **Goblin King**: 35 HP, 8 ATK, 3 DEF - Elite goblin
- **Skeleton Knight**: 40 HP, 9 ATK, 5 DEF - Heavily armored

### Stat Scaling
- Base multiplier: 1.05× per floor
- Floor 1: 1.0×
- Floor 5: 1.22×
- Floor 10: 1.63×
- Floor 20: 2.65×

Example: Skeleton on Floor 10
```
Base: 20 HP, 6 ATK, 2 DEF
Floor 10 multiplier: 1.63×
Scaled: 33 HP, 10 ATK, 3 DEF
```

## Usage in Game

### Automatic Enemy Updates

Enemies are automatically processed each turn via `GameStateManager.processTurn()`:

```javascript
// In GameStateManager.processTurn()
for (const enemy of this.enemies) {
    if (enemy.isAlive && enemy.isAlive()) {
        if (enemy.takeTurn) {
            await enemy.takeTurn(this.player, this.dungeon);
        }
    }
}
```

### Accessing Enemies

```javascript
// Get all enemies on current floor
const enemies = gameState.enemies;

// Get specific enemy at position
const enemy = dungeon.getEntityAt(x, y);

// Filter enemies by type
const activeEnemies = dungeon.getEntitiesByType('enemy');
```

### Creating Custom Enemies

```javascript
import { Enemy } from './Enemy.js';

const customEnemy = new Enemy({
    name: 'Dragon',
    x: 25,
    y: 25,
    maxHP: 100,
    baseATK: 20,
    baseDEF: 10,
    baseCRT: 15,
    detectionRange: 15,
    experienceReward: 500,
    goldReward: 200
});

dungeon.addEntity(customEnemy);
```

## Combat Integration TODO

The enemy system is ready for combat integration. Next steps:

1. **Collision Detection** - Check if enemy is adjacent to player
2. **Combat Resolver** - Handle attack resolution
3. **Damage Calculation** - Use `enemy.calculateAttack()` and `player.takeDamage()`
4. **Death Handling** - Remove dead enemies, award XP/gold
5. **Rendering** - Display enemies on dungeon renderer

Example combat flow:
```javascript
if (distToPlayer === 1) {
    // Adjacent - attack instead of move
    const attackResult = enemy.calculateAttack();
    player.takeDamage(attackResult.damage);
    
    if (attackResult.isCritical) {
        // Show critical hit effect
    }
}
```

## Debugging

### Enable Debug Logging

Add to config or set at runtime:
```javascript
window.DEBUG_ENEMIES = true;
```

### Check Enemy State

```javascript
gameState.enemies.forEach(enemy => {
    console.log(`${enemy.name} at (${enemy.x}, ${enemy.y}), State: ${enemy.aiState}, HP: ${enemy.currentHP}`);
});
```

### Visualize Detection Range

In DungeonRenderer (future enhancement):
```javascript
if (window.DEBUG_ENEMIES) {
    // Draw circle around each enemy showing detection range
    dungeon.entities.forEach(entity => {
        if (entity.type === 'enemy') {
            drawCircle(entity.x, entity.y, entity.detectionRange, 'blue');
        }
    });
}
```

## Performance Considerations

### Current Optimizations
- BFS search limited to 50 steps (prevents infinite loops)
- Visited set prevents revisiting tiles
- Random direction selection avoids pathfinding every turn
- Enemies only update during their turn (turn-based)

### Potential Improvements
- **Spatial Hashing**: Group enemies by grid cells for faster proximity queries
- **Cached Paths**: Store paths and reuse until player moves
- **Simplified Pathfinding**: Use Manhattan distance heuristic (A*)
- **LOD System**: Less frequent AI updates for far-away enemies

## Known Limitations

1. **Enemy Collision**: Enemies can't attack each other yet (no multi-entity pathfinding)
2. **LOS/FOV**: No line-of-sight, just range-based detection
3. **Memory**: All dungeon entities stored in memory (chunk-based loading not implemented)
4. **Respawning**: Killed enemies don't respawn (feature not needed for roguelike)

## Testing Checklist

- [ ] Enemies spawn correctly (1-3 per room, not in first room)
- [ ] Enemies wander when player is far away
- [ ] Enemies chase when player enters detection range
- [ ] Enemies stop chasing when player leaves range
- [ ] Pathfinding works with walls/obstacles
- [ ] Stat scaling increases with floor number
- [ ] Enemies can be damaged and die
- [ ] Different enemy types have different stats
- [ ] No performance issues with many enemies

## Next Integration Points

1. **Collision Detection** (Issue #3) - Check adjacency for combat
2. **Combat System** (Issue #2) - Execute attacks and damage
3. **Rendering** - Display enemies on screen
4. **Loot System** (Issue #7) - Drop gold/items on death
5. **Status Effects** (Issue #11) - Poison, stun, etc.

---

Enemy system is production-ready for integration with combat system!
