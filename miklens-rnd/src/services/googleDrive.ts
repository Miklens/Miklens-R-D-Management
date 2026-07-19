// Google Drive Service for Document Storage
// This service handles uploading, storing, and retrieving documents from Google Drive

import { v4 as uuidv4 } from 'uuid';
import { AttachedDocument, getDocumentType } from '../types/timeTracking';

// Google Drive API configuration
// Note: You'll need to set up Google Drive API in Google Cloud Console
// and configure OAuth 2.0 credentials

const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const GOOGLE_DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

// Configuration - these should be in environment variables
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any = null;
let accessToken: string | null = null;

// Initialize Google API client
export const initGoogleDrive = async (): Promise<boolean> => {
  try {
    // Check if Google Identity Services is available
    if (typeof window !== 'undefined' && (window as any).google) {
      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            accessToken = response.access_token;
          }
        },
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to initialize Google Drive:', error);
    return false;
  }
};

// Request access token
export const authorizeGoogleDrive = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!tokenClient) {
      resolve(null);
      return;
    }
    
    tokenClient.callback = (response: any) => {
      if (response.access_token) {
        accessToken = response.access_token;
        resolve(response.access_token);
      } else {
        resolve(null);
      }
    };
    
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

// Get or refresh access token
const getAccessToken = (): string | null => {
  return accessToken;
};

// Create a folder in Google Drive
export const createDriveFolder = async (folderName: string, parentFolderId?: string): Promise<string | null> => {
  const token = getAccessToken();
  if (!token) return null;

  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  try {
    const response = await fetch(`${GOOGLE_DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (response.ok) {
      const data = await response.json();
      return data.id;
    }
    return null;
  } catch (error) {
    console.error('Error creating folder:', error);
    return null;
  }
};

// Upload file to Google Drive
export const uploadToDrive = async (
  file: File,
  folderId?: string,
  scientistId?: string,
  date?: string
): Promise<{ fileId: string; webViewLink: string } | null> => {
  const token = getAccessToken();
  if (!token) {
    console.warn('Not authorized with Google Drive');
    return null;
  }

  try {
    // Create metadata
    const timestamp = date || new Date().toISOString().split('T')[0];
    const fileName = `${timestamp}_${scientistId || 'doc'}_${file.name}`;
    
    const metadata: any = {
      name: fileName,
      mimeType: file.type,
    };
    
    if (folderId) {
      metadata.parents = [folderId];
    }

    // Multipart upload
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch(`${GOOGLE_DRIVE_UPLOAD_BASE}/files?uploadType=multipart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: form,
    });

    if (response.ok) {
      const data = await response.json();
      return {
        fileId: data.id,
        webViewLink: data.webViewLink,
      };
    }
    return null;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

// Upload multiple files to Google Drive
export const uploadMultipleToDrive = async (
  files: File[],
  folderId?: string,
  scientistId?: string,
  date?: string
): Promise<AttachedDocument[]> => {
  const uploadedDocs: AttachedDocument[] = [];

  for (const file of files) {
    const result = await uploadToDrive(file, folderId, scientistId, date);
    if (result) {
      uploadedDocs.push({
        id: uuidv4(),
        name: file.name,
        type: getDocumentType(file.type),
        url: result.webViewLink,
        driveFileId: result.fileId,
        uploadedAt: new Date().toISOString(),
        size: file.size,
      });
    }
  }

  return uploadedDocs;
};

// Delete file from Google Drive
export const deleteFromDrive = async (fileId: string): Promise<boolean> => {
  const token = getAccessToken();
  if (!token) return false;

  try {
    const response = await fetch(`${GOOGLE_DRIVE_API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Get file metadata from Google Drive
export const getDriveFileMetadata = async (fileId: string): Promise<any | null> => {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(
      `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,size,webViewLink,createdTime`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return null;
  }
};

// Check if Google Drive is authorized
export const isDriveAuthorized = (): boolean => {
  return accessToken !== null;
};

// Sign out from Google Drive
export const signOutGoogleDrive = (): void => {
  accessToken = null;
  if (typeof window !== 'undefined' && (window as any).google) {
    (window as any).google.accounts.oauth2.revoke(accessToken);
  }
};

// Fallback: Store documents in Firebase Storage (if Google Drive fails or isn't set up)
export const getFallbackStorageMessage = (): string => {
  return 'To enable Google Drive storage, please configure VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY in your environment variables.';
};