import { apiClient } from "./client";

export interface UploadValidationConfig {
  maxSizeBytes?: number; // E.g. 5 * 1024 * 1024 (5MB)
  allowedMimeTypes?: string[]; // E.g. ['image/jpeg', 'image/png']
}

export interface UploadOptions extends UploadValidationConfig {
  fieldName?: string; // Default to 'file'
  cancelKey?: string; // AbortController tracking ID
  onProgress?: (progressPercentage: number) => void;
}

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

/**
 * Reusable Upload Service.
 */
export const uploadService = {
  /**
   * Validates a single file against configuration constraints.
   */
  validateFile(file: File, config: UploadValidationConfig) {
    const { maxSizeBytes, allowedMimeTypes } = config;

    if (maxSizeBytes && file.size > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      throw new UploadValidationError(`File size exceeds the ${maxMb}MB upload threshold limits.`);
    }

    if (allowedMimeTypes && allowedMimeTypes.length > 0) {
      if (!allowedMimeTypes.includes(file.type)) {
        throw new UploadValidationError(`MIME type '${file.type}' is unauthorized for upload.`);
      }
    }
  },

  /**
   * Uploads a single file to a specified endpoint.
   */
  async uploadFile<T>(endpoint: string, file: File, options: UploadOptions = {}): Promise<T> {
    const { fieldName = "file", maxSizeBytes, allowedMimeTypes, cancelKey, onProgress } = options;

    // Validate first
    this.validateFile(file, { maxSizeBytes, allowedMimeTypes });

    const formData = new FormData();
    formData.append(fieldName, file);

    // Simulate progress updates if hooks are configured
    if (onProgress) {
      let progress = 0;
      const interval = setInterval(() => {
        progress = Math.min(95, progress + Math.floor(Math.random() * 15) + 5);
        onProgress(progress);
      }, 150);

      try {
        const response = await apiClient.upload<T>(endpoint, formData, { cancelKey });
        clearInterval(interval);
        onProgress(100);
        return response;
      } catch (err) {
        clearInterval(interval);
        throw err;
      }
    }

    return apiClient.upload<T>(endpoint, formData, { cancelKey });
  },

  /**
   * Uploads multiple files.
   */
  async uploadMultiple<T>(endpoint: string, files: File[], options: UploadOptions = {}): Promise<T> {
    const { fieldName = "files", maxSizeBytes, allowedMimeTypes, cancelKey } = options;

    const formData = new FormData();
    files.forEach((file) => {
      this.validateFile(file, { maxSizeBytes, allowedMimeTypes });
      formData.append(fieldName, file);
    });

    return apiClient.upload<T>(endpoint, formData, { cancelKey });
  },

  /**
   * Generates a local browser object URL preview for media/image files.
   */
  generatePreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  },

  /**
   * Revokes generated browser preview URLs to prevent local browser memory leaks.
   */
  revokePreviewUrl(url: string) {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  },
};
export type { UploadOptions as UI_UploadOptions };
