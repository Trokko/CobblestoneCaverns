# Adding New Enemy Types - Quick Guide

## Adding a New Enemy Type

Adding new enemies to the game is simple. Follow these steps:

### Step 1: Add Template to EnemyTemplates.js

Edit `js/data/EnemyTemplates.js` and add your enemy to the `EnemyTemplates` object:

```javascript
export const EnemyTemplates = {
    // ... existing enemies ...
    
    dragon: {
        name: 'Red Dragon',
        sprite: 'dragon_red.png',
        description: 'A powerful flying reptile. Very dangerous.',
        
        // Base stats
        maxHP: 100,
        baseATK: 20,
        baseDEF: 10,
        baseCRT: 10,
        
        // AI parameters
        detectionRange: 12,  // Dragons see further
        wanderRadius: 8,
        
        // Rewards
        experienceReward: 500,
        goldReward: 100
    }
};
```

### Step 2: Update Floor Progression (Optional)

If you want this enemy to appear on specific floors, update `getEnemyTemplatesForFloor()`:

```javascript
export function getEnemyTemplatesForFloor(floor) {
    if (floor <= 5) {
        return ['goblin', 'rat'];
    } else if (floor <= 10) {
        return ['goblin', 'rat', 'skeleton', 'zombie'];
    } else if (floor <= 15) {
        return ['skeleton', 'zombie', 'orc', 'archer'];
    } else if (floor <= 20) {
        return ['skeleton', 'orc', 'archer', 'goblinKing', 'dragon'];  // Add here
    } else {
        return ['orc', 'archer', 'goblinKing', 'skeletonKnight', 'dragon'];  // And here
    }
}
```

### Step 3: That's It!

The enemy will automatically:
- Spawn in dungeons at appropriate floors
- Have stats scaled by floor difficulty
- Wander and chase the player
- Participate in combat when implemented
- Drop rewards when defeated

## Stat Guidelines

Here are recommended stats based on difficulty tier:

### Weak (Early Game)
```javascript
maxHP: 10-20,
baseATK: 3-5,
baseDEF: 0-2,
baseCRT: 2-5,
experienceReward: 15-40,
goldReward: 3-10
```

### Normal (Mid Game)
```javascript
maxHP: 20-40,
baseATK: 6-10,
baseDEF: 2-5,
baseCRT: 4-8,
experienceReward: 40-100,
goldReward: 10-30
```

### Strong (Late Game)
```javascript
maxHP: 40-80,
baseATK: 10-20,
baseDEF: 5-10,
baseCRT: 6-12,
experienceReward: 100-300,
goldReward: 30-100
```

### Boss (Special)
```javascript
maxHP: 80-150,
baseATK: 20-35,
baseDEF: 10-20,
baseCRT: 8-15,
experienceReward: 300-1000,
goldReward: 100-500
```

## AI Parameter Guidelines

### Detection Range
- **4-6**: Low vision (underground creatures, blind enemies)
- **6-8**: Normal vision (most enemies)
- **8-10**: Good vision (alert enemies, ranged units)
- **10-15**: Excellent vision (boss enemies, flying creatures)

### Wander Radius
- **3-4**: Protective (guards specific areas)
- **5-6**: Normal (general patrolling)
- **7-10**: Aggressive (roaming hunters)

## Example: Creating a Specific Enemy Type

### Flying Enemy (High Detection)
```javascript
griffon: {
    name: 'Griffon',
    sprite: 'griffon.png',
    description: 'A flying creature that spots prey from far away.',
    
    maxHP: 45,
    baseATK: 12,
    baseDEF: 4,
    baseCRT: 8,
    
    detectionRange: 15,  // Can see very far
    wanderRadius: 10,
    
    experienceReward: 150,
    goldReward: 50
}
```

### Tank Enemy (High Defense, Low Attack)
```javascript
ironGolem: {
    name: 'Iron Golem',
    sprite: 'golem_iron.png',
    description: 'A magical construct made of metal. Slow but nearly indestructible.',
    
    maxHP: 80,
    baseATK: 6,      // Low damage
    baseDEF: 15,     // High defense!
    baseCRT: 2,
    
    detectionRange: 6,
    wanderRadius: 3,
    
    experienceReward: 120,
    goldReward: 40
}
```

### Fragile High Damage (Glass Cannon)
```javascript
pyreMage: {
    name: 'Pyre Mage',
    sprite: 'mage_pyre.png',
    description: 'A wizard that deals massive damage but has low health.',
    
    maxHP: 18,       // Low HP!
    baseATK: 18,     // High damage!
    baseDEF: 1,
    baseCRT: 7,
    
    detectionRange: 9,
    wanderRadius: 6,
    
    experienceReward: 110,
    goldReward: 35
}
```

## Balancing Tips

1. **HP vs ATK vs DEF Trade-off**
   - High HP + Low ATK/DEF = Tanky but weak
   - Low HP + High ATK = Glass cannon
   - Balanced stats = Standard enemy

2. **Stat Scaling**
   - Stats are multiplied by `1.05^(floor-1)`
   - High-value stats will scale dramatically
   - A Goblin's 15 HP becomes 97 HP by floor 20!

3. **Rewards**
   - XP reward should correlate with difficulty
   - Gold reward should be proportional to XP
   - Bosses give 10-20x more rewards than basic enemies

4. **Detection Range**
   - Affects how far away the player is pursued
   - Longer range = harder to avoid
   - Very long range (15+) only for boss encounters

## Testing New Enemies

### Quick Test

1. Add the enemy template
2. Add to `getEnemyTemplatesForFloor()` for a specific floor
3. Load that floor in game
4. Check console for spawn messages:
   ```
   Floor 5 loaded with X enemies
   ```

### Validate Stats

```javascript
// In browser console after spawning enemy
const enemy = gameState.enemies[0];
console.log(`${enemy.name}: HP=${enemy.currentHP}, ATK=${enemy.totalATK}, DEF=${enemy.totalDEF}`);

// Test combat calculation
const attack = enemy.calculateAttack();
console.log(`Attack: ${attack.damage} damage${attack.isCritical ? ' (CRITICAL!)' : ''}`);
```

### Check Pathfinding

```javascript
// In browser console
const path = gameState.enemies[0].findPathToPlayer(gameState.player, gameState.dungeon);
console.log(`Path length: ${path ? path.length : 'No path found'}`);
```

## Common Issues

### Enemy Not Spawning
- Check if template key matches exactly (case-sensitive)
- Verify enemy is in `getEnemyTemplatesForFloor()` for that floor
- Check sprite file exists (or renderer will use fallback)

### Enemies Too Weak/Strong
- Verify base stats are in expected range
- Check `experienceReward` is proportional to `maxHP + baseATK`
- Remember stats scale 1.05× per floor!

### Pathfinding Not Working
- Check dungeon has valid walkable tiles
- Enemies need floor data: `enemy.floor` must be set
- BFS search limited to 50 steps (long paths may fail)

## Advanced: Custom AI

If you want different AI behavior, you can override in Enemy class:

```javascript
class SpecialEnemy extends Enemy {
    async takeTurn(player, dungeon) {
        // Custom behavior - e.g., heal when low on health
        if (this.currentHP < this.maxHP * 0.3) {
            this.heal(this.maxHP * 0.2);
            return;
        }
        
        // Otherwise use default AI
        super.takeTurn(player, dungeon);
    }
}
```

---

That's it! Adding new enemies is that simple. The system handles spawning, scaling, and AI automatically.
