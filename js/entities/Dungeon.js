/**
 * Dungeon.js - En våning i dungeonen
 * 
 * Representerar en komplett dungeon-våning med:
 * - Grid-baserad karta (50x50 tiles)
 * - Rum och korridorer
 * - Trappa till nästa våning
 * - Alla entities (fiender, items, props)
 * - Fog of war system (vad har spelaren sett?)
 * 
 * Tänk på det som en "spelplan" med all data för en våning!
 */

import DungeonGenerator from '../generation/DungeonGenerator.js';
import { TILE_TYPES, DUNGEON_CONFIG } from '../config.js';
import { Enemy } from './Enemy.js';
import { getEnemyTemplatesForFloor, getEnemyTemplate } from '../data/EnemyTemplates.js';

class Dungeon {
    constructor(floor = 1) {
        this.floor = floor;                    // Vilket våningsnummer
        this.width = DUNGEON_CONFIG.WIDTH;     // Bredd (50 tiles)
        this.height = DUNGEON_CONFIG.HEIGHT;   // Höjd (50 tiles)
        this.grid = [];                        // 2D array med tiles
        this.rooms = [];                       // Lista med alla rum
        this.stairsPosition = null;            // Var är trappan?
        this.playerStartPosition = null;       // Var börjar spelaren?
        this.entities = [];                    // Fiender, items, props
        this.visited = [];                     // Fog of war tracking
        
        this.generate(); // Generera dungeonen direkt!
    }

    /**
     * Genererar dungeonen
     * 
     * Anropar DungeonGenerator och sätter upp allt.
     * Spelaren startar i första rummet!
     */
    generate() {
        const generator = new DungeonGenerator(this.width, this.height);
        const dungeonData = generator.generate(
            DUNGEON_CONFIG.MIN_ROOMS,
            DUNGEON_CONFIG.MAX_ROOMS
        );
        
        this.grid = dungeonData.grid;
        this.rooms = dungeonData.rooms;
        this.stairsPosition = dungeonData.stairsPosition;
        
        // Set player start position in first room
        if (this.rooms.length > 0) {
            const firstRoom = this.rooms[0];
            this.playerStartPosition = {
                x: Math.floor(firstRoom.x + firstRoom.width / 2),
                y: Math.floor(firstRoom.y + firstRoom.height / 2)
            };
        }
        
        // Initialize visited grid
        this.initializeVisited();
        
        // Spawn enemies in the dungeon
        this.spawnEnemies();
    }
    
    /**
     * Spawn enemies throughout the dungeon
     * Each room (except the first) gets 1-3 enemies
     */
    spawnEnemies() {
        // Get available enemy templates for this floor
        const enemyTemplates = getEnemyTemplatesForFloor(this.floor);
        
        if (enemyTemplates.length === 0) {
            console.warn('No enemy templates available for floor', this.floor);
            return;
        }
        
        // Spawn enemies in rooms (skip first room where player starts)
        for (let i = 1; i < this.rooms.length; i++) {
            const room = this.rooms[i];
            
            // Determine how many enemies to spawn (1-3)
            const enemyCount = Math.floor(Math.random() * 3) + 1;
            
            for (let j = 0; j < enemyCount; j++) {
                // Pick a random enemy template
                const templateKey = enemyTemplates[Math.floor(Math.random() * enemyTemplates.length)];
                const template = getEnemyTemplate(templateKey);
                
                // Find a random walkable position in the room
                const spawnPos = this.getRandomPositionInRoom(room);
                
                if (spawnPos) {
                    // Create enemy with floor scaling
                    const multiplier = Math.pow(1.05, this.floor - 1);
                    
                    const enemyData = {
                        ...template,
                        id: `enemy_${this.floor}_${i}_${j}`,
                        x: spawnPos.x,
                        y: spawnPos.y,
                        floor: this.floor,
                        
                        // Scale stats by floor
                        maxHP: Math.ceil(template.maxHP * multiplier),
                        currentHP: Math.ceil(template.maxHP * multiplier),
                        baseATK: Math.ceil(template.baseATK * multiplier),
                        baseDEF: Math.ceil(template.baseDEF * multiplier),
                        
                        // Scale rewards by floor
                        experienceReward: Math.ceil(template.experienceReward * multiplier),
                        goldReward: Math.ceil(template.goldReward * multiplier)
                    };
                    
                    const enemy = new Enemy(enemyData);
                    this.addEntity(enemy);
                }
            }
        }
    }
    
