# Enemy System - Testing & Debugging Guide

## Quick Start Testing

### Step 1: Load the Game
1. Open the game in your browser
2. Create a new character (any class)
3. The game should load Floor 1

### Step 2: Check Console for Confirmation

Open browser DevTools (F12) and check the console for:
```
Floor 1 loaded with X enemies
```

This confirms enemies are spawning!

## In-Game Testing

### Test 1: Enemy Wandering

**Expected Behavior**: Enemies move randomly when you're far away

1. Start new game
2. Let game run for 30+ seconds without moving
3. Watch enemies wander around the visible tiles
4. Enemies should gradually move around the screen

**Console Check**:
```javascript
// In browser console
console.log(gameState.enemies[0].aiState);
// Should print: "wander" or "idle"
```

### Test 2: Enemy Detection & Chasing

**Expected Behavior**: Enemies start chasing when you get close

1. Start new game on Floor 1
2. Move directly toward any enemy
3. When you get within ~6-8 tiles, enemy should start moving toward you
4. Continue moving toward enemy - it should follow

**Console Check**:
```javascript
// In browser console
const enemy = gameState.enemies[0];
const dist = enemy.getDistanceTo(gameState.player.x, gameState.player.y);
console.log(`Distance: ${dist}, State: ${enemy.aiState}, Detection Range: ${enemy.detectionRange}`);

// If dist <= detectionRange and aiState === 'chase', it's working!
```

### Test 3: Pathfinding

**Expected Behavior**: Enemies find path around walls

