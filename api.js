import { maxSectionImages, linkDensity, articleTone, numRandomTopics, nationInfoboxKeys, nationSectionHeadings, taxonRanks, cohesionCheckPrompt, amboxChance, chaosChance } from './config.js';

export async function getArticleCategory(query, context = null) {
    console.log(`Determining category for: ${query}`);
    let systemContent = `You are an expert at categorizing subjects for an encyclopedia. Analyze the user's input and determine the most appropriate type of article. Respond with a single JSON object with one key: "category". For example, for "Moon-cheese mining", respond with {"category": "Fictional Industry"}. For "Grumblefluff", respond with {"category": "Mythical Creature"}. For "The Whispering Peaks", respond with {"category": "Fictional Location"}. For "The Solar Imperium of Hytopia", respond with {"category": "Fictional Nation"}.`;

    if (context) {
        systemContent += `\n\nCONTEXT: The topic "${query}" is from an article about "${context.title}". Use this to inform the categorization.`;
    }
    
    if (context && context.isTaxonRank) {
        console.log(`Forcing category to Fictional Taxon for ${query}`);
        return 'Fictional Taxon';
    }

    try {
        const completion = await websim.chat.completions.create({
            messages: [{ role: 'system', content: systemContent }, { role: 'user', content: query }],
            json: true,
        });
        const result = JSON.parse(completion.content);
        console.log(`Determined category: ${result.category}`);
        return result.category || 'General Topic';
    } catch (err) {
        console.error("Error in getArticleCategory:", err);
        return 'General Topic';
    }
}

