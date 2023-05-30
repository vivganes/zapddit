export interface UploaderResult {
  url?: string;
  error?: string;
}

export default class Uploader {
  static async upload(file: File | Blob): Promise<UploaderResult> {
    const formData = new FormData();
    formData.append('fileToUpload', file);
    formData.append('submit', 'Upload');

    const response = await fetch('https://nostr.build/api/upload/android.php', {
      headers: {
        accept: 'application/json',
      },
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      const data = await response.json();
      return {
        url: new URL(data).toString(),
      };
    }
    return {
      error: 'Upload failed',
    };
  }
}