    /**
     * Get a random walkable position within a room
     * @param {Object} room - Room object with x, y, width, height
     * @returns {Object|null} - Random position or null if not found
     */
    getRandomPositionInRoom(room) {
        const maxAttempts = 10;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.floor(room.x + 1 + Math.random() * (room.width - 2));
            const y = Math.floor(room.y + 1 + Math.random() * (room.height - 2));
            
            // Check if this position is walkable and not occupied
            if (this.isWalkable(x, y) && !this.getEntityAt(x, y)) {
                return { x, y };
            }
        }
        
        return null;
    }

    /**
     * Initialize visited tiles array
     */
    initializeVisited() {
        this.visited = [];
        for (let y = 0; y < this.height; y++) {
            this.visited[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.visited[y][x] = false;
            }
        }
    }

    /**
     * Get tile at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} - Tile type
     */
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return TILE_TYPES.WALL;
        }
        return this.grid[y][x];
    }

    /**
     * Set tile at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} type - Tile type
     */
    setTile(x, y, type) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[y][x] = type;
        }
    }

    /**
     * Kollar om en tile är gåbar
     * @param {number} x - X koordinat
     * @param {number} y - Y koordinat
     * @returns {boolean} - Sant om man kan gå här
     * 
     * Väggar är inte gåbara, men golv, trappor och dörrar är ok!
     */
    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        
        const tile = this.grid[y][x];
        return tile === TILE_TYPES.FLOOR || 
               tile === TILE_TYPES.STAIRS || 
               tile === TILE_TYPES.DOOR;
    }

    /**
     * Check if position has stairs
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} - True if stairs
     */
    isStairs(x, y) {
        return this.getTile(x, y) === TILE_TYPES.STAIRS;
    }

    /**
     * Markerar tiles som besökta (fog of war)
     * @param {number} centerX - Centrum X koordinat
     * @param {number} centerY - Centrum Y koordinat
     * @param {number} radius - Synradie (default 5 tiles)
     * 
     * Avslöjar alla tiles inom en cirkulär radie kring spelaren.
     * Använder Pythagoras för att kolla avstånd - matte från skolan
     * kommer till nytta!
     */
    revealTiles(centerX, centerY, radius = 5) {
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    // Check if within circular radius
                    const dx = x - centerX;
                    const dy = y - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= radius) {
                        this.visited[y][x] = true;
                    }
                }
            }
        }
    }

    /**
     * Check if tile has been visited
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} - True if visited
     */
    isVisited(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return this.visited[y][x];
    }

    /**
     * Add entity to dungeon
     * @param {Object} entity - Entity to add
     */
    addEntity(entity) {
        this.entities.push(entity);
    }

    /**
     * Remove entity from dungeon
     * @param {Object} entity - Entity to remove
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    /**
     * Get entity at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} - Entity or null
     */
    getEntityAt(x, y) {
        return this.entities.find(entity => entity.x === x && entity.y === y) || null;
    }

    /**
     * Get all entities of a specific type
     * @param {string} type - Entity type
     * @returns {Array} - Array of entities
     */
    getEntitiesByType(type) {
        return this.entities.filter(entity => entity.type === type);
    }

    /**
     * Get room that contains a position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} - Room or null
     */
    getRoomAt(x, y) {
        return this.rooms.find(room => 
            x >= room.x && x < room.x + room.width &&
            y >= room.y && y < room.y + room.height
        ) || null;
    }

    /**
     * Get dungeon data for serialization
     * @returns {Object} - Dungeon data
     */
    serialize() {
        return {
            floor: this.floor,
            width: this.width,
            height: this.height,
            grid: this.grid,
            rooms: this.rooms,
            stairsPosition: this.stairsPosition,
            playerStartPosition: this.playerStartPosition,
            visited: this.visited,
            entities: this.entities.map(e => e.serialize ? e.serialize() : e)
        };
    }

    /**
     * Load dungeon from serialized data
     * @param {Object} data - Dungeon data
     * @returns {Dungeon} - Loaded dungeon
     */
    static deserialize(data) {
        const dungeon = new Dungeon(data.floor);
        dungeon.width = data.width;
        dungeon.height = data.height;
        dungeon.grid = data.grid;
        dungeon.rooms = data.rooms;
        dungeon.stairsPosition = data.stairsPosition;
        dungeon.playerStartPosition = data.playerStartPosition;
        dungeon.visited = data.visited;
        // Note: Entities need to be deserialized separately
        dungeon.entities = [];
        return dungeon;
    }
}

export default Dungeon;
