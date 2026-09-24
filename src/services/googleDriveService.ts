/**
 * Google Drive Service for Synthexis
 * Handles authentication, file operations, and sync with Google Drive
 */

import { google } from 'googleapis';
import type { DebateSession as Session, SessionMetadata } from '../types';

const APP_FOLDER_NAME = 'Synthexis_Data';
const SESSIONS_FOLDER_NAME = 'sessions';
const METADATA_FILE_NAME = 'synthexis_metadata.json';

export class GoogleDriveService {
  private accessToken: string | null = null;
  private gapiClient: any = null;

  constructor() {
    // Initialize GAPI client when needed
  }

  /**
   * Check if Drive service is connected
   */
  async isConnected(): Promise<boolean> {
    return Boolean(this.accessToken);
  }

  /**
   * Get total storage usage in MB
   */
  async getStorageUsage(): Promise<{ usedMB: number }> {
    try {
      const files = await this.listAllSessions('sessions');
      const totalBytes = files.reduce((acc: number, f: any) => acc + (Number(f.size) || 0), 0);
      return { usedMB: totalBytes / (1024 * 1024) };
    } catch {
      return { usedMB: 0 };
    }
  }

  /**
   * List sessions
   */
  async listSessions(): Promise<any[]> {
    try {
      return await this.listAllSessions('sessions');
    } catch {
      return [];
    }
  }

  /**
   * Initialize the Google API client with access token
   */
  async initialize(accessToken: string): Promise<void> {
    this.accessToken = accessToken;
    
    // Load GAPI client dynamically
    if (!(window as any).gapi) {
      await this.loadGAPIScript();
    }
    
    this.gapiClient = (window as any).gapi.client;
  }

