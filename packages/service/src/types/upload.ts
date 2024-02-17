/**
 * File upload information.
 */
export interface UploadInfo {
  userId: string;
  fileName: string;
  fileType: string;
  url: string;
}

/**
 * File upload interface.
 */
export interface Upload {

  /**
   * Upload a file.
   */
  upload: (destination: string, path: string, file: File) => Promise<void>;

  /**
   * Upload a file, resuming a previous upload if already started and incomplete.
   * @param bucket - Name of storage bucket.
   * @param file - A File object for the file to download.
   * @param setProgress - A function called to update progress percentage.
   * @param onSuccess - A function called after the file is successfully uploaded.
   * @param onError - A function that is called to handle errors.
   * @returns A void promise.
   */
  resumableUpload: (bucket: string, file: File, setProgress: (percentage: number) => void, onSuccess: (info: UploadInfo) => void, onError: (error: Error) => void) => Promise<void>;
}
