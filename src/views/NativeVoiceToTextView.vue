<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import VoiceToText from '@/components/VoiceToText.vue'
import IntakeForm from '@/components/IntakeForm.vue'
import { extractIntakeData } from '@/services/aiExtractor'

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
const isProcessingAI = ref(false)
const intakeFormRef = ref<InstanceType<typeof IntakeForm> | null>(null) // Reference to the child component

// We need a hidden variable to store the "Solid" text for the current bubble
// so we don't lose it when the interim (gray) text flickers.
let accumulatedFinal = ''

let recognition: ISpeechRecognition | null = null
let silenceTimer: ReturnType<typeof setTimeout> | null = null

const TEST_TRANSCRIPT = `
Magandang araw po  Welcome sa ating clinic. Para ma-fill out natin ang inyong medical record sa system, kailangan ko lang po makuha ang inyong details. Simulan natin sa inyong buong pangalan please Hello po, Nurse. Ako po si John Miguel Cruz Doe Junior Salamat po, Mr. Doe. Para lang po sa validation, ano po ang birthdate ninyo at sex Ipinanganak ako noong May 15, 1995. And Male po ako, Nurse Copy po. Saan po ang current address ninyo ngayon Nakatira po ako sa 123 Rizal Street, Barangay Poblacion, Pandi, Bulacan. Ang zip code po namin doon ay 3014 Noted. Paki-state na rin po ang inyong mobile number at active email address para sa SMS reminders at medical records Ang number ko po is 09771234567, tapos ang email ko is john.doe@example.net Salamat po. Sino naman po ang ating emergency contact person at ano pong relationship niyo sa kanila Ang asawa ko po, si Clara Maria Santos Doe. Ang mobile number niya po ay 09559876543 Clear po. Ngayon, pag-usapan natin ang inyong medical history. Mayroon po ba kayong kahit anong allergies sa gamot or pagkain Opo, may allergy po ako sa Penicillin Naka-record na po. Nakatanggap na rin po ba kayo ng anti-rabies vaccine dati Yes po, pero matagal na 'yun. Parang noong March 2022 pa yata Alright. Tungkol naman sa incident, kailan po ito nangyari at saang part ng katawan kayo tinamaan Kagabi lang po nangyari, dito po sa aking kaliwang binti Anong klaseng hayop po ba ito at paano po ang naging exposure niyo Kinagat po ba kayo o kinalmot Aso po ang naka-encounter ko. Bale kinagat po ako habang naglalakad ako pauwi sa kanto I see. Alam niyo po ba kung vaccinated ang aso May owner po ba ito na pwedeng mapagtanungan Unknown po talaga ang vaccination status niya kasi mukhang stray dog lang siya na pagala-gala. Wala pong lumabas na may-ari nung nangyari ang attack Naku, delikado po 'yun. Sige po, Mr. Doe. Dahil today ang day 0 niyo, i-process na natin ang inyong vaccination schedule at treatment. Standby lang po kayo sandali habang inaayos ko ang inyong records.
`

const runDevTest = async () => {
  if (isProcessingAI.value) return

  console.log('⚡ STARTING DEV TEST...')
  isProcessingAI.value = true

  try {
    // We send the hardcoded transcript directly to your service
    const extractedData = await extractIntakeData(TEST_TRANSCRIPT)

    if (extractedData && intakeFormRef.value) {
      console.log('Gemini Test Success:', extractedData)
      intakeFormRef.value.populateForm(extractedData)
    } else {
      console.warn('AI returned null data')
    }
  } catch (err) {
    console.error('Test Failed:', err)
  } finally {
    isProcessingAI.value = false
  }
}

// --- UTILS ---
const taglishCorrections: Record<string, string> = {
  // Common greetings/fillers
  'the devil': 'Good day',
  devil: 'Good day',
  cable: 'ko po',
  helloponers: 'Hello po nurse',

  // Medical terms phonetic fixes
  boxing: 'vaccine',
  buxom: 'vaccine',
  antirabies: 'anti-rabies',
  histerino: 'history niyo',
  'medical histerino': 'medical history niyo',
  insident: 'incident',
  'vaccinations status': 'vaccination status',

  // Animal/Incident specific
  unprovalk: 'unprovoked',
  provocate: 'unprovoked',
  strikat: 'stray cat',
  striker: 'stray cat',
  nakakamot: 'nakakalmot',

  // Layout/Process terms
  'ma-feel-out': 'ma-fill out',
  'ma Phil out': 'ma-fill out',
  inaalalayas: 'ina-analyze',

  // Others
  consales: 'Gonzales', // Specific fix for common mishearing of names if needed
  'same.': 'sam.',
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
    // 1. Ignore 'no-speech' errors.
    // This happens when you pause for a few seconds. It's not a real error.
    if (event.error === 'no-speech') {
      console.log('💤 No speech detected. Restarting...')
      return
    }

    // 2. Log real errors
    console.error('Speech Error:', event.error)

    // 3. Handle Permission Denied
    if (event.error === 'not-allowed') {
      errorMessage.value = 'Microphone access denied. Please allow permissions.'
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

const stopRecognition = async () => {
  // 1. Force save any pending draft text to the conversation array
  if (currentDraft.value) pushToHistory()

  isManuallyStopped.value = true
  recognition?.stop()
  isListening.value = false

  // 2. TRIGGER AI PROCESSING
  await processConversationWithAI()
}

const processConversationWithAI = async () => {
  if (conversation.value.length === 0) return

  isProcessingAI.value = true

  // Combine all chat bubbles
  const fullTranscript = conversation.value.map((msg) => msg.text).join('\n')

  console.log('Sending to Gemini...', fullTranscript)

  try {
    const extractedData = await extractIntakeData(fullTranscript)

    if (extractedData) {
      console.log('Gemini Extracted Data:', extractedData)

      if (intakeFormRef.value) {
        intakeFormRef.value.populateForm(extractedData)
      }
    } else {
      console.warn('AI returned null data')
    }
  } catch (err) {
    console.error('Error in processing flow:', err)
  } finally {
    isProcessingAI.value = false
  }
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
  <div
    class="min-h-screen w-full relative overflow-hidden bg-slate-900 flex flex-col items-center justify-center p-6"
  >
    <button
      @click="runDevTest"
      class="fixed bottom-4 right-4 z-50 bg-[#122d39] hover:bg-[#0a1c25] text-white px-4 py-2 rounded-lg shadow-lg font-bold text-xs flex items-center gap-2 border border-white/20 transition-opacity opacity-80 hover:opacity-100"
    >
      <span>DEV: TEST AI</span>
    </button>

    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#fb923c_0%,transparent_40%)] opacity-80"
    ></div>
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#2dd4bf_0%,transparent_40%)] opacity-80"
    ></div>
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_center,#818cf8_0%,transparent_50%)] opacity-60"
    ></div>
    <div class="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"></div>

    <div class="relative z-10 w-full max-w-3xl flex flex-col items-center justify-center gap-8">
      <div class="w-full">
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
      </div>

      <div class="w-full">
        <IntakeForm ref="intakeFormRef" :is-processing="isProcessingAI" />
      </div>
    </div>
  </div>
</template>
