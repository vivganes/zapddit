export interface UploaderResult {
  url?: string;
  error?: string;
}

export default class Uploader {
  static async upload(file: File | Blob): Promise<UploaderResult> {
    const formData = new FormData();
    formData.append('fileToUpload', file);
    formData.append('submit', 'Upload');

    const response = await fetch('https://nostr.build/api/v2/upload/files', {
      headers: {
        accept: 'application/json',
      },
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      const data = await response.json();
      console.log(data);
      return {
        url: new URL(data.data[0].url).toString(),
      };
    }
    return {
      error: 'Upload failed',
    };
  }

}
