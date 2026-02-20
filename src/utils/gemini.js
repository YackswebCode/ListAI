
import * as FileSystem from 'expo-file-system/legacy'; // ✅ FIXED
import { Platform } from 'react-native';
import { GEMINI_API_KEY } from './config';

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Helper to convert image URI to base64

const imageToBase64 = async (uri) => {
  try {
    if (!uri) throw new Error('Invalid image URI');

    // 🌐 Web
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();

      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // 📱 Mobile (Android / iOS)
    if (!FileSystem?.readAsStringAsync) {
      throw new Error('FileSystem not available');
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64', // ✅ FIXED HERE
    });

    return base64;
  } catch (err) {
    console.error('Base64 conversion error:', err);
    throw err;
  }
};

// Remove Markdown, headings, code fences, normalize bullets/newlines
const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';

  let s = text;

  s = s.replace(/```[\s\S]*?```/g, '');
  s = s.replace(/`([^`]+)`/g, '$1');
  s = s.replace(/^\s{0,3}#{1,6}\s*/gm, '');
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/(^|\s)\*([^*]+)\*(?=$|\s)/g, '$1$2');
  s = s.replace(/(^|\s)_([^_]+)_(?=$|\s)/g, '$1$2');
  s = s.replace(/^[\s]*[-*•]\s+/gm, '• ');
  s = s.replace(/^\s*\d+\.\s+/gm, '• ');
  s = s.replace(/<\/?[^>]+(>|$)/g, '');
  s = s.replace(/\n{2,}/g, '\n\n');

  // Remove leading/trailing blank lines
  s = s.replace(/^\s*\n/, '');
  s = s.replace(/\n\s*$/, '');

  s = s.trim();
  return s;
};

// Parse "Item Specifics" block into object
const parseSpecificsBlock = (blockText) => {
  const specifics = {};
  if (!blockText) return specifics;

  const lines = blockText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  lines.forEach((line, idx) => {
    const kvMatch = line.match(/^([^:]+):\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const value = kvMatch[2].trim();
      specifics[key] = value;
    } else {
      if (idx > 0) {
        const prev = lines[idx - 1];
        const prevIsKeyOnly = !prev.includes(':') && /^[A-Za-z0-9 \-]+$/.test(prev) && /^[A-Za-z0-9 \-]+$/.test(line);
        if (prevIsKeyOnly && !specifics[prev]) {
          specifics[prev] = line;
        }
      }
    }
  });

  return specifics;
};

const parseTextToListing = (text) => {
  const cleaned = text.replace(/\r/g, '');

 const result = {
  title: '',
  price: '',
  description: '',
  specifics: {},
  keywords: [],
  category: '',
};


  const sectionRegex = /(?:^|\n)(Title|The price of the product|Price|Description|Item Specifics|Item specifics|Item specifics:|Item Specifics:|Keywords|Key words|Suggested Category|Suggested category|Suggested Category:|Suggested category:|Category)\s*\n?/gi;

  const matches = [];
  let m;
  while ((m = sectionRegex.exec(cleaned)) !== null) {
    matches.push({ name: m[1].toLowerCase(), index: m.index + m[0].length });
  }

  if (matches.length === 0) {
    const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return result;
    result.title = sanitizeText(lines[0]);
    result.description = sanitizeText(lines.slice(1).join('\n'));
    return result;
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const start = current.index;
    const end = (i + 1 < matches.length) ? matches[i + 1].index - matches[i + 1].name.length : cleaned.length;
    let content = cleaned.substring(start, end).trim();

    // FIX: Remove any single uppercase letters on their own line
    // before or at the start of Description or Keywords
    content = content.replace(/^\s*[A-Z]\s*$/gm, '');

    const nameLower = current.name.toLowerCase();

  if (nameLower.startsWith('title')) {
  result.title = sanitizeText(content);
} else if (nameLower.includes('price')) {
  result.price = sanitizeText(content);
} else if (nameLower.startsWith('description')) {
  result.description = sanitizeText(content);
    } else if (nameLower.includes('item') && nameLower.includes('specific')) {
      result.specifics = parseSpecificsBlock(sanitizeText(content));
    } else if (nameLower.includes('keyword')) {
      const kwText = sanitizeText(content);
      const kwCandidates = kwText.split(/[,•\n]+/).map(k => k.trim()).filter(Boolean);
      result.keywords = [...new Set(kwCandidates)].slice(0, 20);
    } else if (nameLower.includes('suggested') || nameLower.includes('category')) {
      result.category = sanitizeText(content);
    }
  }

  if (!result.description) {
    const afterTitleIndex = cleaned.indexOf(result.title);
    if (afterTitleIndex >= 0) {
      result.description = sanitizeText(cleaned.substring(afterTitleIndex + result.title.length).trim());
    }
  }

  return result;
};

export const generateListingFromImage = async (imageUri, additionalInfo = {}) => {
  try {
    const base64Image = await imageToBase64(imageUri);
    const mimeType = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    const prompt = `
You are an AI assistant that helps sellers create optimized eBay listings from product images.

Analyze the provided image and generate a complete eBay listing with the following sections:

1. Title: A concise, SEO-optimized title (max 80 characters)
2. The price of the product: the price of the product in USD 
3. Description: A detailed, persuasive product description with bullet points
4. Item Specifics: Key details such as brand, size, color, condition, material, etc.
5. Keywords: 10-15 relevant search keywords
6. Suggested Category: The most appropriate eBay category path (e.g., "Clothing, Shoes & Accessories > Men's Clothing > Jackets & Coats")

Important:
- Do NOT format your response as JSON or any other code/data format.
- Do NOT include any extra letters, labels, colons, braces, quotes, or characters before or after the sections.
- Do NOT add "D" or "I" above Description or Keywords.
- Provide the listing in clear, readable plain text, organized under the headings exactly as shown below.

Output Example:

Title
[Your SEO title here]

The price of the product
$[Price in USD]

Description
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]

Item Specifics
Brand: [Brand]
Size: [Size]
Color: [Color]
Condition: [New/Used]
Material: [Material]

Keywords
[Keyword1, Keyword2, Keyword3, ... up to 15]

Suggested Category
[Full eBay category path]
`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generation_config: {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        max_output_tokens: 2048,
      },
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const textResponse =
      (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) ||
      (data.output && Array.isArray(data.output) && data.output[0]?.content?.text) ||
      (typeof data === 'string' ? data : null);

    const text = textResponse || JSON.stringify(data);

    const parsed = parseTextToListing(text);

    return {
      title: sanitizeText(parsed.title || 'Untitled Product'),
      price: sanitizeText(parsed.price || ''),          // <-- ADDED price
      description: sanitizeText(parsed.description || 'No description generated.'),
      specifics: parsed.specifics || {},
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.map(k => sanitizeText(k))
        : [],
      category: sanitizeText(parsed.category || 'Uncategorized'),
    };
  } catch (error) {
    console.error('Gemini generation error:', error);
    throw new Error('Failed to generate listing: ' + (error.message || error));
  }
};