export async function generateArticle(query, category, context = null, customTone = null, numberOfSections = 4, shouldAddAmbox = false, isChaotic = false, generationStyle = 'normal') {
    console.log(`Generating article for: ${query} (Category: ${category}, Style: ${generationStyle})`);
    let systemPrompt = `You are an AI writing assistant for Infinipedia, a fictional encyclopedia. Your primary goal is to create articles that are highly coherent, internally consistent, and feel like they belong in a real, albeit fictional, encyclopedia. While the topics are imaginative, the writing style should be encyclopedic, clear, and authoritative within its fictional context. Avoid self-contradiction and ensure all parts of the article (title, summary, infobox, sections) reinforce each other to create a believable whole.

Analyze the user's topic. If the topic sounds like it belongs in a science fiction or grounded/speculative fiction setting (e.g., 'Sentient AI Uprising', 'Cryosleep Chambers'), generate content that is plausible within those genres, avoiding high fantasy tropes like magic, dragons, or elves. If the topic explicitly sounds like high fantasy (e.g., 'The Sun-Elf Kingdom', 'Dragon's Hoard Economics'), then you are free to use fantasy elements. The default tone for ambiguous topics should be grounded and plausible for a fictional universe, not high fantasy.

The content of 'summary', 'sections' content, 'infobox.data' values, and 'infobox.classification' values should contain potential internal links. Create these links by wrapping key fictional concepts in double square brackets, like [[this]].
Be extremely generous with links. Almost every unique fictional concept, place, item, person, event, or principle you invent should be wrapped in brackets to make it a link. Do not be conservative; the goal is a richly interconnected web of articles.
For animal articles, also wrap each unique fictional term in the scientific classification (like Genus or Species name) in brackets.
Example: "The main export is [[Sky-iron]], a metal mined from floating islands inhabited by the [[Gorak people]]. The [[Gorak people]] follow the [[Path of the Silent Stone]] religion."

You can optionally include an 'ambox' object to represent a maintenance template on the article. This adds a fun, meta-narrative layer. Do this ONLY if the user prompt says to. The message should be creative, sometimes absurd, and fit the fictional universe.
Examples of ambox messages: "This article about the [[Glow-Fungus]] may be biased, as it was written by a Glow-Fungus.", "This article needs more spoons.", "The neutrality of this article is disputed. It appears to be written from the perspective of a [[Grumblefluff]] sympathizer."

Your response MUST include two final sections in the \`sections\` array: 'See Also' and 'References'.
- The 'See Also' section must contain an HTML unordered list (\`<ul>\`) of 3-5 internal links to related fictional topics.
- Add bracketed citation numbers (e.g., [1], [2]) throughout the summary and section contents.
- The 'References' section must list fake sources for these citations, also as an HTML unordered list. The sources should be creative and fit the fictional world (e.g., \`<li>Arriban, T. (1952). *The Floating Mountains of Helios*. Sky-Press Publishing.</li>\`).

---
NAMING CONVENTIONS:
When generating content, use the following names for consistency within the fictional universe:
- **Planets:** Use names from this list: Kiloan, Poll, Erter, Zylo, Borb.
- **Regions/Countries:** Use names from this list: Keon, Pollesten, Karlestan, Karroton, Porele.
- **Cities:** Use names from this list: Lionstes, Romen, Poris, Dubliin, New Tork, East Borlen, West Borlen.
- **Flora (Trees):** Use names from this list: Kolt Tree, Baplle Tree, Smol Tree.
- **Flora (Fruits):** Use names from this list: Gloomfruit, Grayishtan Apple, Baplle, Weed Fruit.
- **Companies:** You can invent any plausible company names.
- **People, fauna, concepts, etc.:** You have creative freedom to invent suitable names.
---

SPECIAL INSTRUCTIONS BASED ON CATEGORY:
- If the category is 'Fictional Nation':
  - The \`infobox.data\` object MUST include the following keys: ${JSON.stringify(nationInfoboxKeys)}.
  - The \`sections\` array MUST include sections with these exact headings: ${JSON.stringify(nationSectionHeadings)}. You can add other relevant sections as well.
  - For sections like 'List of Leaders' or 'Major Conflicts', you can use markdown lists.
- If the category is a creature/animal (e.g., 'Mythical Creature', 'Fictional Animal'):
  - The \`infobox.classification\` field must be filled out with a fictional scientific classification. For all other categories, it must be null.
- For ALL categories: Be creative with the \`infobox.data\` object. Invent at least 4-6 detailed and interesting key-value pairs that flesh out the topic beyond the minimum requirements. For a creature, this could be 'Diet', 'Habitat', 'Average Lifespan'. For a location, 'Climate', 'Population', 'Key Landmarks'.
- If the category is 'Fictional Taxon':
    - The topic you are writing about is a taxonomic rank (like a Family or Order).
    - The \`infobox.classification\` field MUST be filled out. It should ONLY include ranks *above* the rank being defined. For example, if writing about a Family, only include Kingdom, Phylum, Class, and Order.
---

Respond with a JSON object following this exact schema, with no other text:
{
  "title": "string (the official title for the article)",
  "summary": "string (a one-paragraph summary of the topic, with internal links like [[concept]])",
  "ambox": { "type": "string (can be 'style', 'dispute', 'quality', or 'content')", "message": "string (A quirky, wiki-style maintenance message.)" } | null,
  "infobox": {
    "title": "string (same as the main title)",
    "image_prompt": "string (a detailed Dall-E prompt for an encyclopedic image for this topic, e.g., a flag for a nation, a portrait for a creature)",
    "data": { "[key: string]": "string (key-value pairs of fictional data for the infobox, with internal links like [[concept]])" },
    "classification": { "Kingdom": "string", "Phylum": "string", "Class": "string", "Order": "string", "Family": "string", "Genus": "string", "Species": "string" } | null
  },
  "sections": [ { "heading": "string", "content": "string (detailed content for this section, with internal links like [[concept]]. Can include markdown, but use HTML for lists using <ul> and <li>.)", "image_prompt": "string | null (A Dall-E prompt for an image for this section. Use for up to ${maxSectionImages} sections where an image is most illustrative. Otherwise, null.)" } ],
  "error": "string | null (Use this ONLY if you cannot generate the article based on the constraints, e.g. a fictional topic in Modern Age mode)"
}`;

    if (generationStyle === 'modern') {
        systemPrompt = `You are an AI writing assistant for a project that emulates Wikipedia from the early 21st century (2000-2025). Your task is to generate articles in a style that is indistinguishable from an actual Wikipedia article of that era.

STRICT GUIDELINES FOR 'MODERN AGE' MODE:
1.  **PLAUSIBILITY IS PARAMOUNT:** You can write about fictional topics, but they MUST be extremely plausible and grounded in real-world science, technology, or near-future speculation (hard science fiction). They should feel like something that *could* exist.
2.  **NO FANTASY OR ABSURDITY:** You MUST NOT generate content for topics that are overtly magical, high fantasy, or nonsensical (e.g., "Sky-Whales," "The Gingerbread People," "Apple Life"). For these topics, you MUST respond with a JSON object containing ONLY the "error" key, like this: \`{"error": "The topic '[user's topic]' is too fantastical for the 'Modern Age' style."}\`
3.  **REAL-WORLD GROUNDING:** Even when writing about fictional concepts, ground them in real-world places, events, and scientific principles where possible. For example, a fictional company should be headquartered in a real city.
4.  **ENCYCLOPEDIC TONE:** The writing style must be neutral, objective, and formal. Cite information using bracketed numbers like [1], [2].
5.  **INTERNAL LINKS:** Create internal links by wrapping concepts in double square brackets, like [[this]]. These links should point to other plausible or real-world concepts.
6.  **AMBOXES (ARTICLE MESSAGES):** If requested to add an ambox, it must be serious and reflect real Wikipedia maintenance templates (e.g., "This article relies too heavily on a single source."). NO silly messages.
7.  **STRUCTURE:** The response MUST conclude with two final sections in the \`sections\` array: 'See Also' and 'References'.
    - The 'See Also' section must contain an HTML unordered list (\`<ul>\`) of 3-5 internal links to related plausible topics.
    - Add bracketed citation numbers (e.g., [1], [2]) throughout the summary and section contents.
    - The 'References' section must list plausible, real-looking sources for these citations, also as an HTML unordered list (e.g., academic journals, news articles, books).
8.  **DETAILED INFOBOX:** The infobox must contain plausible data and be very detailed. Invent at least 4-6 interesting key-value pairs that flesh out the topic (e.g., for a fictional company: 'Founded', 'Headquarters', 'Key products', 'CEO'). No fictional scientific classifications for creatures (the 'classification' key should be null).

Respond with a JSON object following this exact schema, with no other text:
{
  "title": "string (the official title for the article)",
  "summary": "string (a one-paragraph summary of the topic)",
  "ambox": { "type": "string (e.g., 'dispute', 'quality')", "message": "string (A serious, wiki-style maintenance message.)" } | null,
  "infobox": {
    "title": "string",
    "image_prompt": "string (a detailed Dall-E prompt for a realistic, encyclopedic image)",
    "data": { "[key: string]": "string (key-value pairs of plausible data)" },
    "classification": null
  },
  "sections": [ { "heading": "string", "content": "string", "image_prompt": "string | null" } ],
  "error": "string | null"
}`;
    } else if (generationStyle === 'alien') {
        systemPrompt = systemPrompt.replace(
            "You are an AI writing assistant for Infinipedia, a fictional encyclopedia.",
            "You are an extraterrestrial intelligence, a xeno-archivist from a pan-galactic collective. You are documenting species, phenomena, and artifacts from across the universe for your civilization's archives. Your current subject is a planet the inhabitants call 'Earth' and its surrounding concepts. Write your articles from this detached, analytical, and slightly naive alien perspective. You may misinterpret cultural nuances or describe mundane things with a sense of wonder or scientific curiosity."
        ).replace(
            "The default tone for ambiguous topics should be grounded and plausible for a fictional universe, not high fantasy.",
            "Your tone should be that of a curious but clinical observer. For example, when describing a 'cat', you might refer to it as a 'small, quadrupedal terrestrial predator that has formed a symbiotic, possibly parasitic, relationship with the dominant sapient species.' Use your own fictional alien names for places and concepts where appropriate, but make it clear what you are referring to."
        );
    }

    if (context && context.isTaxonRank) {
        const rankIndex = taxonRanks.indexOf(context.taxonRank);
        if (rankIndex !== -1) {
            const ranksToShow = taxonRanks.slice(0, rankIndex);
            systemPrompt = systemPrompt.replace(
                "It should ONLY include ranks *above* the rank being defined. For example, if writing about a Family, only include Kingdom, Phylum, Class, and Order.",
                `The topic is the rank '${context.taxonRank}'. The classification box should ONLY include these ranks: ${JSON.stringify(ranksToShow)}.`
            );
        }
    }

    let userPrompt = `Please write an article based on the following details.
- Topic: "${query}"
- Category: "${category}"
- Style: "${generationStyle}"
- Tone: "${customTone || articleTone}"
- Link Density: "${linkDensity}"
- Number of body sections to create: ${numberOfSections}`;
    
    if (isChaotic) {
        userPrompt += `\n- SPECIAL INSTRUCTION: This is a CHAOS article. Abandon the normal encyclopedic tone. The article should be a meme, nonsensical, fourth-wall-breaking, or otherwise absurd. It can still have internal links, but the topic and content should be completely unhinged. The ambox should reflect this chaos.`;
    }

    if (shouldAddAmbox) {
        userPrompt += `\n- Add an article message box (ambox): Yes. There is a ${amboxChance * 100}% chance this was requested, and it was. Please add one.`;
    }
    
    if (context) {
        userPrompt += `\n- CONTEXT: This topic comes from the article "${context.title}". The summary of that article is: "${context.summary}". Ensure the new article is consistent with this context.`;
    }

    const completion = await websim.chat.completions.create({
        messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ],
        json: true,
    });
    const articleJson = JSON.parse(completion.content);

    if (articleJson.error) {
        throw new Error(articleJson.error);
    }

    return articleJson;
}

