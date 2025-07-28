// Service worker pour l'extension "Too many cookies"

// Installation du service worker
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension "Too many cookies" installée');
});

// Fonction pour nettoyer les cookies d'un domaine spécifique
async function clearSiteCookies(domain) {
    try {
        const cookies = await chrome.cookies.getAll({ domain: domain });
        const promises = cookies.map(cookie => {
            const protocol = cookie.secure ? 'https:' : 'http:';
            const url = `${protocol}//${cookie.domain}${cookie.path}`;
            return chrome.cookies.remove({ url: url, name: cookie.name });
        });
        await Promise.all(promises);
        return cookies.length;
    } catch (error) {
        console.error('Erreur lors du nettoyage des cookies:', error);
        throw error;
    }
}

// Fonction pour nettoyer le cache du site
async function clearSiteCache(originUrl) {
    try {
        await chrome.browsingData.remove({
            origins: [originUrl]
        }, {
            cache: true,
            cacheStorage: true,
            indexedDB: true,
            localStorage: true,
            webSQL: true
        });
    } catch (error) {
        console.error('Erreur lors du nettoyage du cache:', error);
        throw error;
    }
}

// Fonction pour nettoyer tout (cookies + cache)
async function clearAll(domain, originUrl) {
    try {
        const cookiesCleared = await clearSiteCookies(domain);
        await clearSiteCache(originUrl);
        return { cookiesCleared, success: true };
    } catch (error) {
        console.error('Erreur lors du nettoyage complet:', error);
        return { success: false, error: error.message };
    }
}

// Écouter les messages du popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'clearCookies') {
        clearSiteCookies(request.domain)
            .then(count => sendResponse({ success: true, cookiesCleared: count }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Indique que la réponse sera asynchrone
    }

    if (request.action === 'clearCache') {
        clearSiteCache(request.originUrl)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'clearAll') {
        clearAll(request.domain, request.originUrl)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});
