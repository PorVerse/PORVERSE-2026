/**
 * 🎭 PorVerse V2 - Biometric System Types
 * Tipurile pentru sistemul de biometrie (recunoaștere facială și emoții)
 * 
 * @version 2.0.0
 * @description EXPLICAT SIMPLU - Toate "rețetele" pentru datele biometrice
 */

// ============================================================================
// 📸 CAMERA & MEDIA TYPES (Tipuri pentru cameră)
// ============================================================================

/**
 * MediaStream = Fluxul video de la cameră (ca un fir de apă)
 * Acesta e deja definit de browser, dar îl menționăm pentru claritate
 */

/**
 * Configurarea camerei
 * Ca setările de pe camera foto: rezoluție, care cameră, etc.
 */
export interface CameraConfig {
  width: number              // Lățime video (ex: 1280 pixeli)
  height: number             // Înălțime video (ex: 720 pixeli)
  facingMode: 'user' | 'environment'  // 'user' = față (selfie), 'environment' = spate
  frameRate?: number         // Cadre pe secundă (ex: 30 fps)
  deviceId?: string          // ID-ul specific al camerei (dacă ai mai multe)
}

/**
 * Informații despre o cameră disponibilă
 * Ca o etichetă pe fiecare cameră: nume, ID, tip
 */
export interface CameraDeviceInfo {
  deviceId: string           // ID unic (ca seria camerei)
  label: string             // Nume afișat (ex: "FaceTime HD Camera")
  kind: 'videoinput'        // Tipul: întotdeauna 'videoinput' pentru camere
  groupId: string           // Grup de dispozitive (camere asociate)
}

/**
 * Starea curentă a camerei
 * Ce se întâmplă acum cu camera: pornită, oprită, eroare?
 */
export interface CameraState {
  isActive: boolean          // Camera e pornită? true/false
  isRecording: boolean       // Se filmează acum? true/false
  currentDeviceId: string | null  // ID-ul camerei active (sau null dacă nu e niciuna)
  error: string | null       // Mesaj de eroare (sau null dacă totul e OK)
  lastFrameTime: number      // Când a fost ultima captură (timestamp)
}

// ============================================================================
// 👤 FACE DETECTION TYPES (Tipuri pentru detectarea feței)
// ============================================================================

/**
 * Un punct pe față (landmark)
 * Gândește-te ca la un bulinuță pe față: x, y coordonate + cât de sigur e AI-ul
 */
export interface FaceLandmark {
  x: number                  // Poziția orizontală (0 = stânga, mai mare = dreapta)
  y: number                  // Poziția verticală (0 = sus, mai mare = jos)
  z?: number                 // Adâncime (opțional, pentru 3D)
  confidence: number         // Cât de sigur e (0 = deloc, 1 = 100% sigur)
}

/**
 * Toate punctele de pe față (468 de puncte!)
 * MediaPipe detectează 468 de puncte: ochi, nas, gură, contur, sprâncene
 */
export interface FaceLandmarks {
  landmarks: FaceLandmark[]  // Array cu toate cele 468 de puncte
  timestamp: number          // Când a fost detectată (milisecunde)
}

/**
 * Detectarea completă a unei fețe
 * Tot ce știm despre o față detectată
 */
export interface FaceDetection {
  landmarks: FaceLandmarks   // Toate punctele de pe față
  boundingBox: BoundingBox   // Dreptunghiul în care se află fața
  confidence: number         // Cât de sigur e că e o față (0-1)
  faceId?: string           // ID unic pentru tracking (opțional)
}

/**
 * Dreptunghi în care se află fața
 * Ca un cadru foto: unde începe, cât de mare e
 */
export interface BoundingBox {
  x: number                  // Unde începe pe orizontală
  y: number                  // Unde începe pe verticală
  width: number              // Cât de lată e fața
  height: number             // Cât de înaltă e fața
}

/**
 * Metrici despre calitatea feței detectate
 * Cât de bună e imaginea pentru analiză?
 */
export interface FaceMetrics {
  faceSize: number           // Dimensiunea feței (în pixeli)
  brightness: number         // Lumina (0 = întunecat, 1 = perfect, 2 = prea luminos)
  sharpness: number          // Cât de clară e imaginea (0 = blur, 1 = sharp)
  headPose: HeadPose         // Unghiul capului
  isGoodQuality: boolean     // E OK pentru analiză? true/false
}

/**
 * Poziția capului
 * În ce direcție te uiți: stânga, dreapta, sus, jos?
 */
