const { generateInstructions, validateVibes } = require("../GenerateCaption/promptGenerator");

/**
 * Generate enhanced master caption prompt for photo dump analysis
 */
function generateMasterCaptionPrompt(captionType, vibes) {
  const baseInstructions = generateInstructions(captionType, vibes);
  
  return `${baseInstructions}

You are analyzing multiple images that form a photo dump/carousel sequence. Perform advanced cross-image analysis to create ONE cohesive master caption.

DEEP ANALYSIS REQUIRED:
- **Thematic Unity**: What's the overarching theme, occasion, or story?
- **Visual Journey**: How do the images work together to tell a complete narrative?
- **Mood Evolution**: Is there an emotional progression or consistent vibe?
- **Contextual Clues**: What setting, time, season, or event connects these images?
- **Aesthetic Coherence**: What visual elements (colors, lighting, style) unify the collection?

CAPTION CREATION FOCUS:
- Create narrative flow that acknowledges the multi-image story
- Use language that suggests variety and richness ("moments like these", "every angle", "the whole vibe")
- Reference the emotional core or main theme connecting all images
- Make it feel authentic and relatable for social media engagement
- Keep it engaging and scroll-stopping (1-3 sentences max)

ADVANCED FEATURES:
- If images show progression: Reference the journey/evolution
- If images show different perspectives: Acknowledge the completeness
- If images capture an event: Reference the experience/memory
- If images have consistent mood: Amplify that emotional tone

CRITICAL: Return ONLY plain text with the exact prefix format. No JSON, XML, HTML, or Markdown formatting.

Format your response EXACTLY as:
MASTER: [sophisticated photo dump caption that captures the essence of the complete visual story]`;
}

/**
 * Generate context-aware individual captions prompt for multiple images  
 */
function generateIndividualCaptionsPrompt(captionType, vibes, imageCount) {
  const baseInstructions = generateInstructions(captionType, vibes);
  
  return `${baseInstructions}

You are analyzing ${imageCount} individual images from a photo dump carousel. Generate brief, specific captions that highlight what makes each image unique while maintaining cohesive storytelling.

INDIVIDUAL CAPTION REQUIREMENTS:
- **Image-Specific**: Focus on unique elements, angles, expressions, or moments in each image
- **Detail-Oriented**: Notice and reference specific visual details that stand out
- **Contextually Aware**: Consider how this image fits within the larger story
- **Voice Consistent**: Maintain the same personality and energy across all captions
- **Standalone Viable**: Each caption should work independently while supporting the sequence

ENHANCED ANALYSIS PER IMAGE:
- Identify the focal point or most interesting element
- Note unique lighting, composition, or visual appeal
- Reference specific emotions, actions, or moments captured
- Consider what story this particular image tells within the larger narrative
- Highlight details that make this image worth including in the dump

CAPTION CRAFTING:
- Keep concise (1 sentence preferred, maximum 2)
- Use specific, vivid language over generic descriptions
- Include subtle emotional or aesthetic commentary
- Make each caption feel intentional and curated
- Ensure captions complement rather than repeat each other

CRITICAL: Use ONLY the specified INDIVIDUAL_X: prefixes. No JSON, XML, HTML, or Markdown formatting.

Format your response EXACTLY as:
INDIVIDUAL_1: [specific, detail-rich caption highlighting unique aspects of first image]
INDIVIDUAL_2: [specific, detail-rich caption highlighting unique aspects of second image]${imageCount >= 3 ? '\nINDIVIDUAL_3: [specific, detail-rich caption highlighting unique aspects of third image]' : ''}`;}

/**
 * Enhanced parsing of structured response with intelligent fallback handling
 */
