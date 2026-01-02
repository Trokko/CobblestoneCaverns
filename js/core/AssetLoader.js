/**
 * AssetLoader.js - Tillgångshanterare
 * 
 * Spelets bildbibliotek! AssetLoader laddar och cachar alla sprites:
 * - Hjältar (Warrior, Barbarian, Rogue)
 * - Monster (50+ olika, uppdelat i tiers)
 * - Items (vapen, rustning, potions, guld)
 * - UI-element (hjärtan, stjärnor, mynt)
 * - Effekter (slag, magi)
 * 
 * Förladdar allt vid spelstart för smooth gameplay utan laddningar!
 */

class AssetLoader {
    constructor() {
        this.images = {};          // Cache: name => HTMLImageElement
        this.loadedCount = 0;      // Hur många bilder som laddats
        this.totalCount = 0;       // Totalt antal bilder att ladda
        this.isLoading = false;    // Laddar vi just nu?
    }

    /**
     * Initialize asset loader
     */
    init() {
        console.log('Asset Loader initialized');
    }

    /**
     * Ladda en bild
     * 
     * @param {string} name - Namn/nyckel för bilden (t.ex. 'warrior')
     * @param {string} path - Sökväg till bildfilen
     * @returns {Promise<HTMLImageElement>}
     * 
     * Använder Promise så vi kan vänta på att bilder laddas klart.
     * Cachar bilder så de inte laddas flera gånger.
     */
    loadImage(name, path) {
        return new Promise((resolve, reject) => {
            // Redan laddad? Returnera cache!
            if (this.images[name]) {
                resolve(this.images[name]);
                return;
            }

            const img = new Image();
            img.onload = () => {
                this.images[name] = img;  // Spara i cache
                this.loadedCount++;
                console.log(`Image loaded: ${name} (${this.loadedCount}/${this.totalCount})`);
                resolve(img);
            };
            img.onerror = (error) => {
                console.error(`Failed to load image: ${name} at ${path}`, error);
                reject(error);
            };
            img.src = path; // Trigger laddning
        });
    }

