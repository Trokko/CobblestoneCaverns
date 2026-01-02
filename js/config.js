/**
 * config.js - Konfiguration och Konstanter
 * 
 * H\u00e4r lever alla spelkonstanter! Genom att samla dem h\u00e4r kan vi:
 * - Enkelt tweaka balansen (\"Hmm, kritisk tr\u00e4ff \u00e4r f\u00f6r svag, h\u00f6j multipliern!\")\n * - Undvika magic numbers i koden\n * - Ha \u00f6versikt \u00f6ver alla viktiga v\u00e4rden
 * 
 * L\u00e4ser du det h\u00e4r som game designer? V\u00e4lkommen till balanserings-paradiset!
 */

// Huvudkonfiguration - Spelets grundinst\u00e4llningar
export const CONFIG = {
    // Spelinst\u00e4llningar
    GAME_VERSION: '0.1.0',           // Nuvarande version
    SAVE_INTERVAL: 30000,            // Auto-spara var 30:e sekund
    
    // Dungeon-inst\u00e4llningar
    DUNGEON_WIDTH: 80,               // Bredd i tiles (anv\u00e4nds ej \u00e4nnu)
    DUNGEON_HEIGHT: 60,              // H\u00f6jd i tiles (anv\u00e4nds ej \u00e4nnu)
    TILE_SIZE: 32,                   // Pixels per tile (viktigt f\u00f6r rendering!)
    MAX_GENERATION_ATTEMPTS: 3,      // F\u00f6rs\u00f6k generera dungeon max 3 g\u00e5nger
    
    // Spelarinst\u00e4llningar
    INVENTORY_SIZE: 20,              // Max antal items i inventory
    STAT_POINTS_PER_LEVEL: 5,        // Stat-po\u00e4ng per level (f\u00f6r framtida features)
    SKILL_POINTS_PER_LEVEL: 2,       // Skill-po\u00e4ng per level (f\u00f6r framtida features)
    
    // Stridsinst\u00e4llningar
    CRITICAL_MULTIPLIER: 1.5,        // Kritisk tr\u00e4ff = 1.5x skada (OBS: Player.js anv\u00e4nder 2x!)
    
    // Ekonomi
    MERCHANT_SPAWN_INTERVAL: 5,      // K\u00f6pman varje 5:e v\u00e5ning
    RESPEC_COST_MULTIPLIER: 50,      // Kostnad att \u00e5terst\u00e4lla stats
    SELL_PRICE_MULTIPLIER: 0.5,      // S\u00e4lj f\u00f6r 50% av v\u00e4rdet
    
    // Loot-chanser
    GOLD_DROP_CHANCE: 0.5,           // 50% chans f\u00f6r guld fr\u00e5n props
    PROP_DESTRUCTION_LOOT_CHANCE: 0.5, // 50% chans f\u00f6r loot n\u00e4r prop f\u00f6rst\u00f6rs
    
    // Milstolpar i spelet
    LEGENDARY_BOSS_FLOORS: [20, 40, 60, 80, 100], // V\u00e5ningar med legend\u00e4ra bossar
    ENDLESS_MODE_FLOOR: 20           // Endless mode startar efter v\u00e5ning 20
};

// Tile-typer - Vad kan en ruta vara?
export const TILE_TYPES = {
    WALL: 0,      // V\u00e4gg (ej g\u00e5bar)
    FLOOR: 1,     // Golv (g\u00e5bart)
    DOOR: 2,      // D\u00f6rr (g\u00e5bar, kan vara st\u00e4ngd/\u00f6ppen)
    STAIRS: 3,    // Trappa till n\u00e4sta v\u00e5ning
    HAZARD: 4     // Fara (eld, gift, spikar etc)
};

