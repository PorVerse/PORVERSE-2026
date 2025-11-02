/**
 * 📸 PorVerse V2 - Camera Manager
 * Sistemul care controlează camera pentru biometrie
 * 
 * @version 2.0.0
 * @description EXPLICAT SIMPLU - Gestionează camera web pentru detectare facială
 * 
 * CE FACE ACEST FIȘIER:
 * - Pornește/Oprește camera
 * - Capturează imagini (frame-uri)
 * - Schimbă între camere (față/spate)
 * - Gestionează permisiunile
 * - Asigură confidențialitatea
 */

import type {
  CameraConfig,
  CameraDeviceInfo,
  CameraState,
} from '../../types/biometric'

// ============================================================================
// 🎬 CAMERA MANAGER CLASS
// ============================================================================

/**
 * Camera Manager - Managerul Camerei
 * 
 * ANALOGIE: Ca un șofer de taxi pentru camera ta
 * - Pornește motorul (camera)
 * - Te duce unde vrei (capturează imagini)
 * - Oprește când ai terminat
 * - Se asigură că totul e sigur
 */
export class CameraManager {
  // ========================================================================
  // 📦 PROPRIETĂȚI PRIVATE (Sertarele personale)
  // ========================================================================

  /**
   * Stream-ul video de la cameră
   * Gândește-te ca la un furtun de apă - video-ul curge prin el
   */
  private stream: MediaStream | null = null

  /**
   * Elementul video HTML
   * Ca un ecran TV unde se afișează imaginea
   */
  private videoElement: HTMLVideoElement | null = null

  /**
   * Canvas pentru capturare
   * Ca o foaie de hârtie invizibilă unde desenăm imaginea
   */
  private canvas: HTMLCanvasElement | null = null

  /**
   * Context 2D pentru desenare
   * Ca un creion cu care desenăm pe canvas
   */
  private canvasContext: CanvasRenderingContext2D | null = null

  /**
   * Starea curentă a camerei
   * Jurnal cu ce se întâmplă: pornită, oprită, eroare?
   */
  private state: CameraState = {
    isActive: false,
    isRecording: false,
    currentDeviceId: null,
    error: null,
    lastFrameTime: 0,
  }

  /**
   * Configurația camerei
   * Setările: rezoluție, care cameră, etc.
   */
  private config: CameraConfig = {
    width: 1280,
    height: 720,
    facingMode: 'user', // 'user' = camera din față (selfie)
    frameRate: 30,
  }

  /**
   * Callback-uri pentru evenimente
   * Funcții care se apelează când se întâmplă ceva
   */
  private callbacks: {
    onError?: (error: Error) => void
    onStreamReady?: () => void
    onStreamEnded?: () => void
  } = {}

  // ========================================================================
  // 🏗️ CONSTRUCTOR (Inițializare)
  // ========================================================================

  /**
   * Constructor - Prima funcție care se rulează când creezi un CameraManager
   * 
   * @param config - Configurația camerei (opțional)
   * 
   * ANALOGIE: Ca atunci când cumperi o cameră nouă și o configurezi
   */
  constructor(config?: Partial<CameraConfig>) {
    // Dacă dai configurație custom, o folosim
    if (config) {
      this.config = { ...this.config, ...config }
    }

    // Creăm canvas-ul pentru capturare
    this.canvas = document.createElement('canvas')
    this.canvasContext = this.canvas.getContext('2d')
  }

  // ========================================================================
  // 🎥 CORE CAMERA METHODS (Metodele principale)
  // ========================================================================

