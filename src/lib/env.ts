function trimEnv(value: string | undefined): string {
  return (value ?? "").trim();
}

export const env = {
  aiml: {
    apiKey: trimEnv(process.env.AIML_API_KEY),
    baseUrl: "https://api.aimlapi.com/v1",
    models: {
      analysis: trimEnv(process.env.AIML_MODEL_ANALYSIS) || "gpt-4o-mini",
      chat: trimEnv(process.env.AIML_MODEL_CHAT) || "gpt-4o",
      search: trimEnv(process.env.AIML_MODEL_SEARCH) || "gpt-4o-search-preview",
      searchMini: trimEnv(process.env.AIML_MODEL_SEARCH_MINI) || "gpt-4o-mini-search-preview",
      intent: trimEnv(process.env.AIML_MODEL_INTENT) || "gpt-4o-mini",
      world: trimEnv(process.env.AIML_MODEL_WORLD) || "gpt-4o",
      vision: trimEnv(process.env.AIML_MODEL_VISION) || "gpt-4o",
      transcribe: trimEnv(process.env.AIML_MODEL_TRANSCRIBE) || "whisper-1",
    },
    searchContextSize: trimEnv(process.env.AIML_SEARCH_CONTEXT_SIZE) || "medium",
    tts: {
      model: trimEnv(process.env.AIML_TTS_MODEL) || "openai/tts-1",
      voice: trimEnv(process.env.AIML_TTS_VOICE) || "nova",
      speed: parseFloat(trimEnv(process.env.AIML_TTS_SPEED) || "1.08"),
    },
  },
  brightData: {
    apiKey: trimEnv(process.env.BRIGHT_DATA_API_KEY),
    serpZone: trimEnv(process.env.BRIGHT_DATA_SERP_ZONE) || "sentra_serp",
  },
  newsApi: {
    apiKey: trimEnv(process.env.NEWS_API_KEY),
  },
  openWeather: {
    apiKey: trimEnv(process.env.OPENWEATHER_API_KEY),
  },
  supabase: {
    url: trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
  },
  speechmatics: {
    apiKey: trimEnv(process.env.SPEECHMATICS_API_KEY),
    voice: trimEnv(process.env.SPEECHMATICS_TTS_VOICE) || "sarah",
  },
  user: {
    name: trimEnv(process.env.NEXT_PUBLIC_USER_NAME) || "Hubaib",
    country: trimEnv(process.env.NEXT_PUBLIC_USER_COUNTRY) || "Sri Lanka",
  },
} as const;

export function hasAiml() {
  return Boolean(env.aiml.apiKey);
}

export function hasBrightData() {
  return Boolean(env.brightData.apiKey && env.brightData.serpZone);
}

export function hasNewsApi() {
  return Boolean(env.newsApi.apiKey);
}

export function hasOpenWeather() {
  return Boolean(env.openWeather.apiKey);
}

export function hasSupabase() {
  return Boolean(env.supabase.url && env.supabase.anonKey);
}

export function hasSpeechmatics() {
  return Boolean(env.speechmatics.apiKey);
}
