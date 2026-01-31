
import { WorkspaceConfig } from "../types";

export class WorkspaceService {
  private config: WorkspaceConfig = {
    gasUrl: localStorage.getItem('omni_gas_url') || ''
  };

  setConfig(url: string) {
    this.config.gasUrl = url;
    if (url) localStorage.setItem('omni_gas_url', url);
    else localStorage.removeItem('omni_gas_url');
  }

  getConfig(): WorkspaceConfig { return this.config; }

  async testConnection(url: string): Promise<boolean> {
    if (!url || !url.startsWith('http')) return false;
    try {
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}ping=true`);
      if (response.ok) {
        const data = await response.json();
        return data.status === 'connected';
      }
      return false;
    } catch (e) { return false; }
  }

  async fetchSystemData(): Promise<any> {
    if (!this.config.gasUrl) return null;
    try {
      const response = await fetch(this.config.gasUrl);
      if (!response.ok) return null;
      const data = await response.json();
      
      // SINCRONIZACIÓN INTELIGENTE DE API KEYS
      if (data.settings) {
        const localKeysStr = localStorage.getItem('omni_api_keys');
        const localKeys = localKeysStr ? JSON.parse(localKeysStr) : {};
        const cloudKeys: any = {};
        
        Object.keys(data.settings).forEach(k => {
          if (k.startsWith('key_')) cloudKeys[k.replace('key_', '')] = data.settings[k];
        });

        // Solo actualizamos local si la nube tiene algo y el local está vacío o es diferente
        const mergedKeys = { ...cloudKeys, ...localKeys };
        
        // Si hay diferencias, sincronizamos hacia ambos lados
        if (JSON.stringify(localKeys) !== JSON.stringify(mergedKeys)) {
          localStorage.setItem('omni_api_keys', JSON.stringify(mergedKeys));
          // Empujar llaves locales faltantes a la nube
          for (const k of Object.keys(localKeys)) {
            if (!cloudKeys[k]) {
              await this.saveSetting(`key_${k}`, localKeys[k]);
            }
          }
        }
      }
      
      return data;
    } catch (e) { return null; }
  }

  async saveSetting(key: string, value: string): Promise<any> {
    if (!value) return; // Evitar borrar por error
    return this.executeAction('saveSetting', { key, value });
  }

  async executeAction(action: string, payload: any): Promise<any> {
    if (!this.config.gasUrl) return { status: 'offline' };
    try {
      const response = await fetch(this.config.gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, payload }),
        redirect: 'follow'
      });
      
      try {
        return await response.json();
      } catch (e) {
        return { status: 'sent' };
      }
    } catch (error) {
      console.error("Workspace Action Error:", error);
      throw error;
    }
  }
}

export const workspace = new WorkspaceService();
