/**
 * DungeonGenerator.js - Magisk dungeongenererare!
 * 
 * Använder Binary Space Partitioning (BSP) för att skapa
 * slumpmässiga dungeons som alltid är spelbara.
 * 
 * Hur det funkar:
 * 1. Dela upp ytan rekursivt i små partitioner (BSP-träd)
 * 2. Skapa ett rum i varje partition
 * 3. Koppla ihop rummen med korridorer (L-formade gångar)
 * 4. Lägg till extra kopplingar för variation
 * 5. Validera att allt är nåbart med flood-fill
 * 
 * Resultatet: Unika, spelbara dungeons varje gång!
 */

import { TILE_TYPES, DUNGEON_CONFIG } from '../config.js';

class DungeonGenerator {
    constructor(width = 50, height = 50) {
        this.width = width;
        this.height = height;
        this.grid = [];
        this.rooms = [];
    }

    /**
     * Genererar en komplett dungeon!
     * @param {number} minRooms - Minsta antal rum
     * @param {number} maxRooms - Största antal rum
     * @returns {Object} - Färdig dungeondata
     * 
     * Detta är huvudmetoden som orkestrerar hela genereringen.
     * Om valideringen misslyckas (t.ex. ett rum är avskilt),
     * genererar vi om tills vi får en bra dungeon!
     */
    generate(minRooms = 5, maxRooms = 10) {
        // Börja med att fylla allt med väggar
        this.initializeGrid();
        
        // Create BSP tree and split into partitions
        const rootPartition = {
            x: 0,
            y: 0,
            width: this.width,
            height: this.height
        };
        
        // Split partitions recursively
        const partitions = this.splitPartition(rootPartition, minRooms, maxRooms);
        
        // Create rooms in each partition
        this.rooms = [];
        partitions.forEach(partition => {
            const room = this.createRoomInPartition(partition);
            if (room) {
                this.rooms.push(room);
                this.carveRoom(room);
            }
        });
        
        // Connect rooms with corridors
        this.connectRooms();
        
        // Place stairs
        const stairsPos = this.placeStairs();
        
        // Validate dungeon connectivity
        if (!this.validateConnectivity(stairsPos)) {
            console.warn('Dungeon connectivity validation failed, regenerating...');
            return this.generate(minRooms, maxRooms);
        }
        
        return {
            grid: this.grid,
            rooms: this.rooms,
            width: this.width,
            height: this.height,
            stairsPosition: stairsPos
        };
    }

