"use strict";

/* ═══════════════════════════════════════════════════════════════════════════
   script.js — MoodWave
   Songs fetched from the Last.fm API (tag.getTopTracks + search endpoints).
   API key is loaded at runtime from config.js → .env (never hard-coded).
   Shuffle = new API call with a different mood tag / page → fresh tracks.
═══════════════════════════════════════════════════════════════════════════ */

/* ── MOOD META (badge colors / labels) ──────────────────────────────────── */
const MOOD_META = {
  happy:       { emoji: "😊", color: "#f59e0b", label: "Happy"       },
  sad:         { emoji: "😢", color: "#60a5fa", label: "Sad"         },
  relaxed:     { emoji: "😌", color: "#34d399", label: "Relaxed"     },
  angry:       { emoji: "😤", color: "#f87171", label: "Angry"       },
  focused:     { emoji: "🎯", color: "#a78bfa", label: "Focused"     },
  euphoric:    { emoji: "✨", color: "#fcd34d", label: "Euphoric"    },
  melancholic: { emoji: "🌧", color: "#94a3b8", label: "Melancholic" },
  anxious:     { emoji: "😰", color: "#fb923c", label: "Anxious"     },
};

function getMoodMeta(mood) {
  return MOOD_META[mood] || { emoji: "🎵", color: "#a78bfa", label: mood };
}

/* ── MOOD → LAST.FM TAGS ────────────────────────────────────────────────────
   Last.fm tag.getTopTracks accepts any tag string.
   We keep a pool per mood; each shuffle picks one randomly.
────────────────────────────────────────────────────────────────────────── */
const MOOD_TAGS = {
  happy: [
    "happy", "feel-good", "upbeat", "summer", "fun", "joyful",
    "good-vibes", "party", "cheerful", "sunny",
  ],
  sad: [
    "sad", "heartbreak", "emotional", "breakup", "melancholy",
    "crying", "longing", "blue", "grief", "tearjerker",
  ],
  relaxed: [
    "chill", "relaxing", "ambient", "calm", "lounge", "peaceful",
    "easy-listening", "laid-back", "soft", "mellow",
  ],
  angry: [
    "angry", "rage", "metal", "hard-rock", "aggressive",
    "intense", "punk", "heavy", "adrenaline", "loud",
  ],
  focused: [
    "study", "focus", "concentration", "instrumental", "classical",
    "work", "productivity", "brain", "deep-focus", "lo-fi",
  ],
  euphoric: [
    "euphoric", "edm", "rave", "festival", "dance", "electronic",
    "trance", "house", "progressive-house", "club",
  ],
  melancholic: [
    "melancholic", "bittersweet", "nostalgic", "dreamy", "wistful",
    "indie", "atmospheric", "dark", "cinematic", "moody",
  ],
  anxious: [
    "calming", "meditation", "healing", "stress-relief", "tranquil",
    "soothing", "gentle", "breathing", "spa", "nature",
  ],
};

/* ── ENERGY → page offset multiplier ───────────────────────────────────── */
const ENERGY_PAGE = { low: [1, 2], medium: [2, 3, 4], high: [4, 5, 6] };

/* ── PICK RANDOM ELEMENT ─────────────────────────────────────────────────── */
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ═══════════════════════════════════════════════════════════════════════════
   LAST.FM BASE URL
   All calls use HTTPS — CORS is allowed by Last.fm for browser requests.
═══════════════════════════════════════════════════════════════════════════ */
const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";