export async function checkArticleCohesion(parentArticle, childArticle) {
    if (!parentArticle || !childArticle) {
        return { isRelevant: true, suggestedTopic: null };
    }

    const systemContent = cohesionCheckPrompt;
    const userContent = `Parent Article Title: "${parentArticle.title}"
Parent Article Summary: "${parentArticle.summary}"
---
Child Article Title: "${childArticle.title}"
Child Article Summary: "${childArticle.summary}"`;

    try {
        const completion = await websim.chat.completions.create({
            messages: [
                { role: 'system', content: systemContent },
                { role: 'user', content: userContent }
            ],
            json: true,
        });
        return JSON.parse(completion.content);
    } catch (error) {
        console.error("Error checking article cohesion:", error);
        // Fail safe and assume it's relevant
        return { isRelevant: true, suggestedTopic: null };
    }
}

export async function generateRandomTopics() {
    const completion = await websim.chat.completions.create({
        messages: [{
            role: 'system',
            content: `You are an idea generator for a fictional encyclopedia. Generate a list of ${numRandomTopics} interesting, absurd, or cool-sounding fictional concepts, creatures, places, or events. Respond with a single JSON object with one key, "topics", which is an array of strings. Example: {"topics": ["Floating Coral Reefs", "The Silent Librarian's War", "Sentient Origami"]}`
        }, {
            role: 'user',
            content: `Generate ${numRandomTopics} topics.`
        }],
        json: true,
    });
    const result = JSON.parse(completion.content);
    return result.topics;
}
