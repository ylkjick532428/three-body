import { GoogleGenAI, Type } from "@google/genai";
import { Body, OracleResponse } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const consultTheOracle = async (bodies: Body[]): Promise<OracleResponse> => {
  const modelId = "gemini-2.5-flash";

  // Prepare data for the model
  const planet = bodies.find(b => b.isPlanet);
  const suns = bodies.filter(b => !b.isPlanet);

  if (!planet) {
      return {
          era: "Chaotic Era",
          description: "Trisolaris has been destroyed.",
          recommendation: "Mourn."
      }
  }

  // Calculate distances from planet to each sun
  const distances = suns.map((sun, index) => {
    const dx = sun.position.x - planet.position.x;
    const dy = sun.position.y - planet.position.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    return `Sun ${index + 1} (${sun.color}): ${dist.toFixed(0)} units away. Mass: ${sun.mass.toFixed(0)}.`;
  }).join('\n');

  const prompt = `
    You are the Oracle of Trisolaris (from the Three Body Problem). 
    Analyze the current astronomical data of our world.
    
    Data:
    Planet Position: (${planet.position.x.toFixed(0)}, ${planet.position.y.toFixed(0)})
    ${distances}

    Determine if we are in a Stable Era (suns follow a regular pattern, temperate climate) or a Chaotic Era (unpredictable sun movement, extreme heat/cold).
    Provide a cryptic, atmospheric description of the sky and the fate of civilization.
    Provide a recommendation (e.g., "Dehydrate", "Rehydrate", "Develop Industry").
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            era: { type: Type.STRING, enum: ["Stable Era", "Chaotic Era"] },
            description: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          },
          required: ["era", "description", "recommendation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Oracle");
    
    return JSON.parse(text) as OracleResponse;

  } catch (error) {
    console.error("Oracle failed:", error);
    return {
      era: "Chaotic Era",
      description: "The Oracle is silent. The magnetic interference from the suns is too strong.",
      recommendation: "Wait"
    };
  }
};