/* ═══════════════════════════════════════════════════════════════════════════
   fetchSongsFromLastFm(mood, energy, time, limit)

   Uses tag.getTopTracks to pull songs for a mood-matching Last.fm tag.
   Returns array of: { title, artist, previewUrl, artUrl, trackId }

   Note: Last.fm does not provide audio previews (that was iTunes-only).
   We set previewUrl = null; the player gracefully shows "No preview" for
   those tracks while still displaying metadata and artwork.
═══════════════════════════════════════════════════════════════════════════ */
async function fetchSongsFromLastFm(mood, energy, time, limit = 5) {
  const apiKey = "1b382b51f4f1cf355432e48e38d1b75e";
  if (!apiKey) throw new Error("Last.fm API key not loaded yet.");

  const tag    = pick(MOOD_TAGS[mood] || MOOD_TAGS.happy);
  const pages  = ENERGY_PAGE[energy]  || ENERGY_PAGE.medium;
  const page   = pick(pages);

  /* tag.getTopTracks — reliable, returns rich metadata */
  const params = new URLSearchParams({
    method:  "tag.getTopTracks",
    tag,
    api_key: apiKey,
    format:  "json",
    limit:   String(Math.min(limit * 4, 50)),   // fetch extra, then shuffle
    page:    String(page),
  });

  const url = `${LASTFM_BASE}?${params}`;
  const res  = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Last.fm HTTP ${res.status}`);

  const data = await res.json();

  /* Last.fm error object */
  if (data.error) throw new Error(`Last.fm error ${data.error}: ${data.message}`);

  const tracks = data.tracks?.track || [];
  if (tracks.length === 0) throw new Error("No tracks for tag: " + tag);

  /* Shuffle for variety, then slice */
  const shuffled = tracks.sort(() => Math.random() - 0.5).slice(0, limit);

  return shuffled.map((t, i) => ({
    title:      t.name         || "Unknown Track",
    artist:     t.artist?.name || "Unknown Artist",
    /* Last.fm tag.getTopTracks gives image arrays */
    artUrl:     _getBestImage(t.image),
    /* Last.fm free API does not give audio previews */
    previewUrl: null,
    trackId:    t.url || String(i),
    lastfmUrl:  t.url || null,
  }));
}

/* ── Helper: pick largest available image from Last.fm image array ───────── */
function _getBestImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  /* Sizes: small, medium, large, extralarge, mega */
  const preferred = ["extralarge", "large", "mega", "medium", "small"];
  for (const size of preferred) {
    const img = images.find(i => i.size === size);
    if (img?.["#text"]) return img["#text"];
  }
  /* fallback: last non-empty */
  return images.filter(i => i["#text"]).pop()?.["#text"] || null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   FALLBACK — tries different tags before giving up
═══════════════════════════════════════════════════════════════════════════ */
async function fetchSongsWithFallback(mood, energy, time, limit = 5) {
  /* Wait for config to be ready (usually already done by page load) */
  

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const tracks = await fetchSongsFromLastFm(mood, energy, time, limit);
      if (tracks.length > 0) return tracks;
    } catch (e) {
      console.warn(`Last.fm fetch attempt ${attempt + 1} failed:`, e.message);
    }
  }

  /* Hard fallback: generic "pop" tag */
  try {
    const apiKey = "1b382b51f4f1cf355432e48e38d1b75e";
    const params = new URLSearchParams({
      method: "tag.getTopTracks", tag: "pop",
      api_key: apiKey, format: "json", limit: "25",
    });
    const res  = await fetch(`${LASTFM_BASE}?${params}`, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const list = (data.tracks?.track || []).sort(() => Math.random() - 0.5).slice(0, limit);
    if (list.length > 0) {
      return list.map((t, i) => ({
        title:     t.name         || "Unknown",
        artist:    t.artist?.name || "Unknown",
        artUrl:    _getBestImage(t.image),
        previewUrl: null,
        trackId:   t.url || String(i),
        lastfmUrl: t.url || null,
      }));
    }
  } catch (e) {
    console.warn("Generic fallback also failed:", e);
  }

  return [];
}

/* ═══════════════════════════════════════════════════════════════════════════
   AI INSIGHT — Anthropic Claude (text insight only)
   Songs come from Last.fm. Only the quote / activity / insight uses Claude.
═══════════════════════════════════════════════════════════════════════════ */
async function fetchInsightFromAI(mood, energy, time, tracks) {
  const songList = tracks.map(t => `"${t.title}" by ${t.artist}`).join(", ");

  const prompt = `You are MoodWave, an AI music companion. The user feels ${mood} with ${energy} energy, it's ${time}.
Playlist: ${songList}

Reply ONLY with a JSON object (no markdown, no backticks, no text before or after):
{"quote":"A short poetic resonant thought max 25 words for this exact mood","activity":"A vivid specific activity max 20 words paired with this mood and playlist","insight":"A warm empathetic 2-sentence insight about what this playlist says about how they feel"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 350,
      messages:   [{ role: "user", content: prompt }],
    }),
  });

  const data  = await res.json();
  const raw   = data.content?.find(b => b.type === "text")?.text || "{}";
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

/* ── LOCAL TEXT FALLBACKS (if Claude insight fails) ─────────────────────── */
function getFallbackInsight(mood) {
  const quotes = {
    happy:       "Keep spreading positivity — your energy lights up every room.",
    sad:         "Every storm runs out of rain. Feel it fully, then let it pass.",
    relaxed:     "Peace begins with a single quiet moment. You deserve this.",
    angry:       "Turn your fire into fuel. Channel that energy into something powerful.",
    focused:     "Consistency beats intensity. Keep going, one beat at a time.",
    euphoric:    "Ride this wave completely — moments like these are why we live.",
    melancholic: "Beauty lives in the bittersweet. Your depth is a rare gift.",
    anxious:     "Breathe. You have survived every difficult moment until now.",
  };
  const activities = {
    happy:       "Take a spontaneous walk with your playlist on full volume.",
    sad:         "Curl up with a warm drink and let the music hold you gently.",
    relaxed:     "Stretch, light a candle, and drift fully into your playlist.",
    angry:       "Channel it: hit the gym, run it out hard, or journal furiously.",
    focused:     "Open your workspace, dim the lights, and lock in for 90 minutes.",
    euphoric:    "Dance in your room like absolutely no one is watching.",
    melancholic: "Take a slow evening walk and let your thoughts breathe freely.",
    anxious:     "Practice box breathing: inhale 4 counts, hold 4, exhale 4, hold 4.",
  };
  return {
    quote:    quotes[mood]     || "Music is the language the soul speaks when words fall short.",
    activity: activities[mood] || "Find a quiet corner and let the music take you somewhere new.",
    insight:  "Your playlist reflects exactly where you are right now. Let the music carry you through this moment.",
  };
}

/* ── TINY HELPER ─────────────────────────────────────────────────────────── */
function cap(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}
