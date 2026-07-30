import { encodeFloat32ToMuLaw, decodeMuLawToFloat32 } from './mulaw';

export interface AudioStats {
  inputLevel: number; // 0 to 100
  outputLevel: number; // 0 to 100
}

/**
 * Handles capturing browser microphone audio, resampling it to 8kHz, compressing it
 * to G.711 mu-law, and streaming it via WebSockets.
 * Also handles receiving mu-law audio chunks, decoding them, and playing them back
 * with barge-in support.
 */
export class BrowserAudioPipeline {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  
  // Output nodes
  private analyserIn: AnalyserNode | null = null;
  private analyserOut: AnalyserNode | null = null;

  // Queue state for playback
  private audioQueue: Float32Array[] = [];
  private scheduledTime = 0;
  private onAudioInput: (base64Payload: string) => void;
  private onStatsUpdate: (stats: AudioStats) => void;

  constructor(
    onAudioInput: (base64Payload: string) => void,
    onStatsUpdate: (stats: AudioStats) => void
  ) {
    this.onAudioInput = onAudioInput;
    this.onStatsUpdate = onStatsUpdate;
  }

  /**
   * Request microphone permissions and initialize audio context.
   */
  async startInput(deviceId?: string) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const constraints: MediaStreamConstraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      video: false,
    };
    
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.inputSource = this.audioContext.createMediaStreamSource(this.stream);
    
    this.analyserIn = this.audioContext.createAnalyser();
    this.analyserIn.fftSize = 256;
    this.analyserOut = this.audioContext.createAnalyser();
    this.analyserOut.fftSize = 256;

    this.inputSource.connect(this.analyserIn);

    this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.inputSource.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);

    this.startLevelMetersLoop();

    const sampleRate = this.audioContext.sampleRate;
    console.log(`[AudioPipeline] Mic input initialized. Original Sample Rate: ${sampleRate}Hz`);

    this.processorNode.onaudioprocess = (e) => {
      if (!this.audioContext || this.audioContext.state === 'suspended') return;

      const inputBuffer = e.inputBuffer.getChannelData(0);
      
      // Resample down to 8000Hz
      const resampled = this.resample(inputBuffer, sampleRate, 8000);
      
      // Compress to 8-bit mu-law
      const muLawData = encodeFloat32ToMuLaw(resampled);
      
      // Convert to Base64 (cast to ArrayBuffer to satisfy TS compiler)
      const base64Payload = this.arrayBufferToBase64(muLawData.buffer as ArrayBuffer);
      this.onAudioInput(base64Payload);
    };
  }

  /**
   * Feed a base64 mu-law chunk received from the WebSocket into the speaker queue.
   */
  playAudioChunk(base64Payload: string) {
    if (!this.audioContext) return;

    // Decode base64 to binary
    const binary = window.atob(base64Payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Decompress 8-bit mu-law to Float32 PCM
    const float32Pcm = decodeMuLawToFloat32(bytes);
    this.audioQueue.push(float32Pcm);

    // Schedule playout in the AudioContext timeline
    this.scheduleQueuePlayback();
  }

  /**
   * Flushes the audio playback queue immediately. Used for barge-in/interruptions.
   */
  clearPlayback() {
    this.audioQueue = [];
    this.scheduledTime = this.audioContext ? this.audioContext.currentTime : 0;
    console.log('[AudioPipeline] Playback queue cleared.');
  }

  /**
   * Stops the microphone input and cleans up nodes.
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioQueue = [];
    console.log('[AudioPipeline] Pipeline stopped.');
  }

  /**
   * Resamples PCM audio from one rate to another.
   */
  private resample(buffer: Float32Array, fromSampleRate: number, toSampleRate: number): Float32Array {
    const ratio = fromSampleRate / toSampleRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const index = Math.round(i * ratio);
      result[i] = buffer[Math.min(index, buffer.length - 1)];
    }

    return result;
  }

  /**
   * Schedule audio buffers sequentially to prevent popping or clicking.
   */
  private scheduleQueuePlayback() {
    if (!this.audioContext || this.audioQueue.length === 0) return;

    const currentTime = this.audioContext.currentTime;
    if (this.scheduledTime < currentTime) {
      this.scheduledTime = currentTime + 0.05;
    }

    while (this.audioQueue.length > 0) {
      const pcmChunk = this.audioQueue.shift()!;
      
      const audioBuffer = this.audioContext.createBuffer(1, pcmChunk.length, 8000);
      audioBuffer.getChannelData(0).set(pcmChunk);

      const bufferSource = this.audioContext.createBufferSource();
      bufferSource.buffer = audioBuffer;

      bufferSource.connect(this.analyserOut!);
      this.analyserOut!.connect(this.audioContext.destination);

      bufferSource.start(this.scheduledTime);
      this.scheduledTime += audioBuffer.duration;
    }
  }

  /**
   * Loop measuring RMS levels to feed the visual level meters.
   */
  private startLevelMetersLoop() {
    const dataArray = new Uint8Array(128);

    const updateLevels = () => {
      if (!this.audioContext) return;

      let inputDb = 0;
      let outputDb = 0;

      if (this.analyserIn) {
        this.analyserIn.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        inputDb = Math.min(100, Math.round(rms * 250));
      }

      if (this.analyserOut) {
        this.analyserOut.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        outputDb = Math.min(100, Math.round(rms * 250));
      }

      this.onStatsUpdate({
        inputLevel: inputDb,
        outputLevel: outputDb,
      });

      requestAnimationFrame(updateLevels);
    };

    requestAnimationFrame(updateLevels);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
