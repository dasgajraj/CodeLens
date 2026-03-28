const Review = require('../models/Review');
const axios = require('axios');
const prettier = require('prettier');
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// --- HELPER FUNCTIONS ---

function detectLanguage(url, providedLanguage, headerLanguage) {
    if (!url) return (headerLanguage || providedLanguage || 'javascript').toLowerCase();

    const ext = url.split('.').pop().toLowerCase();
    const map = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        ipynb: 'python',
        cpp: 'cpp',
        c: 'c',
        java: 'java',
        html: 'html',
        css: 'css',
        rb: 'ruby',
        go: 'go',
    };

    return (headerLanguage || map[ext] || providedLanguage || 'javascript').toLowerCase();
}

function normalizeCodeText(value) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') return JSON.stringify(value, null, 2);
    return '';
}

function safeJsonParse(rawText) {
    try {
        // Strip markdown fences if model wraps in ```json ... ```
        const cleaned = rawText
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
}

function formatWithPrettier(code, language) {
    if (typeof code !== 'string' || !code.trim()) return code;

    const parserMap = {
        javascript: 'babel',
        jsx: 'babel',
        typescript: 'typescript',
        tsx: 'typescript',
        json: 'json',
        css: 'css',
        scss: 'scss',
        html: 'html',
        markdown: 'markdown',
    };

    const parser = parserMap[(language || '').toLowerCase()] || 'babel';

    try {
        return prettier.format(code, { parser, semi: true, singleQuote: true });
    } catch (error) {
        console.warn('Prettier formatting failed:', error.message);
        return code;
    }
}

function toReviewResponse(reviewDoc) {
    return {
        _id: reviewDoc._id,
        title: reviewDoc.title,
        code: reviewDoc.code,
        language: reviewDoc.language,
        githubUrl: reviewDoc.githubUrl,
        userId: reviewDoc.userId,
        status: reviewDoc.status,
        aiSuggestions: reviewDoc.aiSuggestions,
        createdAt: reviewDoc.createdAt,
    };
}

function toRawGithubUrl(url) {
    if (!url) return '';
    if (url.includes('raw.githubusercontent.com')) return url;
    if (!url.includes('github.com')) return '';

    return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
}

function buildContextSnippet(code) {
    const MAX_CONTEXT = 6000;
    if (!code || typeof code !== 'string') return { snippet: '', truncated: false };

    if (code.length <= MAX_CONTEXT) return { snippet: code, truncated: false };

    const head = code.slice(0, 3500);
    const tail = code.slice(-1500);
    const removedChars = code.length - (head.length + tail.length);
    const snippet = `${head}\n/* ... ${removedChars} chars truncated ... */\n${tail}`;

    return { snippet, truncated: true };
}

// --- AI LOGIC ---

async function generateGroqReview(language, code) {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
        return {
            summary: 'AI temporarily unavailable.',
            criticalBugs: [],
            optimizations: ['Set GROQ_API_KEY in backend/.env'],
            score: 0,
            correctedCode: formatWithPrettier(code, language),
        };
    }

    const { snippet: inputCode, truncated } = buildContextSnippet(code);
    const contextNote = truncated
        ? 'Note: Code was truncated. Make assumptions where context is missing.'
        : 'Full code provided.';

    // --- STRONG SYSTEM PROMPT ---
    const systemPrompt = [
        'You are a senior software engineer and code corrector.',
        'Your ONLY job is to return a valid JSON object. No explanation, no markdown fences, no extra text.',
        'The JSON must have exactly these keys: summary, criticalBugs, optimizations, score, correctedCode.',
        '',
        'STRICT RULES for correctedCode:',
        '  1. You MUST rewrite the code from scratch — even if you think it is correct.',
        '  2. Fix ALL syntax errors: misspelled keywords (funcn→function, cst→const, conle→console), missing braces, missing semicolons.',
        '  3. Fix ALL logic errors: off-by-one loops (i<=length → i<length), shadowed variables, missing early returns.',
        '  4. Add guard clauses for null/empty inputs.',
        '  5. The correctedCode MUST be different from the input. Never return the original.',
        '  6. Format the correctedCode as clean, production-ready, properly indented code.',
        '  7. Add short inline comments explaining each fix.',
        '',
        'STRICT RULES for other fields:',
        '  - summary: max 25 words describing what was wrong and what was fixed.',
        '  - criticalBugs: array of up to 3 strings describing bugs found.',
        '  - optimizations: array of up to 3 strings with improvement suggestions.',
        '  - score: integer 0-10 rating the ORIGINAL code quality (0=broken, 10=perfect).',
    ].join('\n');

    // --- USER PROMPT ---
    const userPrompt = [
        `Language: ${language}`,
        contextNote,
        '',
        'INPUT CODE (may contain bugs, typos, syntax errors — FIX ALL OF THEM):',
        '```',
        inputCode,
        '```',
        '',
        'Return ONLY the JSON object. The correctedCode value must be a complete, fixed rewrite of the above.',
    ].join('\n');

    try {
        const response = await axios.post(
            GROQ_URL,
            {
                model: 'llama-3.3-70b-versatile', // Upgraded: much stronger at code correction
                temperature: 0.1,                 // Low temp = deterministic, accurate fixes
                max_tokens: 2048,                 // Enough room for full correctedCode
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${groqKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }
        );

        const raw = response.data?.choices?.[0]?.message?.content || '{}';
        console.log('DEBUG RAW AI RESPONSE:', raw); // Remove after testing
        const parsed = safeJsonParse(raw) || {};

        // --- VALIDATE correctedCode is actually different from input ---
        const rawCorrected = typeof parsed.correctedCode === 'string' ? parsed.correctedCode.trim() : '';
        const isSameAsInput = rawCorrected === code.trim() || rawCorrected === '';

        if (isSameAsInput) {
            // AI failed to rewrite — log and flag it clearly
            console.warn('WARN: AI returned same code as input. Flagging in response.');
        }

        const finalCorrected = isSameAsInput
            ? `// AI could not auto-correct this snippet. Manual review needed.\n${code}`
            : rawCorrected;

        return {
            summary: String(parsed.summary || 'No summary provided.'),
            criticalBugs: Array.isArray(parsed.criticalBugs) ? parsed.criticalBugs : [],
            optimizations: Array.isArray(parsed.optimizations) ? parsed.optimizations : [],
            score: Number.isFinite(Number(parsed.score))
                ? Math.max(0, Math.min(10, Number(parsed.score)))
                : 0,
            correctedCode: formatWithPrettier(finalCorrected, language),
        };
    } catch (error) {
        console.error('Groq API error:', error?.response?.data || error.message);
        return {
            summary: 'AI Analysis failed.',
            criticalBugs: [],
            optimizations: ['Check API quota or network connection.'],
            score: 0,
            correctedCode: formatWithPrettier(code, language),
        };
    }
}

// --- EXPORTS ---

exports.createReview = async (req, res, next) => {
    try {
        let title, url, code, language, bodyUserId;
        const headerLanguage = req.headers['x-language']
            ? String(req.headers['x-language']).toLowerCase()
            : '';
        const authenticatedUserId = req.user && req.user.id;

        if (!authenticatedUserId) {
            return res.status(401).json({ message: 'Missing authenticated user context' });
        }

        if (typeof req.body === 'string') {
            // RAW TEXT paste
            code = req.body;
            title = `Manual Paste - ${new Date().toLocaleTimeString()}`;
            language = headerLanguage || 'javascript';
        } else {
            // JSON body (GitHub URL or structured)
            ({ title, url, code, language, userId: bodyUserId } = req.body);
            if (bodyUserId && bodyUserId !== authenticatedUserId) {
                return res.status(403).json({ message: 'userId in body does not match authenticated user' });
            }
            if (!language && headerLanguage) language = headerLanguage;
        }

        if (!title) title = 'Untitled Review';

        let finalCode = normalizeCodeText(code);

        if (url) {
            const rawUrl = toRawGithubUrl(url);
            if (!rawUrl) {
                return res.status(400).json({ message: 'Only GitHub URLs are permitted.' });
            }
            const response = await axios.get(rawUrl, { timeout: 15000 });
            finalCode = normalizeCodeText(response.data);
        }

        if (!finalCode || finalCode.trim() === '') {
            return res.status(400).json({ message: 'No code content detected' });
        }

        const effectiveLanguage = detectLanguage(url, language, headerLanguage);
        const aiSuggestionsObj = await generateGroqReview(effectiveLanguage, finalCode);

        const newReview = new Review({
            title,
            code: finalCode,
            githubUrl: url || 'Manual Paste',
            language: effectiveLanguage,
            userId: authenticatedUserId,
            aiSuggestions: aiSuggestionsObj,
        });

        await newReview.save();
        return res.status(201).json({
            message: 'Review created successfully',
            review: toReviewResponse(newReview),
        });
    } catch (err) {
        console.error('DEBUG ERROR:', err);
        return next(err);
    }
};

exports.getReviews = async (req, res, next) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res.status(401).json({ message: 'Missing authenticated user context' });
        }

        const review = await Review.findOne({ _id: req.params.id, userId });
        if (!review) return res.status(404).json({ message: 'Review not found' });
        return res.json(toReviewResponse(review));
    } catch (err) {
        return next(err);
    }
};

exports.getAllReviews = async (req, res, next) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res.status(401).json({ message: 'Missing authenticated user context' });
        }

        const reviews = await Review.find({ userId }).sort({ createdAt: -1 });
        return res.json(reviews.map(toReviewResponse));
    } catch (err) {
        return next(err);
    }
};

exports.deleteReview = async (req, res, next) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res.status(401).json({ message: 'Missing authenticated user context' });
        }

        const review = await Review.findOneAndDelete({ _id: req.params.id, userId });
        if (!review) return res.status(404).json({ message: 'Review not found' });
        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        return next(err);
    }
};