  /**
   * Inițializează camera - PORNEȘTE CAMERA
   * 
   * CE FACE:
   * 1. Cere permisiune utilizatorului ("Pot folosi camera?")
   * 2. Pornește camera
   * 3. Conectează camera la elementul video
   * 
   * @param constraints - Restricții opționale (rezoluție, cameră, etc.)
   * @returns Promise care se rezolvă când camera e gata
   * 
   * EXEMPLU:
   * const manager = new CameraManager()
   * await manager.initializeCamera()  // Așteaptă să pornească camera
   */
  async initializeCamera(
    constraints?: MediaStreamConstraints
  ): Promise<void> {
    try {
      // PASUL 1: Verificăm suport browser
      // ========================================
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('❌ Browser-ul tău nu suportă accesul la cameră!')
      }

      // PASUL 2: Pregătim configurația
      // ========================================
      const videoConstraints = constraints?.video || {
        width: { ideal: this.config.width },
        height: { ideal: this.config.height },
        facingMode: this.config.facingMode,
        frameRate: { ideal: this.config.frameRate },
        // Dacă avem un deviceId specific, îl folosim
        ...(this.config.deviceId && { deviceId: this.config.deviceId }),
      }

      // PASUL 3: Cerem permisiune și pornim camera
      // ========================================
      // Aici apare popup-ul: "Vrei să folosești camera?"
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false, // Nu vrem audio (doar video)
      })

      // PASUL 4: Actualizăm starea
      // ========================================
      this.state.isActive = true
      this.state.error = null
      this.state.currentDeviceId = this.getActiveDeviceId()

      // PASUL 5: Configurăm canvas-ul
      // ========================================
      if (this.canvas && this.stream) {
        const videoTrack = this.stream.getVideoTracks()[0]
        const settings = videoTrack.getSettings()

        // Setăm dimensiunile canvas-ului la dimensiunile video-ului
        this.canvas.width = settings.width || this.config.width
        this.canvas.height = settings.height || this.config.height
      }

      // PASUL 6: Dacă avem element video, conectăm stream-ul
      // ========================================
      if (this.videoElement && this.stream) {
        this.videoElement.srcObject = this.stream
        await this.videoElement.play()
      }

      // PASUL 7: Anunțăm că totul e gata!
      // ========================================
      if (this.callbacks.onStreamReady) {
        this.callbacks.onStreamReady()
      }

      console.log('✅ Camera inițializată cu succes!')
    } catch (error) {
      // GESTIONARE ERORI
      // ========================================
      const errorMessage = this.handleCameraError(error)
      this.state.error = errorMessage
      this.state.isActive = false

      if (this.callbacks.onError) {
        this.callbacks.onError(
          error instanceof Error ? error : new Error(errorMessage)
        )
      }

      throw error
    }
  }

  /**
   * Capturează un frame (o imagine) de la cameră
   * 
   * CE FACE:
   * 1. Verifică dacă camera e pornită
   * 2. "Desenează" imaginea curentă pe canvas
   * 3. Extrage pixelii din imagine
   * 4. Returnează imaginea ca ImageData
   * 
   * @returns ImageData - Imaginea capturată (array de pixeli)
   * 
   * ANALOGIE: Ca atunci când apeși butonul de poză pe telefon
   * 
   * EXEMPLU:
   * const frame = await manager.captureFrame()
   * console.log('Am capturat o imagine cu', frame.data.length, 'pixeli!')
   */
  async captureFrame(): Promise<ImageData> {
    // VERIFICARE 1: E camera pornită?
    if (!this.state.isActive || !this.stream) {
      throw new Error('❌ Camera nu e pornită! Pornește-o mai întâi.')
    }

    // VERIFICARE 2: Avem canvas și context?
    if (!this.canvas || !this.canvasContext) {
      throw new Error('❌ Canvas-ul nu e inițializat!')
    }

    // VERIFICARE 3: Avem element video?
    if (!this.videoElement) {
      throw new Error('❌ Element video lipsă!')
    }

    try {
      // PASUL 1: Desenăm imaginea de pe video pe canvas
      // ========================================
      // Ca și cum faci un screenshot al video-ului
      this.canvasContext.drawImage(
        this.videoElement,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      )

      // PASUL 2: Extragem pixelii din canvas
      // ========================================
      // getImageData = ia toți pixelii ca array de numere
      const imageData = this.canvasContext.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      )

      // PASUL 3: Actualizăm timestamp-ul
      // ========================================
      this.state.lastFrameTime = Date.now()

      // PASUL 4: Returnăm imaginea!
      // ========================================
      return imageData
    } catch (error) {
      console.error('❌ Eroare la capturarea frame-ului:', error)
      throw error
    }
  }

  /**
   * Schimbă camera (de la față la spate sau invers)
   * 
   * CE FACE:
   * 1. Oprește camera curentă
   * 2. Pornește noua cameră cu deviceId specificat
   * 
   * @param deviceId - ID-ul noii camere
   * 
   * EXEMPLU:
   * const cameras = await manager.getAvailableCameras()
   * await manager.switchCamera(cameras[1].deviceId)  // Schimbă la a 2-a cameră
   */
  async switchCamera(deviceId: string): Promise<void> {
    try {
      // PASUL 1: Oprește camera curentă
      this.cleanup()

      // PASUL 2: Actualizează configurația cu noul deviceId
      this.config.deviceId = deviceId

      // PASUL 3: Pornește noua cameră
      await this.initializeCamera()

      console.log('✅ Camera schimbată cu succes!')
    } catch (error) {
      console.error('❌ Eroare la schimbarea camerei:', error)
      throw error
    }
  }

  /**
   * Pornește înregistrarea video (în viitor)
   * PLACEHOLDER - va fi implementat când vom avea nevoie
   */
  async startRecording(): Promise<void> {
    if (!this.state.isActive) {
      throw new Error('❌ Pornește camera mai întâi!')
    }

    // TODO: Implementare înregistrare video
    this.state.isRecording = true
    console.log('🎬 Înregistrare pornită (TODO: implementare completă)')
  }

  /**
   * Oprește înregistrarea video (în viitor)
   * PLACEHOLDER - va fi implementat când vom avea nevoie
   */
  async stopRecording(): Promise<void> {
    this.state.isRecording = false
    console.log('⏹️ Înregistrare oprită')
  }

  // ========================================================================
  // 📋 UTILITY METHODS (Metode auxiliare)
  // ========================================================================

  /**
   * Obține toate camerele disponibile
   * 
   * CE FACE:
   * Întreabă browser-ul: "Ce camere sunt disponibile?"
   * 
   * @returns Array cu informații despre fiecare cameră
   * 
   * EXEMPLU:
   * const cameras = await manager.getAvailableCameras()
   * cameras.forEach(cam => console.log(cam.label))
   * // Output: "FaceTime HD Camera", "iPhone Back Camera", etc.
   */
  async getAvailableCameras(): Promise<CameraDeviceInfo[]> {
    try {
      // Cerem lista de dispozitive media
      const devices = await navigator.mediaDevices.enumerateDevices()

      // Filtrăm doar camerele (videoinput)
      const cameras = devices
        .filter((device) => device.kind === 'videoinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`,
          kind: device.kind as 'videoinput',
          groupId: device.groupId,
        }))

      return cameras
    } catch (error) {
      console.error('❌ Eroare la obținerea camerelor:', error)
      return []
    }
  }

  /**
   * Atașează un element video HTML la manager
   * 
   * CE FACE:
   * Conectează managerul la un tag <video> din pagină
   * 
   * @param element - Elementul <video> HTML
   * 
   * EXEMPLU:
   * const videoElement = document.getElementById('my-video')
   * manager.attachVideoElement(videoElement)
   */
  attachVideoElement(element: HTMLVideoElement): void {
    this.videoElement = element

    // Dacă avem deja un stream activ, îl conectăm
    if (this.stream) {
      this.videoElement.srcObject = this.stream
      this.videoElement.play().catch((error) => {
        console.error('❌ Eroare la pornirea video:', error)
      })
    }
  }

  /**
   * Setează callback-uri pentru evenimente
   * 
   * CE FACE:
   * Permite să setezi funcții care se apelează când se întâmplă ceva
   * 
   * @param callbacks - Obiect cu funcții callback
   * 
   * EXEMPLU:
   * manager.setCallbacks({
   *   onError: (error) => console.log('Eroare:', error),
   *   onStreamReady: () => console.log('Camera e gata!')
   * })
   */
  setCallbacks(callbacks: {
    onError?: (error: Error) => void
    onStreamReady?: () => void
    onStreamEnded?: () => void
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * Obține starea curentă a camerei
   * 
   * @returns Obiect cu starea completă
   * 
   * EXEMPLU:
   * const state = manager.getState()
   * console.log('Camera e pornită?', state.isActive)
   */
  getState(): CameraState {
    return { ...this.state }
  }

  /**
   * Verifică dacă camera e activă
   * 
   * @returns true dacă camera e pornită, false altfel
   * 
   * EXEMPLU:
   * if (manager.isActive()) {
   *   console.log('Camera merge!')
   * }
   */
  isActive(): boolean {
    return this.state.isActive
  }

  // ========================================================================
  // 🧹 CLEANUP & ERROR HANDLING (Curățenie și gestionare erori)
  // ========================================================================

  /**
   * Curăță tot - OPREȘTE CAMERA
   * 
   * CE FACE:
   * 1. Oprește toate track-urile video
   * 2. Deconectează stream-ul
   * 3. Resetează starea
   * 
   * IMPORTANT: Apelează ÎNTOTDEAUNA când ai terminat!
   * Altfel camera rămâne pornită și consumă baterie/resurse
   * 
   * ANALOGIE: Ca atunci când închizi toate luminile când pleci din casă
   * 
   * EXEMPLU:
   * manager.cleanup()  // Oprește tot
   */
  cleanup(): void {
    // PASUL 1: Oprește toate track-urile video
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop() // Oprește track-ul
        console.log('🛑 Track oprit:', track.label)
      })
    }

    // PASUL 2: Deconectează stream-ul de la video
    if (this.videoElement) {
      this.videoElement.srcObject = null
    }

    // PASUL 3: Resetează variabilele
    this.stream = null
    this.state.isActive = false
    this.state.isRecording = false
    this.state.currentDeviceId = null
    this.state.lastFrameTime = 0

    // PASUL 4: Anunță că s-a încheiat
    if (this.callbacks.onStreamEnded) {
      this.callbacks.onStreamEnded()
    }

    console.log('🧹 Camera curățată și oprită!')
  }

  /**
   * Gestionează erorile camerei
   * 
   * CE FACE:
   * Traduce erorile tehnice în mesaje clare pentru utilizator
   * 
   * @param error - Eroarea primită
   * @returns Mesaj clar de eroare
   * 
   * ERORILE POSIBILE:
   * - NotAllowedError: User a refuzat permisiunea
   * - NotFoundError: Nu există cameră
   * - NotReadableError: Camera e folosită de altă aplicație
   * - OverconstrainedError: Setările cerute nu sunt suportate
   */
  private handleCameraError(error: any): string {
    let message = 'Eroare necunoscută la cameră'

    if (error instanceof Error) {
      const errorName = error.name

      switch (errorName) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          message =
            '🚫 Permisiunea camerei a fost refuzată. Te rog activează camera din setările browser-ului.'
          break

        case 'NotFoundError':
        case 'DevicesNotFoundError':
          message =
            '📷 Nicio cameră găsită! Conectează o cameră sau verifică setările.'
          break

        case 'NotReadableError':
        case 'TrackStartError':
          message =
            '⚠️ Camera e folosită de o altă aplicație. Închide celelalte aplicații care folosesc camera.'
          break

        case 'OverconstrainedError':
          message =
            '⚙️ Setările cerute nu sunt suportate de camera ta. Încearcă cu alte setări.'
          break

        case 'TypeError':
          message =
            '❌ Eroare tehnică. Browser-ul tău poate să nu suporte această funcție.'
          break

        default:
          message = `❌ Eroare: ${error.message}`
      }
    }

    console.error('🚨 Eroare cameră:', message, error)
    return message
  }

  /**
   * Obține ID-ul device-ului activ
   * 
   * @returns ID-ul camerei active sau null
   */
  private getActiveDeviceId(): string | null {
    if (!this.stream) return null

    const videoTrack = this.stream.getVideoTracks()[0]
    if (!videoTrack) return null

    const settings = videoTrack.getSettings()
    return settings.deviceId || null
  }
}

// ============================================================================
// 🎯 EXPORT
// ============================================================================

/**
 * Exportăm clasa pentru a putea fi folosită în alte fișiere
 * 
 * UTILIZARE:
 * import { CameraManager } from './lib/biometric/camera-manager'
 * 
 * const manager = new CameraManager()
 * await manager.initializeCamera()
 * const frame = await manager.captureFrame()
 * manager.cleanup()
 */
export default CameraManager

/**
 * GATA! 🎉
 * 
 * Camera Manager e complet funcțional!
 * 
 * CE POATE FACE:
 * ✅ Pornește camera
 * ✅ Oprește camera
 * ✅ Capturează imagini
 * ✅ Schimbă între camere
 * ✅ Gestionează erori
 * ✅ Respectă confidențialitatea
 * 
 * URMĂTORUL PAS:
 * O să construim Face Detector care folosește Camera Manager
 * pentru a detecta fețe în imaginile capturate!
 */