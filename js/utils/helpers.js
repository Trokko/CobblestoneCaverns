/**
 * helpers.js - Hjälpfunktioner
 * 
 * Verktygsboxen! Alla smarta hjälpfunktioner samlade:
 * - UUID-generering
 * - Viktad slumpval (weighted random)
 * - Matematik (clamp, lerp, distance)
 * - Array-operationer (shuffle, random element)
 * - Formatering (siffror med komma)
 * - Performance (debounce, throttle)
 * 
 * Används överallt i spelet för att undvika kod-upprepning!
 */

/**
 * Generera ett unikt UUID
 * 
 * @returns {string} - UUID-sträng (t.ex. "a3f2b1c4-5678-4abc-ydef-123456789012")
 * 
 * Används för att ge varje entitet (monster, item) ett unikt ID.
 * Formatet: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (UUID v4)
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Viktad slumpval från array
 * 
 * @param {Array} items - Items att välja mellan
 * @param {Array} weights - Vikter (högre = större chans)
 * @returns {*} - Valt item
 * 
 * Exempel:
 * items = ['common', 'rare', 'epic']
 * weights = [70, 25, 5]  (70% common, 25% rare, 5% epic)
 * 
 * Används för loot-drops, monster-spawns etc!
 */
export function weightedRandomChoice(items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight; // Random mellan 0 och totalWeight
    
    // Iterera genom items tills random <= 0
    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }
    
    return items[items.length - 1]; // Fallback (bör ej hända)
}

/**
 * Begränsa ett värde mellan min och max
 * 
 * @param {number} value - Värde att begränsa
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number} - Begränsat värde
 * 
 * Exempel: clamp(150, 0, 100) = 100
 *          clamp(-10, 0, 100) = 0
 *          clamp(50, 0, 100) = 50
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linjär interpolation mellan två värden
 * 
 * @param {number} start - Startvärde
 * @param {number} end - Slutvärde
 * @param {number} t - Interpolationsfaktor (0.0 - 1.0)
 * @returns {number} - Interpolerat värde
 * 
 * Exempel: lerp(0, 100, 0.5) = 50 (mitt emellan)
 *          lerp(0, 100, 0.25) = 25 (25% av vägen)
 * 
 * Används för smooth animationer, kamera-rörelse etc.
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Beräkna avstånd mellan två punkter (Euklidiskt avstånd)
 * 
 * @param {Object} p1 - Punkt 1 {x, y}
 * @param {Object} p2 - Punkt 2 {x, y}
 * @returns {number} - Avstånd
 * 
 * Använder Pythagoras: √(dx² + dy²)
 * Används för fog of war, AI-detection etc.
 */
export function distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Beräkna Manhattan-avstånd mellan två punkter
 * 
 * @param {Object} p1 - Punkt 1 {x, y}
 * @param {Object} p2 - Punkt 2 {x, y}
 * @returns {number} - Manhattan-avstånd
 * 
 * Manhattan = |dx| + |dy| ("taxicab distance")
 * Exempel: (0,0) till (3,4) = 3+4 = 7 steg
 * 
 * Bättre än Euklidiskt för grid-baserad rörelse!
 */
export function manhattanDistance(p1, p2) {
    return Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
}

/**
 * Kolla om två rektanglar krockar
 * 
 * @param {Object} r1 - Rektangel 1 {x, y, width, height}
 * @param {Object} r2 - Rektangel 2 {x, y, width, height}
 * @returns {boolean} - true om de krockar
 * 
 * Används för kollisionsdetektering, viewport culling etc.
 */
export function rectanglesIntersect(r1, r2) {
    return !(r1.x + r1.width < r2.x ||
             r2.x + r2.width < r1.x ||
             r1.y + r1.height < r2.y ||
             r2.y + r2.height < r1.y);
}

/**
 * Slumpa heltal mellan min och max (inklusive båda)
 * 
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number} - Slumpat heltal
 * 
 * Exempel: randomInt(1, 6) = Tärningskast (1-6)
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Hämta slumpmässigt element från array
 * 
 * @param {Array} array - Array att välja från
 * @returns {*} - Slumpmässigt element
 */
export function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Blanda array (Fisher-Yates shuffle)
 * 
 * @param {Array} array - Array att blanda
 * @returns {Array} - Blandad array (samma instans, modifierad in-place)
 * 
 * Används för att randomisera ordning (t.ex. kortlek, encounter-ordning).
 */
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Djup-kopiera ett objekt
 * 
 * @param {Object} obj - Objekt att kopiera
 * @returns {Object} - Kopierat objekt (helt fristående)
 * 
 * Använder JSON.parse(JSON.stringify())-tricket.
 * OBS: Fungerar EJ med funktioner, Date, undefined, cirkulära referenser!
 * Men funkar perfekt för vanlig spelardata.
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Formatera siffra med kommatecken (tusentalsavskiljare)
 * 
 * @param {number} num - Siffra att formatera
 * @returns {string} - Formaterad sträng
 * 
 * Exempel: formatNumber(1234567) = "1,234,567"
 * Används för guld, skada, XP etc i UI.
 */
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Debounce-funktion (fördröj anrop tills ingen aktivitet)
 * 
 * @param {Function} func - Funktion att debounce:a
 * @param {number} wait - Väntetid i ms
 * @returns {Function} - Debounce:ad funktion
 * 
 * Användning: Om funktionen anropas flera gånger snabbt,
 * körs den bara EN gång efter att anropen slutat.
 * 
 * Exempel: Sökfält - vänta tills användaren slutat skriva!
 * auto-save i SaveManager använder samma princip.
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle-funktion (begränsa anropsfrekvens)
 * 
 * @param {Function} func - Funktion att throttle:a
 * @param {number} limit - Tidsgräns i ms
 * @returns {Function} - Throttle:ad funktion
 * 
 * Användning: Funktionen kan max köras en gång per tidsgräns.
 * 
 * Skillnad mot debounce:
 * - Debounce: Väntar tills aktiviteten slutar
 * - Throttle: Kör jämnt med fix frekvens
 * 
 * Exempel: Scroll-events, resize-events (kör max var 100:e ms).
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