function parseCarouselResponse(responseText, imageCount) {
  const result = {
    masterCaption: '',
    individualCaptions: [],
    imageCount: imageCount,
    analysisQuality: 'structured' // Track parsing success
  };

  try {
    // Extract master caption with multiple pattern variations
    const masterPatterns = [
      /MASTER:\s*(.+?)(?=\nINDIVIDUAL|$)/is,
      /MASTER CAPTION:\s*(.+?)(?=\nINDIVIDUAL|$)/is,
      /Master:\s*(.+?)(?=\nINDIVIDUAL|$)/is
    ];
    
    let masterMatch = null;
    for (const pattern of masterPatterns) {
      masterMatch = responseText.match(pattern);
      if (masterMatch) break;
    }
    
    if (masterMatch) {
      result.masterCaption = masterMatch[1].trim().replace(/\n/g, ' ');
    }

    // Extract individual captions with enhanced pattern matching
    for (let i = 1; i <= imageCount; i++) {
      const patterns = [
        new RegExp(`INDIVIDUAL_${i}:\\s*(.+?)(?=\\nINDIVIDUAL|$)`, 'is'),
        new RegExp(`Image ${i}:\\s*(.+?)(?=\\nImage|$)`, 'is'),
        new RegExp(`${i}\\.\\s*(.+?)(?=\\n\\d+\\.|$)`, 'is')
      ];
      
      let match = null;
      for (const pattern of patterns) {
        match = responseText.match(pattern);
        if (match) break;
      }
      
      if (match) {
        result.individualCaptions.push(match[1].trim().replace(/\n/g, ' '));
      }
    }

    // Enhanced fallback with intelligent content distribution
    if (!result.masterCaption && result.individualCaptions.length === 0) {
      result.analysisQuality = 'unstructured';
      
      // Try to intelligently split unstructured content
      const lines = responseText.trim().split('\n').filter(line => line.trim());
      
      if (lines.length >= imageCount + 1) {
        // Assume first line is master, rest are individual
        result.masterCaption = lines[0].trim();
        for (let i = 0; i < imageCount && i < lines.length - 1; i++) {
          result.individualCaptions.push(lines[i + 1].trim());
        }
      } else if (lines.length === 1) {
        // Single response - use as master, generate contextual individuals
        result.masterCaption = lines[0].trim();
        const contexts = [
          "First moment captured perfectly ✨",
          "Another angle, same energy 📸",
          "The story continues here 🌟"
        ];
        for (let i = 0; i < imageCount; i++) {
          result.individualCaptions.push(contexts[i] || `Frame ${i + 1} of this story 💫`);
        }
      } else {
        // Use full response as master with smart individual generation
        result.masterCaption = responseText.trim();
        for (let i = 0; i < imageCount; i++) {
          result.individualCaptions.push(`Perfect moment ${i + 1} ✨`);
        }
      }
    }

    // Fill missing individual captions if needed
    while (result.individualCaptions.length < imageCount) {
      const index = result.individualCaptions.length;
      result.individualCaptions.push(`Captured the moment perfectly ${index + 1} 📸`);
    }

  } catch (error) {
    // Ultimate fallback with contextual defaults
    result.analysisQuality = 'fallback';
    result.masterCaption = responseText.trim() || "Photo dump perfection captured ✨";
    
    const fallbackCaptions = [
      "This moment right here 💫",
      "Every angle tells a story 📷",
      "The vibe is immaculate ✨"
    ];
    
    for (let i = 0; i < imageCount; i++) {
      result.individualCaptions.push(fallbackCaptions[i] || `Frame ${i + 1} perfection 🌟`);
    }
  }

  return result;
}

/**
 * Enhanced carousel caption instructions with advanced multi-image analysis
 */
