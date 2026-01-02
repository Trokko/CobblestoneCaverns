/**
 * GameManager.js - Hjärtat i spelet!
 * 
 * Den här managern koordinerar allt som händer under själva spelet:
 * - Spelloopen (60 fps rendering)
 * - Dungeon-generering och laddning av våningar  
 * - Spelarens rörelser och kollisioner
 * - Kamerans följning av spelaren
 * - Växling mellan våningar
 * 
 * Tänk på den här som dirigenten i en orkester - den ser till
 * att alla delar spelar tillsammans i harmoni!
 */

import Dungeon from '../entities/Dungeon.js';
import DungeonRenderer from '../rendering/DungeonRenderer.js';
import { gameState } from './GameStateManager.js';
import { hudManager } from '../ui/HUDManager.js';
import { audioManager } from './AudioManager.js';
import { combatResolver } from '../systems/CombatResolver.js';
import { itemSystem } from '../systems/ItemSystem.js';
import { combatFeedback } from '../systems/CombatFeedback.js';

class GameManager {
    constructor() {
        // Singleton-mönster - vi vill bara ha EN GameManager
        if (GameManager.instance) {
            return GameManager.instance;
        }
        GameManager.instance = this;

        // Canvas och rendering
        this.canvas = null;           // HTML5 canvas-elementet
        this.renderer = null;         // DungeonRenderer som ritar allt
        
        // Spelvärlden
        this.dungeon = null;          // Nuvarande dungeon-våning
        this.player = null;           // Spelarkaraktären
        
        // Spelloop-hantering
        this.isRunning = false;       // Är spelloopen igång?
        this.lastFrameTime = 0;       // För att räkna ut deltaTime
        this.animationFrameId = null; // För att kunna stoppa loopen
    }

    /**
     * Startar upp GameManager med en canvas
     * @param {HTMLCanvasElement} canvas - Canvas-elementet att rita på
     * 
     * Sätter upp rendering, kamera och lyssnar på fönster-resize.
     */
    init(canvas) {
        this.canvas = canvas;
        this.resizeCanvas();
        
        // Skapa vår renderer som sköter all ritning
        this.renderer = new DungeonRenderer(canvas);
        
        // Initialize combat feedback system
        combatFeedback.init(canvas, window.audioManager);
        
        // Om fönstret ändrar storlek, anpassa canvasen
        window.addEventListener('resize', () => this.resizeCanvas());
        
        console.log('GameManager initialized');
    }

