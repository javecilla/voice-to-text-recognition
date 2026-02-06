<script setup lang="ts">
import { ref, watch } from 'vue'

// --- HELPER: Get Today's Date in YYYY-MM-DD format ---
const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0') // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface IntakeData {
  // Patient Personal Info
  firstName: string
  lastName: string
  middleName: string
  extensionName: string
  dateOfBirth: string
  sex: string

  // Address
  addressHouse: string
  addressBarangay: string
  addressCity: string
  addressProvince: string
  addressZip: string

  // Contact Info
  mobileNumber: string
  email: string

  // Emergency Contact
  emergencyFirstName: string
  emergencyLastName: string
  emergencyMiddleName: string
  emergencyExtensionName: string
  emergencyRelationship: string
  emergencyMobile: string

  // Medical History
  hasAllergies: string
  allergyDetails: string
  historyOfRabiesVaccine: string
  lastVaccineDate: string

  // Incident Details
  dateOfIncident: string
  typeOfExposure: string
  bodyLocation: string
  animalType: string
  vaccinationStatus: 'vaccinated' | 'unvaccinated' | 'unknown' | ''
}

const props = defineProps<{
  isProcessing?: boolean
}>()

const formData = ref<IntakeData>({
  firstName: '',
  lastName: '',
  middleName: '',
  extensionName: '',
  dateOfBirth: '',
  sex: '',
  addressHouse: '',
  addressBarangay: '',
  addressCity: '',
  addressProvince: '',
  addressZip: '',
  mobileNumber: '',
  email: '',
  emergencyFirstName: '',
  emergencyLastName: '',
  emergencyMiddleName: '',
  emergencyExtensionName: '',
  emergencyRelationship: '',
  emergencyMobile: '',
  // Medical History Init
  hasAllergies: '',
  allergyDetails: '',
  historyOfRabiesVaccine: '',
  lastVaccineDate: '',
  // Incident Init
  dateOfIncident: getTodayDate(),
  typeOfExposure: '',
  bodyLocation: '',
  animalType: '',
  vaccinationStatus: '',
})

// Temporary array to handle multiple checkboxes
const selectedExposures = ref<string[]>([])

// Logic: Watch the array and update the string field automatically
watch(selectedExposures, (newVal) => {
  formData.value.typeOfExposure = newVal.join(', ')
})

const isSubmitting = ref(false)

const emit = defineEmits<{
  (e: 'submit', data: IntakeData): void
  (e: 'clear'): void
}>()

const handleSubmit = async () => {
  isSubmitting.value = true
  setTimeout(() => {
    emit('submit', formData.value)
    isSubmitting.value = false
  }, 500)
}

const populateForm = (data: Partial<IntakeData>) => {
  // 1. Merge simple string fields
  Object.assign(formData.value, data)

  // 2. Normalize Animal Type (Capitalize)
  if (data.animalType) {
    formData.value.animalType = data.animalType.charAt(0).toUpperCase() + data.animalType.slice(1)
  }

  // 3. Handle Checkboxes (Type of Exposure)
  // The AI returns a string "Bite, Scratch", but the checkboxes are bound to an Array.
  // We need to sync them manually here.
  if (data.typeOfExposure) {
    // Split by comma, trim whitespace, and filter out empty strings
    const exposures = data.typeOfExposure
      .split(',')
      .map((item) => item.trim())
      .filter((i) => i)

    // Update the array bound to v-model
    selectedExposures.value = exposures

    // Update the hidden string field (redundant because of watcher, but safe)
    formData.value.typeOfExposure = data.typeOfExposure
  }

  // 4. Handle Boolean/Radio fields normalization if needed
  // (The AI Prompt is instructed to return "Yes"/"No", which matches our v-model, so this is usually fine)
}

defineExpose({ populateForm })
</script>

