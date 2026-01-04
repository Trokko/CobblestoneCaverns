/**
 * main.js - Huvudapplikationens ingångspunkt
 * 
 * Här startar hela spelet! Den här filen sköter:
 * - Initialisering av alla managers (ljud, grafik, input etc.)
 * - Uppkoppling mot Firebase för sparfunktioner
 * - Hantering av huvudmenyn och skärmbyten
 * - Koordinering mellan olika delsystem
 */

import { CONFIG, SCREEN_STATES } from './config.js';
import { gameState } from './core/GameStateManager.js';
import { inputManager } from './core/InputManager.js';
import { audioManager } from './core/AudioManager.js';
import { assetLoader } from './core/AssetLoader.js';
import { uiManager } from './ui/UIManager.js';
import { saveManager } from './firebase/SaveManager.js';
import { characterCreationUI } from './ui/CharacterCreationUI.js';
import { hudManager } from './ui/HUDManager.js';
import { inventoryUI } from './ui/InventoryUI.js';
import gameManager from './core/GameManager.js';

// Huvudklassen som driver hela spelet
class Game {
    constructor() {
        this.initialized = false; // Håller koll på om spelet är igång
    }

    /**
     * Startar upp spelet och initialiserar alla system
     * 
     * Det här är det första som händer när spelet laddas!
     * Vi startar alla managers i rätt ordning och förbereder allt.
     */
    async init() {
        if (this.initialized) return;

        console.log(`Cobblestone Caverns v${CONFIG.GAME_VERSION}`);
        console.log('Initializing game...');

        // Visa laddningsskärm (kan läggas till senare)
        
        // Starta upp alla viktiga managers - ordningen är viktig!
        gameState.init();      // Spelstatus och turn-hantering
        inputManager.init();   // Tangentbord, mus och touch
        audioManager.init();   // Musik och ljudeffekter
        assetLoader.init();    // Laddar bilder och sprites
        uiManager.init();      // Menyer och dialoger
        hudManager.init();     // HUD (Health, XP, stats etc)
        inventoryUI.init();    // Inventory panel

        // Koppla upp mot Firebase för sparfunktioner (valfritt - spelet funkar ändå)
        try {
            await saveManager.init();
        } catch (error) {
            console.warn('SaveManager initialization failed (this is OK):', error.message);
        }
        
        // Gör managers tillgängliga globalt så andra moduler kan använda dem
        window.audioManager = audioManager;
        window.uiManager = uiManager;
        window.gameState = gameState;
        window.hudManager = hudManager;
        window.gameManager = gameManager;
        window.inventoryUI = inventoryUI;
        
        // Starta upp karaktärsskapandet (körs när spelaren klickar "New Game")
        characterCreationUI.init((player) => this.onCharacterCreated(player));

        // Ladda in alla bilder och sprites i förväg
        try {
            await assetLoader.preloadGameAssets();
            console.log('Assets loaded successfully');
        } catch (error) {
            console.error('Failed to load some assets:', error);
        }

        // Ladda in ljudfiler
        audioManager.preloadAssets();

        // Koppla ihop knappar med funktioner
        this.setupEventListeners();

        // Kolla om det finns ett sparat spel
        await this.checkForSavedGame();

        // Auto-test mode: start a default Warrior immediately if URL has ?autotest=1
        try {
            if (window.location && window.location.search && window.location.search.indexOf('autotest=1') !== -1) {
                console.log('Autotest mode detected - creating test player');

                // Create a visible dev log panel on the page
                let devLogEl = document.getElementById('dev-log');
                if (!devLogEl) {
                    devLogEl = document.createElement('div');
                    devLogEl.id = 'dev-log';
                    devLogEl.style.position = 'fixed';
                    devLogEl.style.right = '10px';
                    devLogEl.style.bottom = '10px';
                    devLogEl.style.width = '300px';
                    devLogEl.style.height = '200px';
                    devLogEl.style.overflow = 'auto';
                    devLogEl.style.background = 'rgba(0,0,0,0.8)';
                    devLogEl.style.color = '#fff';
                    devLogEl.style.fontSize = '12px';
                    devLogEl.style.padding = '8px';
                    devLogEl.style.zIndex = 9999;
                    devLogEl.style.border = '1px solid #666';
                    devLogEl.style.borderRadius = '4px';
                    document.body.appendChild(devLogEl);
                }

                window.appendDevLog = function(msg) {
                    if (!msg) return;
                    const el = document.getElementById('dev-log');
                    if (el) {
                        const entry = document.createElement('div');
                        entry.textContent = msg;
                        el.appendChild(entry);
                        el.scrollTop = el.scrollHeight;
                    }
                    console.debug(msg);

                    // Also POST to local dev log server for retrieval
                    try {
                        fetch('http://localhost:9001/log', {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain' },
                            body: msg
                        }).catch(err => console.debug('Failed to post dev log:', err));
                    } catch (err) {
                        console.debug('Failed to post dev log (sync):', err);
                    }
                };

                const { Player } = await import('./entities/Player.js');
                const testPlayer = new Player('warrior');
                // Call existing flow for a created character
                this.onCharacterCreated(testPlayer);
            }
        } catch (err) {
            console.error('Autotest start failed:', err);
        }

        // Spela menymusik - äntligen igång!
        audioManager.playMusic('menu');

        this.initialized = true;
        console.log('Game initialized successfully');
    }