export interface HeadPose {
  yaw: number                // Rotație stânga-dreapta (-90 la +90 grade)
  pitch: number              // Rotație sus-jos (-90 la +90 grade)
  roll: number               // Înclinare cap (stânga-dreapta, -90 la +90)
}

// ============================================================================
// 😊 EMOTION ANALYSIS TYPES (Tipuri pentru analiza emoțiilor)
// ============================================================================

/**
 * Tipurile de emoții de bază
 * 7 emoții fundamentale recunoscute universal
 */
export type EmotionType =
  | 'happy'      // Fericit 😊
  | 'sad'        // Trist 😢
  | 'angry'      // Supărat 😠
  | 'surprised'  // Surprins 😲
  | 'fearful'    // Speriat 😨
  | 'disgusted'  // Dezgustat 🤢
  | 'neutral'    // Neutru 😐

/**
 * Scoruri pentru fiecare emoție
 * Probabilitatea fiecărei emoții (0 = deloc, 1 = 100%)
 */
export interface EmotionScores {
  happy: number       // Cât de fericit (0-1)
  sad: number         // Cât de trist (0-1)
  angry: number       // Cât de supărat (0-1)
  surprised: number   // Cât de surprins (0-1)
  fearful: number     // Cât de speriat (0-1)
  disgusted: number   // Cât de dezgustat (0-1)
  neutral: number     // Cât de neutru (0-1)
}

/**
 * Citirea unei emoții la un moment dat
 * Ce emoție simte persoana ACUM?
 */
export interface EmotionReading {
  dominantEmotion: EmotionType   // Emoția principală (cea mai puternică)
  scores: EmotionScores          // Scoruri pentru toate emoțiile
  confidence: number             // Cât de sigur e AI-ul (0-1)
  timestamp: number              // Când a fost detectată (milisecunde)
  faceLandmarks?: FaceLandmarks  // Punctele de pe față (opțional)
}

/**
 * Starea emoțională pe o perioadă
 * Cum te-ai simțit în ultima oră/zi?
 */
export interface EmotionalState {
  averageEmotion: EmotionType    // Emoția medie/predominantă
  emotionDistribution: EmotionScores  // Distribuția tuturor emoțiilor
  stressLevel: number            // Nivelul de stress (0-1)
  energyLevel: number            // Nivelul de energie (0-1)
  positivity: number             // Cât de pozitiv (0-1)
  stability: number              // Cât de stabil emoțional (0-1)
  timeRange: {
    start: number                // De când (timestamp)
    end: number                  // Până când (timestamp)
  }
}

/**
 * Pattern emoțional - tendințe în timp
 * Cum se schimbă emoțiile tale de-a lungul timpului?
 */
export interface EmotionalPattern {
  userId: string                 // ID-ul utilizatorului
  patternType: 'daily' | 'weekly' | 'monthly'  // Perioada
  dominantEmotions: EmotionType[]  // Emoțiile principale
  triggers: string[]             // Ce declanșează emoțiile (ex: 'dimineața', 'după lucru')
  improvements: string[]         // Îmbunătățiri observate
  concerns: string[]             // Lucruri îngrijorătoare
  confidence: number             // Cât de sigure sunt aceste pattern-uri (0-1)
}

// ============================================================================
// 📊 STRESS & WELLBEING TYPES (Tipuri pentru stress și bunăstare)
// ============================================================================

/**
 * Nivel de stress
 * Cât de stresat ești? (ca un semafor)
 */
export type StressLevel =
  | 'low'       // Scăzut - totul e bine ✅
  | 'moderate'  // Moderat - atenție medie ⚠️
  | 'high'      // Ridicat - ai grijă! 🔴
  | 'critical'  // Critic - ia măsuri imediat! 🚨

/**
 * Scor de stress detaliat
 * Toate informațiile despre stress
 */
export interface StressScore {
  level: StressLevel             // Nivelul general (low, moderate, high, critical)
  value: number                  // Valoare numerică (0-100)
  factors: {
    facial: number               // Stress din expresia facială (0-1)
    temporal: number             // Stress din pattern-uri temporale (0-1)
    contextual: number           // Stress din context (0-1)
  }
  recommendations: string[]      // Recomandări pentru reducere stress
  timestamp: number              // Când a fost măsurat
}

// ============================================================================
// 🔐 PRIVACY TYPES (Tipuri pentru confidențialitate)
// ============================================================================

/**
 * Moduri de confidențialitate
 * Cât de strictă vrei confidențialitatea?
 */
