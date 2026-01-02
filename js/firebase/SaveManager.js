/**
 * SaveManager.js - Sparhanterare
 * 
 * Molnet som minns! SaveManager hanterar:
 * - Firebase/Firestore-integration
 * - Anonym autentisering (inget konto krävs!)
 * - Spara/Ladda spelardata
 * - Auto-save med debouncing (förhindrar spam)
 * 
 * OBS: Firebase är valfritt! Spelet fungerar utan config.
 * Varje anonym användare får ett unikt userId som sparas lokalt.
 */

import { FIREBASE_CONFIG } from '../config.js';

class SaveManager {
    constructor() {
        this.db = null;           // Firestore database-instans
        this.userId = null;       // Anonym userId (från Firebase Auth)
        this.initialized = false; // Är Firebase korrekt uppsatt?
    }

    /**
     * Initialisera Firebase och autentisera användare
     * 
     * @returns {Promise<boolean>} - true om Firebase är redo
     * 
     * Kollar först om Firebase är konfigurerad (API-nyckel finns).
     * Om inte: loggar varning men spelet fungerar ändå (bara utan saves).
     * Om ja: Startar Firebase, skapar Firestore-koppling, autentiserar anonymt.
     */
    async init() {
        try {
            // Kolla om Firebase-config är satt
            if (!FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY_HERE') {
                console.warn('Firebase not configured. Save/Load will not work.');
                return false; // Inte ett fel, bara inte konfigurerat
            }

            // Initialisera Firebase (en gång)
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }

            this.db = firebase.firestore();

            // Aktivera anonym autentisering
            await this.authenticateUser();

            this.initialized = true;
            console.log('Save Manager initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
            return false;
        }
    }

    /**
     * Autentisera användare anonymt
     * 
     * @returns {Promise<boolean>}
     * 
     * Firebase Anonymous Auth = inget konto krävs!
     * Skapar en unik userId som lagras i browsern.
     * Samma userId nästa gång = samma sparfil.
     * Töm browsercache = nytt userId = nytt spel.
     */
    async authenticateUser() {
        try {
            const auth = firebase.auth();
            const result = await auth.signInAnonymously();
            this.userId = result.user.uid;
            console.log('User authenticated:', this.userId);
            return true;
        } catch (error) {
            console.warn('Authentication skipped:', error.message);
            // Kasta inte fel - Firebase är valfritt
            return false;
        }
    }

    /**
     * Kolla om det finns en sparad spelfil
     * 
     * @returns {Promise<boolean>}
     * 
     * Används på huvudmenyn för att visa/dölja "Continue"-knappen.
     */
    async hasSavedGame() {
        if (!this.initialized || !this.userId) {
            return false;
        }

        try {
            const doc = await this.db.collection('saves').doc(this.userId).get();
            return doc.exists;
        } catch (error) {
            console.error('Error checking for saved game:', error);
            return false;
        }
    }

    /**
     * Spara speldata till Firestore
     * 
     * @param {Object} gameData - Speltillstånd att spara
     * @returns {Promise<boolean>}
     * 
     * Struktur:
     * - Collection: 'saves'
     * - Document ID: userId
     * - Data: gameData + lastSaved (timestamp) + userId
     * 
     * Använder .set() (skriver över) istället för .update() (merge).
     */
    async saveGame(gameData) {
        if (!this.initialized || !this.userId) {
            console.warn('Cannot save: Firebase not initialized');
            return false;
        }

        try {
            const saveData = {
                ...gameData,
                lastSaved: firebase.firestore.FieldValue.serverTimestamp(), // Server-tid!
                userId: this.userId
            };

            await this.db.collection('saves').doc(this.userId).set(saveData);
            console.log('Game saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving game:', error);
            return false;
        }
    }

    /**
     * Ladda speldata från Firestore
     * 
     * @returns {Promise<Object|null>}
     * 
     * Returnerar null om inget save finns.
     * Annars: Hela gameData-objektet inklusive lastSaved.
     */
    async loadGame() {
        if (!this.initialized || !this.userId) {
            console.warn('Cannot load: Firebase not initialized');
            return null;
        }

        try {
            const doc = await this.db.collection('saves').doc(this.userId).get();
            
            if (doc.exists) {
                console.log('Game loaded successfully');
                return doc.data();
            } else {
                console.log('No saved game found');
                return null;
            }
        } catch (error) {
            console.error('Error loading game:', error);
            return null;
        }
    }

    /**
     * Radera sparfil (anropas vid Game Over)
     * 
     * @returns {Promise<boolean>}
     * 
     * Permadeath-mekanism! När spelaren dör raderas saves.
     * Nästa gång de startar spelet måste de skapa ny karaktär.
     */
    async deleteSave() {
        if (!this.initialized || !this.userId) {
            console.warn('Cannot delete: Firebase not initialized');
            return false;
        }

        try {
            await this.db.collection('saves').doc(this.userId).delete();
            console.log('Save data deleted');
            return true;
        } catch (error) {
            console.error('Error deleting save:', error);
            return false;
        }
    }

    /**
     * Auto-spara med debouncing
     * 
     * @param {Object} gameData - Speltillstånd att spara
     * 
     * SMART TRICK: Använder setTimeout med clearTimeout!
     * Om autoSave anropas flera gånger snabbt (t.ex. varje steg),
     * väntar den 2 sekunder efter SISTA anropet innan den sparar.
     * Detta förhindrar onödiga Firestore-writes (= kostar pengar!).
     * 
     * Exempel:
     * - Steg 1: autoSave() -> timer startas (2s)
     * - Steg 2 (0.5s senare): autoSave() -> timer resettas (2s)
     * - Steg 3 (0.5s senare): autoSave() -> timer resettas (2s)
     * - Ingen fler steg -> efter 2s: spara!
     * Resultat: 3 steg = 1 save istället för 3 saves!
     */
    async autoSave(gameData) {
        // Avbryt tidigare timer om den finns
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        // Starta ny timer
        this.autoSaveTimeout = setTimeout(async () => {
            await this.saveGame(gameData);
        }, 2000); // Vänta 2 sekunder
    }
}

// Skapa singleton-instans
export const saveManager = new SaveManager();
