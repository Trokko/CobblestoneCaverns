/**
 * AudioManager.js - Ljudhanterare
 * 
 * Spelets DJ! AudioManager sköter:
 * - Bakgrundsmusik (menu, dungeon, boss etc)
 * - Ljudeffekter (attack, pickup, level-up etc)
 * - Volymkontroller och inställningar
 * - Persistens via localStorage
 * 
 * Pro-tips: Använd cloneNode() för SFX så flera ljud kan spelas samtidigt!
 */

class AudioManager {
    constructor() {
        // Volyminställningar (0.0 - 1.0)
        this.musicVolume = 0.5;        // Musik på 50%
        this.sfxVolume = 0.7;          // Ljudeffekter på 70%
        
        // On/off-switchar
        this.isMusicEnabled = true;    // Musik på som standard
        this.isSfxEnabled = true;      // SFX på som standard
        
        // Ljudbibliotek
        this.currentMusic = null;      // Vad spelar just nu?
        this.musicTracks = {};         // Alla musiklåtar (name => Audio)
        this.sfxSounds = {};           // Alla ljudeffekter (name => Audio)
        this.loadedAssets = new Set(); // Set för att undvika dubbelladdning
    }

    /**
     * Initialisera AudioManager
     * Laddar sparade inställningar från localStorage
     */
    init() {
        this.loadSettings();
        console.log('Audio Manager initialized');
    }

    /**
     * Ladda ljudinställningar från localStorage
     * 
     * Hämtar spelarens sparade volyminställningar så de 
     * inte behöver justera volym varje gång de startar spelet.
     * Använder ?? (nullish coalescing) för fallback-värden.
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem('audioSettings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.musicVolume = parsed.musicVolume ?? 0.5;
                this.sfxVolume = parsed.sfxVolume ?? 0.7;
                this.isMusicEnabled = parsed.isMusicEnabled ?? true;
                this.isSfxEnabled = parsed.isSfxEnabled ?? true;
            }
        } catch (error) {
            console.error('Error loading audio settings:', error);
        }
    }

    /**
     * Spara ljudinställningar till localStorage
     * 
     * Anropas när spelaren ändrar volym eller togglar ljud on/off.
     */
    saveSettings() {
        try {
            const settings = {
                musicVolume: this.musicVolume,
                sfxVolume: this.sfxVolume,
                isMusicEnabled: this.isMusicEnabled,
                isSfxEnabled: this.isSfxEnabled
            };
            localStorage.setItem('audioSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving audio settings:', error);
        }
    }

    /**
     * Ladda en musikspår
     * 
     * @param {string} name - Namn på spåret (t.ex. 'dungeon', 'boss')
     * @param {string} path - Sökväg till MP3-filen
     * 
     * Musikspår loopar automatiskt (audio.loop = true)!
     * Använder Set för att undvika dubbelladdning.
     */
    loadMusic(name, path) {
        if (this.loadedAssets.has(name)) return; // Redan laddad!

        const audio = new Audio(path);
        audio.loop = true;                  // Loop forever!
        audio.volume = this.musicVolume;
        this.musicTracks[name] = audio;
        this.loadedAssets.add(name);

        console.log(`Music loaded: ${name}`);
    }

    /**
     * Ladda en ljudeffekt
     * 
     * @param {string} name - Namn på ljudet (t.ex. 'attack', 'pickup')
     * @param {string} path - Sökväg till MP3-filen
     * 
     * SFX loopar INTE (till skillnad från musik).
     */
    loadSfx(name, path) {
        if (this.loadedAssets.has(name)) return;

        const audio = new Audio(path);
        audio.volume = this.sfxVolume;
        this.sfxSounds[name] = audio;
        this.loadedAssets.add(name);

        console.log(`SFX loaded: ${name}`);
    }

    /**
     * Spela ett musikspår
     * 
     * @param {string} name - Namn på spåret
     * @param {boolean} restart - Starta om från början även om redan spelar
     * 
     * Smart logik:
     * - Stannar nuvarande musik om nytt spår
     * - Kan starta om samma spår från början (restart=true)
     * - Respekterar isMusicEnabled-flaggan
     */
    playMusic(name, restart = false) {
        if (!this.isMusicEnabled) return; // Musik avstängd!

        const track = this.musicTracks[name];
        if (!track) {
            console.warn(`Music track not found: ${name}`);
            return;
        }

        // Byt spår om det är ett annat
        if (this.currentMusic && this.currentMusic !== track) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0; // Resetta
        }

