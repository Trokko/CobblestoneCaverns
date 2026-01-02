/**
 * UIManager.js - UI-komponenthanterare
 * 
 * Sköter alla UI-komponenter utanför själva spelet:
 * - Modaler (dialogrutor med knappar)
 * - Bekräftelsedialoger ("Are you sure?")
 * - Alerts ("Welcome, Warrior!")
 * - Tooltips (kommer i framtida veckor)
 * 
 * Använder RPGUI-ramverket för retro RPG-utseende!
 */

class UIManager {
    constructor() {
        this.activeModal = null;
        this.activeTooltip = null;
    }

    /**
     * Initialize UI manager
     */
    init() {
        this.setupTooltips();
        console.log('UI Manager initialized');
    }

    /**
     * Visar en modal dialog
     * @param {string} title - Modal-titel
     * @param {string} content - Modal-innehåll (HTML)
     * @param {Array} buttons - Array med knappobjekt {text, onClick, class}
     * 
     * Skapar en overlay-modal med titel, innehåll och knappar.
     * Perfekt för viktiga meddelanden som kräver spelarens uppmärksamhet!
     */
    showModal(title, content, buttons = []) {
        // Close any existing modal
        this.closeModal();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="rpgui-container framed-golden modal-content">
                <h2>${title}</h2>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-buttons">
                    ${buttons.map(btn => `
                        <button class="rpgui-button ${btn.class || ''}" data-action="${btn.action || ''}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Add click handlers
        const buttonElements = modal.querySelectorAll('button');
        buttonElements.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                try {
                    if (buttons[index].onClick) {
                        buttons[index].onClick();
                    }
                } catch (err) {
                    console.error('Error while executing modal button callback:', err);
                } finally {
                    // Always close modal even if callback throws
                    this.closeModal();
                }
            });
        });

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        document.body.appendChild(modal);
        this.activeModal = modal;
    }

    /**
     * Stänger den aktiva modalen
     * 
     * Tar bort modal-elementet från DOM:en.
     * Anropas automatiskt när spelaren klickar på en knapp!
     */
    closeModal() {
        if (this.activeModal) {
            this.activeModal.remove();
            this.activeModal = null;
        }
    }

    /**
     * Visar en bekräftelsedialog
     * @param {string} message - Bekräftelsemeddelande
     * @param {Function} onConfirm - Callback när "Yes" klickas
     * @param {Function} onCancel - Callback när "No" klickas
     * 
     * Klassisk Yes/No-dialog. Används för viktiga beslut:
     * "Descend to Floor 5?", "Delete save?" osv.
     */
    showConfirmation(message, onConfirm, onCancel = null) {
        this.showModal('Confirm', `<p>${message}</p>`, [
            {
                text: 'Yes',
                class: 'golden',
                onClick: onConfirm
            },
            {
                text: 'No',
                onClick: onCancel || (() => {})
            }
        ]);
    }

    /**
     * Show an alert dialog
     * @param {string} title - Alert title
     * @param {string} message - Alert message
     */
    showAlert(title, message) {
        this.showModal(title, `<p>${message}</p>`, [
            {
                text: 'OK',
                class: 'golden'
            }
        ]);
    }

    /**
     * Show a tooltip at a specific element
     * @param {HTMLElement} element - Element to attach tooltip to
     * @param {string} content - Tooltip content
     */
    showTooltip(element, content) {
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.innerHTML = content;

        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;

        this.activeTooltip = tooltip;
    }

    /**
     * Hide the active tooltip
     */
    hideTooltip() {
        if (this.activeTooltip) {
            this.activeTooltip.remove();
            this.activeTooltip = null;
        }
    }

    /**
     * Set up tooltip event listeners
     */
    setupTooltips() {
        document.addEventListener('mouseover', (e) => {
            const tooltipElement = e.target.closest('[data-tooltip]');
            if (tooltipElement) {
                this.showTooltip(tooltipElement, tooltipElement.dataset.tooltip);
            }
        });

        document.addEventListener('mouseout', (e) => {
            const tooltipElement = e.target.closest('[data-tooltip]');
            if (tooltipElement) {
                this.hideTooltip();
            }
        });
    }

    /**
     * Update a progress bar
     * @param {string} elementId - Progress bar element ID
     * @param {number} current - Current value
     * @param {number} max - Maximum value
     */
    updateProgressBar(elementId, current, max) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const percentage = Math.max(0, Math.min(100, (current / max) * 100));
        
        // Update RPGUI progress bar
        if (element.classList.contains('rpgui-progress')) {
            RPGUI.set_value(element, percentage / 100);
        } else {
            // Update custom progress bar
            const fill = element.querySelector('.progress-fill');
            if (fill) {
                fill.style.width = `${percentage}%`;
            }
        }
    }

    /**
     * Show a floating combat text
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Text to display
     * @param {string} className - CSS class for styling
     */
    showFloatingText(x, y, text, className = '') {
        const floatingText = document.createElement('div');
        floatingText.className = `floating-text ${className}`;
        floatingText.textContent = text;
        floatingText.style.left = `${x}px`;
        floatingText.style.top = `${y}px`;

        document.body.appendChild(floatingText);

        // Animate and remove
        setTimeout(() => {
            floatingText.classList.add('fade-out');
            setTimeout(() => floatingText.remove(), 500);
        }, 1000);
    }

    /**
     * Update HUD element
     * @param {string} elementId - Element ID
     * @param {string} value - New value
     */
    updateHUDElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Add message to combat log
     * @param {string} message - Message to add
     * @param {string} type - Message type (damage, heal, info, etc.)
     */
    addCombatLog(message, type = 'info') {
        const log = document.getElementById('combat-log');
        if (!log) return;

        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = message;

        log.appendChild(entry);

        // Auto-scroll to bottom
        log.scrollTop = log.scrollHeight;

        // Limit log entries
        while (log.children.length > 50) {
            log.removeChild(log.firstChild);
        }
    }

    /**
     * Clear combat log
     */
    clearCombatLog() {
        const log = document.getElementById('combat-log');
        if (log) {
            log.innerHTML = '';
        }
    }
}

// Create singleton instance
export const uiManager = new UIManager();
