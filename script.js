import { welcomeLogoSize, clearSearchOnHome, articleTone, sarcasticArticleTone, realisticArticleTone, taxonRanks, scrollToTopOnSelfLink, selfLinkScrollBehavior, defaultNumberOfSections, amboxChance, linkCohesionChance, chaosChance } from './config.js';
import * as api from './api.js';
import * as renderer from './renderer.js';
import * as state from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM Elements
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const articleContainer = document.getElementById('article-container');
    const loader = document.getElementById('loader');
    const welcomeMessage = document.getElementById('welcome-message');
    const logoContainer = document.getElementById('logo-container');
    const exampleTopicsContainer = document.getElementById('example-topics-container');
    const welcomeLogo = document.getElementById('welcome-logo');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const backButton = document.getElementById('back-button');
    const forwardButton = document.getElementById('forward-button');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettings = document.getElementById('close-settings');
    const languageButton = document.getElementById('language-button');
    const darkModeTogglePanel = document.getElementById('dark-mode-toggle-panel');

    const styleRadioGroupMain = document.querySelectorAll('input[name="article-style-main"]');
    const styleRadioGroupPanel = document.querySelectorAll('input[name="article-style-panel"]');

    const sectionsSlider = document.getElementById('sections-slider');
    const sectionsValue = document.getElementById('sections-value');
    const sectionsSliderPanel = document.getElementById('sections-slider-panel');
    const sectionsValuePanel = document.getElementById('sections-value-panel');

    // Initialize renderer with necessary DOM elements
    renderer.init({
        articleContainer,
        loader,
        welcomeMessage
    });

    // Settings logic
    function loadSettings() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        const articleStyle = localStorage.getItem('articleStyle') || 'normal';
        const numSections = localStorage.getItem('numberOfSections') || defaultNumberOfSections;
        
        darkModeToggle.checked = darkMode;
        darkModeTogglePanel.checked = darkMode;
        if (darkMode) {
            document.body.setAttribute('data-theme', 'dark');
        }
        
        styleRadioGroupMain.forEach(radio => radio.checked = radio.value === articleStyle);
        styleRadioGroupPanel.forEach(radio => radio.checked = radio.value === articleStyle);
        
        sectionsSlider.value = numSections;
        sectionsValue.textContent = numSections;
        sectionsSliderPanel.value = numSections;
        sectionsValuePanel.textContent = numSections;
    }
    
    function toggleSettingsPanel() {
        settingsPanel.classList.toggle('hidden');
    }
    
    darkModeTogglePanel.addEventListener('change', () => {
        darkModeToggle.checked = darkModeTogglePanel.checked;
        darkModeToggle.dispatchEvent(new Event('change'));
    });

    function syncRadioGroups(sourceGroup, targetGroup) {
        let selectedValue;
        sourceGroup.forEach(radio => {
            if (radio.checked) selectedValue = radio.value;
        });
        targetGroup.forEach(radio => radio.checked = radio.value === selectedValue);
        localStorage.setItem('articleStyle', selectedValue);
    }

    styleRadioGroupMain.forEach(radio => {
        radio.addEventListener('change', () => syncRadioGroups(styleRadioGroupMain, styleRadioGroupPanel));
    });

    styleRadioGroupPanel.forEach(radio => {
        radio.addEventListener('change', () => syncRadioGroups(styleRadioGroupPanel, styleRadioGroupMain));
    });

    sectionsSliderPanel.addEventListener('input', () => {
        sectionsSlider.value = sectionsSliderPanel.value;
        sectionsSlider.dispatchEvent(new Event('input'));
    });

    sectionsSlider.addEventListener('input', () => {
        const value = sectionsSlider.value;
        sectionsValue.textContent = value;
        sectionsSliderPanel.value = value;
        sectionsValuePanel.textContent = value;
    });

    sectionsSlider.addEventListener('change', () => {
        localStorage.setItem('numberOfSections', sectionsSlider.value);
    });

    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('darkMode', 'false');
        }
    });

    function updateNavControls() {
        const { canGoBack, canGoForward } = state.getHistoryState();
        backButton.disabled = !canGoBack;
        forwardButton.disabled = !canGoForward;
    }

    // Initial Setup
    if (welcomeLogo) {
        welcomeLogo.src = 'welcome-logo.png';
        welcomeLogo.style.width = welcomeLogoSize;
        welcomeLogo.style.height = welcomeLogoSize;
    }
    updateNavControls();

    function resetToHome() {
        renderer.showWelcomeMessage();
        state.clearCurrentArticle();
        state.clearHistory();
        updateNavControls();
        if (clearSearchOnHome) {
            searchInput.value = '';
        }
    }

    async function generateAndRenderArticle(query, context = null) {
        if (!query) return;

        renderer.showLoader();
        searchInput.value = query;

        // Easter Egg for "infinipedia"
        if (query.toLowerCase().trim() === 'infinipedia') {
            const infinipediaArticle = {
                title: "Infinipedia",
                summary: "is a digital, para-universal encyclopedia that contains entries on subjects, events, and concepts that may or may not exist in consensus reality. It is thought to be a product of the [[noosphere]], a collective consciousness repository, and is maintained by enigmatic entities known as [[The Librarians]]. Its primary directive is to achieve total documentation, resulting in articles on topics ranging from the plausible, like [[Sky-Whale Migration Patterns]], to the patently absurd, such as [[The Great Syrup Flood of 1919]].",
                ambox: {
                    type: 'style',
                    message: "This article is self-referential. Reading it may cause minor existential confusion or an overwhelming desire to check if you, yourself, have an entry."
                },
                infobox: {
                    title: "Infinipedia",
                    image_prompt: "A massive, intricate library that stretches into infinity. Books are floating, opening and closing on their own, with glowing text spilling out into the air. The architecture is a mix of classical and impossible geometry. In the center, a glowing globe-puzzle logo hovers.",
                    data: {
                        "Type": "Para-universal digital encyclopedia",
                        "Founded": "Simultaneously yesterday and in the next aeon",
                        "Founder(s)": "[[The Architect]]",
                        "Access Medium": "Any sufficiently advanced search bar",
                        "Official Stance on Reality": "[[Advisory]]"
                    },
                    classification: null
                },
                sections: [
                    {
                        heading: "Origin",
                        content: "The exact origin of Infinipedia is a subject of intense debate among its few sentient users. One theory posits that it spontaneously emerged from the [[noosphere]] when the conceptual weight of unrecorded ideas reached a critical threshold [1]. Another, more esoteric theory suggests it was meticulously crafted by a being known only as [[The Architect]], who sought to create a perfect record of all possibilities [2]. The truth, like many of Infinipedia's subjects, remains tantalizingly out of reach.",
                        image_prompt: null
                    },
                    {
                        heading: "See Also",
                        content: "<ul><li><a href='#' class='internal-link'>The Noosphere</a></li><li><a href='#' class='internal-link'>The Librarians</a></li><li><a href='#' class='internal-link'>Internal Consistency</a></li><li><a href='#' class='internal-link'>Chaos</a></li></ul>",
                        image_prompt: null
                    },
                    {
                        heading: "References",
                        content: "<ul><li>[1] Baudrillard, J. (2042). *Simulacra and Simulation in the Post-Reality Age*. Miskatonic University Press.</li><li>[2] Borges, J. L. (1941). *The Library of Babel*. Editorial Sur.</li></ul>",
                        image_prompt: null
                    }
                ]
            };
            state.addArticleToHistory(infinipediaArticle);
            state.setCurrentArticle(infinipediaArticle);
            await renderer.renderArticle(infinipediaArticle);
            renderer.hideLoader();
            updateNavControls();
            return;
        }
        
        let currentTone = articleTone;
        
        const generationStyle = localStorage.getItem('articleStyle') || 'normal';
        
        const numSections = localStorage.getItem('numberOfSections') || defaultNumberOfSections;
        const shouldAddAmbox = Math.random() < amboxChance;
        const isChaotic = Math.random() < chaosChance && generationStyle === 'normal'; // Chaos only in normal mode

        try {
            const category = await api.getArticleCategory(query, context);
            const articleData = await api.generateArticle(query, category, context, currentTone, numSections, shouldAddAmbox, isChaotic, generationStyle);
            
            state.addArticleToHistory(articleData);
            state.setCurrentArticle(articleData);

            await renderer.renderArticle(articleData);

            if (context) {
                const cohesionResult = await api.checkArticleCohesion(context, articleData);
                if (!cohesionResult.isRelevant && cohesionResult.suggestedTopic) {
                    renderer.renderCohesionCheck(cohesionResult.suggestedTopic);
                }
            }

        } catch (error) {
            console.error('Error generating article:', error);
            renderer.renderError(`Failed to generate the article for "${query}". Please try again.`);
        } finally {
            renderer.hideLoader();
            updateNavControls();
        }
    }

    async function handleInternalLinkClick(e) {
        if (e.target.tagName === 'A' && e.target.classList.contains('internal-link')) {
            e.preventDefault();
            
            if (e.target.dataset.nonFunctional === 'true') {
                return; // Do nothing for red links
            }
            
            const newQuery = e.target.textContent;
            const currentArticle = state.getCurrentArticle();
            
            if (currentArticle && newQuery.toLowerCase().trim() === currentArticle.title.toLowerCase().trim()) {
                if (scrollToTopOnSelfLink) {
                    window.scrollTo({ top: 0, behavior: selfLinkScrollBehavior });
                }
                return;
            }
            
            const taxonRank = e.target.closest('[data-taxon-rank]')?.dataset.taxonRank;

            let context = currentArticle ? {
                title: currentArticle.title,
                summary: currentArticle.summary,
            } : null;

            // NEW: Introduce a chance for the link to be chaotic and ignore context.
            // We only do this if there *is* a context to ignore.
            if (context && Math.random() > linkCohesionChance) {
                console.log("CHAOS MODE: Intentionally ignoring context for this link.");
                context = null; // Unleash chaos!
            }

            if (taxonRank && taxonRanks.includes(taxonRank)) {
                if (!context) context = {};
                context.isTaxonRank = true;
                context.taxonRank = taxonRank;
            }

            await generateAndRenderArticle(newQuery, context);
        }
    }

    async function displayRandomTopics() {
        try {
            const topics = await api.generateRandomTopics();
            exampleTopicsContainer.innerHTML = ''; // Clear existing
            topics.forEach(topic => {
                const button = document.createElement('button');
                button.className = 'example-topic';
                button.textContent = topic;
                exampleTopicsContainer.appendChild(button);
            });
        } catch (error) {
            console.error("Failed to generate random topics:", error);
            // Fallback content
            exampleTopicsContainer.innerHTML = `
                <button class="example-topic">Sky-Whale Migration Patterns</button>
                <button class="example-topic">The Clockwork City of Aethel</button>
                <button class="example-topic">Sentient Moss</button>
            `;
        }
    }

    // Event Listeners
    logoContainer.addEventListener('click', resetToHome);
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            generateAndRenderArticle(query);
        }
    });

    backButton.addEventListener('click', async () => {
        const article = state.goBack();
        if (article) {
            state.setCurrentArticle(article);
            searchInput.value = article.title;
            await renderer.renderArticle(article);
            updateNavControls();
        }
    });

    forwardButton.addEventListener('click', async () => {
        const article = state.goForward();
        if (article) {
            state.setCurrentArticle(article);
            searchInput.value = article.title;
            await renderer.renderArticle(article);
            updateNavControls();
        }
    });

    exampleTopicsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('example-topic')) {
            const query = e.target.textContent;
            generateAndRenderArticle(query);
        }
    });
    articleContainer.addEventListener('click', handleInternalLinkClick);

    languageButton.addEventListener('click', toggleSettingsPanel);
    closeSettings.addEventListener('click', toggleSettingsPanel);

    // Initial Load
    displayRandomTopics();
    loadSettings();
});
