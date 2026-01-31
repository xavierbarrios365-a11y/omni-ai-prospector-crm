
export type QuotaModel = 'flash' | 'pro';

interface QuotaLimits {
  rpm: number;
  rpd: number;
}

const LIMITS: Record<QuotaModel, QuotaLimits> = {
  flash: { rpm: 15, rpd: 1500 },
  pro: { rpm: 2, rpd: 50 } 
};

class QuotaService {
  private getLogs(model: QuotaModel): number[] {
    const key = `omni_quota_logs_${model}`;
    const logs = localStorage.getItem(key);
    return logs ? JSON.parse(logs) : [];
  }

  private saveLogs(model: QuotaModel, logs: number[]) {
    const key = `omni_quota_logs_${model}`;
    localStorage.setItem(key, JSON.stringify(logs));
  }

  // Registra un bloqueo real reportado por el servidor de Google (Error 429)
  markAsExhausted(model: QuotaModel) {
    const now = Date.now();
    // Guardamos la marca de tiempo del bloqueo para persistencia tras reinicio
    localStorage.setItem(`omni_real_block_ts_${model}`, now.toString());
    
    // Forzamos el contador diario a cero virtualmente
    const logs = this.getLogs(model);
    for (let i = 0; i < LIMITS[model].rpd; i++) {
      logs.push(now);
    }
    this.saveLogs(model, logs);
    window.dispatchEvent(new CustomEvent('quota_updated'));
  }

  recordRequest(model: QuotaModel, responseSize: number = 0) {
    const logs = this.getLogs(model);
    logs.push(Date.now());
    this.saveLogs(model, logs);
    
    const tokens = Math.ceil(responseSize / 4);
    const totalTokens = parseInt(localStorage.getItem('omni_tokens_total') || '0');
    localStorage.setItem('omni_tokens_total', (totalTokens + tokens).toString());
    
    window.dispatchEvent(new CustomEvent('quota_updated'));
  }

  getTotalTokens(): number {
    return parseInt(localStorage.getItem('omni_tokens_total') || '0');
  }

  getAvailability(model: QuotaModel) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneDayAgo = now - 86400000;
    
    // Verificar si hay un bloqueo real persistido
    const realBlockTs = parseInt(localStorage.getItem(`omni_real_block_ts_${model}`) || '0');
    const isUnderRealBlock = (now - realBlockTs) < 86400000; // Bloqueo de Google suele ser por 24h o hasta el ciclo

    let logs = this.getLogs(model);
    logs = logs.filter(t => t > oneDayAgo);
    this.saveLogs(model, logs);

    const rpmLogs = logs.filter(t => t > oneMinuteAgo);
    const rpdLogs = logs.filter(t => t > oneDayAgo);

    const rpmLeft = Math.max(0, LIMITS[model].rpm - rpmLogs.length);
    const rpdLeft = isUnderRealBlock ? 0 : Math.max(0, LIMITS[model].rpd - rpdLogs.length);

    let nextAvailableIn = 0;
    if (rpmLeft <= 0 || rpdLeft <= 0 || isUnderRealBlock) {
      if (rpmLeft <= 0) {
        const oldestInMinute = rpmLogs[0] || now;
        nextAvailableIn = Math.ceil((oldestInMinute + 60000 - now) / 1000);
      } else {
        // Si es bloqueo diario, calculamos hasta que pasen 24h del primer log del día
        const oldestInDay = rpdLogs[0] || realBlockTs || now;
        nextAvailableIn = Math.ceil((oldestInDay + 86400000 - now) / 1000);
      }
    }

    return {
      rpmLeft,
      rpdLeft,
      rpmTotal: LIMITS[model].rpm,
      rpdTotal: LIMITS[model].rpd,
      isBlocked: rpmLeft <= 0 || rpdLeft <= 0 || isUnderRealBlock,
      isDailyBlocked: rpdLeft <= 0 || isUnderRealBlock,
      nextAvailableIn: Math.max(0, nextAvailableIn)
    };
  }

  shouldFallbackToFlash(): boolean {
    const pro = this.getAvailability('pro');
    return pro.isDailyBlocked || (pro.isBlocked && pro.nextAvailableIn > 15);
  }
}

export const quotaService = new QuotaService();
