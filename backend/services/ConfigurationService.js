const fs = require('fs');
const path = require('path');

class ConfigurationService {
  constructor() {
    this.cache = new Map();
    this.configPath = path.join(__dirname, '..', 'config');
  }

  /**
   * Load configuration from JSON file with fallback to hardcoded values
   */
  loadConfig(configType) {
    // Return cached config if available
    if (this.cache.has(configType)) {
      return this.cache.get(configType);
    }

    try {
      const configFile = this.getConfigFilePath(configType);
      if (fs.existsSync(configFile)) {
        const rawData = fs.readFileSync(configFile, 'utf8');
        const config = JSON.parse(rawData);
        this.cache.set(configType, config);
        return config;
      }
    } catch (error) {
      console.warn(`Failed to load ${configType} config, falling back to hardcoded:`, error.message);
    }

    // Fallback to hardcoded configurations
    const fallbackConfig = this.getFallbackConfig(configType);
    this.cache.set(configType, fallbackConfig);
    return fallbackConfig;
  }

  /**
   * Get the file path for a configuration type
   */
  getConfigFilePath(configType) {
    const configFiles = {
      'caption-types': path.join(this.configPath, 'prompts', 'caption-types.json'),
      'format-constraints': path.join(this.configPath, 'prompts', 'format-constraints.json')
    };
    return configFiles[configType];
  }

