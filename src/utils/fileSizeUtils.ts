
export class FileSizeUtils {
  static estimateSize(base64Content: string): string {
    try {
      // Base64 is ~33% larger than the original
      const approximateBytes = (base64Content.length * 3) / 4;
      
      if (approximateBytes < 1024) return `${Math.round(approximateBytes)} B`;
      if (approximateBytes < 1024 * 1024) return `${Math.round(approximateBytes / 1024)} KB`;
      if (approximateBytes < 1024 * 1024 * 1024) return `${Math.round(approximateBytes / (1024 * 1024))} MB`;
      
      return `${Math.round(approximateBytes / (1024 * 1024 * 1024))} GB`;
    } catch {
      return 'Unknown';
    }
  }
}
