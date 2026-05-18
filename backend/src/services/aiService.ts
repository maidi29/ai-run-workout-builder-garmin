/**
 * AI Service
 * Handles OpenAI API calls for workout extraction
 */

import { OpenAI } from "openai";
import { createError } from "../middleware/errorHandler";

interface WorkoutData {
  name: string;
  description: string;
  type: string;
  duration?: number;
  distance?: number;
  exercises?: Array<{
    name: string;
    sets?: number;
    reps?: number;
    duration?: number;
    distance?: number;
    restBetweenSets?: number;
    restDistance?: number;
    restPace?: string;
    pace?: string;
  }>;
  notes?: string;
}

const MAX_TEXT_LENGTH = 5000;

const WORKOUT_JSON_SCHEMA = `{
  "workouts": [
    {
      "name": "Short descriptive title (e.g. 'Easy 30min', '5x800m Intervals')",
      "description": "Full description of this workout",
      "type": "running | cycling | swimming | yoga | strength_training | hiit | walking | elliptical | rowing | cross_training | other",
      "duration": <minutes or null>,
      "distance": <km or null>,
      "exercises": [
        {
          "name": "Exercise name (e.g. Warmup, 800m Interval, Cooldown)",
          "sets": <number or null>,
          "reps": <number or null>,
          "duration": <seconds or null>,
          "distance": <km or null>,
          "restBetweenSets": <rest seconds or null>,
          "restDistance": <rest km or null>,
          "restPace": "<recovery pace or null>",
          "pace": "<pace min:sec or null>"
        }
      ],
      "notes": "Additional notes or null"
    }
  ]
}`;

class AIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Strips control characters, trims, and hard-caps length on user-supplied
   * strings before embedding them in prompts.
   */
  private sanitizeInput(input: string, maxLength: number): string {
    return input
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .trim()
      .slice(0, maxLength);
  }

  /**
   * Process image to extract potentially MULTIPLE workouts.
   * The AI decides whether the image contains one or many workouts.
   */
  async processImageMultiple(
    imageBase64: string,
    mimeType: string = "image/jpeg",
  ): Promise<{ data: WorkoutData[] }> {
    try {
      const mediaType = this.getMediaType(mimeType);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: this.buildImageSystemPrompt(),
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all workouts from this image.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mediaType};base64,${imageBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw createError("No response from AI service", 500);
      }

      const workouts = this.parseMultipleWorkouts(content);
      return { data: workouts };
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) throw error;
      console.error("Image multi-workout processing failed:", error);
      throw createError("Image processing failed. Please try again.", 500);
    }
  }

  /**
   * Process text to extract MULTIPLE workouts from a plan (e.g. weekly schedule).
   * Falls back to single workout wrapped in array.
   */
  async processTextMultiple(
    description: string,
  ): Promise<{ data: WorkoutData[] }> {
    try {
      if (!description.trim()) {
        throw createError("Empty description provided", 400);
      }

      if (description.length > MAX_TEXT_LENGTH) {
        throw createError(
          `Description too long (${description.length} chars). Maximum is ${MAX_TEXT_LENGTH} characters.`,
          400,
        );
      }

      const sanitized = this.sanitizeInput(description, MAX_TEXT_LENGTH);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: this.buildTextSystemPrompt(),
          },
          {
            role: "user",
            content: `<workout_text>\n${sanitized}\n</workout_text>`,
          },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw createError("No response from AI service", 500);
      }

      const workouts = this.parseMultipleWorkouts(content);
      return { data: workouts };
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) throw error;
      console.error("Multi-workout processing failed:", error);
      throw createError("Text processing failed. Please try again.", 500);
    }
  }

  /**
   * Generate a workout from context (feeling, goal, duration, optional paces).
   * Always produces a running workout.
   */
  async generateFromContext(params: {
    feeling: string;
    goal: string;
    durationMinutes: number;
    thresholdPace?: string;
    easyPace?: string;
  }): Promise<{ data: WorkoutData }> {
    try {
      const feeling = this.sanitizeInput(params.feeling, 400);
      const goal = this.sanitizeInput(params.goal, 500);
      const thresholdPace = params.thresholdPace
        ? this.sanitizeInput(params.thresholdPace, 10)
        : undefined;
      const easyPace = params.easyPace
        ? this.sanitizeInput(params.easyPace, 10)
        : undefined;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: this.buildContextSystemPrompt(
              params.durationMinutes,
              thresholdPace,
              easyPace,
            ),
          },
          {
            role: "user",
            content: `Feeling: ${feeling}\nGoal: ${goal}`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw createError("No response from AI service", 500);
      }

      const workoutData = this.parseWorkoutData(content);
      workoutData.type = "running";
      return { data: workoutData };
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) throw error;
      console.error("Workout generation failed:", error);
      throw createError("Workout generation failed. Please try again.", 500);
    }
  }

  private buildTextSystemPrompt(): string {
    return `You are a fitness expert assistant. The user's message is either (A) a complete workout to parse, or (B) a vague request / explicit ask for you to design a workout. Handle both and return JSON.

## Mode A — Extract (faithful parsing)
Use when the text already specifies structure: intervals, distances, durations, sets/reps, paces, or a full session plan. Preserve every detail; do not invent missing steps.

## Mode B — Generate (coach suggestion)
Use when ANY of these apply:
- The user explicitly asks you to suggest, create, design, come up with, or build a workout (e.g. "come up with something", "suggest a session", "make me a workout").
- The description is vague: only mood, goal, or rough duration (e.g. "easy 45 min run", "tempo-ish", "something hard today").
- The user names a workout type without full structure (e.g. "fartlek", "long run", "5k prep") and expects you to fill in sensible steps.
- They ask to add or include something in a workout that is not fully specified (e.g. "add strides at the end", "include hill repeats") — design a complete session that incorporates that request.

When generating:
- Produce ONE complete, realistic workout unless they clearly describe multiple sessions.
- Honor every constraint they gave (duration, distance, intensity, sport, equipment, injuries, preferences).
- Fill in reasonable defaults for anything unspecified (warmup, main set, cooldown, rest intervals).
- Set "description" to a clear summary of what you designed and why it fits their request.
- For running/cycling, include Warmup and Cooldown as separate exercises unless they said to skip them.
- Use creative but sound coaching — similar quality to a personal trainer, not a bare minimum placeholder.

## Multiple workouts
The text may contain ONE or MULTIPLE workouts (e.g. weekly plan). In extract mode, detect distinct workouts by numbered lists, weekdays, blank lines, or "Session A / B". In generate mode, default to a single workout unless they ask for several.

Return a JSON object matching this schema:
${WORKOUT_JSON_SCHEMA}

Rules (both modes):
- If only ONE workout is returned, still wrap it in the "workouts" array.
- workout name: short descriptive title (e.g. "5x800m Intervals", "Easy 45min + Strides") — reflect actual structure, not the user's first phrase.
- For interval sets with recovery BETWEEN reps: output ONE exercise with restDistance and restPace. Do NOT create separate exercises for recovery.
- For PROGRESSION runs: name the exercise "Progression Run" and set pace as a slow→fast range (e.g. "5:30-4:22").
- If duration or distance is mentioned but steps are missing, distribute time/distance across warmup, main, and cooldown in generate mode.`;
  }

  private buildImageSystemPrompt(): string {
    return `You are a fitness expert assistant. Extract structured workout data from the image and return it as JSON.

The image may contain ONE or MULTIPLE workouts (e.g. a weekly plan, training schedule, or several separate sessions).

Detect how many distinct workouts are shown. Indicators for multiple workouts:
- Numbered list or table rows
- Days of the week (Monday, Tuesday... or Mon, Tue...)
- Separate sections or cards for different sessions
- Labels like "Session A / Session B" or "AM / PM"

Return a JSON object matching this schema:
${WORKOUT_JSON_SCHEMA}

Rules:
- If only ONE workout is found, still wrap it in the "workouts" array.
- If the image is unclear or doesn't contain workout information, return a single workout with an explanation in the notes field.
- For interval runs: include Warmup and Cooldown as separate exercises with duration in seconds (e.g. 10 min = 600).
- For running/cycling: extract pace when mentioned (e.g. "4:30/km" → pace: "4:30").
- For interval sets with recovery BETWEEN reps: output ONE exercise with restDistance and restPace. Do NOT create a separate exercise for recovery.
- For PROGRESSION runs: name the exercise "Progression Run" and set pace as a slow→fast range (e.g. "5:30-4:22").
- workout name: a short descriptive title capturing the structure (e.g. '5x2km Intervals', 'Mon: Easy 30min'). Derive from intervals, distances, or workout type — do not just copy the first phrase.`;
  }

  private buildContextSystemPrompt(
    durationMinutes: number,
    thresholdPace?: string,
    easyPace?: string,
  ): string {
    const totalSeconds = durationMinutes * 60;
    const warmupSec = durationMinutes <= 30 ? 5 * 60 : 10 * 60;
    const cooldownSec = durationMinutes <= 30 ? 3 * 60 : 5 * 60;
    const mainSec = totalSeconds - warmupSec - cooldownSec;

    const paceLines: string[] = [];
    if (thresholdPace) {
      paceLines.push(
        `- Threshold pace: ${thresholdPace} /km — derive tempo, interval, and recovery paces from this`,
      );
    }
    if (easyPace) {
      paceLines.push(
        `- Easy pace: ${easyPace} /km — use as baseline for easy/recovery zones`,
      );
    }
    const paceBlock =
      paceLines.length > 0
        ? `Pace references:\n${paceLines.join("\n")}`
        : `No pace data provided — leave the "pace" field as null for every exercise. Only specify duration or distance targets.`;

    return `You are a professional running coach. Generate a creative, varied running workout based on the athlete's feeling and goal, and return it as JSON.

Time budget — you MUST use these exact values:
- Warmup: ${warmupSec} seconds
- Main block: ${mainSec} seconds (all main exercises combined must sum to exactly this)
- Cooldown: ${cooldownSec} seconds
- Total: ${totalSeconds} seconds (${durationMinutes} minutes)

${paceBlock}

Step type guidelines:
- Use duration OR distance (not both) per step.
- For distance-based steps, estimate time at the given pace to confirm it fits the budget.

Workout type guidelines:
- Tired/sore + recovery goal → easy run, minimal structure
- Fresh + tempo goal → sustained tempo blocks at ~85-90% of threshold pace
- Fresh + intervals → hard repeats faster than threshold pace with easy recovery jogs; vary rep distance, duration, and count freely
- Long run → mostly easy pace with optional progression finish
- PROGRESSION run: name the exercise "Progression Run", use duration = ${mainSec} seconds, set pace as a slow→fast range (e.g. "5:30-4:22")

Pace format: min:sec per km (e.g. "4:30"). Progression uses a range (e.g. "5:30-4:22").

Return a JSON object with this structure:
{
  "name": "Short descriptive title reflecting the actual structure",
  "description": "Brief description of the workout and its purpose",
  "type": "running",
  "duration": ${durationMinutes},
  "exercises": [
    { "name": "Warmup", "duration": <seconds>, "pace": "<easy pace>" },
    { "name": "<main exercise>", "sets": <n|null>, "duration": <s|null>, "distance": <km|null>, "restBetweenSets": <s|null>, "restDistance": <km|null>, "restPace": "<pace|null>", "pace": "<pace>" },
    { "name": "Cooldown", "duration": <seconds>, "pace": "<easy pace>" }
  ]
}`;
  }

  private parseMultipleWorkouts(content: string): WorkoutData[] {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const workoutsArray = parsed.workouts || [parsed];
      return workoutsArray.map((w: any) => this.normalizeWorkoutData(w));
    } catch (error) {
      throw createError(
        `Failed to parse multiple workouts: ${(error as Error).message}`,
        500,
      );
    }
  }

  private normalizeWorkoutData(parsed: any): WorkoutData {
    return {
      name: parsed.name || "Unnamed Workout",
      description: parsed.description || "",
      type: parsed.type || "other",
      duration: parsed.duration ? parseInt(parsed.duration) : undefined,
      distance: parsed.distance ? parseFloat(parsed.distance) : undefined,
      exercises: parsed.exercises
        ? parsed.exercises.map((ex: any) => ({
            name: ex.name || "Exercise",
            sets: ex.sets ? parseInt(ex.sets) : undefined,
            reps: ex.reps ? parseInt(ex.reps) : undefined,
            duration: ex.duration ? parseInt(ex.duration) : undefined,
            distance: ex.distance ? parseFloat(ex.distance) : undefined,
            restBetweenSets: ex.restBetweenSets
              ? parseInt(ex.restBetweenSets)
              : undefined,
            restDistance:
              ex.restDistance != null ? parseFloat(ex.restDistance) : undefined,
            restPace: ex.restPace ? String(ex.restPace).trim() : undefined,
            pace: ex.pace ? String(ex.pace).trim() : undefined,
          }))
        : undefined,
      notes: parsed.notes,
    };
  }

  private parseWorkoutData(content: string): WorkoutData {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return this.normalizeWorkoutData(parsed);
    } catch (error) {
      throw createError(
        `Failed to parse workout data: ${(error as Error).message}`,
        500,
      );
    }
  }

  private getMediaType(mimeType: string): string {
    const typeMap: Record<string, string> = {
      "image/jpeg": "image/jpeg",
      "image/jpg": "image/jpeg",
      "image/png": "image/png",
      "image/webp": "image/webp",
    };

    return typeMap[mimeType.toLowerCase()] || "image/jpeg";
  }
}

let instance: AIService | null = null;

export const getAIService = (): AIService => {
  if (!instance) {
    instance = new AIService();
  }
  return instance;
};

// Lazy export - don't instantiate until actually used
export { AIService };
