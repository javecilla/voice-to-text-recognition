<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import VoiceToText from '@/components/VoiceToText.vue'

// --- Types ---
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}
interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onstart: (() => void) | null
  onend: (() => void) | null
}
interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition
}
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

// --- State ---
const transcript = ref<string>('')
const interimTranscript = ref<string>('')
const isListening = ref<boolean>(false)
const listeningStatus = ref<'idle' | 'starting' | 'ready'>('idle')
const errorMessage = ref<string>('')

let recognition: ISpeechRecognition | null = null

// --- Lifecycle ---
onMounted(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    errorMessage.value = 'Browser not supported.'
    return
  }

  recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'

  recognition.onstart = () => {
    isListening.value = true
    listeningStatus.value = 'ready'
    errorMessage.value = ''
  }

  recognition.onend = () => {
    isListening.value = false
    listeningStatus.value = 'idle'
  }

  recognition.onerror = (event) => {
    console.error(event.error)
    if (event.error === 'not-allowed') {
      errorMessage.value = 'Microphone access denied.'
      isListening.value = false
    }
  }

  recognition.onresult = (event) => {
    let finalTranscript = ''
    let interim = ''

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i]
      if (result?.[0]?.transcript) {
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }
    }

    // Display interim text in real-time
    if (interim) {
      interimTranscript.value = interim
    }

    // Add final transcript to permanent transcript
    if (finalTranscript) {
      transcript.value += finalTranscript
      interimTranscript.value = ''
    }
  }
})

onBeforeUnmount(() => {
  recognition?.abort()
})

// --- Actions ---
const startRecognition = () => {
  if (!recognition) return
  transcript.value = ''
  interimTranscript.value = ''
  listeningStatus.value = 'starting'
  try {
    recognition.start()
  } catch (e) {
    console.error('Recognition already started:', e)
  }
}

const stopRecognition = () => {
  recognition?.stop()
  isListening.value = false
}

const handleReset = () => {
  transcript.value = ''
  interimTranscript.value = ''
  errorMessage.value = ''
  listeningStatus.value = 'idle'
}
</script>

<template>
  <VoiceToText
    :transcript="transcript + interimTranscript"
    :interim-transcript="interimTranscript"
    :is-listening="isListening"
    :listening-status="listeningStatus"
    :error-message="errorMessage"
    @start="startRecognition"
    @stop="stopRecognition"
    @reset="handleReset"
    @update:transcript="transcript = $event"
  />
</template>
