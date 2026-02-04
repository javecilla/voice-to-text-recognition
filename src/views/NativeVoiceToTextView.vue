<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import VoiceToText from '@/components/VoiceToText.vue'

// --- Interfaces ---
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
interface ChatMessage {
  id: number
  text: string
  isFinal: boolean
}

const conversation = ref<ChatMessage[]>([])
const currentDraft = ref<string>('') // This is what shows on the UI (Solid + Gray)
const isListening = ref<boolean>(false)
const listeningStatus = ref<'idle' | 'starting' | 'ready'>('idle')
const errorMessage = ref<string>('')
const isManuallyStopped = ref<boolean>(false)

// We need a hidden variable to store the "Solid" text for the current bubble
// so we don't lose it when the interim (gray) text flickers.
let accumulatedFinal = ''

let recognition: ISpeechRecognition | null = null
let silenceTimer: ReturnType<typeof setTimeout> | null = null

// --- UTILS ---
const taglishCorrections: Record<string, string> = {
  'the devil': 'Good day',
  devil: 'Good day',
  cable: 'ko po',
  unprovalk: 'unprovoked',
  provocate: 'unprovoked',
  provoke: 'unprovoked',
  intake: 'intake',
  antique: 'intake',
  vaccine: 'vaccine',
  buxom: 'vaccine',
  prophylaxis: 'prophylaxis',
  'profile access': 'prophylaxis',
}

const cleanTaglish = (text: string) => {
  let cleaned = text
  for (const [wrong, right] of Object.entries(taglishCorrections)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi')
    cleaned = cleaned.replace(regex, right)
  }
  return cleaned
}

// --- LOGIC: SOFT COMMIT ---
const pushToHistory = () => {
  // Use accumulatedFinal if available, otherwise grab whatever is in draft
  const textToSave = accumulatedFinal.trim() || currentDraft.value.trim()

  if (!textToSave) return

  const polishedText = cleanTaglish(textToSave)

  conversation.value.push({
    id: Date.now(),
    text: polishedText,
    isFinal: true,
  })

  // RESET BUFFERS
  currentDraft.value = ''
  accumulatedFinal = ''
}

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
  recognition.lang = 'fil-PH'
  // recognition.lang = 'en-PH'

  recognition.onstart = () => {
    isListening.value = true
    listeningStatus.value = 'ready'
    errorMessage.value = ''
    console.log('🎤 Microphone active')
  }

  recognition.onend = () => {
    console.log('⚠️ Browser stopped listening.')
    if (!isManuallyStopped.value) {
      console.log('🔄 Restoring connection...')
      listeningStatus.value = 'starting'
      setTimeout(() => {
        try {
          recognition?.start()
        } catch (e) {
          console.error('Restart failed:', e)
        }
      }, 500)
    } else {
      isListening.value = false
      listeningStatus.value = 'idle'
    }
  }

  recognition.onerror = (event) => {
    console.error('Speech Error:', event.error)
    if (event.error === 'not-allowed') {
      errorMessage.value = 'Microphone access denied.'
      isManuallyStopped.value = true
      isListening.value = false
    }
  }

  recognition.onresult = (event) => {
    // 1. Reset Silence Timer
    if (silenceTimer) clearTimeout(silenceTimer)

    let interimChunk = ''
    let newFinalChunk = ''

    // 2. Loop through NEW results
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i]
      if (result?.[0]?.transcript) {
        if (result.isFinal) {
          newFinalChunk += result[0].transcript + ' '
        } else {
          interimChunk += result[0].transcript
        }
      }
    }

    // 3. Update Hidden Solid Storage
    if (newFinalChunk) {
      accumulatedFinal += newFinalChunk
    }

    // 4. Update UI (Solid + Gray)
    // FIX: This uses 'interimChunk' so it is no longer unused!
    currentDraft.value = accumulatedFinal + interimChunk

    console.log(currentDraft.value)

    // 5. Silence Detection (2 Seconds)
    silenceTimer = setTimeout(() => {
      console.log('🤫 Silence detected - Creating new bubble...')
      pushToHistory()
    }, 2000)
  }
})

onBeforeUnmount(() => {
  recognition?.abort()
  if (silenceTimer) clearTimeout(silenceTimer)
})

// --- Actions ---
const startRecognition = () => {
  if (!recognition) return
  conversation.value = []
  currentDraft.value = ''
  accumulatedFinal = ''
  errorMessage.value = ''
  isManuallyStopped.value = false
  listeningStatus.value = 'starting'
  try {
    recognition.start()
  } catch (e) {
    console.error('Recognition already started:', e)
  }
}

const stopRecognition = () => {
  if (currentDraft.value) pushToHistory()
  isManuallyStopped.value = true
  recognition?.stop()
  isListening.value = false
}

const handleReset = () => {
  conversation.value = []
  currentDraft.value = ''
  accumulatedFinal = ''
  errorMessage.value = ''
  listeningStatus.value = 'idle'
}
</script>

<template>
  <VoiceToText
    :conversation="conversation"
    :current-draft="currentDraft"
    :is-listening="isListening"
    :listening-status="listeningStatus"
    :error-message="errorMessage"
    @start="startRecognition"
    @stop="stopRecognition"
    @reset="handleReset"
  />
</template>
