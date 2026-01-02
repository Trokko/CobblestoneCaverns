# Cobblestone Caverns

> A fun, browser-based dungeon crawling game with random dungeons, epic battles, and loot to collect. Built entirely with vanilla JavaScript.

![Version](https://img.shields.io/badge/version-0.4.1-blue)
![Status](https://img.shields.io/badge/status-BETA-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎮 What's This About?

Ever want to dive into a dungeon, fight some monsters, and grab treasure without needing to install anything? **Cobblestone Caverns** is for you! It's a turn-based roguelike where you explore randomly generated caverns, fight enemies, collect loot, and get progressively more powerful. Every game is different because the dungeons are randomly created each time you play.

The best part? Just open it in your browser and start playing. No downloads, no setup, no waiting around.

### What You Get

- **Random Dungeons**: Every playthrough gives you brand new dungeon layouts
- **Turn-Based Combat**: Think before you attack. Enemies will counter, so choose your moves wisely
- **Three Classes to Choose From**: Warrior, Barbarian, or Rogue - each has their own special abilities
- **Status Effects**: Apply debuffs to enemies (poison, stun, freeze, etc.) or get hit with them yourself
- **Tons of Loot**: Different items with rarity colors - from common to legendary
- **Smart Enemies**: They wander around until they spot you, then come after you
- **Inventory System**: Equip gear, use potions, and manage your stuff
- **Progressive Difficulty**: The deeper you go, the tougher it gets

## 🚀 Getting Started

### Just Want to Play?
1. Open `index.html` in your browser
2. That's it! No servers, no installs

### Setting Up for Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/CobblestoneCaverns.git
   cd CobblestoneCaverns
   ```

2. **Get the dependencies** (only needed if you want the Firebase save feature)
   ```bash
   npm install
   ```

3. **Start a local server**
   ```bash
   # Python 3 (comes with most systems)
   python -m http.server 8000
   
   # Or if you have Node.js
   npx http-server
   ```

4. **Visit the game**
   - Go to `http://localhost:8000` in your browser and play!

## 📊 What's Done and What's Not

Here's the honest breakdown of where we're at:

| Feature | Status | What It Does |
|---------|--------|--------------|
| Enemies | ✅ Done | 8 different types, they wander and chase you |
| Combat | ✅ Done | Fight enemies, take damage, see results |
| Items & Loot | ✅ Done | 15 different items drop from enemies |
| Inventory | ✅ Done | Equip stuff, use potions, see your gear |
| Abilities | ✅ Done | 12 special abilities (4 per class) with cooldowns |
| Status Effects | ✅ Done | Poison, burn, stun, freeze, bleed, weakness |
| Dungeons | ✅ Done | Randomly generated maps that are always different |
| UI & HUD | ✅ Done | Health bars, cooldowns, combat log, stats |
| Save/Load | ⏳ WIP | You can't save yet (Firebase is set up but not finished) |

**We're at 90% done.** Everything you need for a solid game is in there. The only missing piece is saving your progress - right now each game starts fresh.

## 🎯 The Features Explained

### Dungeons That Are Always Different
We use an algorithm called Binary Space Partitioning (fancy name, simple idea) to chop up the dungeon randomly. You get different rooms every time, connected by hallways. Plus there's a fog of war so you can't see everything at once.

### Fights Feel Good
When you move next to an enemy, the fight starts. You attack first (nice bonus!), and enemies counter-attack. Damage gets calculated based on your attack vs their defense. Get lucky and land a critical hit for extra damage.

### Gear Matters
Pick up weapons and armor that enemies drop. Equip them to boost your stats. Better gear = more damage, better defense. Simple as that.

### Abilities Are Cool
Each class has 4 unique abilities. They have cooldowns so you can't spam them, but they come back online over time. Use them strategically on tougher enemies.

### Enemies Get Tougher
Start on floor 1 with wimpy goblins. Go deeper and fight stronger stuff. Each floor scales the enemy stats a bit higher - the math is built right in.

## ✅ Everything That Works

### Enemies (Fully Built)
- 8 different types: Goblins, Rats, Skeletons, Zombies, Orcs, Archers, Goblin Kings, and Skeleton Knights
- They wander around until they see you
- When they spot you, they chase using smart pathfinding
- Stats scale with each floor you go down

### Combat (Fully Built)
- Damage calculation: Your attack vs their defense
- Critical hits: 15% base chance to deal extra damage
- Defense cuts down incoming damage (maxes out at 75% reduction)
- Everything gets logged so you can see what happened

### Items & Loot (Fully Built)
- 15 different weapons, armor, and potions
- Enemies drop loot when they die
- Items have rarity levels (common to legendary)
- You pick them up automatically when you walk over them

### Inventory (Fully Built)
- Press 'I' to open your inventory
- See what you're carrying and what you have equipped
- Equip items with a button click
- Use potions or drop stuff you don't need

### Abilities (Fully Built)
- 12 total abilities across 3 classes
- Each ability has its own cooldown
- Cooldowns go down by 1 each turn
- Abilities get stronger with your stats

### Status Effects (Fully Built)
- Poison: Ticks damage for 3 turns
- Burn: Lowers enemy attack for 2 turns
- Stun: Skips their next turn
- Freeze: Stops them from moving for 2 turns
- Bleed: Takes more damage for 3 turns
- Weakness: Defense drops for 2 turns

### Dungeons (Fully Built)
- 50x50 tile dungeons
- Rooms of different sizes, all connected
- Stairs to go down to the next floor
- Enemies spawn naturally (about 3 per room)

## 📂 How the Code is Organized

```
js/                           # Everything runs from here
├── config.js               # Tweak game balance here
├── main.js                 # Where everything starts
├── core/
│   ├── GameManager.js      # Runs the game loop
│   ├── GameStateManager.js # Tracks whose turn it is
│   ├── InputManager.js     # Listens for keyboard
│   └── AudioManager.js     # Plays sounds
├── entities/
│   ├── Player.js           # That's you
│   ├── Enemy.js            # The baddies
│   ├── Item.js             # Stuff you pick up
│   └── Dungeon.js          # The map itself
├── systems/
│   ├── CombatResolver.js   # Does the math on fights
│   ├── CombatFeedback.js   # Shows floating numbers
│   ├── ItemSystem.js       # Manages loot
│   ├── StatusEffectSystem.js # Handles debuffs
│   └── AbilitySystem.js    # Manages abilities
├── generation/
│   └── DungeonGenerator.js # Creates random maps
├── rendering/
│   └── DungeonRenderer.js  # Draws it on screen
├── ui/
│   ├── UIManager.js        # Coordinates UI
│   ├── HUDManager.js       # Health bars, stats, etc
│   ├── CharacterCreationUI.js # Pick your class
│   └── InventoryUI.js      # Your backpack
├── data/
│   ├── ClassTemplates.js   # What are Warriors, etc
│   ├── EnemyTemplates.js   # What are Goblins, etc
│   └── ItemTemplates.js    # What stuff exists
└── utils/
    └── helpers.js          # Useful functions
```

## 🎮 How to Actually Play

### Starting Out
1. Open `index.html`
2. Pick your character class
3. Click "Start Game"
4. Start exploring!

### Controls
| What | Key |
|------|-----|
| Move Up | **↑** or **W** |
| Move Down | **↓** or **S** |
| Move Left | **←** or **A** |
| Move Right | **→** or **D** |
| Pick an Ability | **1/2/3/4** or **A/B/C/D** |
| Cast on Enemy | **Click** them |
| Open Backpack | **I** |
| Cancel | **ESC** |

### Play Loop
1. Wander around the dungeon (arrow keys)
2. Enemies come at you - fight them!
3. Pick up the stuff they drop
4. Use items from your inventory to heal or buff up
5. Level up when you get enough XP
6. Find the stairs and go deeper
7. Everything gets harder as you go down - good luck!

### Quick Tips
- Better gear = easier fights. Always equip upgrades!
- Use abilities on tough enemies, don't waste them on wimpy ones
- Different classes play differently - try them all out
- The game gets noticeably harder each floor, so prepare yourself

## 🐛 Known Problems

### Can't Save (Bummer)
You can't save your progress right now. Each game starts fresh. This is the biggest thing we need to fix.

### Smaller Annoyances
- Sounds might not work depending on browser settings
- Mobile support is spotty (better on desktop)
- Can't use a game controller (keyboard/mouse only)

## 🛠️ What We Used to Build This

- **Language**: Vanilla JavaScript (ES6) - no React, Vue, Angular, nothing fancy
- **Graphics**: HTML5 Canvas for drawing
- **Styling**: Custom CSS and the RPGUI framework
- **Saves**: Firebase is set up but not fully wired in yet
- **Database**: None needed yet

The whole thing runs in your browser with zero dependencies except Firebase when we get the save feature working.

## 🚀 What's Coming Next

### Phase 1: Finish It Up (Right Now)
- [x] Get the game playable
- [x] Add inventory system
- [x] Add abilities
- [x] Add status effects
- [ ] Get save/load working
- [ ] Add a pause menu

### Phase 2: More Stuff
- [ ] Boss encounters
- [ ] More enemy types
- [ ] More items and weapons
- [ ] Different dungeon themes

### Phase 3: Nice to Haves
- [ ] NPCs you can trade with
- [ ] Talent trees to customize your build
- [ ] Achievements
- [ ] Leaderboards

## 🤝 Wanna Help Out?

Great! We'd love contributions. Just keep a few things in mind:

### Code Style
- Write modern JavaScript (ES6+)
- Comment your public functions
- Keep functions small and focused
- Put any balance changes in `config.js`

### Adding New Stuff
1. Make a new file in the right folder
2. Comment what it does
3. Add any tuning values to `config.js`
4. Test it in the browser
5. Write a quick guide in `/Documentation`

### Before You Submit
- [ ] No error messages in the console
- [ ] Actually tested in the browser
- [ ] Code works with the rest of the game
- [ ] Consistent with the rest of the codebase
- [ ] Documentation updated

## 📖 Read More

Check the `/Documentation` folder for detailed guides on how things work:

- **[Combat Guide](Documentation/COMBAT_SYSTEM_GUIDE.md)** - How fights work
- **[Enemy Guide](Documentation/ENEMY_SYSTEM_GUIDE.md)** - How enemies behave
- **[Abilities Guide](Documentation/ABILITIES_SYSTEM.md)** - How abilities work
- **[Loot Guide](Documentation/LOOT_SYSTEM_GUIDE.md)** - How items drop
- **[Effects Guide](Documentation/STATUS_EFFECTS_SYSTEM.md)** - How debuffs work
- **[Testing Guide](Documentation/TESTING_AND_DEBUGGING_GUIDE.md)** - How to test stuff
- **[Next Steps](Documentation/NEXT_STEPS.md)** - What to build next

## 🎓 Some Technical Notes

### It's Pretty Fast
- Dungeons generate super fast (<100ms)
- Combat calculations are instant
- Even with 20+ enemies, no lag
- Pathfinding is optimized so enemies don't chug

### Code Design
- Uses the singleton pattern for managers (keeps state clean)
- Entity-based system (each thing in the game is an entity)
- Everything can be tuned from `config.js`
- Each system is independent so it's easy to add features

### Browser Support
- **Chrome/Edge**: Works great
- **Firefox**: Works great  
- **Safari**: Works great
- **Mobile**: Works okay but not perfect

## 🧪 Test It Out

You can run commands in your browser console to see what's happening:

```javascript
// See damage calculation
gameManager.player.calculateAttack()

// Check fight history
combatResolver.getCombatStats("Player")

// Look at your inventory
gameManager.player.inventory

// Check your current status
gameManager.gameState
gameManager.currentFloor
```

## 💬 Found a Bug? Got an Idea?

If something's broken or you have a cool idea, let us know! Open an issue and tell us:
- What happened (clear description)
- How to make it happen again
- What should happen instead
- What browser/device you're on

## 📄 License

MIT License - do whatever you want with it. Details in the LICENSE file.

## 🙏 Thanks

- The dungeon algorithm is based on Binary Space Partitioning (a classic technique)
- RPGUI for the UI styling
- All the classic roguelikes that inspired this
- Built with vanilla JS because it's cool to see what you can do without a framework

---

**Last Updated**: January 2, 2026  
**Current Version**: 0.4.1  
**Status**: ✅ BETA - Fully playable, go have fun!
