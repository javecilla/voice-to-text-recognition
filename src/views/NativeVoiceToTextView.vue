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

// --- 🧪 DEV TESTING SCENARIOS ---
const TEST_SCENARIOS = [
  // 1. HIGH RISK (Deep Bite, Stray Dog, Leg)
  `Magandang araw po Welcome sa ating clinic. Para ma-fill out natin ang inyong medical record sa system kailangan ko lang makuha ang inyong details. Simulan natin sa inyong buong pangalan please Hello po Nurse ako po si John Miguel Cruz Doe Junior. Salamat po. Para lang po sa validation ano po ang birthdate ninyo at sex Ipinanganak ako noong May fifteen nineteen ninety-five and Male po ako Nurse. Copy po. Saan po ang current address ninyo ngayon Nakatira po ako sa one two three Rizal Street Barangay Poblacion Pandi Bulacan. Ang zip code po namin doon ay three zero one four. Noted. Paki-state na rin po ang inyong mobile number at active email address Ang number ko po is zero nine seven seven one two three four five six seven tapos ang email ko is john dot doe at example dot net. Salamat po. Sino naman po ang ating emergency contact person at ano pong relationship niyo sa kanila Ang asawa ko po si Clara Maria Santos Doe. Ang mobile number niya po ay zero nine five five nine eight seven six five four three. Clear po. Ngayon pag-usapan natin ang inyong medical history. Mayroon po ba kayong kahit anong allergies sa gamot or pagkain Opo may allergy po ako sa Penicillin. Naka-record na po. Nakatanggap na rin po ba kayo ng anti-rabies vaccine dati Yes po pero matagal na iyon parang noong March twenty twenty-two pa yata. Alright. Tungkol naman sa incident kailan po ito nangyari at saang part ng katawan kayo tinamaan Kagabi lang po nangyari dito po sa aking kaliwang binti. Anong klaseng hayop po ba ito at paano po ang naging exposure niyo Kinagat po ako bigla at may kalmot na kasama habang naglalakad pauwi sa kanto. Unprovoked attack po talaga at malalim yung sugat. Unknown po talaga ang vaccination status nung aso kasi mukhang stray dog lang siya. Naku delikado po iyon. Sige po Mr. Doe dahil today ang day zero niyo i-process na natin ang inyong vaccination schedule at treatment. Standby lang po kayo sandali habang inaayos ko ang inyong records.`,

  // 2. MODERATE RISK (Minor Scratch, Pet Cat, Vaccinated)
  `Magandang araw po welcome sa clinic maaari ko bang makuha ang inyong buong pangalan para sa intake form natin hello po nurse ako po si Maria Clara Santos Reyes. Salamat Maria. Ano po ang inyong birth date at sex ipinanganak ako noong June twelve nineteen ninety-eight. Female po ako. Ano po ang inyong current address at zip code nakatira po ako sa four five Sampaguita Street Barangay San Jose Malolos Bulacan. Ang zip code namin ay three zero zero zero. Salamat. Ano ang cellphone number at email address niyo ang number ko po ay zero nine one seven eight eight eight nine nine nine nine. Ang email ko ay maria dot clara at test dot com. Sino ang emergency contact person niyo ang nanay ko po si Teodora Reyes. Ang mobile number niya ay zero nine two two three three three four four four four. May allergies ba kayo or previous anti-rabies vaccines wala naman po akong kahit anong allergy. Nakakuha na ako ng vaccine last year lang June twenty twenty-four. Saan po kayo tinamaan at kailan ito nangyari kanina lang pong umaga nakalmot ako ng pusa ko sa kanang braso o right arm habang naglalaro kami. May dugo ba ang kalmot at vaccinated ba ang pusa gasgas lang naman po no bleeding po talaga. "No blood" po. Fully vaccinated naman po ang pusa ko at indoor cat lang siya. Sige po Moderate Risk ito since walang dugo pero kailangan pa rin nating i-check standby lang po.`,

  // 3. HIGH URGENCY (Face Bite, Unprovoked, Child Patient)
  `Magandang araw po pakitulungan po kami sa registration niyo ano po ang pangalan ng pasyente nurse pakibilisan po ang anak ko po ito si Pedro Penduko Cruz Junior. Sige po relax lang kailan po siya ipinanganak ipinanganak siya noong April one twenty fifteen. Male po siya. Saan po ang address niyo at contact number taga eighty-eight Caingin Meycauayan Bulacan kami. Ang number ko po ay zero nine nine nine one one one two two two two. Email ko ay pedro dot sr at ymail dot com. Sino ang emergency contact may allergy ba ang bata ako na lang po tatay niya si Pedro Penduko Senior. Wala siyang allergy at never pa nakatanggap ng vaccine dati. Ano po ang nangyari at kailan ito naganap kanina lang pong umaga habang natutulog siya bigla siyang inatake ng aso ng kapitbahay. Kinagat siya sa mukha at leeg. "Deep wound" po ba at nag-bleeding opo unprovoked attack po at ang daming dugo. "Bleeding" po talaga siya hanggang ngayon. Hindi namin alam kung vaccinated yung aso kasi laging nakakawala. Naku High Urgency ito dahil sa location ng kagat sa head at neck area priority po ito sa treatment natin.`,

  // 4. LOW RISK (Lick on Hand, Intact Skin)
  `Magandang araw po welcome sa clinic simulan natin sa inyong buong pangalan please hi po nurse magpapakonsulta lang sana ako ako si Juan Ponce Enrile Dela Cruz. Salamat Juan. Birth date at sex niyo po December twenty-five two thousand. Male po ako. Address po ninyo taga ten Acacia Street Plaridel Bulacan po ako. Ang number ko ay zero nine one eight one two three one two three four. Email ko po is juan dot pc at gmail dot com. May emergency contact ba kayo at relationship niyo sa kanila ang kapatid ko po si Jose Dela Cruz zero nine zero six five five five four four four four. May allergies ba kayo wala po akong kahit anong allergy at wala pa ring rabies vaccine history. Ano pong naging incident at kailan ito nangyari kanina lang po habang pinapakain ko yung puppy namin sa bahay. Dinilaan niya ang kamay ko. "Lick on hand" po. May sugat ba kayo sa kamay or gasgas wala naman po "intact skin" naman po at walang kahit anong sugat or bleeding. Natakot lang ako baka kailangan ng vaccine kasi two months old pa lang yung puppy at wala pang shots. Salamat Juan dahil lick lang ito sa intact skin Low Risk ang category nito pero i-record pa rin natin para sigurado.`,
]

const runDevTest = async () => {
  if (isProcessingAI.value) return

  // Randomize Selection
  const randomIndex = Math.floor(Math.random() * TEST_SCENARIOS.length)
  const selectedTranscript = TEST_SCENARIOS[randomIndex] || ''

  console.log(`⚡ STARTING DEV TEST (Scenario ${randomIndex + 1}/${TEST_SCENARIOS.length})...`)
  console.log('📝 Transcript:', selectedTranscript)

  isProcessingAI.value = true

  try {
    const extractedData = await extractIntakeData(selectedTranscript)

    if (extractedData && intakeFormRef.value) {
      console.log('✅ Gemini Extracted:', extractedData)
      intakeFormRef.value.populateForm(extractedData)
    } else {
      console.warn('⚠️ AI returned null data')
    }
  } catch (err) {
    console.error('❌ Test Failed:', err)
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
