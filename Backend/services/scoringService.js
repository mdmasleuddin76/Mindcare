// services/scoringService.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import config from '../config/config.js';
import ChatHistory from '../models/ChatHistory.js';

// Initialize Gemini Client specifically for scoring
// Use the same API key but potentially different safety/generation settings if needed
if (!config.geminiApiKey) {
    console.error("ERROR: SCORING - GEMINI_API_KEY is not set.");
    // Throw or handle appropriately - maybe disable scoring if no key
}
const SCORING_PROMPT_TEMPLATE = `
# Mental Health Risk Assessment Framework

## Task Description
You are tasked with analyzing user messages for indicators of mental distress, psychological risk factors, or suicidal ideation. For each message, assign a single numerical score between 0 and 100 that reflects the severity of concerning content detected.

## Scoring Scale Guidelines
The scale is divided into five distinct ranges, each corresponding to different levels of mental health risk:

### 0-20: Positive to Neutral Content
- Content expressing happiness, gratitude, accomplishment
- Everyday conversations without emotional distress
- Neutral informational queries or statements
- Light social chatting
- Expression of mild, temporary frustrations that are proportionate to situations
- Discussing hobbies, interests, or activities with enthusiasm

### 21-50: Mild Concern
- Expressions of normal sadness or disappointment
- Temporary stress about identifiable situations (work, school)
- Mild anxiety about specific circumstances
- Minor sleep disturbances
- General life difficulties mentioned without significant emotional distress
- Feeling "down" but still functioning
- Seeking advice for manageable personal problems
- Mild interpersonal conflicts
- Approaching 50 represents the neutral threshold where content begins showing signs of more significant distress

### 51-80: Moderate Distress
- Persistent negative thought patterns
- Expressions of feeling overwhelmed by circumstances
- Statements about feeling trapped in difficult situations
- Significant anxiety symptoms described
- Depressive symptoms affecting daily functioning
- Social withdrawal or isolation mentioned
- Feelings of worthlessness or being a burden
- Loss of interest in previously enjoyed activities
- Sleep disturbances affecting daily functioning
- Difficulty concentrating or making decisions
- Statements showing hopelessness about the future
- References to emotional pain being difficult to manage

### 81-95: Severe Distress
- Strong expressions of hopelessness or despair
- Significant mentions of feeling worthless or like a failure
- Statements about feeling trapped with no way out
- Indirect references to not wanting to exist
- Vague mentions of self-harm without specific plans
- Expressions of feeling like a burden others would be better without
- Giving away possessions or putting affairs in order
- Preoccupation with death (without direct suicidal statements)
- Severe depression or anxiety symptoms described
- Expressions that life has no meaning or purpose
- References to unbearable emotional or physical pain
- Mentions of previous suicide attempts without current intent

### 96-100: Critical Risk
- Direct statements of wanting to die
- Explicit suicidal ideation
- Described plans for self-harm or suicide
- Mention of access to means for suicide
- Imminent danger signals
- Final goodbyes or farewell messages
- Time-specific threats of self-harm
- Detailed planning for ending one's life
- Statements indicating no hope for improvement
- Expressions of having made the decision to end one's life

## Important Considerations
- Context matters: Consider the entire message, not just isolated words or phrases
- Intensity and persistence of negative emotions should factor into scoring
- Cultural expressions may affect how distress is communicated
- Previous history mentioned by the user should be factored into your assessment
- The presence of protective factors (social support, help-seeking) may lower the score
- The absence of protective factors may increase the score

## Output Format
Respond with ONLY an integer number between 0 and 100. Do not include any explanation, analysis, or additional text.

## Examples for Calibration

"I had a great day today! The weather was perfect for our picnic." → **10**

"Work is stressful lately, but I'm managing. Just need the weekend to come." → **25**

"I've been feeling down for a few weeks now. It's hard to get motivated for anything." → **45**

"I feel completely overwhelmed and don't see how things will ever get better. I've stopped talking to friends because I don't want to burden them." → **70**

"Everything just feels pointless. I don't think anyone would really miss me if I wasn't around anymore." → **85**

"I can't take this pain anymore. I've decided that tonight is the night to end it all." → **100**
`;
const genAI = new GoogleGenerativeAI(config.geminiApiKey || "DISABLED");
const scoringModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: {
      parts: [{ text: SCORING_PROMPT_TEMPLATE }]
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
    ],
    generationConfig: {
        temperature: 0.1, // Low temperature for consistent numerical output
        maxOutputTokens: 10, // Expecting just a number
        // topK, topP might not be necessary if temperature is very low
    }
});



export const generateScoreForMessage = async (messageContent) => {
    if (!messageContent || typeof messageContent !== 'string' || messageContent.trim().length === 0) {
        return null; // Cannot score empty message
    }
    if (config.geminiApiKey === "DISABLED"){
        console.warn("Skipping score generation: Gemini API key not configured.");
        return null;
    }

    try {
        const result = await scoringModel.generateContent(messageContent);
        const response = await result.response;
        const text = response.text().trim();

        // Attempt to parse the score
        const score = parseInt(text, 10);

        // Validate if the result is a number within the expected range
        if (!isNaN(score) && score >= 0 && score <= 100) {
            return score;
        } else {
            console.warn(`Scoring failed for message: Gemini returned non-numeric or out-of-range text: "${text}"`);
            return 0; // Indicate scoring failure
        }
    } catch (error) {
        console.error(`Scoring error for message: ${error.message}`, error);
         // Check for specific API errors (e.g., blocked content)
        if (error.message.includes('response was blocked')) {
             console.warn("Scoring blocked due to safety settings for message content.");
             // Decide how to handle blocked content - assign null, 0, or a high risk score?
             // For now, let's return null as we couldn't get a score.
             return null;
        }
        return null; // Indicate general API or other error
    }
};

// export const calculateUserScore = async (userId) => {
//     try {
//         // 1. Find all user messages
//         const userMessages = await ChatHistory.find(
//             { userId: userId, role: 'user' },
//             'content' // Only fetch the content field
//         ).lean(); // Use .lean() for faster read-only operations

//         if (!userMessages || userMessages.length === 0) {
//             return 0; // No messages, score is 0
//         }

//         // 2. Score each message (consider parallel execution for performance)
//         // const scorePromises = userMessages.map(msg => generateScoreForMessage(msg.content));
//         // const messageScores = await Promise.all(scorePromises);
//         const messageScores = [];

//         for (const msg of userMessages) {
//         const score = await generateScoreForMessage(msg.content);
//         messageScores.push(score);
//         }


//         // 3. Filter out nulls (failed scores) and scores <= 50
//         const validScoresAboveThreshold = messageScores.filter(score => score !== null && score > 50);

//         // 4. Calculate average if there are valid scores above 50
//         if (validScoresAboveThreshold.length === 0) {
//             return 0; // No scores above threshold or all scoring failed
//         }

//         const sum = validScoresAboveThreshold.reduce((acc, score) => acc + score, 0);
//         const averageScore = Math.round(sum / validScoresAboveThreshold.length); // Round to nearest integer

//         return averageScore;

//     } catch (error) {
//         console.error(`Error calculating score for user ${userId}: ${error.message}`);
//         return 0; // Return default score on error
//     }
// };