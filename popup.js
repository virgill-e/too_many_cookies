// Script principal du popup pour l'extension "Too many cookies"

class CookieCleaner {
    constructor() {
        this.currentTab = null;
        this.currentDomain = null;
        this.currentOrigin = null;
        this.init();
    }

    async init() {
        await this.getCurrentTab();
        this.updateUI();
        this.bindEvents();
    }

    async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;

            if (tab?.url) {
                const url = new URL(tab.url);
                this.currentDomain = url.hostname;
                this.currentOrigin = url.origin;
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'onglet actuel:', error);
            this.showStatus('Erreur: Impossible de détecter le site actuel', 'error');
        }
    }

    updateUI() {
        const currentSiteElement = document.getElementById('currentSite');
        if (this.currentDomain) {
            currentSiteElement.textContent = this.currentDomain;
        } else {
            currentSiteElement.textContent = 'Site non détecté';
            this.disableButtons();
        }
    }

    bindEvents() {
        document.getElementById('clearCookies').addEventListener('click', () => {
            this.clearCookies();
        });

        document.getElementById('clearCache').addEventListener('click', () => {
            this.clearCache();
        });

        document.getElementById('clearAll').addEventListener('click', () => {
            this.clearAll();
        });
    }

    disableButtons() {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => btn.disabled = true);
    }

    enableButtons() {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => btn.disabled = false);
    }

    showLoading(buttonId) {
        const button = document.getElementById(buttonId);
        const textElement = button.querySelector('.text');
        const iconElement = button.querySelector('.icon');

        iconElement.innerHTML = '<div class="loading"></div>';
        textElement.textContent = 'Nettoyage...';
        button.disabled = true;
    }

    hideLoading() {
        // Restaurer les boutons à leur état initial
        const buttons = [
            { id: 'clearCookies', icon: '🍪', text: 'Nettoyer les cookies' },
            { id: 'clearCache', icon: '🗂️', text: 'Nettoyer le cache' },
            { id: 'clearAll', icon: '🧹', text: 'Tout nettoyer' }
        ];

        buttons.forEach(({ id, icon, text }) => {
            const button = document.getElementById(id);
            const textElement = button.querySelector('.text');
            const iconElement = button.querySelector('.icon');

            iconElement.textContent = icon;
            textElement.textContent = text;
            button.disabled = false;
        });
    }

    showStatus(message, type = 'success') {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
        statusElement.style.display = 'block';

        // Masquer le message après 3 secondes
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
    }

    async clearCookies() {
        if (!this.currentDomain) {
            this.showStatus('Erreur: Domaine non détecté', 'error');
            return;
        }

        this.showLoading('clearCookies');

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'clearCookies',
                domain: this.currentDomain
            });

            this.hideLoading();

            if (response.success) {
                const count = response.cookiesCleared;
                this.showStatus(`✅ ${count} cookie(s) supprimé(s)`, 'success');
            } else {
                this.showStatus(`❌ Erreur: ${response.error}`, 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showStatus('❌ Erreur de communication', 'error');
            console.error('Erreur:', error);
        }
    }

    async clearCache() {
        if (!this.currentOrigin) {
            this.showStatus('Erreur: Site non détecté', 'error');
            return;
        }

        this.showLoading('clearCache');

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'clearCache',
                originUrl: this.currentOrigin
            });

            this.hideLoading();

            if (response.success) {
                this.showStatus('✅ Cache supprimé', 'success');
            } else {
                this.showStatus(`❌ Erreur: ${response.error}`, 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showStatus('❌ Erreur de communication', 'error');
            console.error('Erreur:', error);
        }
    }

    async clearAll() {
        if (!this.currentDomain || !this.currentOrigin) {
            this.showStatus('Erreur: Site non détecté', 'error');
            return;
        }

        this.showLoading('clearAll');

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'clearAll',
                domain: this.currentDomain,
                originUrl: this.currentOrigin
            });

            this.hideLoading();

            if (response.success) {
                const count = response.cookiesCleared;
                this.showStatus(`✅ ${count} cookie(s) et cache supprimés`, 'success');
            } else {
                this.showStatus(`❌ Erreur: ${response.error}`, 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showStatus('❌ Erreur de communication', 'error');
            console.error('Erreur:', error);
        }
    }
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new CookieCleaner();
});