export type PrivacyMode =
  | 'strict'      // Strict - nici o dată nu părăsește device-ul
  | 'balanced'    // Echilibrat - date minime, anonimizate
  | 'permissive'  // Permisiv - funcționalitate maximă

/**
 * Nivelul de consimțământ al utilizatorului
 * Ce ai acceptat să facem cu datele tale?
 */
export interface ConsentLevel {
  biometricCapture: boolean      // Accepti capturarea biometrică? da/nu
  emotionAnalysis: boolean       // Accepti analiza emoțiilor? da/nu
  dataStorage: boolean           // Accepti stocarea datelor? da/nu
  analytics: boolean             // Accepti analytics? da/nu
  sharing: boolean               // Accepti partajarea datelor? da/nu
  timestamp: number              // Când ai dat consimțământul
  version: string                // Versiunea termenilor acceptați
}

/**
 * Date biometrice criptate
 * Date care au fost transformate în cod secret
 */
export interface EncryptedData {
  data: string                   // Datele criptate (ca hieroglife)
  algorithm: string              // Algoritmul folosit (ex: 'AES-256')
  iv: string                     // Vector de inițializare (cheie extra)
  timestamp: number              // Când a fost criptat
}

/**
 * Audit al folosirii datelor
 * Jurnalul: ce s-a făcut cu datele tale?
 */
export interface DataUsageAudit {
  userId: string                 // ID-ul tău
  actions: DataUsageAction[]     // Lista acțiunilor
  summary: {
    totalAccesses: number        // De câte ori au fost accesate datele
    lastAccess: number           // Ultima accesare (timestamp)
    purposes: string[]           // În ce scopuri (ex: 'emotion_analysis')
  }
}

/**
 * O acțiune cu datele
 * Ce s-a făcut exact cu datele tale?
 */
export interface DataUsageAction {
  action: string                 // Tipul acțiunii (ex: 'read', 'analyze')
  timestamp: number              // Când (milisecunde)
  purpose: string                // De ce (ex: 'emotion_detection')
  dataType: string               // Ce tip de date (ex: 'face_landmarks')
  location: 'device' | 'cloud'   // Unde (pe device sau în cloud)
}

// ============================================================================
// ⚙️ CONFIGURATION TYPES (Tipuri pentru configurare)
// ============================================================================

/**
 * Configurarea sistemului biometric
 * Toate setările pentru biometrie
 */
export interface BiometricConfig {
  camera: CameraConfig           // Setări cameră
  faceDetection: {
    minConfidence: number        // Încredere minimă pentru detectare (0-1)
    maxFaces: number             // Câte fețe max să detecteze
    smoothing: boolean           // Smoothing pentru stabilitate
  }
  emotionAnalysis: {
    enabled: boolean             // Analiza emoțiilor activată?
    updateInterval: number       // Cât de des să analizeze (milisecunde)
    minConfidence: number        // Încredere minimă (0-1)
  }
  privacy: {
    mode: PrivacyMode           // Modul de confidențialitate
    onDeviceOnly: boolean       // Procesare doar pe device?
    dataRetention: number       // Cât timp păstrăm datele (zile)
    anonymize: boolean          // Anonimizare date?
  }
  performance: {
    targetFps: number           // Cadre pe secundă țintă
    maxLatency: number          // Latența maximă acceptabilă (ms)
    useWebWorker: boolean       // Folosește Web Worker pentru performanță?
  }
}

// ============================================================================
// 📦 COMPLETE BIOMETRIC READING (Citire biometrică completă)
// ============================================================================

/**
 * Citirea biometrică completă
 * TOT ce știm despre tine la un moment dat
 */
export interface BiometricReading {
  userId: string                 // ID-ul tău
  timestamp: number              // Când (milisecunde)
  face: FaceDetection | null     // Detectarea feței (sau null)
  emotion: EmotionReading | null // Emoția (sau null)
  stress: StressScore | null     // Scorul de stress (sau null)
  quality: FaceMetrics | null    // Calitatea detectării (sau null)
  metadata: {
    sessionId: string            // ID-ul sesiunii
    portalId?: string            // ID-ul portalului (dacă e în portal)
    context?: string             // Context adițional
  }
}

// ============================================================================
// 🎯 EXPORT ALL (Exportăm tot)
// ============================================================================

/**
 * GATA! Toate tipurile sunt definite! 🎉
 * 
 * Aceste "rețete" (types) vor fi folosite în tot codul
 * pentru a asigura că datele sunt întotdeauna în formatul corect!
 */