<script setup lang="ts">
interface Props {
  transcript: string
  interimTranscript?: string
  isListening: boolean
  listeningStatus?: 'idle' | 'starting' | 'ready'
  errorMessage: string
}

interface Emits {
  start: []
  stop: []
  reset: []
  'update:transcript': [value: string]
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <div
    class="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-slate-900"
  >
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#fb923c_0%,transparent_40%)] opacity-80"
    ></div>
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#2dd4bf_0%,transparent_40%)] opacity-80"
    ></div>
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_center,#818cf8_0%,transparent_50%)] opacity-60"
    ></div>
    <div
      class="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
      style="background-image: url('https://grainy-gradients.vercel.app/noise.svg')"
    ></div>

    <div
      class="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ease-in-out h-150 flex flex-col"
    >
      <div
        v-if="!isListening && transcript.length === 0"
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
          <h2 class="text-xl font-medium text-slate-800">Click to start transcribing</h2>
          <p class="text-slate-500 text-sm">Experience the power of Voice-to-Text</p>
        </div>
      </div>

      <div v-else class="flex-1 flex flex-col p-8 md:p-12">
        <div
          class="w-full flex-1 text-2xl leading-relaxed text-slate-800 placeholder-slate-300 bg-transparent overflow-y-auto"
        >
          <span>{{ transcript }}</span>
          <span v-if="interimTranscript" class="italic text-slate-400">{{
            interimTranscript
          }}</span>
        </div>

        <div class="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
          <div class="flex items-center gap-3">
            <template v-if="isListening && listeningStatus === 'starting'">
              <span class="relative flex h-3 w-3">
                <span
                  class="animate-pulse absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"
                ></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
              <span class="text-sm font-medium text-slate-600">Setting up audio...</span>
            </template>
            <template v-else-if="isListening && listeningStatus === 'ready'">
              <span class="relative flex h-3 w-3">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                ></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span class="text-sm font-medium text-slate-600">Transcribing...</span>
            </template>
            <template v-else>
              <span class="text-sm text-slate-400">{{ transcript.length }} chars</span>
            </template>
          </div>

          <div>
            <button
              v-if="isListening"
              @click="$emit('stop')"
              class="bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg flex items-center gap-2"
            >
              Finish
            </button>

            <button
              v-else
              @click="$emit('reset')"
              class="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              New transcription
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
  </div>
</template>

<style scoped>
/* Optional: Only if you want specific scrollbar hiding */
textarea::-webkit-scrollbar {
  display: none;
}
textarea {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
