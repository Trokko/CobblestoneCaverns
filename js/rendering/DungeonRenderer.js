/**
 * DungeonRenderer.js - Dungeon-ritaren!
 * 
 * Sköter all rendering av dungeonen på HTML5 Canvas:
 * - Kamera som följer spelaren
 * - Viewport culling (ritar bara synliga tiles för prestanda)
 * - Fog of war rendering (dimma över outforskade områden)
 * - Tiles, entities och spelaren
 * 
 * Optimerad för 60 fps smädig rendering!
 */

import { TILE_TYPES, CONFIG } from '../config.js';
import { assetLoader } from '../core/AssetLoader.js';

class DungeonRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = CONFIG.TILE_SIZE; // 32 pixlar per tile
        
        // Kameraegenskaper - vad ser vi just nu?
        this.camera = {
            x: 0,      // Top-left X i världs-tiles
            y: 0,      // Top-left Y i världs-tiles
            width: 0,  // Synlig bredd i tiles
            height: 0  // Synlig höjd i tiles
        };
        
        // Placeholder-färger tills vi laddar riktiga sprites
        this.tileColors = {
            [TILE_TYPES.WALL]: '#4a4a4a',
            [TILE_TYPES.FLOOR]: '#c9b896',
            [TILE_TYPES.DOOR]: '#8b4513',
            [TILE_TYPES.STAIRS]: '#ffd700',
            [TILE_TYPES.HAZARD]: '#dc143c'
        };
        
        // Fog of war settings
        this.enableFogOfWar = true;
        this.fogColor = 'rgba(0, 0, 0, 0.7)';
        this.exploredFogColor = 'rgba(0, 0, 0, 0.3)';
        
        this.updateCameraSize();
    }

    /**
     * Update camera viewport size based on canvas
     */
    updateCameraSize() {
        this.camera.width = Math.ceil(this.canvas.width / this.tileSize);
        this.camera.height = Math.ceil(this.canvas.height / this.tileSize);
    }

    /**
     * Center camera on a position
     * @param {number} x - X coordinate (in tiles)
     * @param {number} y - Y coordinate (in tiles)
     * @param {Object} dungeon - Dungeon object for bounds checking
     */
    centerCamera(x, y, dungeon) {
        // Center camera on position
        this.camera.x = x - Math.floor(this.camera.width / 2);
        this.camera.y = y - Math.floor(this.camera.height / 2);
        
        // Clamp camera to dungeon bounds
        this.camera.x = Math.max(0, Math.min(this.camera.x, dungeon.width - this.camera.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, dungeon.height - this.camera.height));
    }

    /**
     * Ritar dungeonen
     * @param {Object} dungeon - Dungeonen att rita
     * @param {Object} player - Spelaren för kamerapositionering
     * 
     * Huvudmetoden som ritar allt i rätt ordning:
     * 1. Rensa canvas (svart bakgrund)
     * 2. Centrera kamera på spelaren
     * 3. Rita tiles (bara de synliga - viewport culling!)
     * 4. Rita fog of war
     * 5. Rita entities och spelaren
     */
    render(dungeon, player = null) {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update camera to follow player
        if (player) {
            this.centerCamera(player.x, player.y, dungeon);
        }
        
        // Calculate visible tile range with some padding
        const startX = Math.max(0, Math.floor(this.camera.x) - 1);
        const endX = Math.min(dungeon.width, Math.ceil(this.camera.x + this.camera.width) + 1);
        const startY = Math.max(0, Math.floor(this.camera.y) - 1);
        const endY = Math.min(dungeon.height, Math.ceil(this.camera.y + this.camera.height) + 1);
        
        // Render tiles
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const isVisible = !this.enableFogOfWar || dungeon.isVisited(x, y);
                
                if (isVisible) {
                    this.renderTile(x, y, dungeon.getTile(x, y));
                }
            }
        }
        
        // Render fog of war
        if (this.enableFogOfWar && player) {
            this.renderFogOfWar(dungeon, player);
        }
        
        // Render entities
        this.renderEntities(dungeon, startX, endX, startY, endY);
        
        // Render player
        if (player) {
            this.renderPlayer(player);
        }
        
        // Render grid (debug mode)
        if (window.DEBUG_MODE) {
            this.renderGrid(startX, endX, startY, endY);
        }
    }

    /**
     * Render a single tile
     * @param {number} x - Tile X coordinate
     * @param {number} y - Tile Y coordinate
     * @param {number} tileType - Tile type
     */
    renderTile(x, y, tileType) {
        const screenX = (x - this.camera.x) * this.tileSize;
        const screenY = (y - this.camera.y) * this.tileSize;
        
        // Base tile color
        this.ctx.fillStyle = this.tileColors[tileType] || '#000000';
        this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
        
        // Add some visual variety to tiles
        if (tileType === TILE_TYPES.WALL) {
            // Add darker border to walls
            this.ctx.strokeStyle = '#2a2a2a';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
        } else if (tileType === TILE_TYPES.FLOOR) {
            // Add subtle texture to floor
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            this.ctx.fillRect(screenX + 2, screenY + 2, this.tileSize - 4, this.tileSize - 4);
        } else if (tileType === TILE_TYPES.STAIRS) {
            // Draw stairs icon
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
            
            // Rita trappsteg
            this.ctx.fillStyle = '#888';
            for (let i = 0; i < 5; i++) {
                const stepY = screenY + (i * this.tileSize / 5);
                const stepWidth = this.tileSize - (i * this.tileSize / 10);
                this.ctx.fillRect(screenX, stepY, stepWidth, this.tileSize / 5);
            }
        }
    }

    /**
     * Ritar fog of war
     * @param {Object} dungeon - Dungeon-objektet
     * @param {Object} player - Spelaren
     * 
     * Tre nivåer av synlighet:
     * 1. Obesökt: Mörk dimma (rgba 0,0,0,0.7)
     * 2. Utforskad men ej synlig: Ljusare dimma (rgba 0,0,0,0.3)
     * 3. Inom synradie: Helt synlig!
     */
    renderFogOfWar(dungeon, player) {
        const visionRadius = 5; // Spelaren ser 5 tiles i alla riktningar
        
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const screenX = (x - this.camera.x) * this.tileSize;
                const screenY = (y - this.camera.y) * this.tileSize;
                
                // Skip if off-screen
                if (screenX + this.tileSize < 0 || screenX > this.canvas.width ||
                    screenY + this.tileSize < 0 || screenY > this.canvas.height) {
                    continue;
                }
                
                const dx = x - player.x;
                const dy = y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (dungeon.isVisited(x, y)) {
                    // Explored but not currently visible
                    if (distance > visionRadius) {
                        this.ctx.fillStyle = this.exploredFogColor;
                        this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                    }
                } else {
                    // Unexplored
                    this.ctx.fillStyle = this.fogColor;
                    this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                }
            }
        }
    }

    /**
     * Render entities (enemies, items, props)
     * @param {Object} dungeon - Dungeon object
     * @param {number} startX - Start X of visible area
     * @param {number} endX - End X of visible area
     * @param {number} startY - Start Y of visible area
     * @param {number} endY - End Y of visible area
     */
    renderEntities(dungeon, startX, endX, startY, endY) {
        for (const entity of dungeon.entities) {
            // Only render if in visible range
            if (entity.x >= startX && entity.x < endX &&
                entity.y >= startY && entity.y < endY) {
                
                // Only render if tile is visited
                if (!this.enableFogOfWar || dungeon.isVisited(entity.x, entity.y)) {
                    this.renderEntity(entity);
                }
            }
        }
    }

    /**
     * Render a single entity
     * @param {Object} entity - Entity to render
     */
    renderEntity(entity) {
        const screenX = (entity.x - this.camera.x) * this.tileSize;
        const screenY = (entity.y - this.camera.y) * this.tileSize;
        
        // Render by entity type
        if (entity.type === 'enemy') {
            // Try drawing sprite if available
            const spriteKey = typeof entity.sprite === 'string' ? entity.sprite.replace(/\.[^/.]+$/, '') : entity.sprite;
            const img = assetLoader && assetLoader.hasImage && assetLoader.hasImage(spriteKey) ? assetLoader.getImage(spriteKey) : null;
            if (img) {
                this.ctx.drawImage(img, screenX, screenY, this.tileSize, this.tileSize);
            } else {
                // Fallback: colored square
                this.ctx.fillStyle = entity.color || '#ff3333';
                this.ctx.fillRect(
                    screenX + this.tileSize * 0.2,
                    screenY + this.tileSize * 0.2,
                    this.tileSize * 0.6,
                    this.tileSize * 0.6
                );
            }
        } else if (entity.type === 'item') {
            // Item: Rarity-based color diamond shape
            const color = entity.getColor ? entity.getColor() : entity.color || '#FFD700';
            this.ctx.fillStyle = color;
            
            // Draw diamond shape for items
            this.ctx.beginPath();
            this.ctx.moveTo(screenX + this.tileSize / 2, screenY + this.tileSize * 0.2);
            this.ctx.lineTo(screenX + this.tileSize * 0.8, screenY + this.tileSize / 2);
            this.ctx.lineTo(screenX + this.tileSize / 2, screenY + this.tileSize * 0.8);
            this.ctx.lineTo(screenX + this.tileSize * 0.2, screenY + this.tileSize / 2);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Add glimmer outline
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        } else if (entity.type === 'prop') {
            // Props: Gray square
            this.ctx.fillStyle = entity.color || '#888888';
            this.ctx.fillRect(
                screenX + this.tileSize * 0.2,
                screenY + this.tileSize * 0.2,
                this.tileSize * 0.6,
                this.tileSize * 0.6
            );
        } else {
            // Default placeholder
            this.ctx.fillStyle = entity.color || '#ff0000';
            this.ctx.fillRect(
                screenX + this.tileSize * 0.2,
                screenY + this.tileSize * 0.2,
                this.tileSize * 0.6,
                this.tileSize * 0.6
            );
        }
    }

    /**
     * Render the player
     * @param {Object} player - Player entity
     */
    renderPlayer(player) {
        const screenX = (player.x - this.camera.x) * this.tileSize;
        const screenY = (player.y - this.camera.y) * this.tileSize;
        
        // Try drawing player sprite if available
        const playerSpriteKey = typeof player.sprite === 'string' ? player.sprite.replace(/\.[^/.]+$/, '') : player.sprite;
        const playerImg = assetLoader && assetLoader.hasImage && assetLoader.hasImage(playerSpriteKey) ? assetLoader.getImage(playerSpriteKey) : null;
        if (playerImg) {
            this.ctx.drawImage(playerImg, screenX, screenY, this.tileSize, this.tileSize);
        } else {
            // Draw player circle
            this.ctx.fillStyle = '#4169e1'; // Royal blue
            this.ctx.beginPath();
            this.ctx.arc(
                screenX + this.tileSize / 2,
                screenY + this.tileSize / 2,
                this.tileSize * 0.4,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Draw player outline
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    /**
     * Render debug grid
     * @param {number} startX - Start X of visible area
     * @param {number} endX - End X of visible area
     * @param {number} startY - Start Y of visible area
     * @param {number} endY - End Y of visible area
     */
    renderGrid(startX, endX, startY, endY) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = startX; x <= endX; x++) {
            const screenX = (x - this.camera.x) * this.tileSize;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = startY; y <= endY; y++) {
            const screenY = (y - this.camera.y) * this.tileSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.canvas.width, screenY);
            this.ctx.stroke();
        }
    }

    /**
     * Convert screen coordinates to world coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {Object} - World coordinates {x, y}
     */
    screenToWorld(screenX, screenY) {
        return {
            x: Math.floor(screenX / this.tileSize + this.camera.x),
            y: Math.floor(screenY / this.tileSize + this.camera.y)
        };
    }

    /**
     * Convert world coordinates to screen coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object} - Screen coordinates {x, y}
     */
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.camera.x) * this.tileSize,
            y: (worldY - this.camera.y) * this.tileSize
        };
    }

    /**
     * Resize canvas and update camera
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.updateCameraSize();
    }

    /**
     * Toggle fog of war
     */
    toggleFogOfWar() {
        this.enableFogOfWar = !this.enableFogOfWar;
    }
}

export default DungeonRenderer;
