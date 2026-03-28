const Review = require('../models/Review');
const axios = require('axios');
const prettier = require('prettier');
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// --- HELPER FUNCTIONS ---

function detectLanguage(url, providedLanguage, headerLanguage) {
    // If it's a manual paste with no URL, fallback to header or provided default
    if (!url) return (headerLanguage || providedLanguage || 'javascript').toLowerCase();

    const ext = url.split('.').pop().toLowerCase();
    const map = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'ipynb': 'python',
        'cpp': 'cpp',
        'c': 'c',
        'java': 'java',
        'html': 'html',
        'css': 'css',
        'rb': 'ruby',
        'go': 'go'
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
        return JSON.parse(rawText);
    } catch (error) {
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
        markdown: 'markdown'
    };

    const parser = parserMap[(language || '').toLowerCase()] || 'babel';

    try {
        return prettier.format(code, {
            parser,
            semi: true,
            singleQuote: true
        });
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
        createdAt: reviewDoc.createdAt
    };
}

function toRawGithubUrl(url) {
    if (!url) return '';
    if (url.includes('raw.githubusercontent.com')) return url;
    if (!url.includes('github.com')) return '';

    return url
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/');
}

function buildContextSnippet(code) {
    const MAX_CONTEXT = 6000;
    if (!code || typeof code !== 'string') {
        return { snippet: '', truncated: false };
    }

    if (code.length <= MAX_CONTEXT) {
        return { snippet: code, truncated: false };
    }

    const head = code.slice(0, 3500);
    const tail = code.slice(-1500);
    const removedChars = code.length - (head.length + tail.length);
    const snippet = `${head}\n/* ... ${removedChars} chars truncated for AI token control ... */\n${tail}`;

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
            correctedCode: formatWithPrettier(code, language)
        };
    }

    const { snippet: inputCode, truncated } = buildContextSnippet(code);
    const contextNote = truncated
        ? 'Code truncated for length; highlight any assumptions where context may be missing.'
        : 'Full code provided.';

    const prompt = [
        'Return only JSON with keys summary,criticalBugs,optimizations,score,correctedCode.',
        'Rules: summary max 20 words; max 3 bugs; max 3 optimizations; score 0-10 integer.',
        'correctedCode must be runnable, fully indented like a Prettier output, and include concise inline comments describing the adjustments.',
        'Add missing braces, semicolons, or spacing so the output reads like production-ready code.',
        contextNote,
        `Language: ${language}`,
        'Code:',
        inputCode
    ].join('\n');

    try {
        const response = await axios.post(
            GROQ_URL,
            {
                model: 'llama-3.1-8b-instant',
                temperature: 0.2,
                max_tokens: 1000, // Increased for correctedCode buffer
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: 'You are a senior software engineer providing structured JSON reviews.' },
                    { role: 'user', content: prompt }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${groqKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 25000
            }
        );

        const raw = response.data?.choices?.[0]?.message?.content || '{}';
        const parsed = safeJsonParse(raw) || {};

        const correctedCandidate = typeof parsed.correctedCode === 'string' && parsed.correctedCode.trim()
            ? parsed.correctedCode
            : code;
        return {
            summary: String(parsed.summary || 'No summary provided.'),
            criticalBugs: Array.isArray(parsed.criticalBugs) ? parsed.criticalBugs : [],
            optimizations: Array.isArray(parsed.optimizations) ? parsed.optimizations : [],
            score: Number.isFinite(Number(parsed.score)) ? Math.max(0, Math.min(10, Number(parsed.score))) : 0,
            correctedCode: formatWithPrettier(correctedCandidate, language)
        };
    } catch (error) {
        return {
            summary: 'AI Analysis failed.',
            criticalBugs: [],
            optimizations: ['Check API quota or connection.'],
            score: 0,
            correctedCode: formatWithPrettier(code, language)
        };
    }
}

// --- EXPORTS ---

exports.createReview = async (req, res, next) => {
    try {
        let title, url, code, language, bodyUserId;
        const headerLanguage = req.headers['x-language'] ? String(req.headers['x-language']).toLowerCase() : '';
        const authenticatedUserId = req.user && req.user.id;

        if (!authenticatedUserId) {
            return res.status(401).json({ message: 'Missing authenticated user context' });
        }

        // 1. Check if the input is Raw Text or JSON
        if (typeof req.body === 'string') {
            // Option A: RAW TEXT (Pasted Code)
            code = req.body;
            title = `Manual Paste - ${new Date().toLocaleTimeString()}`;
            language = headerLanguage || "javascript"; // Default for text pastes unless header provided
        } else {
            // Option B: JSON (GitHub or Structured Request)
            ({ title, url, code, language, userId: bodyUserId } = req.body);
            if (bodyUserId && bodyUserId !== authenticatedUserId) {
                return res.status(403).json({ message: 'userId in body does not match authenticated user' });
            }
            
            if (!language && headerLanguage) {
                language = headerLanguage;
            }
        }

        // 2. Validation & Defaults
        if (!title) title = "Untitled Review";

        let finalCode = normalizeCodeText(code);

        // 3. GitHub Logic (Triggered if 'url' exists in JSON body)
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

        // 4. Intelligence & AI Review
        const effectiveLanguage = detectLanguage(url, language, headerLanguage);
        const aiSuggestionsObj = await generateGroqReview(effectiveLanguage, finalCode);

        // 5. Save to MongoDB
        const newReview = new Review({
            title,
            code: finalCode,
            githubUrl: url || 'Manual Paste',
            language: effectiveLanguage,
            userId: authenticatedUserId,
            aiSuggestions: aiSuggestionsObj
        });

        await newReview.save();
        return res.status(201).json({ 
            message: 'Review created successfully', 
            review: toReviewResponse(newReview) 
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
        if (!review) return res.status(404).json({ message: "Review not found" });
        res.json({ message: "Review deleted successfully" });
    } catch (err) {
        return next(err);
    }
};