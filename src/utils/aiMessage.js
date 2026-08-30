import { aiApiKey, googleGemeniApiKey } from './constants';

const GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-pro', 'gemini-1.5-pro'];

const ACTION_INSTRUCTIONS = {
  improve: 'Rewrite the message to be clearer, more natural and more professional while keeping the original meaning and facts.',
  grammar: 'Fix all grammar, spelling and punctuation errors. Do not change the tone or wording beyond what is needed to correct errors.',
  shorten: 'Make the message shorter and more concise. Keep the core meaning but cut filler words. Use plain, direct language.',
  friendly: 'Rewrite in a warm, friendly and conversational tone. Make it feel personal and approachable while staying clear.',
  professional: 'Rewrite in a formal, professional business tone. Skip slang and emojis. Be polished and trustworthy.',
  promo: 'Rewrite as a compelling promotional/marketing message. Add a clear call to action, a sense of value, and subtle urgency. Do not make up false claims or special offers.',
  vivid: 'Rewrite in a vivid, persuasive and engaging style suitable for a sales pitch or announcement.',
};

const SYSTEM_HINT =
  'You are a professional WhatsApp marketing copywriter for a business. Return only the rewritten message text with no explanations, no quotes around it, and no extra commentary. Keep it under 500 characters unless asked otherwise.';

function buildPrompt({ text, action, targetLanguage }) {
  let instruction;
  if (action === 'translate') {
    instruction = `Translate the message into ${targetLanguage}. Keep the tone and meaning identical. Return only the translated text.`;
  } else {
    instruction = ACTION_INSTRUCTIONS[action] || ACTION_INSTRUCTIONS.improve;
  }
  return `${SYSTEM_HINT}\n\nInstruction: ${instruction}\n\nOriginal message:\n"""\n${text}\n"""`;
}

function cleanText(raw) {
  let text = typeof raw === 'string' ? raw.trim() : '';
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1).trim();
  }
  return text;
}

async function callGemini(prompt) {
  if (!googleGemeniApiKey) return null;
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(googleGemeniApiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      });
      if (res.status === 404 || res.status === 400) continue;
      const data = await res.json();
      if (!res.ok) return { error: data?.error?.message || `Gemini error ${res.status}` };
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
      if (text) return { text: cleanText(text) };
    } catch (err) {
      continue;
    }
  }
  return null;
}

async function callAiml(prompt) {
  if (!aiApiKey) return null;
  try {
    const res = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aiApiKey}` },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data?.error?.message || `AI error ${res.status}` };
    const text = data?.choices?.[0]?.message?.content;
    if (text) return { text: cleanText(text) };
  } catch (err) {
    return { error: err.message };
  }
  return null;
}

/**
 * Transform a draft message with AI.
 * Returns { success: true, text } or { success: false, error }.
 */
export async function aiTransformMessage({ text, action = 'improve', targetLanguage }) {
  const source = String(text || '').trim();
  if (!source) return { success: false, error: 'Message is empty' };

  const hasGemini = !!googleGemeniApiKey;
  const hasAiml = !!aiApiKey || !!openAiApiKey;
  if (!hasGemini && !hasAiml) {
    return { success: false, error: 'AI keys are not configured. Add EXPO_PUBLIC_GOOGLE_GEMENI_API_KEY.' };
  }

  const prompt = buildPrompt({ text: source, action, targetLanguage });

  const geminiResult = hasGemini ? await callGemini(prompt) : null;
  if (geminiResult?.text) return { success: true, text: geminiResult.text };
  if (geminiResult?.error && !hasAiml) return { success: false, error: geminiResult.error };

  const aimlResult = hasAiml ? await callAiml(prompt) : null;
  if (aimlResult?.text) return { success: true, text: aimlResult.text };
  if (aimlResult?.error) return { success: false, error: aimlResult.error };

  return { success: false, error: 'AI could not generate a response. Please try again.' };
}