        // Spela nya spåret
        if (restart) {
            track.currentTime = 0; // Från början!
        }
        
        track.volume = this.musicVolume;
        track.play().catch(error => {
            console.error(`Error playing music ${name}:`, error);
        });

        this.currentMusic = track;
    }

    /**
     * Stop current music
     */
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
    }

    /**
     * Pause current music
     */
    pauseMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
        }
    }

    /**
     * Resume current music
     */
    resumeMusic() {
        if (this.currentMusic && this.isMusicEnabled) {
            this.currentMusic.play().catch(error => {
                console.error('Error resuming music:', error);
            });
        }
    }

    /**
     * Spela en ljudeffekt
     * 
     * @param {string} name - Namn på ljudeffekten
     * 
     * SMART TRICK: Vi använder cloneNode() för att kunna spela
     * samma ljud flera gånger samtidigt (t.ex. flera attacker).
     * Utan clone skulle ljudet avbrytas och börja om varje gång.
     */
    playSfx(name) {
        if (!this.isSfxEnabled) return; // SFX avstängt!

        const sound = this.sfxSounds[name];
        if (!sound) {
            console.warn(`SFX not found: ${name}`);
            return;
        }

        // Klona ljudet så flera kan spelas samtidigt
        const sfx = sound.cloneNode();
        sfx.volume = this.sfxVolume;
        sfx.play().catch(error => {
            console.error(`Error playing SFX ${name}:`, error);
        });
    }

    /**
     * Sätt musikvolym
     * 
     * @param {number} volume - Volym (0.0 = tyst, 1.0 = max)
     * 
     * Använder Math.max/min för att "clampa" värdet mellan 0-1.
     * Uppdaterar även nuvarande spår direkt om något spelar.
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume)); // Clamp 0-1
        
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume; // Applicera direkt!
        }

        this.saveSettings();
    }

    /**
     * Sätt ljudeffektsvolym
     * 
     * @param {number} volume - Volym (0.0 = tyst, 1.0 = max)
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    /**
     * Toggle music on/off
     */
    toggleMusic() {
        this.isMusicEnabled = !this.isMusicEnabled;
        
        if (this.isMusicEnabled) {
            this.resumeMusic();
        } else {
            this.pauseMusic();
        }

        this.saveSettings();
    }

    /**
     * Toggle SFX on/off
     */
    toggleSfx() {
        this.isSfxEnabled = !this.isSfxEnabled;
        this.saveSettings();
    }

    /**
     * Förladda alla ljudfiler
     * 
     * Laddar alla musik och SFX vid spelstart så det inte laggar
     * när ljud ska spelas första gången.
     * 
     * Musik: menu, dungeon, boss, victory, defeat
     * SFX: click, attack, hit, miss, level-up, pickup, potion,
     *      door, chest, gold, death, stairs
     */
    preloadAssets() {
        // Musik (loopar automatiskt)
        this.loadMusic('menu', 'Assets/Audio/Music/menu.mp3');
        this.loadMusic('dungeon', 'Assets/Audio/Music/dungeon.mp3');
        this.loadMusic('boss', 'Assets/Audio/Music/boss.mp3');
        this.loadMusic('victory', 'Assets/Audio/Music/victory.mp3');
        this.loadMusic('defeat', 'Assets/Audio/Music/defeat.mp3');

        // Ljudeffekter (kan spelas samtidigt via cloneNode)
        this.loadSfx('click', 'Assets/Audio/Effects/click.mp3');
        this.loadSfx('attack', 'Assets/Audio/Effects/attack.mp3');
        this.loadSfx('hit', 'Assets/Audio/Effects/hit.mp3');
        this.loadSfx('miss', 'Assets/Audio/Effects/miss.mp3');
        this.loadSfx('level-up', 'Assets/Audio/Effects/level-up.mp3');
        this.loadSfx('pickup', 'Assets/Audio/Effects/pickup.mp3');
        this.loadSfx('potion', 'Assets/Audio/Effects/potion.mp3');
        this.loadSfx('door', 'Assets/Audio/Effects/door.mp3');
        this.loadSfx('chest', 'Assets/Audio/Effects/chest.mp3');
        this.loadSfx('gold', 'Assets/Audio/Effects/gold.mp3');
        this.loadSfx('death', 'Assets/Audio/Effects/death.mp3');
        this.loadSfx('stairs', 'Assets/Audio/Effects/stairs.mp3');

        console.log('Audio assets preloaded');
    }
}

// Create singleton instance
export const audioManager = new AudioManager();