1. Position yourself across a wall from an enemy
2. Move directly toward it (don't cross walls yourself)
3. Enemy should navigate around the wall to reach you

**Console Check**:
```javascript
// Find a chasing enemy
const chasingEnemy = gameState.enemies.find(e => e.aiState === 'chase');
const path = chasingEnemy.findPathToPlayer(gameState.player, gameState.dungeon);
console.log(`Path length: ${path ? path.length : 'No path'}`);
console.log(path); // See the actual path coordinates
```

## Automated Testing Scripts

You can paste these into the browser console to test various aspects:

### Test: Check All Enemies

```javascript
console.group('Enemy Status Report');
console.log(`Total enemies: ${gameState.enemies.length}`);
console.log(`Current floor: ${gameState.currentFloor}`);

gameState.enemies.forEach((enemy, i) => {
    const dist = enemy.getDistanceTo(gameState.player.x, gameState.player.y);
    console.log(`${i}: ${enemy.name} - HP: ${enemy.currentHP}/${enemy.maxHP}, ` +
                `Pos: (${enemy.x}, ${enemy.y}), State: ${enemy.aiState}, ` +
                `Dist: ${dist}, Range: ${enemy.detectionRange}`);
});
console.groupEnd();
```

Expected output:
```
Enemy Status Report
Total enemies: 8
Current floor: 1
0: Goblin - HP: 15/15, Pos: (15, 20), State: wander, Dist: 12, Range: 6
1: Skeleton - HP: 20/20, Pos: (35, 25), State: wander, Dist: 25, Range: 7
...
```

### Test: Force Chase Mode

```javascript
// Move player next to first enemy to force chase
const enemy = gameState.enemies[0];
gameState.player.x = enemy.x + 2;
gameState.player.y = enemy.y;

console.log(`Moved player next to ${enemy.name}`);
console.log(`Next turn, enemy should enter CHASE mode`);
```

Then just wait one turn and check:
```javascript
console.log(gameState.enemies[0].aiState); // Should be "chase"
```

### Test: Combat Damage Calculation

```javascript
// Test enemy attack calculation
const testEnemy = gameState.enemies[0];
const attack = testEnemy.calculateAttack();

console.log(`${testEnemy.name} attack roll:`);
console.log(`- Base ATK: ${testEnemy.totalATK}`);
console.log(`- Critical Chance: ${testEnemy.totalCRT}%`);
console.log(`- Result: ${attack.damage} damage${attack.isCritical ? ' (CRITICAL!)' : ''}`);

// Run multiple times to see variation
console.log('\n10 attack rolls:');
for (let i = 0; i < 10; i++) {
    const result = testEnemy.calculateAttack();
    console.log(`  Roll ${i+1}: ${result.damage} damage${result.isCritical ? ' ✓CRIT' : ''}`);
}
```

### Test: Pathfinding Performance

```javascript
console.time('Pathfinding');

const enemy = gameState.enemies[0];
const path = enemy.findPathToPlayer(gameState.player, gameState.dungeon);

console.timeEnd('Pathfinding');

if (path) {
    console.log(`Path found! ${path.length} steps:`);
    console.log(path);
} else {
    console.log('No path found');
}
```

**Expected**: Should complete in < 5ms for most dungeons

### Test: Stat Scaling by Floor

```javascript
// Check how enemy stats scale with floor
function testFloorScaling(templateKey, floors) {
    const { getEnemyTemplate } = require('../../data/EnemyTemplates.js');
    const template = getEnemyTemplate(templateKey);
    
    console.log(`Stat scaling for ${template.name}:`);
    console.log('Floor | HP | ATK | DEF | XP Reward');
    console.log('------|----|----|-----|----------');
    
    floors.forEach(floor => {
        const multiplier = Math.pow(1.05, floor - 1);
        const hp = Math.ceil(template.maxHP * multiplier);
        const atk = Math.ceil(template.baseATK * multiplier);
        const def = Math.ceil(template.baseDEF * multiplier);
        const xp = Math.ceil(template.experienceReward * multiplier);
        console.log(`${floor.toString().padEnd(5)} | ${hp.toString().padEnd(3)} | ${atk.toString().padEnd(3)} | ${def.toString().padEnd(3)} | ${xp}`);
    });
}

// Test Goblin scaling on floors 1, 5, 10, 20
testFloorScaling('goblin', [1, 5, 10, 20]);
```

Expected output:
```
Stat scaling for Goblin:
Floor | HP | ATK | DEF | XP Reward
------|----|----|-----|----------
1     | 15 | 4   | 1   | 25
5     | 18 | 5   | 1   | 31
10    | 24 | 7   | 2   | 41
20    | 40 | 11  | 3   | 66
```

### Test: Enemy Spawning Distribution

```javascript
// Analyze which enemies spawned and where
console.group('Spawning Analysis');

const enemyTypes = {};
const roomDistribution = {};

gameState.enemies.forEach(enemy => {
    // Count by type
    enemyTypes[enemy.name] = (enemyTypes[enemy.name] || 0) + 1;
});

console.log('Enemy Type Distribution:');
Object.entries(enemyTypes).forEach(([name, count]) => {
    console.log(`  ${name}: ${count}`);
});

console.log(`\nTotal: ${gameState.enemies.length} enemies`);
console.log(`Expected: ~${(gameState.dungeon.rooms.length - 1) * 2} enemies (1-3 per room, skip first)`);

console.groupEnd();
```

## Debugging Common Issues

### Issue: No Enemies Spawning

**Diagnostic Script**:
```javascript
console.log('Dungeon entities:', gameState.dungeon.entities.length);
console.log('Enemies from gameState:', gameState.enemies.length);

// Check what's in entities
gameState.dungeon.entities.forEach((entity, i) => {
    console.log(`${i}: type=${entity.type}, name=${entity.name}`);
});
```

**Possible Causes**:
- [ ] Enemy spawn in floor > 20 but no templates for that floor
- [ ] Dungeon has no rooms (generation failed)
- [ ] Imports not working (check console for module errors)

**Fix**:
- Ensure `EnemyTemplates.js` is imported in `Dungeon.js`
- Check if Dungeon.js `generate()` calls `spawnEnemies()`

### Issue: Enemies Not Moving

**Diagnostic Script**:
```javascript
// Record initial positions
const initialPos = gameState.enemies.map(e => ({name: e.name, x: e.x, y: e.y}));
console.log('Initial positions:', initialPos);

// Wait several seconds
setTimeout(() => {
    const finalPos = gameState.enemies.map(e => ({name: e.name, x: e.x, y: e.y}));
    console.log('Final positions:', finalPos);
    
    // Check if any moved
    let moved = 0;
    initialPos.forEach((initial, i) => {
        if (initial.x !== finalPos[i].x || initial.y !== finalPos[i].y) {
            moved++;
        }
    });
    console.log(`Enemies that moved: ${moved}`);
}, 5000); // Wait 5 seconds
```

**Possible Causes**:
- [ ] `takeTurn()` not being called (GameStateManager integration)
- [ ] Enemies all have `aiState = 'idle'`
- [ ] Dungeon blocked (all walls, no walkable tiles)

**Fix**:
- Verify `GameStateManager.processTurn()` processes enemy turns
- Check `loadFloor()` populates `gameState.enemies`

### Issue: Pathfinding Broken (Enemies Don't Chase)

**Diagnostic Script**:
```javascript
const enemy = gameState.enemies[0];
const player = gameState.player;

// Force chase situation
enemy.aiState = 'chase';
enemy.detectionRange = 100;  // Guarantee in range

// Test pathfinding
const path = enemy.findPathToPlayer(player, gameState.dungeon);
console.log('Pathfinding test:');
console.log(`- Start: (${enemy.x}, ${enemy.y})`);
console.log(`- Goal: (${player.x}, ${player.y})`);
console.log(`- Path length: ${path ? path.length : 'NO PATH'}`);

if (path) {
    console.log('- Path:');
    path.slice(0, 5).forEach((p, i) => {
        console.log(`  Step ${i+1}: (${p.x}, ${p.y})`);
    });
}
```

**Possible Causes**:
- [ ] Player and enemy in separate rooms (no corridor connectivity)
- [ ] BFS search depth (50 steps) insufficient
- [ ] Dungeon has invalid walkable zones

**Fix**:
- Increase BFS search depth: `const maxSearchSteps = 100;`
- Verify dungeon generation creates corridors
- Check `dungeon.isWalkable()` returns correct values

## Performance Testing

### Monitor CPU Usage During Gameplay

```javascript
// Measure framerate
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
    frameCount++;
    const now = performance.now();
    
    if (now - lastTime >= 1000) {
        console.log(`FPS: ${frameCount}`);
        frameCount = 0;
        lastTime = now;
    }
    
    requestAnimationFrame(measureFPS);
}

measureFPS();
```

**Expected**: 
- 50-60 FPS (smooth)
- Any drop below 30 FPS = performance issue

### Profile Enemy Turn Processing

```javascript
console.profile('Enemy Turns');

// Run one complete turn
await gameState.processTurn();

console.profileEnd('Enemy Turns');
```

This will show exact timing breakdown.

## Stress Testing

### Test: Many Enemies

```javascript
// Add extra enemies for stress testing
for (let i = 0; i < 50; i++) {
    const pos = gameState.dungeon.getRandomWalkablePosition();
    if (pos) {
        const enemy = new Enemy({
            name: `Test Enemy ${i}`,
            x: pos.x,
            y: pos.y,
            floor: gameState.currentFloor,
            maxHP: 20,
            baseATK: 5,
            baseDEF: 2,
            detectionRange: 8
        });
        gameState.dungeon.addEntity(enemy);
        gameState.enemies.push(enemy);
    }
}

console.log(`Now testing with ${gameState.enemies.length} enemies`);
```

Then check if performance degrades.

## Verification Checklist

Before declaring the system complete:

- [ ] Enemies spawn on every floor
- [ ] No enemies in first room (safe start)
- [ ] Enemies wander when player is far away
- [ ] Enemies chase when player is close
- [ ] Chasing stops when player leaves range
- [ ] Pathfinding works around walls
- [ ] Stats scale with floor difficulty
- [ ] Different enemy types have different stats
- [ ] Combat calculations work (`calculateAttack()`)
- [ ] Enemies can take damage (`takeDamage()`)
- [ ] Performance remains smooth (50+ FPS)
- [ ] No console errors or warnings

---

**Testing Complete When**: All checks pass and console shows no errors!