// Dungeon-genererings inst\u00e4llningar
export const DUNGEON_CONFIG = {
    WIDTH: 50,                    // Bredd i tiles
    HEIGHT: 50,                   // H\u00f6jd i tiles
    MIN_ROOMS: 5,                 // Minst 5 rum per v\u00e5ning
    MAX_ROOMS: 10,                // Max 10 rum per v\u00e5ning
    MIN_ROOM_SIZE: 4,             // Minsta rumstorlek (4x4 tiles)
    ROOM_PADDING: 2,              // Mellanrum till partitionens kanter
    CORRIDOR_WIDTH: 1,            // Korridorbredd (1 tile)
    BSP_MAX_DEPTH: 4,             // Max rekursionsdjup f\u00f6r BSP
    BSP_MIN_PARTITION_SIZE: 8     // Minsta partitionsstorlek
};

// Rariteter f\u00f6r items - ju h\u00f6gre, desto b\u00e4ttre!
export const RARITY = {
    COMMON: 'common',         // Vanlig (vit)
    UNCOMMON: 'uncommon',     // Ovanlig (gr\u00f6n)
    RARE: 'rare',             // S\u00e4llsynt (bl\u00e5)
    EPIC: 'epic',             // Episk (lila)
    LEGENDARY: 'legendary'    // Legend\u00e4r (orange/guld)
};

// Status-effekter - buffar och debuffar
export const STATUS_EFFECTS = {
    BURN: 'burn',       // Br\u00e4nnskada \u00f6ver tid
    POISON: 'poison',   // Giftskada \u00f6ver tid
    BLEED: 'bleed',     // Bl\u00f6dning (skada per tur)
    FREEZE: 'freeze',   // Frusen (kan ej r\u00f6ra sig)
    STUN: 'stun'        // Bedr\u00f6vad (missar turen)
};

// Sk\u00e4rm-states - Vilka sk\u00e4rmar finns?
export const SCREEN_STATES = {
    MAIN_MENU: 'main-menu',                   // Huvudmeny
    HELP: 'help-panel',                       // Hj\u00e4lpsk\u00e4rm
    CHARACTER_CREATION: 'character-creation', // Karakt\u00e4rsskapande
    GAME: 'game-screen',                      // Sj\u00e4lva spelet
    GAME_OVER: 'game-over'                    // Game Over-sk\u00e4rm
};

// Item-typer - Vad kan f\u00f6rem\u00e5l vara?
export const ITEM_TYPES = {
    WEAPON: 'weapon',         // Vapen (ATK-bonus)
    ARMOR: 'armor',           // Rustning (DEF-bonus)
    CONSUMABLE: 'consumable', // Konsumerbart (potions etc)
    CURRENCY: 'currency'      // Valuta (guld)
};

// Equipment-slots - Var kan man ha utrustning?
export const EQUIPMENT_SLOTS = {
    HEAD: 'head',             // Hj\u00e4lm
    NECK: 'neck',             // Halsband
    SHOULDERS: 'shoulders',   // Axelskydd
    CHEST: 'chest',           // Br\u00f6stpansar
    BRACERS: 'bracers',       // Armsk\u00f6ld
    HANDS: 'hands',           // Handskar
    LEGS: 'legs',             // Benskydd
    MAIN_HAND: 'mainHand',    // H\u00f6ger hand (prim\u00e4rt vapen)
    OFF_HAND: 'offHand',      // V\u00e4nster hand (sk\u00f6ld/sekundart vapen)
    RING_1: 'ring1',          // Ring 1
    RING_2: 'ring2'           // Ring 2
};

// Firebase-konfiguration - F\u00f6r online sparfunktioner
// OBS: I produktion b\u00f6r dessa ligga i milj\u00f6variabler!
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyD9utvFyshDbVnBB2GFrBCQuHPxlCKSd3U",
    authDomain: "cobblestone-caverns.firebaseapp.com",
    projectId: "cobblestone-caverns",
    storageBucket: "cobblestone-caverns.firebasestorage.app",
    messagingSenderId: "481504160221",
    appId: "1:481504160221:web:474354f2d1a29d0d7fae34",
    measurementId: "G-6GFL6VHGPS"
};