    /**
     * Initierar gridet med väggar överallt
     * 
     * Vi börjar med en solid stenplatta - sedan karvar vi ut rum!
     */
    initializeGrid() {
        this.grid = [];
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = TILE_TYPES.WALL;
            }
        }
    }

    /**
     * Delar upp partitionen rekursivt med BSP
     * @param {Object} partition - Nuvarande partition att dela
     * @param {number} minRooms - Minsta antal rum
     * @param {number} maxRooms - Största antal rum  
     * @param {number} depth - Nuvarande rekursionsdjup
     * @returns {Array} - Array med löv-partitioner (de minsta bitarna)
     * 
     * BSP-algoritmen i action! Vi delar ytan i mindre och mindre bitar
     * tills vi har lagom stora områden för rum. Slumpar mellan
     * horisontella och vertikala delningar för variation.
     */
    splitPartition(partition, minRooms, maxRooms, depth = 0) {
        const MIN_SIZE = 8;   // Minsta storlek för en partition
        const MAX_DEPTH = 4;  // Max rekursionsdjup (annars blir rummen för små!)
        
        // Sluta dela om vi nått botten eller partitionen är för liten
        if (depth >= MAX_DEPTH || 
            partition.width < MIN_SIZE * 2 || 
            partition.height < MIN_SIZE * 2) {
            return [partition];
        }
        
        // Decide whether to split horizontally or vertically
        const splitHorizontally = Math.random() > 0.5;
        
        if (splitHorizontally && partition.height >= MIN_SIZE * 2) {
            // Split horizontally
            const splitY = partition.y + MIN_SIZE + Math.floor(Math.random() * (partition.height - MIN_SIZE * 2));
            
            const top = {
                x: partition.x,
                y: partition.y,
                width: partition.width,
                height: splitY - partition.y
            };
            
            const bottom = {
                x: partition.x,
                y: splitY,
                width: partition.width,
                height: partition.y + partition.height - splitY
            };
            
            return [
                ...this.splitPartition(top, minRooms, maxRooms, depth + 1),
                ...this.splitPartition(bottom, minRooms, maxRooms, depth + 1)
            ];
        } else if (!splitHorizontally && partition.width >= MIN_SIZE * 2) {
            // Split vertically
            const splitX = partition.x + MIN_SIZE + Math.floor(Math.random() * (partition.width - MIN_SIZE * 2));
            
            const left = {
                x: partition.x,
                y: partition.y,
                width: splitX - partition.x,
                height: partition.height
            };
            
            const right = {
                x: splitX,
                y: partition.y,
                width: partition.x + partition.width - splitX,
                height: partition.height
            };
            
            return [
                ...this.splitPartition(left, minRooms, maxRooms, depth + 1),
                ...this.splitPartition(right, minRooms, maxRooms, depth + 1)
            ];
        }
        
        // Cannot split further
        return [partition];
    }

    /**
     * Skapar ett rum inuti en partition
     * @param {Object} partition - Partitionen att skapa rum i
     * @returns {Object} - Rumobjekt med position och storlek
     * 
     * Rummet blir slumpmässigt placerat och storleksvarierande,
     * men hålls inom partitionens gränser med lite padding.
     * Detta ger naturlig variation!
     */
    createRoomInPartition(partition) {
        const MIN_ROOM_SIZE = 4;  // Minsta rumstorlek (annars blir det trångt!)
        const PADDING = 2;         // Mellanrum till partitionens kanter
        
        const maxWidth = partition.width - PADDING * 2;
        const maxHeight = partition.height - PADDING * 2;
        
        if (maxWidth < MIN_ROOM_SIZE || maxHeight < MIN_ROOM_SIZE) {
            return null;
        }
        
        const width = MIN_ROOM_SIZE + Math.floor(Math.random() * (maxWidth - MIN_ROOM_SIZE + 1));
        const height = MIN_ROOM_SIZE + Math.floor(Math.random() * (maxHeight - MIN_ROOM_SIZE + 1));
        
        const x = partition.x + PADDING + Math.floor(Math.random() * (maxWidth - width + 1));
        const y = partition.y + PADDING + Math.floor(Math.random() * (maxHeight - height + 1));
        
        return { x, y, width, height };
    }

    /**
     * Karvar ut ett rum i gridet
     * @param {Object} room - Rummet att karva
     * 
     * Går igenom alla tiles i rummets område och ändrar dem
     * från vägg till golv. Nu kan spelaren gå här!
     */
    carveRoom(room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    this.grid[y][x] = TILE_TYPES.FLOOR;
                }
            }
        }
    }

    /**
     * Kopplar ihop alla rum med korridorer
     * 
     * Vi sorterar rummen efter position och kopplar varje rum till
     * nästa. Sen lägger vi till extra slumpmässiga kopplingar
     * för att skapa alternativa vägar - spelaren ska ha val!
     */
    connectRooms() {
        // Sortera rum efter position för bättre ihopkoppling
        const sortedRooms = [...this.rooms].sort((a, b) => {
            return (a.x + a.y) - (b.x + b.y);
        });
        
        // Connect each room to the next one
        for (let i = 0; i < sortedRooms.length - 1; i++) {
            const roomA = sortedRooms[i];
            const roomB = sortedRooms[i + 1];
            
            this.createCorridor(
                this.getRoomCenter(roomA),
                this.getRoomCenter(roomB)
            );
        }
        
        // Add some extra connections for variety
        const extraConnections = Math.floor(this.rooms.length / 3);
        for (let i = 0; i < extraConnections; i++) {
            const roomA = this.rooms[Math.floor(Math.random() * this.rooms.length)];
            const roomB = this.rooms[Math.floor(Math.random() * this.rooms.length)];
            
            if (roomA !== roomB) {
                this.createCorridor(
                    this.getRoomCenter(roomA),
                    this.getRoomCenter(roomB)
                );
            }
        }
    }

    /**
     * Get center point of a room
     * @param {Object} room - Room object
     * @returns {Object} - Center coordinates {x, y}
     */
    getRoomCenter(room) {
        return {
            x: Math.floor(room.x + room.width / 2),
            y: Math.floor(room.y + room.height / 2)
        };
    }

    /**
     * Skapar en korridor mellan två punkter
     * @param {Object} start - Startpunkt {x, y}
     * @param {Object} end - Slutpunkt {x, y}
     * 
     * Gör en L-formad korridor (antingen horisontellt-vertikalt
     * eller vertikalt-horisontellt). Slumpen bestämmer vilket
     * för variation i hur korridorerna ser ut!
     */
    createCorridor(start, end) {
        let x = start.x;
        let y = start.y;
        
        // L-formad korridor (slumpa riktning)
        if (Math.random() > 0.5) {
            // Horizontal then vertical
            while (x !== end.x) {
                this.carveTile(x, y);
                x += (end.x > x) ? 1 : -1;
            }
            while (y !== end.y) {
                this.carveTile(x, y);
                y += (end.y > y) ? 1 : -1;
            }
        } else {
            // Vertical then horizontal
            while (y !== end.y) {
                this.carveTile(x, y);
                y += (end.y > y) ? 1 : -1;
            }
            while (x !== end.x) {
                this.carveTile(x, y);
                x += (end.x > x) ? 1 : -1;
            }
        }
        
        this.carveTile(x, y);
    }

    /**
     * Carve a single tile (and optionally widen it)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    carveTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[y][x] = TILE_TYPES.FLOOR;
            
            // Ibland bredda korridorer för variation
            if (Math.random() < 0.3) {
                if (x + 1 < this.width) this.grid[y][x + 1] = TILE_TYPES.FLOOR;
                if (y + 1 < this.height) this.grid[y + 1][x] = TILE_TYPES.FLOOR;
            }
        }
    }

    /**
     * Placerar trappan till nästa våning
     * @returns {Object} - Trappans position {x, y}
     * 
     * Vi lägger trappan i sista rummet (längst från start).
     * Detta uppmuntrar utforskning - spelaren måste leta!
     */
    placeStairs() {
        if (this.rooms.length === 0) {
            throw new Error('No rooms available for stairs placement');
        }
        
        // Place stairs in the last room (furthest from start)
        const room = this.rooms[this.rooms.length - 1];
        const center = this.getRoomCenter(room);
        
        this.grid[center.y][center.x] = TILE_TYPES.STAIRS;
        
        return center;
    }

    /**
     * Validerar att alla golv-tiles är ihopkopplade
     * @param {Object} stairsPos - Trappans position att validera från
     * @returns {boolean} - Sant om dungeonen är fullt ihopkopplad
     * 
     * Använder flood-fill algoritm från trappan. Om vi kan nå
     * alla golv-tiles så är dungeonen spelbar! Annars genererar
     * vi om - inget rum får vara isolerat.
     */
    validateConnectivity(stairsPos) {
        if (!stairsPos) return false;
        
        // Flood fill from stairs to check if all floors are reachable
        const visited = Array(this.height).fill(null).map(() => Array(this.width).fill(false));
        let floorCount = 0;
        let reachableCount = 0;
        
        // Count total floor tiles
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] !== TILE_TYPES.WALL) {
                    floorCount++;
                }
            }
        }
        
        // Flood fill from stairs
        const queue = [stairsPos];
        visited[stairsPos.y][stairsPos.x] = true;
        
        while (queue.length > 0) {
            const pos = queue.shift();
            reachableCount++;
            
            // Check all 4 directions
            const directions = [
                { x: pos.x + 1, y: pos.y },
                { x: pos.x - 1, y: pos.y },
                { x: pos.x, y: pos.y + 1 },
                { x: pos.x, y: pos.y - 1 }
            ];
            
            for (const dir of directions) {
                if (dir.x >= 0 && dir.x < this.width && 
                    dir.y >= 0 && dir.y < this.height &&
                    !visited[dir.y][dir.x] &&
                    this.grid[dir.y][dir.x] !== TILE_TYPES.WALL) {
                    
                    visited[dir.y][dir.x] = true;
                    queue.push(dir);
                }
            }
        }
        
        // All floor tiles should be reachable
        return reachableCount === floorCount;
    }

    /**
     * Get a random walkable position in the dungeon
     * @param {Object} excludePos - Position to exclude (optional)
     * @returns {Object} - Random position {x, y}
     */
    getRandomWalkablePosition(excludePos = null) {
        const walkableTiles = [];
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                    if (!excludePos || excludePos.x !== x || excludePos.y !== y) {
                        walkableTiles.push({ x, y });
                    }
                }
            }
        }
        
        if (walkableTiles.length === 0) {
            return null;
        }
        
        return walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
    }
}

export default DungeonGenerator;
