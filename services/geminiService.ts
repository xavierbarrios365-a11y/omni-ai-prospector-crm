
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, LeadStatus, Task, Campaign, StrategyGuide, CalendarEvent, AIModelPreference } from "../types";
import { quotaService, QuotaModel } from "./quotaService";
import { workspace } from "./workspaceService";

export class GeminiService {
  private get ai() {
    const key = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    return new GoogleGenAI({ apiKey: key });
  }

  private getCacheKey(contents: any, model: string): string {
    return `omni_cache_${btoa(JSON.stringify(contents)).substring(0, 32)}_${model}`;
  }

  private async callWithResilience(modelType: QuotaModel, config: any, contents: any, retries = 3, forceModel?: AIModelPreference) {
    let activeModel: QuotaModel = modelType;

    if (forceModel && forceModel !== 'auto') {
      activeModel = forceModel as QuotaModel;
    } else if (modelType === 'pro' && quotaService.shouldFallbackToFlash()) {
      activeModel = 'flash';
    }

    const modelName = activeModel === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    // MAGIA: Verificar Caché
    const cacheKey = this.getCacheKey(contents, modelName);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < 86400000) { // 24h
        console.log(`✨ [Token Magic] Rescatando respuesta de caché para ${modelName}`);
        quotaService.recordSavedTokens(data.length);
        return { text: data };
      }
    }

    const quota = quotaService.getAvailability(activeModel);
    if (quota.isBlocked) {
      throw new Error(`CORE_QUOTA_ERROR: ${activeModel.toUpperCase()} agotado.`);
    }

    for (let i = 0; i < retries; i++) {
      try {
        const response = await this.ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            ...config,
            systemInstruction: "ERES UN AUDITOR B2B. RESPONDE SIEMPRE EN JSON PLANO.",
          }
        });

        const responseText = response.text || "";

        // MAGIA: Guardar en Caché
        localStorage.setItem(cacheKey, JSON.stringify({ data: responseText, ts: Date.now() }));

        quotaService.recordRequest(activeModel, responseText.length);
        return response;
      } catch (e: any) {
        const errorMsg = e.message?.toLowerCase() || "";

        // DETECCIÓN DE CUOTA AGOTADA REAL
        if (errorMsg.includes("quota") || errorMsg.includes("429") || errorMsg.includes("limit")) {
          quotaService.markAsExhausted(activeModel);
          throw new Error("USER_EXCEEDED_QUOTA");
        }

        if (i === retries - 1) {
          throw new Error("CORE_CONNECTION_FAILURE");
        }
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
      }
    }
    throw new Error("CORE_CONNECTION_FAILURE");
  }

  async enhanceLeadData(lead: Lead, knowledgeContext: string = "", preference?: AIModelPreference): Promise<Partial<Lead>> {
    const prompt = `AUDITORÍA: "${lead.businessName}" URL: ${lead.website} \n CONTEXTO: ${knowledgeContext.substring(0, 1000)} \n JSON con email, phone, attackPlan.`;
    const res = await this.callWithResilience("flash", { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }, prompt, 3, preference);
    return JSON.parse(res.text || "{}");
  }

  async prospectLeads(industry: string, location: string, limit: number = 10, preference?: AIModelPreference): Promise<{ leads: Lead[], sources: any[] }> {
    const prompt = `Lista JSON de ${limit} empresas reales de "${industry}" en "${location}" con URLs oficiales.`;
    const search = await this.callWithResilience("pro", { tools: [{ googleSearch: {} }] }, prompt, 3, preference);
    const extraction = await this.callWithResilience("flash", { responseMimeType: "application/json" }, `Convierte a JSON: ${search.text}`, 2, preference);
    const leads = JSON.parse(extraction.text || "[]");
    return { leads: leads.map((l: any) => ({ ...l, id: `lead-${Date.now()}`, status: LeadStatus.NEW, aiScore: 70 })), sources: [] };
  }

  async generateCampaign(industry: string, objective: string, preference?: AIModelPreference): Promise<{ campaign: Campaign, tasks: Task[] }> {
    const prompt = `Campaña para "${industry}". Objetivo: ${objective}. JSON.`;
    const res = await this.callWithResilience("flash", { responseMimeType: "application/json" }, prompt, 2, preference);
    const data = JSON.parse(res.text || "{}");
    return {
      campaign: { ...data.campaign, id: `c-${Date.now()}`, leadsReached: 0, status: 'Draft', openRate: "0%" },
      tasks: (data.tasks || []).map((t: any) => ({ ...t, id: `t-${Date.now()}`, status: 'todo' }))
    };
  }

  async suggestContentIdeas(leads: Lead[], preference?: AIModelPreference): Promise<Partial<CalendarEvent>[]> {
    const prompt = `Ideas contenido para: ${leads.map(l => l.businessName).join(",")}. JSON.`;
    const res = await this.callWithResilience("flash", { responseMimeType: "application/json" }, prompt, 2, preference);
    return JSON.parse(res.text || "[]");
  }

  async generateStrategicPlan(leads: Lead[], preference?: AIModelPreference): Promise<Task[]> {
    const prompt = `Tareas estratégicas para: ${leads.map(l => l.businessName).join(",")}. JSON.`;
    const res = await this.callWithResilience("pro", { responseMimeType: "application/json" }, prompt, 2, preference);
    return JSON.parse(res.text || "[]").map((t: any) => ({ ...t, id: `st-${Date.now()}`, status: 'todo' }));
  }

  /**
   * CEREBRO OMNI: Responde preguntas basadas en el contexto de la base de conocimiento.
   */
  async askQuestion(query: string, context: string, preference?: AIModelPreference): Promise<string> {
    const prompt = `CONTEXTO ESTRATÉGICO:\n${context}\n\nPREGUNTA DEL USUARIO: ${query}\n\nResponde de forma técnica, estratégica y concisa. Si no está en el contexto, usa tu conocimiento B2B general pero prioriza los documentos.`;
    const res = await this.callWithResilience("flash", {}, prompt, 2, preference);
    return res.text || "No pude procesar una respuesta.";
  }

  /**
   * MARKETING ENGINE: Genera un copy de ataque personalizado para un lead y campaña.
   */
  async generateMarketingCopy(lead: Lead, campaign: Campaign, preference?: AIModelPreference): Promise<string> {
    const prompt = `GENERA UN MENSAJE DE OUTREACH PERSONALIZADO.
    LEAD: ${lead.businessName} (Industria: ${lead.industry})
    CAMPAÑA: ${campaign.name}
    OBJETIVO: ${campaign.description}
    WEBSITE DEL LEAD: ${lead.website}
    
    El mensaje debe ser corto, directo al grano y enfocado en el valor B2B. Máximo 3 párrafos cortos.`;
    const res = await this.callWithResilience("flash", {}, prompt, 2, preference);
    return res.text || "Error generando el copy.";
  }

  /**
   * Verifica la conexión real probando una respuesta mínima.
   * Esto permite detectar si la API Key es válida y si hay cuota disponible.
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Usamos flash para la prueba para no consumir cuota Pro
      // Un prompt mínimo para verificar disponibilidad
      await this.callWithResilience("flash", {}, "ping", 1);
      return { success: true, message: "Conexión exitosa con Gemini AI." };
    } catch (e: any) {
      if (e.message === "USER_EXCEEDED_QUOTA") {
        return { success: false, message: "Cuota agotada (429). Intente más tarde." };
      }
      return { success: false, message: e.message || "Error de conexión con el proveedor." };
    }
  }
}

export const gemini = new GeminiService();
