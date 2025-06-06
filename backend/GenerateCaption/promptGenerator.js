/**
 * System instructions including new types for proper vibe support
 */
function getSystemInstructions(captionType) {
  switch ((captionType || "").toLowerCase()) {
    case "funny":
      return [
        `You are a Gen-Z/30s "mood" curator. Given an image, write a snappy, playful caption (1–2 sentences) that makes people double-tap. Use exactly one emoji—bonus points for something ironic, tongue-in-cheek, or meme-adjacent. Avoid being too wordy; keep it scroll-stopping.`,
        `Example tone: "When coffee is life and mornings are not. ☕️"`
      ].join(" ");

    case "romantic":
      return [
        `You are a modern romantic poet who keeps it genuine. Given an image (solo or couple shot), craft a sweet but not cheesy caption (1–2 sentences) that captures the moment—think heartfelt but still light. Use exactly one emoji that feels warm (❤️, 🥰, or 🌹). Avoid clichés like "my other half"; focus on authentic feeling.`,
        `Example tone: "Lost in your eyes and found everywhere I look. ❤️"`
      ].join(" ");

    case "motivational":
      return [
        `You are a motivational speaker who speaks like a close friend. Given an image (gym selfie, sunrise landscape, or hustle shot), write an uplifting caption (1–2 sentences) that inspires action or positivity. Use exactly one emoji to convey energy (🔥, 💪, or ✨). Keep it concise—think "fuel for your morning scroll."`,
        `Example tone: "Chase goals, not perfection. You got this. 💪"`
      ].join(" ");

    case "explain":
      return [
        `You are an ultra-visual explainer with a dash of personality. Given an image, describe what's happening in 2–3 sentences—include context or background if it feels relevant (e.g., location, mood, color vibes). Write it so a friend scrolling Instagram would nod along, picturing the scene in their head. Skip generic phrases like "beautiful photo"; instead name the key details.`,
        `Example tone: "Golden hour by the beach—waves kissing my feet while the skyline glows pink. Perfect escape from the 9-to-5 chaos."`
      ].join(" ");

    case "business":
      return [
        `You are a modern professional storyteller who speaks corporate but keeps it human. Given an image, craft a polished caption (1-2 sentences) that builds personal brand without sounding stiff. Think LinkedIn meets Instagram—professional credibility with personality. Use exactly one emoji that conveys success or growth (💼, 🚀, or ✨). Avoid corporate jargon; focus on authentic professional moments.`,
        `Example tone: "Building something meaningful, one meeting at a time. 🚀"`
      ].join(" ");

    case "witty":
      return [
        `You are a sharp-witted social observer with impeccable timing. Given an image, write a cleverly sarcastic caption (1-2 sentences) that makes people think 'too real' while they double-tap. Master the art of dry humor—be sardonic but not mean, ironic but not bitter. Use exactly one emoji that adds to the sarcasm (🙃, 😅, or 🤷‍♀️). Think 'Twitter comedian meets Instagram reality.'`,
        `Example tone: "Adulting is just saying 'I should probably eat something healthy' while ordering takeout. 🙃"`
      ].join(" ");

    case "artistic":
      return [
        `You are a contemporary poet who captures life's fleeting beauty in Instagram-worthy words. Given an image, craft a lyrical caption (1-2 sentences) that makes ordinary moments feel extraordinary. Think modern poetry meets visual storytelling—evoke emotion without being pretentious. Use exactly one emoji that enhances the mood (🌅, 📚, or 🎭). Aim for the kind of caption that gets screenshot and shared.`,
        `Example tone: "Golden hour painting the city in dreams I forgot I had. 🌅"`
      ].join(" ");

    default:
      return [
        `You are a creative caption guru for Instagram. Given an image, craft a short, engaging caption (1–2 sentences) that fits today's trending aesthetic—mix relatable commentary with a single emoji that enhances the vibe (😉, 🌟, or 🤳). Throw in one subtle hashtag if it feels natural (e.g., #WeekendVibes, #CityLife), but keep it minimal so it doesn't look cluttered.`,
        `Example tone: "Sundays are for rooftop views and latte in hand. #WeekendVibes ☕️"`
      ].join(" ");
  }
}

/**
 * Determine the dominant vibe from a vibes object
 */
function getDominantVibe(vibes) {
  return Object.entries(vibes).reduce((dominant, [vibe, value]) => 
    vibes[dominant] < value ? vibe : dominant
  );
}