  /**
   * Load Google API script dynamically
   */
  private loadGAPIScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).gapi) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        (window as any).gapi.load('client', resolve);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Ensure the app folder structure exists in Drive
   */
  async ensureAppFolderStructure(): Promise<{ appFolderId: string; sessionsFolderId: string }> {
    await this.initGAPIClient();
    
    // Find or create main app folder
    const appFolder = await this.findOrCreateFolder(APP_FOLDER_NAME, 'root');
    
    // Find or create sessions subfolder
    const sessionsFolder = await this.findOrCreateFolder(SESSIONS_FOLDER_NAME, appFolder.id);
    
    return {
      appFolderId: appFolder.id,
      sessionsFolderId: sessionsFolder.id
    };
  }

  /**
   * Initialize GAPI client
   */
  private async initGAPIClient(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Access token not set. Call initialize() first.');
    }
    
    await this.gapiClient.init({
      apiKey: '', // Not needed for OAuth
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    });
    
    this.gapiClient.setToken({ access_token: this.accessToken });
  }

  /**
   * Find existing folder or create new one
   */
  private async findOrCreateFolder(name: string, parentId: string): Promise<any> {
    // Try to find existing folder
    const response = await this.gapiClient.drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    
    if (response.result.files && response.result.files.length > 0) {
      return response.result.files[0];
    }
    
    // Create new folder
    const createResponse = await this.gapiClient.drive.files.create({
      resource: {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id, name',
    });
    
    return createResponse.result;
  }

  /**
   * Search for existing metadata file
   */
  async findMetadataFile(sessionsFolderId: string): Promise<any | null> {
    const response = await this.gapiClient.drive.files.list({
      q: `name='${METADATA_FILE_NAME}' and '${sessionsFolderId}' in parents and trashed=false`,
      fields: 'files(id, name, modifiedTime)',
      spaces: 'drive',
    });
    
    if (response.result.files && response.result.files.length > 0) {
      return response.result.files[0];
    }
    
    return null;
  }

  /**
   * Read metadata file content
   */
  async readMetadataFile(fileId: string): Promise<SessionMetadata[]> {
    const response = await this.gapiClient.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });
    
    return response.result.sessions || [];
  }

  /**
   * Create new metadata file
   */
  async createMetadataFile(sessionsFolderId: string, sessions: SessionMetadata[] = []): Promise<any> {
    const boundary = '-------314159265358979323846';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const close_delim = '\r\n--' + boundary + '--';
    
    const metadata = {
      sessions: sessions,
      lastSync: new Date().toISOString(),
      version: '1.0'
    };
    
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      close_delim;
    
    const response = await this.gapiClient.request({
      path: '/upload/drive/v3/files',
      method: 'POST',
      params: {
        uploadType: 'multipart',
        fields: 'id, name, modifiedTime',
      },
      headers: {
        'Content-Type': 'multipart/related; boundary="' + boundary + '"',
      },
      body: multipartRequestBody,
    });
    
    // Set file metadata
    await this.gapiClient.drive.files.update({
      fileId: response.result.id,
      addParents: sessionsFolderId,
      removeParents: 'root',
    });
    
    return response.result;
  }

  /**
   * Update metadata file
   */
  async updateMetadataFile(fileId: string, sessions: SessionMetadata[]): Promise<void> {
    const metadata = {
      sessions: sessions,
      lastSync: new Date().toISOString(),
      version: '1.0'
    };
    
    const mediaBody = JSON.stringify(metadata);
    
    await this.gapiClient.drive.files.update({
      fileId: fileId,
      media: {
        mimeType: 'application/json',
        body: mediaBody,
      },
    });
  }

  /**
   * Save session file to Drive
   */
  async saveSession(session: Session, sessionsFolderId: string): Promise<any> {
    const fileName = `session_${session.id}.json`;
    
    // Check if file already exists
    const existingFile = await this.findSessionFile(fileName, sessionsFolderId);
    
    const mediaBody = JSON.stringify(session, null, 2);
    
    if (existingFile) {
      // Update existing file
      return await this.gapiClient.drive.files.update({
        fileId: existingFile.id,
        media: {
          mimeType: 'application/json',
          body: mediaBody,
        },
      });
    } else {
      // Create new file
      const response = await this.gapiClient.drive.files.create({
        resource: {
          name: fileName,
          mimeType: 'application/json',
          parents: [sessionsFolderId],
        },
        media: {
          mimeType: 'application/json',
          body: mediaBody,
        },
        fields: 'id, name, modifiedTime',
      });
      
      return response.result;
    }
  }

  /**
   * Find session file by name
   */
  private async findSessionFile(fileName: string, sessionsFolderId: string): Promise<any | null> {
    const response = await this.gapiClient.drive.files.list({
      q: `name='${fileName}' and '${sessionsFolderId}' in parents and trashed=false`,
      fields: 'files(id, name, modifiedTime)',
      spaces: 'drive',
    });
    
    if (response.result.files && response.result.files.length > 0) {
      return response.result.files[0];
    }
    
    return null;
  }

  /**
   * Load session from Drive
   */
  async loadSession(sessionId: string, sessionsFolderId: string): Promise<Session | null> {
    const fileName = `session_${sessionId}.json`;
    const file = await this.findSessionFile(fileName, sessionsFolderId);
    
    if (!file) {
      return null;
    }
    
    const response = await this.gapiClient.drive.files.get({
      fileId: file.id,
      alt: 'media',
    });
    
    return response.result as Session;
  }

  /**
   * List all session files in Drive (convenience method with size info)
   */
  async listAllSessions(sessionsFolderIdOrName: string): Promise<any[]> {
    // If it's a folder name, get the ID first
    let folderId = sessionsFolderIdOrName;
    if (!sessionsFolderIdOrName.includes('-')) {
      // It's likely a name, try to get folder
      try {
        const { sessionsFolderId } = await this.ensureAppFolderStructure();
        folderId = sessionsFolderId;
      } catch (e) {
        console.error('Could not get folder structure:', e);
        return [];
      }
    }
    
    const response = await this.gapiClient.drive.files.list({
      q: `name starts with 'session_' and name ends with '.json' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, modifiedTime, size)',
      spaces: 'drive',
      orderBy: 'modifiedTime desc',
    });
    
    return response.result.files || [];
  }

  /**
   * Delete session file by ID (convenience method)
   */
  async deleteSessionById(sessionId: string): Promise<void> {
    const { sessionsFolderId } = await this.ensureAppFolderStructure();
    await this.deleteSession(sessionId, sessionsFolderId);
  }

  /**
   * List all session metadata (legacy method)
   */
  async listSessionMetadata(sessionsFolderId: string): Promise<SessionMetadata[]> {
    const files = await this.listAllSessions(sessionsFolderId);
    
    return files.map((file: any) => {
      const match = file.name.match(/session_(.+)\.json/);
      return {
        id: match ? match[1] : file.id,
        title: `Session ${match ? match[1].substring(0, 8) : 'unknown'}...`,
        createdAt: file.modifiedTime,
        updatedAt: file.modifiedTime,
        promptCount: 0,
      };
    });
  }

  /**
   * Delete session file
   */
  async deleteSession(sessionId: string, sessionsFolderId: string): Promise<void> {
    const fileName = `session_${sessionId}.json`;
    const file = await this.findSessionFile(fileName, sessionsFolderId);
    
    if (file) {
      await this.gapiClient.drive.files.delete({
        fileId: file.id,
      });
    }
  }

  /**
   * Sync local sessions with Drive
   */
  async syncWithDrive(
    localSessions: Session[],
    accessToken: string
  ): Promise<{ sessions: SessionMetadata[]; conflicts: string[] }> {
    await this.initialize(accessToken);
    const { sessionsFolderId } = await this.ensureAppFolderStructure();
    
    const conflicts: string[] = [];
    const remoteSessions = await this.listAllSessions(sessionsFolderId);
    
    // Upload all local sessions
    for (const session of localSessions) {
      try {
        await this.saveSession(session, sessionsFolderId);
      } catch (error) {
        console.error(`Failed to sync session ${session.id}:`, error);
        conflicts.push(session.id);
      }
    }
    
    // Update metadata file
    const metadataFile = await this.findMetadataFile(sessionsFolderId);
    const sessionMetadata: SessionMetadata[] = localSessions.map(s => ({
      id: s.id,
      title: (s as any).title || s.prompt?.substring(0, 30) || `Session ${s.id.substring(0, 8)}`,
      createdAt: new Date(s.createdAt).toISOString(),
      updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
      promptCount: s.steps?.length || 0,
    }));
    
    if (metadataFile) {
      await this.updateMetadataFile(metadataFile.id, sessionMetadata);
    } else {
      await this.createMetadataFile(sessionsFolderId, sessionMetadata);
    }
    
    return { sessions: sessionMetadata, conflicts };
  }
}

export const driveService = new GoogleDriveService();
export const googleDriveService = driveService;