    /**
     * Ladda flera bilder samtidigt
     * 
     * @param {Array<{name: string, path: string}>} imageList - Lista med bilder
     * @returns {Promise<void>}
     * 
     * Använder Promise.all() för att ladda alla bilder parallellt.
     * Mycket snabbare än att ladda en i taget!
     */
    async loadImages(imageList) {
        this.isLoading = true;
        this.totalCount = imageList.length;
        this.loadedCount = 0;

        try {
            const promises = imageList.map(item => this.loadImage(item.name, item.path));
            await Promise.all(promises); // Vänta på alla!
            console.log(`All ${this.totalCount} images loaded successfully`);
        } catch (error) {
            console.error('Error loading images:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Hämta en laddad bild
     * 
     * @param {string} name - Bildnamn
     * @returns {HTMLImageElement|null}
     * 
     * Används av renderare för att rita sprites.
     */
    getImage(name) {
        return this.images[name] || null;
    }

    /**
     * Check if an image is loaded
     * @param {string} name - Image name
     * @returns {boolean}
     */
    hasImage(name) {
        return this.images[name] !== undefined;
    }

    /**
     * Hämta laddningsprogress
     * 
     * @returns {number} - Värde mellan 0.0 (0%) och 1.0 (100%)
     * 
     * Används för loading bar: getProgress() * 100 = procent
     */
    getProgress() {
        if (this.totalCount === 0) return 1;
        return this.loadedCount / this.totalCount;
    }

    /**
     * Förladda alla spelets sprites
     * 
     * @returns {Promise<void>}
     * 
     * Laddar ~100+ bilder! Uppdelat i kategorier:
     * - Spelbara klasser: Warrior, Barbarian, Rogue
     * - Köpmän: 2 varianter
     * - Monster Tier 1-5: Från råttor till drakar (50+ monster)
     * - Vapen: Svärd, yxa, dolk, klubba, spjut
     * - Rustning: Hjälm, brösta, sköld, stövlar, handskar
     * - Konsumabelt: HP/Mana potions, scrolls, mat
     * - Övrigt: Guld, kistor, nycklar, ädelstenar
     * - UI: Hjärtan, stjärnor, mynt
     * - Effekter: Slag, magi
     * 
     * Tier-system:
     * Tier 1 (Floor 1-5): Råttor, fladdermöss, goblins
     * Tier 2 (Floor 6-15): Jätteråttor, spindlar, lizardmen
     * Tier 3 (Floor 16-30): Ogres, troll, minotaurer, andar
     * Tier 4 (Floor 31-50): Lich, golems, demoner, elementals
     * Tier 5 (Boss-våningar): Drakar!
     */
    async preloadGameAssets() {
        const assets = [];

        // Spelbara klasser
        assets.push(
            { name: 'warrior', path: 'Assets/Art/uf_heroes/warrior_m_1.png' },
            { name: 'barbarian', path: 'Assets/Art/uf_heroes/barbarian_1.png' },
            { name: 'rogue', path: 'Assets/Art/uf_heroes/thief_1.png' }
        );

        // Merchants
        assets.push(
            { name: 'merchant_a', path: 'Assets/Art/uf_heroes/merchant_a_1.png' },
            { name: 'merchant_b', path: 'Assets/Art/uf_heroes/merchant_b_1.png' }
        );

        // Tier 1 Monsters (Floors 1-5)
        assets.push(
            { name: 'rat', path: 'Assets/Art/uf_heroes/rat_1.png' },
            { name: 'bat', path: 'Assets/Art/uf_heroes/bat_1.png' },
            { name: 'goblin', path: 'Assets/Art/uf_heroes/goblin_1.png' },
            { name: 'skeleton', path: 'Assets/Art/uf_heroes/skeleton_1.png' },
            { name: 'snake', path: 'Assets/Art/uf_heroes/snake_1.png' },
            { name: 'zombie', path: 'Assets/Art/uf_heroes/zombie_a_1.png' }
        );

        // Tier 2 Monsters (Floors 6-15)
        assets.push(
            { name: 'giantRat', path: 'Assets/Art/uf_heroes/rat_giant_1.png' },
            { name: 'giantBat', path: 'Assets/Art/uf_heroes/bat_giant_1.png' },
            { name: 'goblinWarrior', path: 'Assets/Art/uf_heroes/goblin_warrior_1.png' },
            { name: 'spider', path: 'Assets/Art/uf_heroes/spider_brown_1.png' },
            { name: 'giantSpider', path: 'Assets/Art/uf_heroes/spider_brown_giant_1.png' },
            { name: 'lizardman', path: 'Assets/Art/uf_heroes/lizardman_green_1.png' },
            { name: 'mummy', path: 'Assets/Art/uf_heroes/mummy_1.png' }
        );

        // Tier 3 Monsters (Floors 16-30)
        assets.push(
            { name: 'ogre', path: 'Assets/Art/uf_heroes/ogre_1.png' },
            { name: 'troll', path: 'Assets/Art/uf_heroes/troll_1.png' },
            { name: 'minotaur', path: 'Assets/Art/uf_heroes/minotaur_1.png' },
            { name: 'banshee', path: 'Assets/Art/uf_heroes/banshee_1.png' },
            { name: 'wraith', path: 'Assets/Art/uf_heroes/wraith_a_1.png' },
            { name: 'spirit', path: 'Assets/Art/uf_heroes/spirit_1.png' },
            { name: 'stoneGolem', path: 'Assets/Art/uf_heroes/golem_stone_1.png' }
        );

        // Tier 4 Monsters (Floors 31-50)
        assets.push(
            { name: 'lich', path: 'Assets/Art/uf_heroes/lich_1.png' },
            { name: 'ironGolem', path: 'Assets/Art/uf_heroes/golem_metal_1.png' },
            { name: 'fireGolem', path: 'Assets/Art/uf_heroes/golem_fire_1.png' },
            { name: 'frostGolem', path: 'Assets/Art/uf_heroes/golem_ice_1.png' },
            { name: 'fireDemon', path: 'Assets/Art/uf_heroes/demon_red_1.png' },
            { name: 'frostDemon', path: 'Assets/Art/uf_heroes/demon_blue_1.png' },
            { name: 'fireElemental', path: 'Assets/Art/uf_heroes/elemental_fire_1.png' },
            { name: 'waterElemental', path: 'Assets/Art/uf_heroes/elemental_water_1.png' },
            { name: 'earthElemental', path: 'Assets/Art/uf_heroes/elemental_earth_1.png' },
            { name: 'airElemental', path: 'Assets/Art/uf_heroes/elemental_air_1.png' }
        );

        // Tier 5 Epic Bosses (Milestone Floors: 20, 40, 60, etc.)
        assets.push(
            { name: 'frostDragon', path: 'Assets/Art/uf_heroes/dragon_blue_1.png' },
            { name: 'shadowDragon', path: 'Assets/Art/uf_heroes/dragon_shadow_1.png' }
        );

        // Items - Weapons
        assets.push(
            { name: 'sword', path: 'Assets/Art/uf_items/sword.png' },
            { name: 'axe', path: 'Assets/Art/uf_items/axe.png' },
            { name: 'dagger', path: 'Assets/Art/uf_items/dagger.png' },
            { name: 'mace', path: 'Assets/Art/uf_items/mace.png' },
            { name: 'spear', path: 'Assets/Art/uf_items/spear.png' }
        );

        // Items - Armor
        assets.push(
            { name: 'helmet', path: 'Assets/Art/uf_items/helmet.png' },
            { name: 'chest', path: 'Assets/Art/uf_items/chest.png' },
            { name: 'shield', path: 'Assets/Art/uf_items/shield.png' },
            { name: 'boots', path: 'Assets/Art/uf_items/boots.png' },
            { name: 'gloves', path: 'Assets/Art/uf_items/gloves.png' }
        );

        // Items - Consumables
        assets.push(
            { name: 'health_potion', path: 'Assets/Art/uf_items/potion_health.png' },
            { name: 'mana_potion', path: 'Assets/Art/uf_items/potion_mana.png' },
            { name: 'scroll', path: 'Assets/Art/uf_items/scroll.png' },
            { name: 'food', path: 'Assets/Art/uf_items/food.png' }
        );

        // Items - Misc
        assets.push(
            { name: 'gold', path: 'Assets/Art/uf_items/gold.png' },
            { name: 'chest', path: 'Assets/Art/uf_items/chest.png' },
            { name: 'key', path: 'Assets/Art/uf_items/key.png' },
            { name: 'gem', path: 'Assets/Art/uf_items/gem.png' }
        );

        // UI Elements
        assets.push(
            { name: 'heart', path: 'Assets/Art/uf_interface/heart.png' },
            { name: 'star', path: 'Assets/Art/uf_interface/star.png' },
            { name: 'coin', path: 'Assets/Art/uf_interface/coin.png' }
        );

        // Effects
        assets.push(
            { name: 'impact', path: 'Assets/Art/uf_FX_impact/impact.png' },
            { name: 'effect', path: 'Assets/Art/uf_FX/effect.png' }
        );

        console.log(`Preloading ${assets.length} game assets...`);
        await this.loadImages(assets);
    }

    /**
     * Töm bildcache
     * 
     * Används för att frigöra minne (t.ex. vid byte av stor area).
     * I detta spel anropas sällan eftersom vi förladdar allt en gång.
     */
    clear() {
        this.images = {};
        this.loadedCount = 0;
        this.totalCount = 0;
        console.log('Asset cache cleared');
    }
}

// Create singleton instance
export const assetLoader = new AssetLoader();