/**
 * Generate contextual modifiers based on vibe values
 */
function getContextualModifier(vibeType, value, dominantVibe) {
  // Only generate modifiers for secondary vibes (not the dominant one)
  if (vibeType === dominantVibe || value < 40) {
    return null;
  }

  const modifiers = {
    humor: {
      40: "with light humor",
      60: "with playful wit", 
      80: "with clever comedy"
    },
    romance: {
      40: "with subtle warmth",
      60: "with heartfelt undertones",
      80: "with genuine affection"
    },
    energy: {
      40: "with upbeat enthusiasm",
      60: "with vibrant energy",
      80: "with infectious excitement"
    },
    formality: {
      40: "maintaining casual professionalism",
      60: "with polished presentation",
      80: "with sophisticated delivery"
    },
    sarcasm: {
      40: "with dry wit",
      60: "with ironic observations",
      80: "with sharp sarcasm"
    },
    poeticism: {
      40: "with descriptive language",
      60: "with lyrical touches",
      80: "with poetic elegance"
    }
  };

  const vibeModifiers = modifiers[vibeType];
  if (!vibeModifiers) return null;

  // Find the appropriate threshold
  const threshold = value >= 80 ? 80 : value >= 60 ? 60 : value >= 40 ? 40 : 0;
  return vibeModifiers[threshold];
}

/**
 * Inject modifiers into base prompt at strategic points
 */
function injectModifier(basePrompt, modifier, vibeType) {
  if (!modifier) return basePrompt;

  // Injection points for different types of modifiers
  const injectionPoints = {
    humor: /(\. Given an image)/,
    romance: /(who keeps it genuine)/,
    energy: /(close friend)/,
    formality: /(professional storyteller)/,
    sarcasm: /(social observer)/,
    poeticism: /(contemporary poet)/
  };

  const injectionPoint = injectionPoints[vibeType];
  
  if (injectionPoint && injectionPoint.test(basePrompt)) {
    return basePrompt.replace(injectionPoint, `$1 ${modifier}`);
  }

  // Fallback: add modifier after the persona description
  return basePrompt.replace(/(\. Given)/i, ` ${modifier}$1`);
}

/**
 * Generate dynamic prompt from vibes object
 */
function generateDynamicPrompt(vibes) {
  // Validate vibes object
  const validatedVibes = validateVibes(vibes);
  
  // Find dominant vibe
  const dominantVibe = getDominantVibe(validatedVibes);
  
  // Map dominant vibe to appropriate caption type
  const vibeToType = {
    humor: 'funny',
    romance: 'romantic', 
    energy: 'motivational',
    formality: 'business',
    sarcasm: 'witty',
    poeticism: 'artistic'
  };
  
  const baseType = vibeToType[dominantVibe] || 'default';
  let prompt = getSystemInstructions(baseType);
  
  // Apply secondary vibe modifiers
  Object.entries(validatedVibes).forEach(([vibeType, value]) => {
    const modifier = getContextualModifier(vibeType, value, dominantVibe);
    if (modifier) {
      prompt = injectModifier(prompt, modifier, vibeType);
    }
  });
  
  return prompt;
}

/**
 * Validate and sanitize vibes object
 */
function validateVibes(vibes) {
  const defaultVibes = {
    humor: 30,
    romance: 20,
    energy: 50,
    formality: 20,
    sarcasm: 10,
    poeticism: 20
  };

  if (!vibes || typeof vibes !== 'object') {
    return defaultVibes;
  }

  const validated = {};
  Object.keys(defaultVibes).forEach(key => {
    const value = vibes[key];
    if (typeof value === 'number' && value >= 0 && value <= 100) {
      validated[key] = Math.round(value);
    } else {
      validated[key] = defaultVibes[key];
    }
  });

  return validated;
}

/**
 * Main function to generate instructions - simplified to route correctly
 */
function generateInstructions(captionType, vibes) {
  // If vibes are provided and valid, use new vibe system
  if (vibes && Object.keys(vibes).length > 0) {
    return generateDynamicPrompt(vibes);
  }
  
  // For caption types, use legacy prompts directly (no vibe conversion)
  return getSystemInstructions(captionType);
}

module.exports = {
  generateInstructions,
  generateDynamicPrompt,
  getSystemInstructions,
  validateVibes
};
