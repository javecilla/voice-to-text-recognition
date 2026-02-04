<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

interface ChatMessage {
  id: number
  text: string
  isFinal: boolean
}

interface Props {
  conversation: ChatMessage[] // Changed from 'transcript' string to Array
  currentDraft: string
  isListening: boolean
  listeningStatus?: 'idle' | 'starting' | 'ready'
  errorMessage: string
}

interface Emits {
  start: []
  stop: []
  reset: []
}

const props = defineProps<Props>()
defineEmits<Emits>()

const textContainer = ref<HTMLDivElement | null>(null)

// Auto-scroll logic remains the same
watch(
  () => [props.conversation.length, props.currentDraft],
  async () => {
    await nextTick()
    if (textContainer.value) {
      textContainer.value.scrollTo({
        top: textContainer.value.scrollHeight,
        behavior: 'smooth',
      })
    }
  },
  { deep: true },
)
</script>

<template>
  <div
    class="relative w-full bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ease-in-out h-[80vh] flex flex-col"
  >
    <div
      v-if="!isListening && conversation.length === 0"
      class="flex-1 flex flex-col items-center justify-center space-y-6 cursor-pointer group"
      @click="$emit('start')"
    >
      <div class="relative">
        <div
          class="absolute inset-0 bg-slate-200 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 opacity-50"
        ></div>
        <button
          class="relative w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
        >
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </button>
      </div>
      <div class="text-center space-y-2 translate-y-4">
        <h2 class="text-xl font-medium text-slate-800">Start Consultation</h2>
        <p class="text-slate-500 text-sm">Conversation Mode Enabled</p>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col p-12 overflow-hidden bg-white">
      <div ref="textContainer" class="w-full flex-1 overflow-y-auto space-y-4 pr-2">
        <div
          v-for="msg in conversation"
          :key="msg.id"
          class="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div class="bg-white p-4 shadow-sm max-w-[100%]">
            <p class="text-slate-800 text-lg leading-relaxed">{{ msg.text }}</p>
          </div>
        </div>

        <div v-if="currentDraft" class="flex flex-col">
          <div class="bg-slate-200 p-4 max-w-[100%] opacity-80">
            <p class="text-slate-700 text-lg leading-relaxed">{{ currentDraft }}...</p>
          </div>
        </div>
      </div>

      <div
        class="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 bg-white -mx-6 px-6 -mb-6 pb-6 z-10"
      >
        <div class="flex items-center gap-3">
          <template v-if="isListening">
            <span class="relative flex h-3 w-3">
              <span
                class="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
              ></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span class="text-sm font-bold text-slate-600">Listening...</span>
          </template>
        </div>

        <div>
          <button
            v-if="isListening"
            @click="$emit('stop')"
            class="bg-[#122d39] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#174a52] transition-colors shadow-lg flex items-center gap-2"
          >
            Stop & Save
          </button>
          <button
            v-else
            @click="$emit('reset')"
            class="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
          >
            New Patient
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="absolute top-4 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm border border-red-100 shadow-sm"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>