function generateCarouselInstructions(captionType, vibes, imageCount) {
  const baseInstructions = generateInstructions(captionType, vibes);
  
  return `${baseInstructions}

You are analyzing ${imageCount} images that form a carousel/photo dump for social media. Perform deep cross-image analysis to understand the complete story.

ANALYSIS FRAMEWORK:
1. **Context Detection**: Identify the setting, time period, occasion, or theme connecting all images
2. **Relationship Mapping**: Understand how images relate (chronological sequence, different angles, mood progression, location changes)
3. **Emotional Arc**: Detect the emotional journey or vibe evolution across the images
4. **Visual Consistency**: Note lighting, colors, style, or aesthetic elements that unify the collection

CAPTION GENERATION:
1. **MASTER CAPTION**: Create a cohesive narrative that captures the essence of the entire photo dump (1-3 sentences)
   - Reference the overarching theme, mood, or story
   - Use connecting language that ties the images together
   - Include subtle hints about the variety/progression shown
   - Make it feel authentic and engaging for social media

2. **INDIVIDUAL CAPTIONS**: Generate specific captions for each image (1 sentence each)
   - Be specific to what's unique in that particular image
   - Maintain voice consistency with the master caption
   - Work well both standalone and as part of the sequence
   - Highlight distinct moments, angles, or details

ENHANCED FEATURES:
- **Memory Creation**: If images show progression (time, location, mood), reference the journey
- **Detail Spotting**: Notice and reference specific elements that make each image special
- **Vibe Matching**: Ensure all captions match the overall energy and aesthetic
- **Social Optimization**: Make captions that encourage engagement and storytelling

CRITICAL FORMAT REQUIREMENTS:
⚠️ FOLLOW THIS EXACT STRUCTURE - NO DEVIATIONS ALLOWED ⚠️
- Use ONLY the specified prefixes: "MASTER:" and "INDIVIDUAL_X:"
- Do NOT use JSON, XML, HTML, Markdown, or any other formatting
- Do NOT add extra headers, sections, or explanatory text
- Do NOT use asterisks (*), underscores (_), backticks (\`), or markup syntax
- Each caption should be plain text on a single line after its prefix
- No bullet points, numbered lists, or multiple paragraphs per caption

FORBIDDEN FORMATS:
❌ {"master": "caption"} or any JSON structure
❌ **MASTER:** or *MASTER:* (no bold/italic formatting)
❌ # MASTER or ## INDIVIDUAL (no headers)
❌ - MASTER: or 1. INDIVIDUAL: (no list formatting)
❌ Additional explanatory text before or after the format

Format your response EXACTLY as:
MASTER: [cohesive narrative capturing the complete photo dump story]
INDIVIDUAL_1: [specific caption highlighting unique aspects of first image]
INDIVIDUAL_2: [specific caption highlighting unique aspects of second image]${imageCount >= 3 ? '\nINDIVIDUAL_3: [specific caption highlighting unique aspects of third image]' : ''}`;}

/**
 * Generate advanced photo dump analysis prompt with context detection
 * This is for future enhancement to add even more sophisticated analysis
 */
function generateAdvancedPhotoDumpPrompt(captionType, vibes, imageCount, metadata = {}) {
  const baseInstructions = generateInstructions(captionType, vibes);
  
  return `${baseInstructions}

ADVANCED PHOTO DUMP ANALYSIS for ${imageCount} images:

CONTEXT INTELLIGENCE:
- **Scenario Detection**: Identify if this is a travel dump, event coverage, aesthetic collection, daily life moments, or creative series
- **Temporal Analysis**: Determine if images span time (chronological story) or capture a single moment from multiple angles
- **Mood Mapping**: Trace emotional consistency or evolution across the image sequence
- **Aesthetic Cohesion**: Analyze color palettes, lighting, and visual style that unify the collection

ENHANCED STORYTELLING:
- **Narrative Arc**: Create captions that acknowledge the complete visual journey
- **Detail Amplification**: Highlight specific elements that make each image worth including
- **Engagement Optimization**: Craft language that encourages saves, shares, and comments
- **Authentic Voice**: Ensure captions feel genuine and relatable, not AI-generated

SOCIAL MEDIA INTELLIGENCE:
- Reference current photo dump trends and aesthetic language
- Use vocabulary that resonates with the target demographic
- Include subtle calls-to-action or conversation starters
- Balance aspirational and relatable content

This enhanced approach creates captions that feel intentionally curated and deeply connected to contemporary social media culture.

Format response as structured master + individual captions.`;
}

/**
 * Helper function to detect photo dump themes and contexts
 */
function detectPhotoDumpContext(imageAnalysis = []) {
  // This would be used with image metadata in future enhancements
  const contexts = {
    travel: ['landscape', 'architecture', 'food', 'transportation'],
    lifestyle: ['fashion', 'food', 'interior', 'personal'],
    event: ['group', 'celebration', 'performance', 'gathering'],
    aesthetic: ['artistic', 'minimal', 'cohesive_color', 'styled'],
    daily: ['casual', 'routine', 'candid', 'authentic']
  };
  
  // Future implementation would analyze image content and return context
  return 'lifestyle'; // Default for now
}

module.exports = {
  generateCarouselInstructions,
  parseCarouselResponse,
  generateMasterCaptionPrompt,
  generateIndividualCaptionsPrompt,
  generateAdvancedPhotoDumpPrompt,
  detectPhotoDumpContext
};
