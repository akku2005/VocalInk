/**
 * Slash Commands Helper
 * Non-AI writing assistance commands for the blog editor
 */

// Transition phrases library
const TRANSITIONS = {
    addition: [
        "Furthermore,",
        "Moreover,",
        "In addition,",
        "Additionally,",
        "What's more,"
    ],
    contrast: [
        "However,",
        "On the other hand,",
        "Nevertheless,",
        "Conversely,",
        "Despite this,"
    ],
    example: [
        "For instance,",
        "For example,",
        "To illustrate,",
        "As an example,",
        "Consider this:"
    ],
    conclusion: [
        "In conclusion,",
        "To summarize,",
        "Ultimately,",
        "In summary,",
        "To wrap up,"
    ],
    sequence: [
        "First,",
        "Second,",
        "Next,",
        "Then,",
        "Finally,"
    ]
};

// Example templates
const EXAMPLE_TEMPLATES = {
    code: `\`\`\`javascript
// Your code example here
\`\`\``,
    quote: `> "Your quote here" - Author Name`,
    list: `- Point 1
- Point 2
- Point 3`,
    comparison: `| Feature | Option A | Option B |
|---------|----------|----------|
| Speed   | Fast     | Slow     |
| Cost    | Low      | High     |`,
    stepByStep: `**Step 1:** First action
**Step 2:** Second action
**Step 3:** Third action`
};

/**
 * Get a random transition phrase
 */
export const getTransition = (type = 'addition') => {
    const phrases = TRANSITIONS[type] || TRANSITIONS.addition;
    return phrases[Math.floor(Math.random() * phrases.length)];
};

/**
 * Continue writing - provides context-aware continuation prompts
 */
export const continueWriting = (currentText) => {
    const lastSentence = currentText.trim().split(/[.!?]/).filter(Boolean).pop()?.trim() || '';

    // Detect context and suggest continuation
    if (lastSentence.toLowerCase().includes('however') || lastSentence.toLowerCase().includes('but')) {
        return `<p>${getTransition('example')} </p>`;
    } else if (lastSentence.match(/\d+\./)) {
        return `<p>${getTransition('sequence')} </p>`;
    } else if (lastSentence.toLowerCase().includes('therefore') || lastSentence.toLowerCase().includes('thus')) {
        return `<p>${getTransition('conclusion')} </p>`;
    } else {
        return `<p>${getTransition('addition')} </p>`;
    }
};

/**
 * Rewrite selected text in different styles
 */
export const rewriteText = (text, style = 'simple') => {
    const plainText = text.replace(/<[^>]*>/g, '').trim();

    switch (style) {
        case 'casual':
            // Make it more conversational
            return `<p>${plainText.replace(/\./g, '!').replace(/Moreover|Furthermore/gi, 'Also').replace(/Therefore|Thus/gi, 'So')}</p>`;

        case 'formal':
            // Make it more professional
            return `<p>${plainText.replace(/!/g, '.').replace(/Also/gi, 'Furthermore').replace(/So/gi, 'Therefore')}</p>`;

        case 'simple':
            // Simplify - split long sentences
            const sentences = plainText.split(/[.!?]/).filter(s => s.trim());
            return sentences.map(s => `<p>${s.trim()}.</p>`).join('');

        case 'bold':
            // Make key points bold
            const words = plainText.split(' ');
            const boldWords = words.map((word, i) => {
                // Bold important-sounding words
                if (word.length > 7 || /important|critical|essential|key/i.test(word)) {
                    return `<strong>${word}</strong>`;
                }
                return word;
            });
            return `<p>${boldWords.join(' ')}</p>`;

        default:
            return `<p>${plainText}</p>`;
    }
};

/**
 * Expand bullet point into paragraph
 */
