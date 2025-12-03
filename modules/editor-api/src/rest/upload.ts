import { globals as api } from '../globals';

type UploadStartData = {
    /**
     * The name of the file to upload
     */
    filename: string;

    /**
     * The MIME type of the file to upload
     */
    mimeType?: string;
};

type UploadUrlsData = {
    /**
     * The ID of the upload
     */
    uploadId: string;

    /**
     * The number of parts to upload
     */
    parts: number;

    /**
     * The s3 key of the file
     */
    key: string;
};

type UploadCompleteData = {
    /**
     * The ID of the upload
     */
    uploadId: string;

    /**
     * The parts of the file to upload
     */
    parts: { PartNumber: number; ETag: string }[];

    /**
     * The s3 key of the file
     */
    key: string;
};

/**
 * Start upload process
 *
 * @param data - The data for the upload
 * @param data.filename - The name of the file to upload
 * @returns {Promise<{ uploadId: string, key: string }>} - A promise that resolves with the upload
 * ID and s3 key
 */
export const uploadStart = (data: UploadStartData): Promise<{ uploadId: string, key: string }> => {
    return fetch(`${api.apiUrl}/upload/start-upload`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Authorization': `Bearer ${api.accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(res => res.json());
};

/**
 * Upload a file and get signed URLs
 *
 * @param data - The data for the upload
 * @param data.uploadId - The ID of the upload
 * @param data.parts - The number of parts to upload
 * @param data.key - The s3 key of the file
 * @returns {Promise<{ signedUrls: string[] }>} - A promise that resolves with the signed URLs
 */
export const uploadUrls = (data: UploadUrlsData): Promise<{ signedUrls: string[] }> => {
    return fetch(`${api.apiUrl}/upload/signed-urls`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Authorization': `Bearer ${api.accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(res => res.json());
};

/**
 * Complete the upload process
 *
 * @param data - The data for the upload
 * @param data.uploadId - The ID of the upload
 * @param {{ PartNumber: number, ETag: string }[]} data.parts - The parts of the file to upload
 * @param data.key - The s3 key of the file
 * @returns {Promise<Response>} - A promise that resolves when the upload is complete
 */
export const uploadComplete = (data: UploadCompleteData): Promise<Response> => {
    return fetch(`${api.apiUrl}/upload/complete-upload`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Authorization': `Bearer ${api.accessToken}`,
            'Content-Type': 'application/json'
        }
    });
};
