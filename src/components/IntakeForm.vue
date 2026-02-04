<script setup lang="ts">
import { ref } from 'vue'

// Define the shape of our form data
interface IntakeData {
  firstName: string
  lastName: string
  middleName: string
  animalType: string
  vaccinationStatus: 'vaccinated' | 'unvaccinated' | 'unknown' | ''
}

// Reactive state for the form
const formData = ref<IntakeData>({
  firstName: '',
  lastName: '',
  middleName: '',
  animalType: '',
  vaccinationStatus: '',
})

const isSubmitting = ref(false)

// Emits for parent component handling
const emit = defineEmits<{
  (e: 'submit', data: IntakeData): void
  (e: 'clear'): void
}>()

const handleSubmit = async () => {
  isSubmitting.value = true
  // Simulate a small delay for UX feel or validation
  setTimeout(() => {
    emit('submit', formData.value)
    isSubmitting.value = false
  }, 500)
}

// NEW: Expose a function to populate data from the outside
const populateForm = (data: Partial<IntakeData>) => {
  if (data.firstName) formData.value.firstName = data.firstName
  if (data.lastName) formData.value.lastName = data.lastName
  if (data.middleName) formData.value.middleName = data.middleName

  // Normalize Animal Type (Capitalize first letter)
  if (data.animalType) {
    formData.value.animalType = data.animalType.charAt(0).toUpperCase() + data.animalType.slice(1)
  }

  // Normalize Status (ensure it matches the radio values)
  if (data.vaccinationStatus) {
    const status = data.vaccinationStatus.toLowerCase()
    if (['vaccinated', 'unvaccinated', 'unknown'].includes(status)) {
      formData.value.vaccinationStatus = status as never
    }
  }
}

defineExpose({ populateForm })
</script>

<template>
  <div
    class="relative w-full bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ease-in-out flex flex-col"
  >
    <div class="p-8 pb-4 border-b border-slate-100">
      <h2 class="text-2xl font-bold text-slate-800">New Patient Intake</h2>
      <p class="text-slate-500 text-sm mt-1">Please fill in the incident details below.</p>
    </div>

    <div class="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
      <div class="space-y-4">
        <label class="block text-sm font-bold text-slate-700 uppercase tracking-wide"
          >Patient Name</label
        >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <input
              v-model="formData.firstName"
              type="text"
              placeholder="First Name"
              class="w-full px-4 py-3 rounded-xl bg-slate-30 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
          <div class="space-y-1">
            <input
              v-model="formData.lastName"
              type="text"
              placeholder="Last Name"
              class="w-full px-4 py-3 rounded-xl bg-slate-30 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
          <div class="space-y-1 md:col-span-2">
            <input
              v-model="formData.middleName"
              type="text"
              placeholder="Middle Name (Optional)"
              class="w-full px-4 py-3 rounded-xl bg-slate-30 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
        </div>
      </div>

      <div class="h-px bg-slate-50 w-full !mt-7"></div>

      <div class="space-y-4 !mt-5">
        <label class="block text-sm font-bold text-slate-700 uppercase tracking-wide"
          >Incident Details</label
        >

        <div class="grid grid-cols-1 gap-6">
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-600">Animal Involved</label>

            <input
              v-model="formData.animalType"
              list="animal-options"
              type="text"
              placeholder="Type or select animal..."
              class="w-full px-4 py-3 rounded-xl bg-slate-30 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#122d39] focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
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

    <div class="p-6 border-t border-slate-100 bg-slate-20 flex items-center justify-end gap-3">
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
select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}
</style>
