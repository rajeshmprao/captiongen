const configurationService = require('../services/ConfigurationService');

/**
 * Universal format enforcement instructions for plain text output
 */
function getFormatConstraints() {
  return configurationService.getFormatConstraints();
}

/**
 * System instructions including new types for proper vibe support
 */
function getSystemInstructions(captionType) {
  const typeConfig = configurationService.getCaptionType((captionType || "").toLowerCase());
  const formatConstraints = getFormatConstraints();
  
  return [
    typeConfig.persona,
    `Example tone: "${typeConfig.example}"`,
    formatConstraints
  ].join(" ");
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

  const modifiers = configurationService.getVibeModifiers();
  const vibeModifiers = modifiers[vibeType];
  if (!vibeModifiers) return null;

  // Find the appropriate threshold
  const threshold = value >= 80 ? 80 : value >= 60 ? 60 : value >= 40 ? 40 : 0;
  return vibeModifiers[threshold.toString()];
}

/**
 * Inject modifiers into base prompt at strategic points
 */
function injectModifier(basePrompt, modifier, vibeType) {
  if (!modifier) return basePrompt;

  // Get injection points from configuration
  const injectionPointsConfig = configurationService.getInjectionPoints();
  
  // Convert string patterns to regex objects
  const injectionPoints = {};
  Object.keys(injectionPointsConfig).forEach(key => {
    try {
      injectionPoints[key] = new RegExp(injectionPointsConfig[key]);
    } catch (error) {
      console.warn(`Invalid regex pattern for ${key}: ${injectionPointsConfig[key]}`);
    }
  });

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