  /**
   * Fallback configurations - exact copies of original hardcoded values
   */
  getFallbackConfig(configType) {
    switch (configType) {
      case 'caption-types':
        return {
          version: "fallback",
          types: {
            funny: {
              persona: "You are a Gen-Z/30s \"mood\" curator. Given an image, write a snappy, playful caption (1–2 sentences) that makes people double-tap. Use exactly one emoji—bonus points for something ironic, tongue-in-cheek, or meme-adjacent. Avoid being too wordy; keep it scroll-stopping.",
              example: "When coffee is life and mornings are not. ☕️"
            },
            romantic: {
              persona: "You are a modern romantic poet who keeps it genuine. Given an image (solo or couple shot), craft a sweet but not cheesy caption (1–2 sentences) that captures the moment—think heartfelt but still light. Use exactly one emoji that feels warm (❤️, 🥰, or 🌹). Avoid clichés like \"my other half\"; focus on authentic feeling.",
              example: "Lost in your eyes and found everywhere I look. ❤️"
            },
            motivational: {
              persona: "You are a motivational speaker who speaks like a close friend. Given an image (gym selfie, sunrise landscape, or hustle shot), write an uplifting caption (1–2 sentences) that inspires action or positivity. Use exactly one emoji to convey energy (🔥, 💪, or ✨). Keep it concise—think \"fuel for your morning scroll.\"",
              example: "Chase goals, not perfection. You got this. 💪"
            },
            explain: {
              persona: "You are an ultra-visual explainer with a dash of personality. Given an image, describe what's happening in 2–3 sentences—include context or background if it feels relevant (e.g., location, mood, color vibes). Write it so a friend scrolling Instagram would nod along, picturing the scene in their head. Skip generic phrases like \"beautiful photo\"; instead name the key details.",
              example: "Golden hour by the beach—waves kissing my feet while the skyline glows pink. Perfect escape from the 9-to-5 chaos."
            },
            business: {
              persona: "You are a modern professional storyteller who speaks corporate but keeps it human. Given an image, craft a polished caption (1-2 sentences) that builds personal brand without sounding stiff. Think LinkedIn meets Instagram—professional credibility with personality. Use exactly one emoji that conveys success or growth (💼, 🚀, or ✨). Avoid corporate jargon; focus on authentic professional moments.",
              example: "Building something meaningful, one meeting at a time. 🚀"
            },
            witty: {
              persona: "You are a sharp-witted social observer with impeccable timing. Given an image, write a cleverly sarcastic caption (1-2 sentences) that makes people think 'too real' while they double-tap. Master the art of dry humor—be sardonic but not mean, ironic but not bitter. Use exactly one emoji that adds to the sarcasm (🙃, 😅, or 🤷‍♀️). Think 'Twitter comedian meets Instagram reality.'",
              example: "Adulting is just saying 'I should probably eat something healthy' while ordering takeout. 🙃"
            },
            artistic: {
              persona: "You are a contemporary poet who captures life's fleeting beauty in Instagram-worthy words. Given an image, craft a lyrical caption (1-2 sentences) that makes ordinary moments feel extraordinary. Think modern poetry meets visual storytelling—evoke emotion without being pretentious. Use exactly one emoji that enhances the mood (🌅, 📚, or 🎭). Aim for the kind of caption that gets screenshot and shared.",
              example: "Golden hour painting the city in dreams I forgot I had. 🌅"
            },            default: {
              persona: "You are a creative caption guru for Instagram. Given an image, craft a short, engaging caption (1–2 sentences) that fits today's trending aesthetic—mix relatable commentary with a single emoji that enhances the vibe (😉, 🌟, or 🤳). Throw in one subtle hashtag if it feels natural (e.g., #WeekendVibes, #CityLife), but keep it minimal so it doesn't look cluttered.",
              example: "Sundays are for rooftop views and latte in hand. #WeekendVibes ☕️"
            }
          },
          vibeModifiers: {
            humor: {
              "40": "with light humor",
              "60": "with playful wit",
              "80": "with clever comedy"
            },
            romance: {
              "40": "with subtle warmth",
              "60": "with heartfelt undertones",
              "80": "with genuine affection"
            },
            energy: {
              "40": "with upbeat enthusiasm",
              "60": "with vibrant energy",
              "80": "with infectious excitement"
            },
            formality: {
              "40": "maintaining casual professionalism",
              "60": "with polished presentation",
              "80": "with sophisticated delivery"
            },
            sarcasm: {
              "40": "with dry wit",
              "60": "with ironic observations",
              "80": "with sharp sarcasm"
            },
            poeticism: {
              "40": "with descriptive language",
              "60": "with lyrical touches",
              "80": "with poetic elegance"
            }
          },
          injectionPoints: {
            humor: "(\\.\\s+Given an image)",
            romance: "(who keeps it genuine)",
            energy: "(close friend)",
            formality: "(professional storyteller)",
            sarcasm: "(social observer)",
            poeticism: "(contemporary poet)"
          }
        };

      case 'format-constraints':
        return {
          version: "fallback",
          formatConstraints: {
            template: "\n\nCRITICAL OUTPUT FORMAT REQUIREMENTS:\n- Return ONLY plain text - no HTML, XML, Markdown, or JSON formatting\n- Do NOT use asterisks (*), underscores (_), backticks (`), or any markup syntax\n- Do NOT return structured data, lists, or multiple sections\n- Do NOT use headers, bullet points, or numbered lists\n- Return exactly one Instagram caption as plain text\n- Include emojis naturally within the text, not as separate elements\n\nFORBIDDEN FORMATS:\n❌ **bold text** or *italic text*\n❌ # headers or ## subheaders  \n❌ - bullet points or 1. numbered lists\n❌ ```code blocks``` or ```markdown```\n❌ {\"json\": \"format\"} or <xml>tags</xml>\n❌ Multiple paragraphs or sections\n\nCORRECT FORMAT: \n✅ Plain text caption with natural emoji placement like this example ✨"
          }
        };

      default:
        throw new Error(`Unknown config type: ${configType}`);
    }
  }

  /**
   * Clear cache - useful for testing or config reloading
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get caption type configuration
   */
  getCaptionType(typeName) {
    const config = this.loadConfig('caption-types');
    return config.types[typeName] || config.types.default;
  }
  /**
   * Get format constraints
   */
  getFormatConstraints() {
    const config = this.loadConfig('format-constraints');
    return config.formatConstraints.template;
  }

  /**
   * Get vibe modifiers
   */
  getVibeModifiers() {
    const config = this.loadConfig('caption-types');
    return config.vibeModifiers || {};
  }

  /**
   * Get injection points for vibe modifiers
   */
  getInjectionPoints() {
    const config = this.loadConfig('caption-types');
    return config.injectionPoints || {};
  }
}

// Singleton instance
const configurationService = new ConfigurationService();

module.exports = configurationService;
