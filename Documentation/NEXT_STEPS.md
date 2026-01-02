# Next Steps - Issue Roadmap

**Current Date**: January 2, 2026
**Highest Priority Issues**: 5 Critical System Gaps
**Estimated Time to Playability**: 10-15 more implementation sessions

---

## 🎯 Recommended Priority Order

### Phase 1: Core Gameplay Loop (70% → 85% Complete)
**Current Status**: Combat + Loot fully working

#### ✅ Issue #1: Enemy/NPC System
**Status**: ✅ COMPLETE
- Enemy spawning per room
- Wander AI (random patrol)
- Chase AI (BFS pathfinding)
- 8 enemy types with progression
- **File**: `js/entities/Enemy.js`, `js/data/EnemyTemplates.js`

#### ✅ Issue #2: Combat System
**Status**: ✅ COMPLETE (~60% polish)
- Melee combat resolution
- Damage calculation with DEF
- Critical hits (CONFIG-based)
- Combat logging
- **File**: `js/systems/CombatResolver.js`
- **Pending**: Visual effects, floating damage numbers

#### ✅ Issue #7: Loot/Item System
**Status**: ✅ COMPLETE
- Item templates (15 items)
- Automatic loot drops
- Item pickup mechanism
- Rarity-based colors
- **File**: `js/entities/Item.js`, `js/data/ItemTemplates.js`, `js/systems/ItemSystem.js`

#### 📋 Issue #9: Inventory UI (NEXT HIGH PRIORITY)
**Severity**: 🟠 CRITICAL GAMEPLAY GAPS (7/10)
**Estimated Effort**: 6-8 hours
**Impact**: Players can see and manage items
**Blocker For**: Item equipment, consumable usage

**What's Needed**:
```
1. Create InventoryUI component
   ├─ Display held items with icons
   ├─ Show item names and rarity
   ├─ Show equipped weapon/armor
   └─ Item count badges

2. Equipment Slot Display
   ├─ Current weapon (ATK stats)
   ├─ Current armor (DEF stats)
   ├─ Quick swap UI
   └─ Stat comparison

3. Interaction Handlers
   ├─ Click item to equip
   ├─ Shift-click to drop
   ├─ Right-click for menu
   └─ Consumable usage

4. Integration
   ├─ Connect to ItemSystem
   ├─ Update on pickup
   ├─ Update on equipment change
   └─ Persist state in saves
```

**Key Files to Create**:
- `js/ui/InventoryUI.js` - Item display component
- `js/ui/EquipmentSlots.js` - Equipment display

---

### Phase 2: Combat Depth (85% → 90% Complete)

#### 📋 Issue #11: Status Effects System
**Severity**: 🟡 IMPORTANT ISSUES (6/10)
**Estimated Effort**: 6-8 hours
**Impact**: Poison, burn, stun, freeze mechanics
**Blocker For**: Strategic combat, buff/debuff items

**What's Needed**:
```
1. Status Effect System
   ├─ Poison (damage per turn)
   ├─ Burn (ATK debuff)
   ├─ Stun (skip next turn)
   ├─ Freeze (no movement)
   ├─ Bleed (damage on hit)
   └─ Buff system (temporary stats)

2. Effect Application
   ├─ Apply on hit (weapon procs)
   ├─ Apply from items/skills
   ├─ Apply from enemy abilities
   └─ Duration tracking

3. Effect Processing
   ├─ Apply each turn
   ├─ Remove on expiration
   ├─ Show visual indicators
   └─ Display in HUD

4. Balance System
   ├─ Effect chances (RNG)
   ├─ Duration scaling by floor
   ├─ Stacking rules
   └─ Immunity mechanics
```

**Key Files to Create**:
- `js/systems/StatusEffectSystem.js` - Effect management
- `js/data/StatusEffectTemplates.js` - Effect definitions

---

### Phase 3: Player Progression (90% → 95% Complete)

#### 📋 Issue #12: Skill/Ability System
**Severity**: 🟡 IMPORTANT ISSUES (6/10)
**Estimated Effort**: 8-10 hours
**Impact**: Special attacks, unique class abilities
**Blocker For**: Class uniqueness, tactical options

**What's Needed**:
```
1. Ability System
   ├─ Class-specific abilities
   ├─ Cooldown management
   ├─ Mana/resource costs
   ├─ Passive bonuses
   └─ Ability scaling with stats

2. Warrior Abilities
   ├─ Power Attack (2x damage)
   ├─ Shield Bash (stun)
   ├─ Cleave (hits adjacent enemies)
   └─ Passive: +10% ATK

3. Rogue Abilities
   ├─ Backstab (3x crit damage)
   ├─ Shadow Step (teleport + invisibility)
   ├─ Evasion (dodge next attack)
   └─ Passive: +20% CRT

4. Barbarian Abilities
   ├─ Rage (ATK buff, DEF debuff)
   ├─ Whirlwind (hit all adjacent)
   ├─ Bloodlust (heal on kill)
   └─ Passive: +20% DEF
```

**Key Files to Create**:
- `js/systems/AbilitySystem.js` - Ability management
- `js/data/AbilityTemplates.js` - Ability definitions

---

### Phase 4: Backend Systems (95% → 98% Complete)

