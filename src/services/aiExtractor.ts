// src/services/aiExtractor.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini
// NOTE: In production, you should proxy this through a backend to hide the key.
// For this student project, using import.meta.env is acceptable.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export async function extractIntakeData(transcript: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `
    You are a medical data assistant. Analyze the following consultation transcript between a Nurse and a Patient.
    Extract the following information into a strict JSON format:

    1. firstName (Capitalized)
    2. lastName (Capitalized)
    3. middleName (Capitalized, or empty string if not mentioned)
    4. animalType (One of: "Dog", "Cat", "Bat", "Rat", "Snake", "Monkey", or "Other")
    5. vaccinationStatus (Must be exactly one of: "vaccinated", "unvaccinated", "unknown")

    Rules:
    - If the patient implies the dog is stray or has no owner/record, set vaccinationStatus to "unknown".
    - If a field is missing, use an empty string.
    - Return ONLY the JSON object. No markdown formatting like \`\`\`json.

    Transcript:
    "${transcript}"
  `

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Clean up if Gemini wraps it in markdown code blocks
    const cleanJson = text.replace(/```json|```/g, '').trim()

    return JSON.parse(cleanJson)
  } catch (error) {
    console.error('AI Extraction Failed:', error)
    return null
  }
}
