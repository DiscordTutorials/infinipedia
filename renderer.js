import { redLinkChance } from './config.js';

let elements = {};

export function init(domElements) {
    elements = domElements;
}

function processInternalLinks(text) {
    return text.replace(/\[\[(.*?)\]\]/g, (match, content) => {
        if (Math.random() < redLinkChance) {
            return `<a href="#" class="internal-link red-link" data-non-functional="true">${content}</a>`;
        }
        return `<a href="#" class="internal-link">${content}</a>`;
    });
}

export function showLoader() {
    elements.articleContainer.classList.add('hidden');
    elements.welcomeMessage.classList.add('hidden');
    elements.loader.classList.remove('hidden');
}

export function hideLoader() {
    elements.loader.classList.add('hidden');
    elements.articleContainer.classList.remove('hidden');
}

export function showWelcomeMessage() {
    elements.articleContainer.innerHTML = '';
    elements.articleContainer.classList.add('hidden');
    elements.loader.classList.add('hidden');
    elements.welcomeMessage.classList.remove('hidden');
}

export function renderError(message) {
    elements.articleContainer.innerHTML = '';
    elements.welcomeMessage.classList.add('hidden');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    elements.articleContainer.appendChild(errorElement);
    elements.articleContainer.classList.remove('hidden');
}

async function renderImage(container, prompt, aspectRatio) {
    const p = document.createElement('p');
    p.textContent = 'Generating image...';
    container.innerHTML = '';
    container.appendChild(p);
    
    try {
        const res = await websim.imageGen({ prompt, aspect_ratio: aspectRatio });
        const img = document.createElement('img');
        img.src = res.url;
        img.style.width = '100%';
        img.style.height = 'auto';
        container.innerHTML = '';
        container.appendChild(img);
    } catch (err) {
        console.error("Image generation failed:", err);
        p.textContent = 'Image failed to load.';
    }
}

export async function renderArticle(data) {
    elements.articleContainer.innerHTML = ''; // Clear previous article

    const titleElement = document.createElement('h1');
    titleElement.textContent = data.title;
    elements.articleContainer.appendChild(titleElement);

    if (data.ambox) {
        const amboxElement = document.createElement('div');
        // Provide a default type if one isn't specified
        const amboxType = data.ambox.type || 'style';
        amboxElement.className = `ambox ambox-${amboxType.toLowerCase()}`;
        amboxElement.innerHTML = processInternalLinks(data.ambox.message);
        elements.articleContainer.appendChild(amboxElement);
    }

    if (data.infobox) {
        const infoboxElement = document.createElement('div');
        infoboxElement.className = 'infobox';

        const infoboxTitle = document.createElement('h3');
        infoboxTitle.textContent = data.infobox.title || data.title;
        infoboxElement.appendChild(infoboxTitle);

        if (data.infobox.image_prompt) {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'infobox-image-container';
            infoboxElement.appendChild(imageContainer);
            renderImage(imageContainer, data.infobox.image_prompt, "1:1");
        }
        
        if (data.infobox.classification) {
            const classificationBox = document.createElement('div');
            classificationBox.className = 'classification-box';
            const classificationTitle = document.createElement('h4');
            classificationTitle.textContent = 'Scientific classification';
            classificationBox.appendChild(classificationTitle);
            
            const table = document.createElement('table');
            for (const key in data.infobox.classification) {
                const row = table.insertRow();
                row.dataset.taxonRank = key;
                const th = document.createElement('th');
                th.textContent = key;
                const td = document.createElement('td');
                td.innerHTML = processInternalLinks(data.infobox.classification[key]);
                row.appendChild(th);
                row.appendChild(td);
            }
            classificationBox.appendChild(table);
            infoboxElement.appendChild(classificationBox);
        }

        const table = document.createElement('table');
        for (const key in data.infobox.data) {
            const row = table.insertRow();
            const th = document.createElement('th');
            th.textContent = key;
            const td = document.createElement('td');
            td.innerHTML = processInternalLinks(data.infobox.data[key]);
            row.appendChild(th);
            row.appendChild(td);
        }
        infoboxElement.appendChild(table);
        elements.articleContainer.appendChild(infoboxElement);
    }
    
    const summaryElement = document.createElement('p');
    const summaryText = data.summary.replace(/<p>|<\/p>/g, '');
    summaryElement.innerHTML = `<strong>${data.title}</strong> ${processInternalLinks(summaryText)}`;
    elements.articleContainer.appendChild(summaryElement);

    data.sections.forEach((section, index) => {
        const sectionContainer = document.createElement('div');
        sectionContainer.className = 'article-section';

        const sectionHeading = document.createElement('h2');
        sectionHeading.textContent = section.heading;
        sectionContainer.appendChild(sectionHeading);
        
        if (section.image_prompt) {
            const imageFigure = document.createElement('figure');
            const alignmentClass = index % 2 === 0 ? 'section-image-left' : 'section-image-right';
            imageFigure.className = `section-image ${alignmentClass}`;
            sectionContainer.appendChild(imageFigure);
            renderImage(imageFigure, section.image_prompt, "4:3");
        }

        const sectionContent = document.createElement('div');
        sectionContent.innerHTML = processInternalLinks(section.content);
        sectionContainer.appendChild(sectionContent);

        elements.articleContainer.appendChild(sectionContainer);
    });
}

export function renderCohesionCheck(suggestedTopic) {
    const container = document.createElement('div');
    container.className = 'cohesion-check';

    const link = document.createElement('a');
    link.href = '#';
    link.className = 'internal-link';
    link.textContent = suggestedTopic;

    const p = document.createElement('p');
    p.innerHTML = `Oops! This article might not be what you were looking for. Did you mean: `;
    p.appendChild(link);
    p.innerHTML += `?`;

    container.appendChild(p);
    elements.articleContainer.appendChild(container);
}