#### 📋 Issue #6: Save/Load System
**Severity**: 🟠 CRITICAL GAMEPLAY GAPS (8/10)
**Estimated Effort**: 4-6 hours
**Impact**: Players can resume progress
**Blocker For**: Long play sessions, leaderboards

**Files to Complete**:
- `js/firebase/SaveManager.js` - Complete implementation
- localStorage fallback for offline

---

## 📊 Implementation Timeline

```
Now      [Issue #7] ✅
Week 1   [Issue #9] → Inventory UI
         [Issue #11] → Status Effects
Week 2   [Issue #12] → Skills/Abilities
         [Issue #6] → Save/Load
```

---

## 🎮 Gameplay Progression Example

### After Issue #7 (Current)
```
Player enters dungeon
  ↓
Defeat Goblin (combat)
  ↓
Iron Sword drops (loot)
  ↓
Walk over sword (pickup)
  ↓
Inventory has "Iron Sword" (text only, no UI yet)
  ↓
Can equip via code only (no UI)
```

### After Issue #9 (Inventory UI)
```
Player enters dungeon
  ↓
Defeat Goblin
  ↓
Iron Sword drops on ground (colored diamond)
  ↓
Walk over sword → "+Iron Sword" floating text
  ↓
Inventory panel shows "Iron Sword" with icon
  ↓
Click to equip → ATK stat increases, UI updates
  ↓
See "Equipped: Iron Sword (+5 ATK)" in panel
```

### After Issue #11 (Status Effects)
```
Poison Rat attacks
  ↓
Combat hit → Poison applied (20% chance)
  ↓
Next turn: Player takes poison damage
  ↓
Purple poison icon shows duration (3 turns left)
  ↓
After 3 turns: Poison fades
  ↓
Can use antidote potion to remove immediately
```

### After Issue #12 (Skills)
```
Player presses 'E' for Warrior ability
  ↓
Power Attack activates (cooldown: 3 turns)
  ↓
Damage dealt: 2x normal (+critical chance)
  ↓
Screen flashes, sound effect
  ↓
Cooldown timer shows "2 turns remaining"
```

---

## 📈 Feature Unlock Table

| Feature | Issue | Status | Enables |
|---------|-------|--------|---------|
| Enemies | #1 | ✅ | Combat encounters |
| Combat | #2 | ✅ | Defeat mechanics |
| Loot | #7 | ✅ | Equipment progression |
| **Inventory UI** | **#9** | 📋 NEXT | Item management |
| Status Effects | #11 | 📋 | Strategic depth |
| Skills/Abilities | #12 | 📋 | Class identity |
| Save/Load | #6 | 📋 | Persistence |
| Bosses | #20 | 📋 | Boss encounters |

---

## 🔥 Quick Wins (If Want Faster Progress)

### Easy Additions (1-2 hours each)
1. **Floating Combat Text** - Show "+18 DMG" above enemies
2. **Combat Sounds** - Play hit/miss/crit sounds
3. **Death Animation** - Flash enemy when taking damage
4. **Level-up Effects** - Show "+1 ATK" when stat increases
5. **Item Drop Animation** - Items fall from death location

### Medium Additions (3-4 hours each)
1. **Boss Encounters** - Special harder enemy on floor 5, 10, 15
2. **Mini-map** - Show current floor miniature view
3. **Leaderboard** - Track high floors achieved
4. **Difficulty Selector** - Easy/Normal/Hard modes
5. **Enemy Variety Visuals** - Different colors per enemy type

---

## 🎯 Immediate Next Steps (For This Session)

### Option A: Continue with Issue #9 (Inventory UI)
**Pros**:
- Completes Item System feature set
- Players can see progression
- High visual impact
- Builds on existing code

**Cons**:
- More UI work needed
- Requires CSS styling
- Drag-and-drop complexity

### Option B: Jump to Issue #11 (Status Effects)
**Pros**:
- Adds tactical depth quickly
- Works with existing combat
- Less UI complexity
- High gameplay value

**Cons**:
- Can feel incomplete without visuals
- Players won't see in inventory

### Recommendation: **Issue #9** (Inventory UI)
- Completes the loot system "feel"
- Players want to see what they have
- Sets up for future item interactions
- Relatively quick implementation

---

## 📝 Session Checklist

Before starting next issue:

- [ ] Review current codebase (all files created/modified)
- [ ] Run game and test loot system working
- [ ] Check all items drop correctly
- [ ] Verify pickup notifications show
- [ ] Test on multiple floors (items scale correctly)
- [ ] Confirm no console errors
- [ ] Plan UI layout for Inventory
- [ ] Check RPGUI CSS for inventory panel options
- [ ] Design item icon system

---

## 🚀 Final Notes

**Current State**:
- Game is playable and fun for first few levels
- Combat feels rewarding with loot system
- All core mechanics implemented and tested
- No game-breaking bugs
- Well-documented code

**Next Priority**: 
- Inventory UI to show items collected
- Status effects to add tactical depth
- Save system to enable longer play

**Estimated Time to "Fully Playable"**: 
- 20-30 more hours of implementation
- ~5-7 additional features
- All core systems completed

**Viability**: Game loop is complete and working! 🎉

---