<template>
  <div
    class="relative w-full bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ease-in-out flex flex-col"
  >
    <div
      v-if="props.isProcessing"
      class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/10 backdrop-blur-[2px] transition-all duration-500"
    >
      <div class="relative w-32 h-32 animate-float">
        <div class="absolute inset-0 rounded-full bg-blue-400/20 blur-2xl"></div>

        <div
          class="absolute inset-0 rounded-full bg-gradient-to-br from-purple-200/40 via-blue-200/30 to-emerald-200/40 backdrop-blur-md border border-white/40 shadow-inner"
        ></div>

        <div
          class="absolute inset-0 rounded-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.6)_50%,transparent_75%)] bg-[length:200%_200%] animate-shimmer opacity-70"
        ></div>

        <div
          class="absolute top-2 left-4 w-12 h-6 bg-white/60 rounded-full blur-[2px] transform -rotate-12"
        ></div>
      </div>

      <div
        class="mt-8 px-6 py-2 bg-white/90 backdrop-blur-xl rounded-full shadow-xl border border-white/50 animate-pulse-slow"
      >
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-[#122d39] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
          <span
            class="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#122d39] to-[#0a1c25] animate-gradient-x"
          >
            AI Extracting Data...
          </span>
        </div>
      </div>
    </div>

    <div class="p-8 pb-4 border-b border-slate-100">
      <h2 class="text-2xl font-bold text-slate-800">New Patient Intake</h2>
      <p class="text-slate-500 text-sm mt-1">Please fill in the incident details below.</p>
    </div>

    <div class="p-8 space-y-8 overflow-y-auto">
      <div class="space-y-4">
        <label class="block text-sm font-black text-slate-900 uppercase tracking-wide">
          Patient Personal Information
        </label>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-sm font-medium text-slate-600">Patient Full Name</label>
            <small class="block font-light text-slate-600">Enter first name (e.g., John)</small>
            <input
              v-model="formData.firstName"
              type="text"
              placeholder="First Name"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
          <div class="space-y-1">
            <label class="hidden md:block text-sm font-medium text-slate-600">&nbsp;</label>
            <small class="block font-light text-slate-600">Enter last name (e.g., Doe)</small>
            <input
              v-model="formData.lastName"
              type="text"
              placeholder="Last Name"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
          <div class="space-y-1">
            <small class="block font-light text-slate-600">Enter middle name (e.g., Cruz)</small>
            <input
              v-model="formData.middleName"
              type="text"
              placeholder="Middle Name (Optional)"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
          <div class="space-y-1">
            <small class="block font-light text-slate-600"
              >Enter extension name (e.g., Jr. III)</small
            >
            <input
              v-model="formData.extensionName"
              type="text"
              placeholder="Extension Name (Optional)"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div class="space-y-1">
            <label class="block text-sm font-medium text-slate-600">Date of Birth</label>
            <small class="block font-light text-slate-600">Select or type birth date</small>
            <input
              v-model="formData.dateOfBirth"
              type="date"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-medium text-slate-600">Sex</label>
            <small class="block font-light text-slate-600">Select patient sex</small>
            <select
              v-model="formData.sex"
              class="appearance-none w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            >
              <option value="" disabled selected>--SELECT--</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        <div class="space-y-3 pt-2">
          <label class="text-sm font-medium text-slate-600">Complete Address</label>

          <div class="space-y-1">
            <small class="block font-light text-slate-600"
              >Enter house no. and street name (e.g., 123 Naga St.)</small
            >
            <input
              v-model="formData.addressHouse"
              type="text"
              placeholder="House No. & Street"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="space-y-1">
              <small class="block font-light text-slate-600"
                >Enter city or municipality (e.g., Brgy. Mapulang Lupa)</small
              >
              <input
                v-model="formData.addressBarangay"
                type="text"
                placeholder="Barangay"
                class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>
            <div class="space-y-1">
              <small class="block font-light text-slate-600"
                >Enter city or municipality (e.g., Pandi)</small
              >
              <input
                v-model="formData.addressCity"
                type="text"
                placeholder="City / Municipality"
                class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="space-y-1">
              <small class="block font-light text-slate-600">Enter province (e.g., Bulacan)</small>
              <input
                v-model="formData.addressProvince"
                type="text"
                placeholder="Province"
                class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>
            <div class="space-y-1">
              <small class="block font-light text-slate-600">Enter zip code (e.g., 3014)</small>
              <input
                v-model="formData.addressZip"
                type="text"
                placeholder="Zip Code (Optional)"
                class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div class="space-y-1">
            <label class="block text-sm font-medium text-slate-600">Mobile Number</label>
            <small class="block font-light text-slate-600">
              Used for sending critical SMS reminders. Please ensure it is correct and active.
              (e.g., 0977*****42)
            </small>
            <input
              v-model="formData.mobileNumber"
              type="text"
              placeholder="Mobile Number"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-medium text-slate-600">Email Address</label>
            <small class="block font-light text-slate-600">
              Digital copies of receipts and medical records will be sent here and serve as your
              username in portal. (e.g., john.doe@example.net)
            </small>
            <input
              v-model="formData.email"
              type="text"
              placeholder="Email Address"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
        </div>
      </div>

      <div class="h-px bg-slate-100 w-full"></div>

      <div class="space-y-4">
        <label class="block text-sm font-black text-slate-900 uppercase tracking-wide">
          CONTACT EMERGENCY PERSON
        </label>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-sm font-medium text-slate-600">Contact Person Full Name</label>
            <small class="block font-light text-slate-600">Enter first name (e.g., Clara)</small>
            <input
              v-model="formData.emergencyFirstName"
              type="text"
              placeholder="First Name"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
          <div class="space-y-1">
            <label class="hidden md:block text-sm font-medium text-slate-600">&nbsp;</label>
            <small class="block font-light text-slate-600">Enter last name (e.g., Doe)</small>
            <input
              v-model="formData.emergencyLastName"
              type="text"
              placeholder="Last Name"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
          <div class="space-y-1">
            <small class="block font-light text-slate-600">Enter middle name (e.g., Cruz)</small>
            <input
              v-model="formData.emergencyMiddleName"
              type="text"
              placeholder="Middle Name (Optional)"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
          <div class="space-y-1">
            <small class="block font-light text-slate-600">Enter extension name (e.g., II)</small>
            <input
              v-model="formData.emergencyExtensionName"
              type="text"
              placeholder="Extension Name (Optional)"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div class="space-y-1">
            <label class="block text-sm font-medium text-slate-600"
              >Contact Person Relationship to Patient</label
            >
            <small class="block font-light text-slate-600"
              >What is their relationship to the patient?</small
            >
            <input
              v-model="formData.emergencyRelationship"
              list="relationship-status-options"
              type="text"
              placeholder="Type or select relationship status..."
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
            <datalist id="relationship-status-options">
              <option value="Spouse"></option>
              <option value="Mother"></option>
              <option value="Father"></option>
              <option value="Sibling"></option>
              <option value="Guardian"></option>
            </datalist>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-medium text-slate-600"
              >Contact Person Mobile Number</label
            >
            <small class="block font-light text-slate-600"
              >Enter mobile number of emergency contact person. (e.g., 0955*****19)</small
            >
            <input
              v-model="formData.emergencyMobile"
              type="text"
              placeholder="Mobile Number"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
        </div>
      </div>

      <div class="h-px bg-slate-100 w-full"></div>

      <div class="space-y-4">
        <label class="block text-sm font-black text-slate-900 uppercase tracking-wide">
          Medical History
        </label>
        <small class="block font-light text-slate-600"
          >(To be filled out by healthcare provider during assessment and treatment)</small
        >

        <div class="grid grid-cols-1 gap-6">
          <div class="space-y-2">
            <div>
              <label class="block text-sm font-medium text-slate-600"
                >Do you have any known allergies?</label
              >
              <small class="block font-light text-slate-600"
                >This is important for your safety.</small
              >

              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="Yes"
                    v-model="formData.hasAllergies"
                    class="w-4 h-4 text-[#122d39] bg-slate-50 border-slate-200 focus:ring-[#122d39] focus:ring-2 transition-all"
                  />
                  <span class="text-sm text-slate-700">Yes</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="No"
                    v-model="formData.hasAllergies"
                    class="w-4 h-4 text-[#122d39] bg-slate-50 border-slate-200 focus:ring-[#122d39] focus:ring-2 transition-all"
                  />
                  <span class="text-sm text-slate-700">No</span>
                </label>
              </div>

              <div
                v-if="formData.hasAllergies === 'Yes'"
                class="animate-in fade-in slide-in-from-top-1 duration-300"
              >
                <label class="block text-sm font-medium text-slate-600"
                  >Please specify your allergies:</label
                >
                <small class="block font-light text-slate-600"
                  >List all known allergies (e.g., Penicillin, Egg Protein)</small
                >
                <input
                  v-model="formData.allergyDetails"
                  type="text"
                  placeholder="Allergy Details"
                  class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800 mt-1"
                />
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <div>
              <label class="block text-sm font-medium text-slate-600"
                >Have you received an anti-rabies vaccine before?</label
              >
              <small class="block font-light text-slate-600"
                >This will help determine if a booster shot is needed.</small
              >

              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="Yes"
                    v-model="formData.historyOfRabiesVaccine"
                    class="w-4 h-4 text-[#122d39] bg-slate-50 border-slate-200 focus:ring-[#122d39] focus:ring-2 transition-all"
                  />
                  <span class="text-sm text-slate-700">Yes</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="No"
                    v-model="formData.historyOfRabiesVaccine"
                    class="w-4 h-4 text-[#122d39] bg-slate-50 border-slate-200 focus:ring-[#122d39] focus:ring-2 transition-all"
                  />
                  <span class="text-sm text-slate-700">No</span>
                </label>
              </div>

              <div
                v-if="formData.historyOfRabiesVaccine === 'Yes'"
                class="animate-in fade-in slide-in-from-top-1 duration-300"
              >
                <label class="block text-sm font-medium text-slate-600"
                  >If yes, when was your last anti-rabies vaccine received?</label
                >
                <small class="block font-light text-slate-600">e.g., 2 years ago, March 2025</small>
                <input
                  v-model="formData.lastVaccineDate"
                  type="text"
                  placeholder="Last Anti-Rabies Vaccine Date"
                  class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800 mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="h-px bg-slate-100 w-full"></div>

      <div class="space-y-4">
        <label class="block text-sm font-black text-slate-900 uppercase tracking-wide">
          Incident Details
        </label>

        <div class="grid grid-cols-1 gap-6">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-slate-600">Date of Incident</label>
            <small class="block font-light text-slate-600">
              CRITICAL: This date will be used as 'Day 0' for the vaccination schedule
              (automatically set to today's date, but can be adjusted if the incident occurred on a
              previous date)
            </small>
            <input
              v-model="formData.dateOfIncident"
              type="date"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-slate-600">Type of Exposure</label>
            <small class="block font-light text-slate-600">Please check all that apply </small>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  value="Bite"
                  v-model="selectedExposures"
                  class="w-4 h-4 text-[#122d39] bg-slate-50 border-slate-200 rounded focus:ring-[#122d39] focus:ring-2 focus:ring-offset-0 transition-all"
                />
                <span class="text-sm text-slate-700">Bite</span>
              </label>
              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  value="Scratch"
                  v-model="selectedExposures"
                  class="w-4 h-4 text-[#122d39] bg-slate-50 border-slate-200 rounded focus:ring-[#122d39] focus:ring-2 focus:ring-offset-0 transition-all"
                />
                <span class="text-sm text-slate-700">Scratch</span>
              </label>
              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  value="Contamination of mucous membrane"
                  v-model="selectedExposures"
                  class="w-4 h-4 text-[#122d39] bg-slate-50 border-slate-200 rounded focus:ring-[#122d39] focus:ring-2 focus:ring-offset-0 transition-all"
                />
                <span class="text-sm text-slate-700">Contamination of mucous membrane</span>
              </label>
              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  value="Lick on open wound"
                  v-model="selectedExposures"
                  class="w-4 h-4 text-[#122d39] bg-slate-50 border-slate-200 rounded focus:ring-[#122d39] focus:ring-2 focus:ring-offset-0 transition-all"
                />
                <span class="text-sm text-slate-700">Lick on open wound</span>
              </label>
              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  value="Abrasions WITHOUT bleeding"
                  v-model="selectedExposures"
                  class="w-4 h-4 text-[#122d39] bg-slate-50 border-slate-200 rounded focus:ring-[#122d39] focus:ring-2 focus:ring-offset-0 transition-all"
                />
                <span class="text-sm text-slate-700">Abrasions WITHOUT bleeding</span>
              </label>
              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  value="Nibble on uncovered skin"
                  v-model="selectedExposures"
                  class="w-4 h-4 text-[#122d39] bg-slate-50 border-slate-200 rounded focus:ring-[#122d39] focus:ring-2 focus:ring-offset-0 transition-all"
                />
                <span class="text-sm text-slate-700">Nibble on uncovered skin</span>
              </label>
            </div>
            <input type="hidden" v-model="formData.typeOfExposure" />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-slate-600"
              >Location of Incident on Body</label
            >
            <small class="block font-light text-slate-600">
              List all body parts where the patient was bitten or scratched (e.g., Left Hand, Right
              Leg)
            </small>
            <input
              v-model="formData.bodyLocation"
              type="text"
              placeholder="Location of Incident"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-600">Animal Involved</label>
            <input
              v-model="formData.animalType"
              list="animal-options"
              type="text"
              placeholder="Type or select animal..."
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
            <datalist id="animal-options">
              <option value="Dog"></option>
              <option value="Cat"></option>
              <option value="Bat"></option>
              <option value="Rat"></option>
              <option value="Snake"></option>
              <option value="Monkey"></option>
            </datalist>
          </div>

          <div class="space-y-3">
            <label class="text-sm font-medium text-slate-600">Animal Vaccination Status</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                class="relative flex items-center justify-center px-4 py-3 rounded-xl border cursor-pointer transition-all hover:bg-slate-50"
                :class="
                  formData.vaccinationStatus === 'vaccinated'
                    ? 'border-[#122d39] bg-slate-50 ring-1 ring-[#122d39]'
                    : 'border-slate-200'
                "
              >
                <input
                  type="radio"
                  v-model="formData.vaccinationStatus"
                  value="vaccinated"
                  class="absolute opacity-0 w-full h-full cursor-pointer"
                />
                <span
                  class="text-sm font-medium"
                  :class="
                    formData.vaccinationStatus === 'vaccinated'
                      ? 'text-[#122d39]'
                      : 'text-slate-600'
                  "
                  >Vaccinated</span
                >
              </label>

              <label
                class="relative flex items-center justify-center px-4 py-3 rounded-xl border cursor-pointer transition-all hover:bg-slate-50"
                :class="
                  formData.vaccinationStatus === 'unvaccinated'
                    ? 'border-[#122d39] bg-slate-50 ring-1 ring-[#122d39]'
                    : 'border-slate-200'
                "
              >
                <input
                  type="radio"
                  v-model="formData.vaccinationStatus"
                  value="unvaccinated"
                  class="absolute opacity-0 w-full h-full cursor-pointer"
                />
                <span
                  class="text-sm font-medium"
                  :class="
                    formData.vaccinationStatus === 'unvaccinated'
                      ? 'text-[#122d39]'
                      : 'text-slate-600'
                  "
                  >Unvaccinated</span
                >
              </label>

              <label
                class="relative flex items-center justify-center px-4 py-3 rounded-xl border cursor-pointer transition-all hover:bg-slate-50"
                :class="
                  formData.vaccinationStatus === 'unknown'
                    ? 'border-[#122d39] bg-slate-50 ring-1 ring-[#122d39]'
                    : 'border-slate-200'
                "
              >
                <input
                  type="radio"
                  v-model="formData.vaccinationStatus"
                  value="unknown"
                  class="absolute opacity-0 w-full h-full cursor-pointer"
                />
                <span
                  class="text-sm font-medium"
                  :class="
                    formData.vaccinationStatus === 'unknown' ? 'text-[#122d39]' : 'text-slate-600'
                  "
                  >Unknown</span
                >
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
      <button
        @click="emit('clear')"
        class="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-slate-100 transition-colors shadow-sm"
      >
        Clear
      </button>
      <button
        @click="handleSubmit"
        :disabled="isSubmitting"
        class="bg-[#122d39] text-white px-8 py-2.5 rounded-full text-sm font-medium hover:bg-[#174a52] transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <span
          v-if="isSubmitting"
          class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
        ></span>
        {{ isSubmitting ? 'Saving...' : 'Submit Record' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Floating Animation */
@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}
.animate-float {
  animation: float 4s ease-in-out infinite;
}

/* Shimmer Animation for the liquid band */
@keyframes shimmer {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
.animate-shimmer {
  animation: shimmer 3s infinite linear;
}

/* Slower pulse */
.animate-pulse-slow {
  animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}
</style>
