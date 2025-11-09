/**
 * 📸 PorVerse V2 - Camera Manager  
 * Already implemented - this is the existing file from repository
 */
import type {
  CameraConfig,
  CameraDeviceInfo,
  CameraState,
} from '../../types/biometric'

export class CameraManager {
  private stream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private canvasContext: CanvasRenderingContext2D | null = null
  private state: CameraState = {
    isActive: false,
    isRecording: false,
    currentDeviceId: null,
    error: null,
    lastFrameTime: 0,
  }
  private config: CameraConfig = {
    width: 1280,
    height: 720,
    facingMode: 'user',
    frameRate: 30,
  }
  private callbacks: {
    onError?: (error: Error) => void
    onStreamReady?: () => void
    onStreamEnded?: () => void
  } = {}

  constructor(config?: Partial<CameraConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    this.canvas = document.createElement('canvas')
    this.canvasContext = this.canvas.getContext('2d')
  }

  async initializeCamera(constraints?: MediaStreamConstraints): Promise<void> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support camera access!')
      }

      const videoConstraints = constraints?.video || {
        width: { ideal: this.config.width },
        height: { ideal: this.config.height },
        facingMode: this.config.facingMode,
        frameRate: { ideal: this.config.frameRate },
        ...(this.config.deviceId && { deviceId: this.config.deviceId }),
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      })

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream
        await this.videoElement.play()
      }

      if (this.canvas) {
        this.canvas.width = this.config.width
        this.canvas.height = this.config.height
      }

      this.state.isActive = true
      this.state.currentDeviceId = this.getActiveDeviceId()
      this.state.error = null

      if (this.callbacks.onStreamReady) {
        this.callbacks.onStreamReady()
      }

      console.log('✅ Camera initialized successfully')
    } catch (error) {
      const message = this.handleCameraError(error)
      this.state.error = message
      if (this.callbacks.onError) {
        this.callbacks.onError(error as Error)
      }
      throw error
    }
  }

  async captureFrame(): Promise<ImageData> {
    if (!this.state.isActive || !this.stream) {
      throw new Error('Camera is not active!')
    }

    if (!this.canvas || !this.canvasContext) {
      throw new Error('Canvas is not initialized!')
    }

    if (!this.videoElement) {
      throw new Error('Video element is missing!')
    }

    try {
      this.canvasContext.drawImage(
        this.videoElement,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      )

      const imageData = this.canvasContext.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      )

      this.state.lastFrameTime = Date.now()

      return imageData
    } catch (error) {
      console.error('Error capturing frame:', error)
      throw error
    }
  }

  async switchCamera(deviceId: string): Promise<void> {
    try {
      this.cleanup()
      this.config.deviceId = deviceId
      await this.initializeCamera()
      console.log('✅ Camera switched successfully')
    } catch (error) {
      console.error('Error switching camera:', error)
      throw error
    }
  }

  async startRecording(): Promise<void> {
    if (!this.state.isActive) {
      throw new Error('Start camera first!')
    }
    this.state.isRecording = true
    console.log('🎬 Recording started (placeholder)')
  }

  async stopRecording(): Promise<void> {
    this.state.isRecording = false
    console.log('⏹️ Recording stopped')
  }

  async getAvailableCameras(): Promise<CameraDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
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
      console.error('Error getting cameras:', error)
      return []
    }
  }

  attachVideoElement(element: HTMLVideoElement): void {
    this.videoElement = element
    if (this.stream) {
      this.videoElement.srcObject = this.stream
      this.videoElement.play().catch((error) => {
        console.error('Error playing video:', error)
      })
    }
  }

  setCallbacks(callbacks: {
    onError?: (error: Error) => void
    onStreamReady?: () => void
    onStreamEnded?: () => void
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  getState(): CameraState {
    return { ...this.state }
  }

  isActive(): boolean {
    return this.state.isActive
  }

  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null
    }

    this.state.isActive = false
    this.state.currentDeviceId = null

    if (this.callbacks.onStreamEnded) {
      this.callbacks.onStreamEnded()
    }

    console.log('🧹 Camera cleaned up')
  }

  private handleCameraError(error: any): string {
    let message = 'Unknown error'

    if (error instanceof Error) {
      switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          message = '⛔ Camera permission denied'
          break
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          message = '📷 No camera found'
          break
        case 'NotReadableError':
        case 'TrackStartError':
          message = '⚠️ Camera is being used by another application'
          break
        case 'OverconstrainedError':
          message = '⚙️ Camera settings not supported'
          break
        case 'TypeError':
          message = '❌ Technical error. Browser may not support this feature'
          break
        default:
          message = `❌ Error: ${error.message}`
      }
    }

    console.error('🚨 Camera error:', message, error)
    return message
  }

  private getActiveDeviceId(): string | null {
    if (!this.stream) return null

    const videoTrack = this.stream.getVideoTracks()[0]
    if (!videoTrack) return null

    const settings = videoTrack.getSettings()
    return settings.deviceId || null
  }
}

export default CameraManager