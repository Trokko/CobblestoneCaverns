/**
 * CharacterCreationUI.js - Karaktärsskapande UI
 * 
 * "Välj din öde!"-skärmen! Hanterar:
 * - Klasskort (Warrior, Barbarian, Rogue)
 * - Stats-visning (HP, ATK, DEF, CRT)
 * - Startutrusning preview (vapen, rustning, accessoarer)
 * - Bekräftelse-dialog
 * - Callback till main.js när karaktär skapas
 * 
 * Flow: Välj klass -> Granska stats -> Bekräfta -> Starta spelet!
 */

import { getClassTemplate, getAvailableClasses } from '../data/ClassTemplates.js';
import { Player } from '../entities/Player.js';

class CharacterCreationUI {
    constructor() {
        this.selectedClass = null;        // Vald klass (null = ingen vald)
        this.onCharacterCreated = null;   // Callback när karaktär skapas
    }
    
    /**
     * Initialisera karaktärsskapande-skärmen
     * 
     * @param {Function} callback - Anropas när karaktär skapats (tar emot Player-objekt)
     * 
     * Sätter upp klasskorten och Confirm-knappen.
     */
    init(callback) {
        this.onCharacterCreated = callback;
        this.setupClassCards();
        this.setupConfirmButton();
    }
    
    /**
     * Sätt upp klasskort med klick-handlers
     * 
     * För varje tillgänglig klass (Warrior, Barbarian, Rogue):
     * 1. Hitta HTML-elementet (#class-warrior etc)
     * 2. Lägg till klick-lyssnare
     * 3. Fyll i kortdata (namn, beskrivning, stats)
     */
    setupClassCards() {
        const classes = getAvailableClasses();
        
        classes.forEach(classKey => {
            const card = document.getElementById(`class-${classKey}`);
            if (!card) return;
            
            card.addEventListener('click', () => {
                this.selectClass(classKey);
            });
            
            // Fyll i kortets data
            this.populateClassCard(classKey);
        });
    }
    
    /**
     * Fyll i klasskortet med data från ClassTemplate
     * 
     * @param {string} classKey - Klassnyckel ('warrior', 'barbarian', 'rogue')
     * 
     * Sätter:
     * - Klassnamn (t.ex. "Warrior")
     * - Beskrivning ("A balanced fighter...")
     * - Stats: HP, ATK, DEF, CRT
     * - Utrustning: Vapen, rustning, accessoarer
     */
    populateClassCard(classKey) {
        const template = getClassTemplate(classKey);
        if (!template) return;
        
        const card = document.getElementById(`class-${classKey}`);
        if (!card) return;
        
        // Sätt klassnamn
        const nameEl = card.querySelector('.class-name');
        if (nameEl) nameEl.textContent = template.name;
        
        // Sätt beskrivning
        const descEl = card.querySelector('.class-description');
        if (descEl) descEl.textContent = template.description;
        
        // Sätt stats
        const stats = template.baseStats;
        const statElements = {
            hp: card.querySelector('.stat-hp'),
            atk: card.querySelector('.stat-atk'),
            def: card.querySelector('.stat-def'),
            crt: card.querySelector('.stat-crt')
        };
        
        if (statElements.hp) statElements.hp.textContent = stats.maxHP;
        if (statElements.atk) statElements.atk.textContent = stats.baseATK;
        if (statElements.def) statElements.def.textContent = stats.baseDEF;
        if (statElements.crt) statElements.crt.textContent = `${stats.baseCRT}%`;
        
        // Sätt utrustnings-preview
        this.populateEquipmentPreview(card, template);
    }
    
    /**
     * Fyll i utrustnings-preview på kortet
     * 
     * @param {HTMLElement} card - Klasskortets HTML-element
     * @param {Object} template - Klassmallen
     * 
     * Visar startutrustning med tooltips som visar bonusar:
     * - Vapen: "ATK +X, CRT +Y%"
     * - Rustning: "DEF +X"
     * - Accessoar: "CRT +X%" (eller "None")
     */
    populateEquipmentPreview(card, template) {
        const weaponEl = card.querySelector('.equipment-weapon');
        const armorEl = card.querySelector('.equipment-armor');
        const accessoryEl = card.querySelector('.equipment-accessory');
        
        if (weaponEl && template.startingEquipment.weapon) {
            weaponEl.textContent = template.startingEquipment.weapon.name;
            weaponEl.setAttribute('data-tooltip', 
                `ATK +${template.startingEquipment.weapon.atk}${template.startingEquipment.weapon.crt > 0 ? `, CRT +${template.startingEquipment.weapon.crt}%` : ''}`
            );
        }
        
        if (armorEl && template.startingEquipment.armor) {
            armorEl.textContent = template.startingEquipment.armor.name;
            armorEl.setAttribute('data-tooltip', `DEF +${template.startingEquipment.armor.def}`);
        }
        
        if (accessoryEl) {
            if (template.startingEquipment.accessory) {
                accessoryEl.textContent = template.startingEquipment.accessory.name;
                accessoryEl.setAttribute('data-tooltip', `CRT +${template.startingEquipment.accessory.crt}%`);
            } else {
                accessoryEl.textContent = 'None';
                accessoryEl.removeAttribute('data-tooltip');
            }
        }
    }
    
