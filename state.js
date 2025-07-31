let currentArticleData = null;
let articleHistory = [];
let historyIndex = -1;

export function getHistoryState() {
    return {
        canGoBack: historyIndex > 0,
        canGoForward: historyIndex < articleHistory.length - 1,
    };
}

export function addArticleToHistory(articleData) {
    // If we're not at the end of history, truncate the future
    articleHistory = articleHistory.slice(0, historyIndex + 1);
    articleHistory.push(articleData);
    historyIndex = articleHistory.length - 1;
}

export function goBack() {
    if (historyIndex > 0) {
        historyIndex--;
        return articleHistory[historyIndex];
    }
    return null;
}

export function goForward() {
    if (historyIndex < articleHistory.length - 1) {
        historyIndex++;
        return articleHistory[historyIndex];
    }
    return null;
}

export function clearHistory() {
    articleHistory = [];
    historyIndex = -1;
}

export function setCurrentArticle(data) {
    currentArticleData = data;
}

export function getCurrentArticle() {
    return currentArticleData;
}

export function clearCurrentArticle() {
    currentArticleData = null;
}