    /**
     * Kopplar ihop knappar med deras funktioner
     * 
     * Här binder vi alla klick-events så när spelaren trycker på
     * "New Game" eller "Help" så vet spelet vad som ska hända!
     */
    setupEventListeners() {
        // Hitta knapparna i huvudmenyn
        const btnNewGame = document.getElementById('btn-new-game');
        const btnLoadGame = document.getElementById('btn-load-game');
        const btnHelp = document.getElementById('btn-help');

        console.log('Button elements found:', { btnNewGame, btnLoadGame, btnHelp });

        if (btnNewGame) {
            btnNewGame.addEventListener('click', () => {
                console.log('New Game button clicked!');
                this.startNewGame();
            });
            console.log('New Game listener attached');
        } else {
            console.error('btn-new-game element not found!');
        }

        if (btnLoadGame) {
            btnLoadGame.addEventListener('click', () => {
                console.log('Load Game button clicked!');
                this.loadGame();
            });
        }

        if (btnHelp) {
            btnHelp.addEventListener('click', () => {
                console.log('Help button clicked!');
                this.showHelp();
            });
            console.log('Help listener attached');
        } else {
            console.error('btn-help element not found!');
        }

        // Help panel
        const btnCloseHelp = document.getElementById('btn-close-help');
        if (btnCloseHelp) {
            btnCloseHelp.addEventListener('click', () => this.closeHelp());
        }

        // Game Over
        const btnReturnMenu = document.getElementById('btn-return-menu');
        if (btnReturnMenu) {
            btnReturnMenu.addEventListener('click', () => this.returnToMenu());
        }

        console.log('Event listeners set up');
    }

    /**
     * Kollar om det finns ett sparat spel
     * 
     * Om det finns ett sparat spel aktiverar vi "Load Game"-knappen,
     * annars gör vi den grå och oklickbar.
     */
    async checkForSavedGame() {
        try {
            const hasSave = await saveManager.hasSavedGame();
            const btnLoadGame = document.getElementById('btn-load-game');
            
            if (btnLoadGame) {
                if (hasSave) {
                    btnLoadGame.disabled = false;
                    btnLoadGame.classList.remove('disabled');
                } else {
                    btnLoadGame.disabled = true;
                    btnLoadGame.classList.add('disabled');
                }
            }
        } catch (error) {
            console.error('Error checking for saved game:', error);
            const btnLoadGame = document.getElementById('btn-load-game');
            if (btnLoadGame) {
                btnLoadGame.disabled = true;
                btnLoadGame.classList.add('disabled');
            }
        }
    }

    /**
     * Startar ett nytt spel
     * 
     * Spelar ett klickljud och byter till karaktärsskapandets skärm.
     * Här väljer spelaren sin klass (Warrior, Rogue, Barbarian).
     */
    startNewGame() {
        console.log('Starting new game...');
        audioManager.playSfx('click');
        gameState.changeScreen(SCREEN_STATES.CHARACTER_CREATION);
    }
    
