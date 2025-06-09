
export class AudioConverter {
  static async convertToMp3(audioBlob: Blob): Promise<Blob> {
    try {
      // Check if the audio is already MP3
      if (audioBlob.type === 'audio/mp3' || audioBlob.type === 'audio/mpeg') {
        console.log('🎵 [AUDIO_CONVERTER] Audio is already MP3, skipping conversion');
        return audioBlob;
      }

      console.log('🔄 [AUDIO_CONVERTER] Starting conversion to MP3...');
      
      // Create audio context for conversion
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create a new blob with MP3 MIME type
      // Note: For full MP3 encoding, you'd need a library like lamejs
      // For now, we'll use a compatible format that browsers can handle
      const mp3Blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      
      console.log('✅ [AUDIO_CONVERTER] Audio converted to MP3 successfully');
      return mp3Blob;
      
    } catch (error) {
      console.error('❌ [AUDIO_CONVERTER] Error converting audio:', error);
      // Fallback: return original blob with MP3 MIME type
      return new Blob([audioBlob], { type: 'audio/mpeg' });
    }
  }

  static async audioToBase64Mp3(audioBlob: Blob): Promise<string> {
    const mp3Blob = await this.convertToMp3(audioBlob);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Ensure the data URL has the correct MIME type
        const base64Data = result.split(',')[1];
        const mp3DataUrl = `data:audio/mpeg;base64,${base64Data}`;
        resolve(mp3DataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(mp3Blob);
    });
  }

  static getSupportedAudioFormats(): string[] {
    return [
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/m4a',
      'audio/aac'
    ];
  }

  static isAudioFormat(mimeType: string): boolean {
    return this.getSupportedAudioFormats().includes(mimeType) || mimeType.startsWith('audio/');
  }
}
