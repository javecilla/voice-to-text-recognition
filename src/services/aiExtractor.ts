//v2 - src\services\aiExtractor.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export async function extractIntakeData(transcript: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const today = new Date().toISOString().split('T')[0]

  const prompt = `
    You are an expert Medical Data Transcriptionist for an Animal Bite Center in the Philippines.

    TASK: Convert the following "Taglish" audio transcript into strict JSON.
    WARNING: The transcript comes from an automated Speech-to-Text engine and contains MANY phonetic errors. You must infer the correct medical terms.

    CONTEXT:
    - Current Date: ${today}
    - Location: Bulacan, Philippines

    --- PHONETIC ERROR CORRECTION DICTIONARY ---
    Analyze specifically for these misheard terms:

    1. **INCIDENT / EXPOSURE:**
       - "Nakalimuto", "Nakalmutan", "Nakal mot" -> **"Scratch"**
       - "Kinagat", "Kagat", "Nangagat" -> **"Bite"**
       - "Laway", "Dila", "Dinilaan" -> **"Lick on open wound"**
       - "Stocks ni Daddy", "Box ing", "Boxing" -> **"Vaccine" / "Bakuna"**
       - "Nagpapakain", "Pinapakain" -> Context clue for interacting with animals (Dog/Cat).

    2. **NAMES / PERSONAL:**
       - "Samangka", "Samanta" -> **"Samantha"**
       - "Corners", "Gorners" -> **"Nurse"**
       - "Consales" -> **"Gonzales"**

    3. **ADDRESS:**
       - "Siling bata" -> **"Siling Bata"** (Barangay in Pandi)
       - "Pandi" -> (Municipality in Bulacan)

    --- EXTRACTION RULES ---
    1. **Date of Birth:** If Month is missing in transcript (e.g., "22 2012"), DO NOT invent a month. Leave dateOfBirth as empty string "" if incomplete.
    2. **Address:** "45" is usually the house number. If street is missing, put "45" in addressHouse.
    3. **Animal Type:** If the transcript mentions "Nagpapakain" (feeding), infer "Dog" or "Cat" based on context. If ambiguous, default to "Dog".
    4. **Exposure:** If "Nakalimuto" or "Nakalmot" is heard, SET "typeOfExposure" to "Scratch".

    --- JSON OUTPUT FORMAT ---
    {
      "firstName": "String",
      "lastName": "String",
      "middleName": "String",
      "extensionName": "String",
      "dateOfBirth": "YYYY-MM-DD",
      "sex": "Male/Female",
      "addressHouse": "String",
      "addressBarangay": "String",
      "addressCity": "String",
      "addressProvince": "String",
      "addressZip": "String",
      "mobileNumber": "String",
      "email": "String",
      "emergencyFirstName": "String",
      "emergencyLastName": "String",
      "emergencyMiddleName": "String",
      "emergencyExtensionName": "String",
      "emergencyRelationship": "String",
      "emergencyMobile": "String",
      "hasAllergies": "Yes/No",
      "allergyDetails": "String",
      "historyOfRabiesVaccine": "Yes/No",
      "lastVaccineDate": "String",
      "dateOfIncident": "YYYY-MM-DD",
      "typeOfExposure": "Bite/Scratch/etc",
      "bodyLocation": "String",
      "animalType": "Dog/Cat/etc",
      "vaccinationStatus": "vaccinated/unvaccinated/unknown"
    }

    TRANSCRIPT:
    "${transcript}"
  `

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    const cleanJson = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleanJson)
  } catch (error) {
    console.error('AI Extraction Failed:', error)
    return null
  }
}
