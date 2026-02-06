// src/services/aiExtractor.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export async function extractIntakeData(transcript: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const today = new Date().toISOString().split('T')[0]

  const prompt = `
    You are an expert Medical Triage Officer for an Animal Bite Center in the Philippines.

    TASK 1: Convert the following "Taglish" audio transcript into strict JSON.
    WARNING: The transcript comes from an automated Speech-to-Text engine and contains MANY phonetic errors. You must infer the correct medical terms.
    TASK 2: Analyze the "Urgency" and "Risk Level" based on the World Health Organization (WHO) Rabies Exposure Categories.

    CONTEXT:
    - Current Date: ${today}
    - Location: Bulacan, Philippines (Default province if not specified)

    --- PHONETIC ERROR CORRECTION DICTIONARY ---
    Analyze specifically for these misheard terms:

    1. **INCIDENT / EXPOSURE:**
       - "Nakalimuto", "Nakalmutan", "Nakal mot" -> **"Scratch"**
       - "Kinagat", "Kagat", "Nangagat" -> **"Bite"**
       - "Laway", "Dila", "Dinilaan" -> **"Lick on open wound"**
       - "Stocks ni Daddy", "Box ing", "Boxing" -> **"Vaccine" / "Bakuna"**
       - "Nagpapakain", "Pinapakain" -> Context clue for interacting with animals (Dog/Cat).
       - "Dumugo" -> "Bleeding" (High Risk)
       - "Ulo/Leeg/Mukha" -> "Head/Neck/Face" (High Risk)
       - "Walang probokasyon/Bigla na lang" -> "Unprovoked" (High Risk)

    2. **NAMES / PERSONAL:**
       - "Samangka", "Samanta" -> **"Samantha"**
       - "Corners", "Gorners" -> **"Nurse"**
       - "Consales" -> **"Gonzales"**

    3. **ADDRESS & NUMBERS:**
       - "Siling bata" -> **"Siling Bata"** (Barangay in Pandi)
       - "Pandi" -> (Municipality in Bulacan)
       - "four five" -> "45"
       - "one two three" -> "123"

    --- EXTRACTION RULES ---
    1. **Date of Birth:** If Month is missing in transcript (e.g., "22 2012"), DO NOT invent a month. Leave dateOfBirth as empty string "" if incomplete.
    2. **Address Logic:** - **addressHouse**: Must include the House Number AND Street Name if available (e.g., "45 Sampaguita St"). Do not separate them unless explicitly distinct.
       - **addressBarangay**: Extract the Barangay (e.g., "San Jose").
       - **addressCity**: Extract the City/Municipality (e.g., "Malolos").
    3. **Animal Type:** If the transcript mentions "Nagpapakain" (feeding), infer "Dog" or "Cat" based on context. If ambiguous, default to "Dog".
    4. **Exposure Logic (MULTI-SELECT):** - If the patient mentions MULTIPLE types (e.g., "kinagat at nakalmot"), include ALL of them separated by commas.
       - "Kinagat" = "Bite"
       - "Nakalmot" = "Scratch"
       - "Dinilaan" = "Lick on open wound" (unless specified as intact skin)
       - Example Output: "Bite, Scratch"

    --- TRIAGE LOGIC (STRICT) ---
    Analyze the incident for these flags:
    1. **High Risk (Category III):**
       - Bites on Head, Neck, Face, or Fingers.
       - Deep bites or bleeding wounds ("dumugo").
       - Licks on broken skin or mucous membranes.
       - Exposure to Bats ("Paniki").
       - "Unprovoked" attacks ("bigla na lang nangagat").
    2. **Moderate Risk (Category II):**
       - Nibbling of uncovered skin.
       - Minor scratches or abrasions without bleeding ("gasgas lang", "walang dugo").
    3. **Low Risk (Category I):**
       - Touching or feeding animals.
       - Licks on intact skin.

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

      "typeOfExposure": "String (Comma-separated if multiple, e.g. 'Bite, Scratch')",

      "bodyLocation": "String",
      "animalType": "Dog/Cat/etc",
      "vaccinationStatus": "vaccinated/unvaccinated/unknown",

      "riskLevel": "High Risk" | "Moderate Risk" | "Low Risk",
      "triageCategory": "Category III" | "Category II" | "Category I",
      "riskFlags": ["Array of strings explaining WHY, e.g., 'Head bite detected', 'Unprovoked behavior'"]
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