    /**
     * Anpassar canvasens storlek till tillgängligt utrymme
     * 
     * Tar hänsyn till HUD:ens höjd så canvasen fyller resten.
     * Kallas automatiskt när fönstret ändrar storlek.
     */
    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        
        // Sätt canvasens storlek till tillgängligt utrymme i dungeon-container
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Uppdatera renderare
        if (this.renderer) {
            this.renderer.resize(this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Startar ett nytt spel med en spelarkaraktär
     * @param {Player} player - Spelarens karaktär
     * 
     * Genererar första våningen och startar spelloopen.
     * Nu kör vi igång på riktigt!
     */
    startGame(player) {
        this.player = player;
        
        // Generera första dungeon-våningen
        this.loadFloor(player.floor);
        
        // Starta spelloopen (60 fps rendering)
        this.start();
        
        console.log('Game started on floor', player.floor);
    }

    /**
     * Laddar en dungeon-våning
     * @param {number} floorNumber - Vilket våningsnummer att ladda
     * 
     * Skapar en ny procedurellt genererad dungeon med BSP-algoritmen.
     * Placerar spelaren i startpositionen och avslöjar närliggande tiles.
     */
    loadFloor(floorNumber) {
        console.log('Loading floor', floorNumber);
        
        // Generera ny dungeon (se DungeonGenerator för magin!)
        this.dungeon = new Dungeon(floorNumber);
        
        // Placera spelaren vid startpunkten
        if (this.player) {
            this.player.x = this.dungeon.playerStartPosition.x;
            this.player.y = this.dungeon.playerStartPosition.y;
            this.player.floor = floorNumber;
            
            // Avslöja tiles runt spelaren
            this.dungeon.revealTiles(this.player.x, this.player.y);
            
            // Uppdatera HUD
            if (window.hudManager) {
                window.hudManager.updateFloor(floorNumber);
            }
        }
        
        // Update game state with dungeon enemies
        if (window.gameState) {
            window.gameState.dungeon = this.dungeon;
            window.gameState.enemies = this.dungeon.entities.filter(e => e.type === 'enemy');
            console.log(`Floor ${floorNumber} loaded with ${window.gameState.enemies.length} enemies`);
        }
        
        console.log('Floor loaded:', floorNumber, 'Player at:', this.player.x, this.player.y);
    }

    /**
     * Flytta spelaren till nästa våning
     * 
     * Kallas när spelaren står på trappan och bekräftar att de
     * vill gå ner. Inkrementerar våningsnumret och genererar
     * en helt ny dungeon att utforska!
     */
    descendFloor() {
        if (!this.player || !this.dungeon) return;
        
        // Dubbelkolla att spelaren verkligen står på trappan
        if (!this.dungeon.isStairs(this.player.x, this.player.y)) {
            console.warn('Player is not on stairs');
            return;
        }
        
        // En våning klarad! Uppdatera spelarens progress
        this.player.floor++;
        this.player.stats.floorsCleared++;
        
        // Ladda nästa våning
        this.loadFloor(this.player.floor);
        
        // Spela övergångseffekt/ljud
        if (window.audioManager) {
            window.audioManager.playSFX('stairsDescend');
        }
        
        // Visa notifikation
        if (window.hudManager) {
            window.hudManager.showFloatingText('Floor ' + this.player.floor, 'level-up');
        }
    }

    /**
     * Försöker flytta spelaren
     * @param {number} dx - Förändring i X (t.ex. -1 för vänster, +1 för höger)
     * @param {number} dy - Förändring i Y (t.ex. -1 för upp, +1 för ner)
     * @returns {boolean} - Sant om flytten lyckades
     * 
     * Kollar kollisioner med väggar och fiender innan flytt sker.
     * Detta är kärnan i den turn-baserade rörelsen!
     */
    movePlayer(dx, dy) {
        if (!this.player || !this.dungeon) return false;
        
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        // Kolla om nya positionen är gångbar
        if (!this.dungeon.isWalkable(newX, newY)) {
            return false;
        }
        
        // Kolla efter entiteter på nya positionen
        const entity = this.dungeon.getEntityAt(newX, newY);
        if (entity) {
            // Hantera kollision med entitet
            this.handleEntityCollision(entity);
            return false;
        }
        
        // Flytta spelaren
        this.player.x = newX;
        this.player.y = newY;
        
        // Avslöja tiles runt spelaren
        this.dungeon.revealTiles(newX, newY);
        
        // Kolla om på trappan
        if (this.dungeon.isStairs(newX, newY)) {
            // Visa trapp-prompt
            if (window.uiManager) {
                window.uiManager.showConfirmation(
                    'Descend to Floor ' + (this.player.floor + 1) + '?',
                    () => this.descendFloor(),
                    () => console.log('Descending cancelled')
                );
            }
        }
        
        // Processa turen (fiender rör sig, etc.)
        if (window.gameStateManager) {
            window.gameStateManager.processTurn();
        }
        
        return true;
    }

    /**
     * Hanterar när spelaren krockar med något
     * @param {Object} entity - Den entity som krockades med
     * 
     * Beroende på vad spelaren stöter på händer olika saker:
     * - Fiende: Starta strid!
     * - Föremål: Plocka upp det!
     * - Destructible prop: Förstör den och få loot!
     */
    handleEntityCollision(entity) {
        if (!entity) return;
        
        if (entity.type === 'enemy') {
            // COMBAT START: Player attacks enemy
            this.initiateCombat(entity);
        } else if (entity.type === 'item') {
            // Pick up item automatically or show UI option
            const pickupSuccess = itemSystem.pickupItem(entity, this.player);
            if (pickupSuccess) {
                console.log(`You picked up: ${entity.name}`);
                if (window.hudManager) {
                    window.hudManager.showFloatingText(
                        `+${entity.name}`,
                        'pickup'
                    );
                }
                // Refresh inventory UI if open
                if (window.inventoryUI) {
                    window.inventoryUI.showPickupNotification(entity.name);
                }
            } else {
                console.log('Could not pick up item');
            }
        } else if (entity.type === 'prop') {
            // Interagera med prop
            console.log('Prop interacted with!');
        }
    }

    /**
     * Initiates combat between player and enemy
     * @param {Object} enemy - The enemy to fight
     * 
     * Player attacks first (they initiated contact).
     * Combat continues until one dies or player retreats.
     */
    initiateCombat(enemy) {
        if (!this.player || !enemy || !enemy.isAlive) {
            return;
        }

        console.log(`Combat started with ${enemy.name}!`);

        // Player attacks first (always, since they moved into the enemy)
        const playerAttack = combatResolver.resolveAttack(this.player, enemy);

        // Show combat message in HUD
        const message = combatResolver.formatCombatMessage(playerAttack, true);
        if (window.hudManager) {
            window.hudManager.showAttackFeedback(playerAttack);
            if (playerAttack.isCritical) {
                window.hudManager.showCriticalHitEffect();
            }
        }

        // Add to combat log
        combatFeedback.showAttackFeedback(playerAttack, true);

        console.log(message);

        // Check if enemy died
        if (playerAttack.defenderDied) {
            const loot = combatResolver.applyDeathEffects(enemy, this.player, this.dungeon);
            
            // Update HUD to reflect XP gains
            if (window.hudManager) {
                window.hudManager.updateXP();
                
                // Show death message
                window.hudManager.showEnemyDeathEffect(enemy.name);
                
                // Show rewards
                if (loot) {
                    window.hudManager.showFloatingText(
                        `+${loot.xp} XP +${loot.gold} Gold`,
                        'reward'
                    );
                    
                    // If player leveled up, update level display
                    if (loot.leveledUp) {
                        window.hudManager.updateLevel();
                        window.hudManager.updateHP();
                        window.hudManager.updateStats();
                    }
                }
            }

            // Add to combat log
            combatFeedback.showDeathFeedback(enemy.name, loot);

            console.log(`${enemy.name} defeated! Rewards:`, loot);
            return; // Combat over, enemy dead
        }

        // Enemy is still alive - THEY ATTACK BACK
        // But this happens on their turn (during processTurn)
        // Store that combat is active
        enemy.inCombat = true;
        enemy.combatOpponent = this.player;
    }

    /**
     * Resolve enemy counter-attack (happens during their turn)
     * @param {Object} enemy - Enemy counterattacking
     * 
     * Called when it's the enemy's turn and they're in combat.
     * Enemy attacks player immediately instead of wandering/chasing.
     */
    resolveEnemyCounterAttack(enemy) {
        if (!this.player || !enemy || !enemy.inCombat) {
            return;
        }

        // Check if still adjacent
        if (!combatResolver.areAdjacent(enemy, this.player)) {
            // Combat ended - they're not adjacent anymore
            enemy.inCombat = false;
            enemy.combatOpponent = null;
            return;
        }

        // Enemy attacks player
        const enemyAttack = combatResolver.resolveAttack(enemy, this.player);

        // Show enemy attack with visual feedback
        const message = combatResolver.formatCombatMessage(enemyAttack, false);
        if (window.hudManager) {
            window.hudManager.showDamageTakenFeedback(enemyAttack.attackDamage);
            if (enemyAttack.isCritical) {
                window.hudManager.showCriticalHitEffect();
            }
        }

        // Add to combat log (enemy attacking you)
        combatFeedback.showAttackFeedback(enemyAttack, false);

        console.log(message);

        // Check if player died
        if (enemyAttack.defenderDied) {
            console.log('You have been defeated!');
            combatFeedback.addCombatLogEntry('You have been defeated!', 'death');
            if (window.gameState) {
                window.gameState.gameOver();
            }
        }
    }

    /**
     * Startar spelloopen
     * 
     * Använder requestAnimationFrame för smidig 60 fps rendering.
     * Detta är hjärtat som pumpar - varje frame uppdateras och ritas!
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.gameLoop();
        
        console.log('Game loop started');
    }

    /**
     * Stoppar spelloopen
     * 
     * Pausar all uppdatering och rendering. Användbart för menyer
     * och när spelaren pausar.
     */
    stop() {
        this.isRunning = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        console.log('Game loop stopped');
    }

    /**
     * Huvudloopen som körs varje frame
     * @param {number} currentTime - Nuvarande tidsstämpel från browser
     * 
     * Denna metod anropas ~60 gånger per sekund och sköter:
     * 1. Beräkna deltaTime (tid sedan förra framen)
     * 2. Uppdatera spellogik
     * 3. Rita allt på skärmen
     * 4. Schemalägg nästa frame
     */
    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        
        // Beräkna delta time
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Uppdatera speltillståndet
        this.update(deltaTime);
        
        // Rita spelet
        this.render();
        
        // Schemalägg nästa frame
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * Uppdaterar spellogiken
     * @param {number} deltaTime - Tid sedan förra framen i millisekunder
     * 
     * Här uppdateras:
     * - Animationer (spridning, partiklar etc)
     * - Fiendernas AI
     * - Statuseffekter (gift, eld etc)
     * - Fysik och kollisioner
     */
    update(deltaTime) {
        // TODO: Uppdatera spellogik
        // - Uppdatera animationer
        // - Uppdatera partiklar
        // - Uppdatera fiender
        // - Uppdatera effekter
    }

    /**
     * Ritar allt på skärmen
     * 
     * Använder DungeonRenderer för att rita:
     * - Dungeonen med alla tiles
     * - Fog of war (dimma över outforskade områden)
     * - Alla entities (fiender, items, props)
     * - Spelaren själv
     */
    render() {
        if (!this.renderer || !this.dungeon) return;
        
        // Rita dungeon och entiteter
        this.renderer.render(this.dungeon, this.player);
    }

    /**
     * Pause the game
     */
    pause() {
        if (window.gameStateManager) {
            window.gameStateManager.togglePause();
        }
        this.stop();
    }

    /**
     * Resume the game
     */
    resume() {
        if (window.gameStateManager) {
            window.gameStateManager.togglePause();
        }
        this.start();
    }

    /**
     * Reset game state
     */
    reset() {
        this.stop();
        this.dungeon = null;
        this.player = null;
        this.isRunning = false;
    }

    /**
     * Get current dungeon
     * @returns {Dungeon|null}
     */
    getDungeon() {
        return this.dungeon;
    }

    /**
     * Get current player
     * @returns {Player|null}
     */
    getPlayer() {
        return this.player;
    }
}

// Skapa singleton-instans
const gameManager = new GameManager();

export default gameManager;