export const expandBullet = (bulletText) => {
    const plainText = bulletText.replace(/<[^>]*>/g, '').replace(/^[-*•]\s*/, '').trim();

    // Create expanded version with more detail
    const templates = [
        `<p>${plainText}. This is particularly important because it helps establish a strong foundation. Let me explain further...</p>`,
        `<p>When we consider ${plainText.toLowerCase()}, several key aspects come to mind. First and foremost...</p>`,
        `<p>${plainText}. This approach has proven effective in many scenarios. Here's why it matters...</p>`,
        `<p>Let's dive deeper into ${plainText.toLowerCase()}. Understanding this concept is crucial for...</p>`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
};

/**
 * Summarize selected text (extractive summarization)
 */
export const summarizeText = (text) => {
    const plainText = text.replace(/<[^>]*>/g, '').trim();
    const sentences = plainText.split(/[.!?]/).filter(s => s.trim().length > 20);

    if (sentences.length <= 2) {
        return `<p><strong>Summary:</strong> ${plainText}</p>`;
    }

    // Take first sentence and last sentence (simple extraction)
    const summary = `${sentences[0].trim()}. ${sentences[sentences.length - 1].trim()}.`;

    return `<p><strong>TL;DR:</strong> ${summary}</p>`;
};

/**
 * Add examples based on context
 */
export const addExamples = (context = '', type = 'list') => {
    if (type === 'code') {
        return EXAMPLE_TEMPLATES.code;
    } else if (type === 'quote') {
        return EXAMPLE_TEMPLATES.quote;
    } else if (type === 'comparison') {
        return EXAMPLE_TEMPLATES.comparison;
    } else if (type === 'steps') {
        return EXAMPLE_TEMPLATES.stepByStep;
    } else {
        return EXAMPLE_TEMPLATES.list;
    }
};

/**
 * Detect and execute slash command
 */
export const executeSlashCommand = (command, selectedText = '', currentText = '') => {
    const cmd = command.toLowerCase().trim();

    if (cmd === '/continue') {
        return {
            content: continueWriting(currentText),
            action: 'insert'
        };
    }

    if (cmd.startsWith('/rewrite')) {
        const style = cmd.split(' ')[1] || 'simple';
        return {
            content: rewriteText(selectedText || currentText, style),
            action: 'replace'
        };
    }

    if (cmd === '/expand') {
        return {
            content: expandBullet(selectedText || currentText),
            action: 'replace'
        };
    }

    if (cmd === '/summarize') {
        return {
            content: summarizeText(selectedText || currentText),
            action: 'insert'
        };
    }

    if (cmd.startsWith('/examples')) {
        const type = cmd.split(' ')[1] || 'list';
        return {
            content: addExamples(currentText, type),
            action: 'insert'
        };
    }

    if (cmd === '/transition') {
        const type = ['addition', 'contrast', 'example', 'conclusion'][Math.floor(Math.random() * 4)];
        return {
            content: `<p>${getTransition(type)} </p>`,
            action: 'insert'
        };
    }

    return null;
};

/**
 * Get available slash commands with descriptions
 */
export const getAvailableCommands = () => [
    {
        command: '/continue',
        description: 'Continue writing from cursor',
        icon: '✍️',
        needsSelection: false
    },
    {
        command: '/rewrite [style]',
        description: 'Rewrite selected text (casual, formal, simple, bold)',
        icon: '🔄',
        needsSelection: true
    },
    {
        command: '/expand',
        description: 'Expand bullet point into paragraph',
        icon: '📝',
        needsSelection: true
    },
    {
        command: '/summarize',
        description: 'Create summary of selected text',
        icon: '📋',
        needsSelection: true
    },
    {
        command: '/examples [type]',
        description: 'Insert examples (code, quote, list, comparison, steps)',
        icon: '💡',
        needsSelection: false
    },
    {
        command: '/transition',
        description: 'Insert smooth transition phrase',
        icon: '🔗',
        needsSelection: false
    }
];

export default {
    executeSlashCommand,
    getAvailableCommands,
    getTransition,
    continueWriting,
    rewriteText,
    expandBullet,
    summarizeText,
    addExamples
};