    /**
     * Körs när spelaren har skapat sin karaktär
     * @param {Player} player - Den nyskapade spelarkaraktären
     * 
     * Nu kör vi igång på riktigt! Vi startar dungeonen, 
     * initierar rendera och spelar äventyrlig musik.
     */
    onCharacterCreated(player) {
        console.log('Character created:', player.className);
        
        // Spara spelaren i vår globala state
        gameState.player = player;
        
        // Uppdatera HUD med spelarens stats
        hudManager.setPlayer(player);
        
        // Uppdatera inventoryUI med spelarens items
        inventoryUI.setPlayer(player);
        
        // Starta canvas och generera första dungeon-våningen
        const canvas = document.getElementById('dungeon-canvas');
        if (canvas) {
            gameManager.init(canvas);      // Sätt upp rendering
            gameManager.startGame(player); // Generera dungeon och starta spelloopen
        } else {
            console.error('Game canvas not found!');
        }
        
        // Byt till spelvän
        gameState.changeScreen(SCREEN_STATES.GAME);
        
        // Visa välkomstmeddelande till spelaren
        uiManager.showAlert(
            `Welcome, ${player.className}!`,
            `Your adventure begins in the Cobblestone Caverns. Good luck!`
        );
        
        // Play game music
        audioManager.playMusic('dungeon');
        
        // Auto-save the new character
        this.autoSaveGame();
    }
    
    /**
     * Sparar spelet automatiskt
     * 
     * Packar ihop all speldata (spelare, våning, inventory osv)
     * och skickar det till Firebase. Körs efter viktiga events!
     */
    async autoSaveGame() {
        if (!gameState.player) return;
        
        try {
            const saveData = {
                player: gameState.player.toJSON(),
                timestamp: Date.now(),
                version: CONFIG.GAME_VERSION
                // TODO: Add dungeon state, inventory, etc. in later weeks
            };
            
            await saveManager.saveGame(saveData);
            console.log('Game auto-saved');
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    /**
     * Laddar ett sparat spel
     * 
     * Hämtar sparad data från Firebase och återskapar spelets tillstånd.
     * (Fullt implementerat i Vecka 8!)
     */
    async loadGame() {
        console.log('Loading game...');
        audioManager.playSfx('click');
        
        try {
            const saveData = await saveManager.loadGame();
            
            if (saveData) {
                // TODO: Restore game state from save data (will be implemented in later weeks)
                // await gameState.loadFromSave(saveData);
                gameState.changeScreen(SCREEN_STATES.GAME);
                uiManager.showAlert('Load Game', 'Game loading will be fully implemented in Week 8!');
            } else {
                uiManager.showAlert('No Save Found', 'No saved game data was found.');
            }
        } catch (error) {
            console.error('Error loading game:', error);
            uiManager.showAlert('Error', 'Failed to load game. Please start a new game.');
        }
    }

    /**
     * Visar hjälpskärmen
     * 
     * Presenterar kontroller, spelmekanik och tips för spelaren.
     */
    showHelp() {
        audioManager.playSfx('click');
        gameState.changeScreen(SCREEN_STATES.HELP);
    }

    /**
     * Stänger hjälpskärmen och går tillbaka till menyn
     */
    closeHelp() {
        audioManager.playSfx('click');
        gameState.changeScreen(SCREEN_STATES.MAIN_MENU);
    }

    /**
     * Återgå till huvudmenyn
     * 
     * Används när spelaren vill avsluta och börja om.
     */
    returnToMenu() {
        audioManager.playSfx('click');
        gameState.resetGame();
    }

    /**
     * Game loop (called every frame if needed)
     */
    gameLoop(timestamp) {
        // Game loop will be implemented when we add dungeon rendering
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }
}

// Starta spelet när sidan är klar laddad
// DOMContentLoaded säkerställer att alla HTML-element finns innan vi börjar
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init(); // Och så kör vi!
});

export default Game;