    /**
     * Välj en klass och uppdatera UI
     * 
     * @param {string} classKey - Klass att välja
     * 
     * Gör:
     * 1. Spelar klick-ljud
     * 2. Sparar vald klass
     * 3. Uppdaterar visuellt urval (markerar valt kort, avmarkerar övriga)
     * 4. Aktiverar "Confirm"-knappen
     * 5. Visar detaljerad info-panel för vald klass
     */
    selectClass(classKey) {
        // Spela klick-ljud
        if (window.audioManager) {
            window.audioManager.playSfx('click');
        }
        
        this.selectedClass = classKey;
        
        // Uppdatera visuellt urval (blå ram runt valt kort)
        const classes = getAvailableClasses();
        classes.forEach(key => {
            const card = document.getElementById(`class-${key}`);
            if (card) {
                if (key === classKey) {
                    card.classList.add('selected'); // Markera!
                } else {
                    card.classList.remove('selected'); // Avmarkera
                }
            }
        });
        
        // Aktivera bekräfta-knappen
        const confirmBtn = document.getElementById('confirm-class-btn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
        }
        
        // Uppdatera vald klass info-panel
        this.updateSelectedClassInfo(classKey);
    }
    
    /**
     * Update the selected class information panel
     * @param {string} classKey - The selected class key
     */
    updateSelectedClassInfo(classKey) {
        const template = getClassTemplate(classKey);
        if (!template) return;
        
        const infoPanel = document.getElementById('selected-class-info');
        if (!infoPanel) return;
        
        infoPanel.style.display = 'block';
        
        const nameEl = infoPanel.querySelector('.selected-class-name');
        const descEl = infoPanel.querySelector('.selected-class-desc');
        
        if (nameEl) nameEl.textContent = template.name;
        if (descEl) descEl.textContent = template.description;
    }
    
    /**
     * Setup confirm button handler
     */
    setupConfirmButton() {
        const confirmBtn = document.getElementById('confirm-class-btn');
        if (!confirmBtn) return;
        
        confirmBtn.addEventListener('click', () => {
            this.confirmClassSelection();
        });
    }
    
    /**
     * Bekräfta klasval och skapa karaktär
     * 
     * Flow:
     * 1. Validera att klass är vald (annars: visa alert)
     * 2. Spela klick-ljud
     * 3. Skapa Player-objekt med vald klass
     * 4. Visa bekräftelse-dialog: "Create Warrior?"
     * 5. Om Yes: Anropa callback med player-objekt
     * 6. Om No: Avbryt, gå tillbaka till klasval
     * 
     * Callback leder till main.js -> startGame() -> laddar dungeon!
     */
    confirmClassSelection() {
        if (!this.selectedClass) {
            // Ingen klass vald!
            if (window.uiManager) {
                window.uiManager.showAlert('Please select a class first!');
            }
            return;
        }
        
        // Spela klick-ljud
        if (window.audioManager) {
            window.audioManager.playSfx('click');
        }
        
        // Skapa spelarkaraktär
        try {
            const player = new Player(this.selectedClass);
            
            // Visa bekräftelse
            const template = getClassTemplate(this.selectedClass);
            if (window.uiManager) {
                window.uiManager.showConfirmation(
                    `Create ${template.name}?`,
                    () => {
                        // Bekräftat - anropa callback
                        if (this.onCharacterCreated) {
                            this.onCharacterCreated(player);
                        }
                    },
                    () => {
                        // Avbrutet - gör ingenting
                    }
                );
            } else {
                // Ingen UI manager, skapa direkt
                if (this.onCharacterCreated) {
                    this.onCharacterCreated(player);
                }
            }
        } catch (error) {
            console.error('Failed to create character:', error);
            if (window.uiManager) {
                window.uiManager.showAlert('Failed to create character. Please try again.');
            }
        }
    }
    
    /**
     * Återställ karaktärsskapande-skärmen
     * 
     * Tömmer urval, avmarkerar kort, inaktiverar Confirm-knapp.
     * Används när spelaren återvänder till skärmen (t.ex. efter Game Over).
     */
    reset() {
        this.selectedClass = null;
        
        // Rensa vald klass visuellt
        const classes = getAvailableClasses();
        classes.forEach(key => {
            const card = document.getElementById(`class-${key}`);
            if (card) {
                card.classList.remove('selected');
            }
        });
        
        // Inaktivera bekräfta-knappen
        const confirmBtn = document.getElementById('confirm-class-btn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
        }
        
        // Dölj info-panel
        const infoPanel = document.getElementById('selected-class-info');
        if (infoPanel) {
            infoPanel.style.display = 'none';
        }
    }
    
    /**
     * Show character creation screen
     */
    show() {
        this.reset();
        const screen = document.getElementById('character-creation');
        if (screen) {
            screen.classList.remove('hidden');
        }
    }
    
    /**
     * Hide character creation screen
     */
    hide() {
        const screen = document.getElementById('character-creation');
        if (screen) {
            screen.classList.add('hidden');
        }
    }
}

// Skapa singleton-instans
export const characterCreationUI = new CharacterCreationUI();
