
// Translation definitions for Omni AI
export type Language = 'en' | 'es';

export const translations = {
  en: {
    sidebar: {
      roadmap: 'Roadmap',
      dashboard: 'Dashboard',
      prospector: 'AI Prospector',
      crm: 'CRM',
      marketing: 'Marketing',
      calendar: 'Content Strategy',
      workplan: 'Team Planner',
      knowledge: 'Knowledge Base',
      integrations: 'Integrations',
      logout: 'Log Out',
      quotaTitle: 'AI Core Quota',
      waiting: 'Refilling in {s}s'
    },
    integrations: {
      title: 'Third-Party Ecosystem',
      subtitle: 'The best tools to expand Omni AI capabilities beyond Google.',
      connect: 'Connect Tool',
      connected: 'Active',
      disconnected: 'Not Connected',
      status: 'Status',
      freeTier: 'Free Tier Limit',
      bestFor: 'Best for',
      tools: {
        apollo: {
          name: 'Apollo.io',
          desc: 'The gold standard for finding CEOs, verified emails, and direct phone numbers.',
          limit: '50 Credits / month',
          use: 'Lead Enrichment & B2B Data',
          url: 'https://www.apollo.io/'
        },
        hunter: {
          name: 'Hunter.io',
          desc: 'Find and verify professional email addresses from any domain.',
          limit: '25 Searches / month',
          use: 'Email Verification',
          url: 'https://hunter.io/'
        },
        apify: {
          name: 'Apify',
          desc: 'Cloud scrapers for Instagram, Facebook, and Google Maps without getting banned.',
          limit: '$5 Free Credit / month',
          use: 'Social Media Scraping',
          url: 'https://apify.com/'
        },
        make: {
          name: 'Make (Integromat)',
          desc: 'Connect Omni AI with WhatsApp, Telegram, or Slack via Webhooks.',
          limit: '1,000 Ops / month',
          use: 'Automation & Messaging',
          url: 'https://www.make.com/'
        }
      }
    },
    dashboard: {
      title: 'Performance Dashboard',
      subtitle: 'Real-time intelligence from your Omni AI network.',
      stat1: 'Total Leads',
      stat2: 'Active Tasks',
      stat3: 'Web Scans',
      stat4: 'AI Agents'
    },
    prospector: {
      title: 'Deep IQ Prospector',
      subtitle: 'Advanced crawling for industrial leads with direct contact data.',
      industryLabel: 'Sector / Niche',
      locationLabel: 'Location / Zone',
    },
    roadmap: {
      title: 'Development Roadmap',
      subtitle: 'Phase-by-phase implementation of the Omni AI ecosystem.',
      phases: [
        { title: 'Phase 1: Foundation', items: ['Authentication', 'Workspace Sync', 'Core UI'] },
        { title: 'Phase 2: Intelligence', items: ['Gemini Prospector', 'CRM Integration', 'AI Scoring'] },
        { title: 'Phase 3: Automation', items: ['Marketing Agents', 'Content Calendar', 'Legal Engine'] }
      ],
      analysis: 'Critical System Analysis'
    },
    crm: {
      title: 'Smart CRM',
      subtitle: 'Manage your qualified leads and track AI-driven performance.',
      colNew: 'New Leads',
      colContacted: 'Contacted',
      colQualified: 'Qualified',
      colClosed: 'Closed'
    },
    knowledge: {
      title: 'Knowledge Intelligence',
      subtitle: "Cloud-synced files, brand manuals, and strategic notes for Omni AI.",
      addCard: 'Add Material'
    },
    marketing: {
      title: 'AI Outreach Studio',
      subtitle: 'Smart marketing with Cloud brain and Lead Sync.'
    },
    calendar: {
      title: 'Content Cloud Strategy',
      subtitle: 'Full Google Calendar synchronization active.'
    },
    workplan: {
      title: 'Team Planner',
      subtitle: 'Strategic execution roadmap.',
      cols: {
        todo: 'To Do',
        progress: 'In Progress',
        done: 'Done'
      }
    },
    workspace: {
      title: 'Cloud Workspace',
    },
    login: {
      title: 'Manager User Access',
      subtitle: 'Omni AI Enterprise Portal',
      button: 'Continue with Google',
      terms: 'I ACCEPT THE LEGAL TERMS AND DATA POLICIES.',
    },
    limits: {
      title: 'System Limits & Health',
      subtitle: 'Real-time monitoring of AI Core and Cloud resources.',
      aiSection: 'Intelligence Hub',
      rpm: 'Requests Per Minute',
      rpd: 'Requests Per Day',
    }
  },
  es: {
    sidebar: {
      roadmap: 'Hoja de Ruta',
      dashboard: 'Panel de Control',
      prospector: 'Prospector IA',
      crm: 'CRM',
      marketing: 'Marketing',
      calendar: 'Estrategia de Contenido',
      workplan: 'Planificador de Equipo',
      knowledge: 'Base de Conocimiento',
      integrations: 'Integraciones',
      logout: 'Cerrar Sesión',
      quotaTitle: 'Cuota de Núcleo IA',
      waiting: 'Recarga en {s}s'
    },
    integrations: {
      title: 'Ecosistema de Terceros',
      subtitle: 'Las mejores herramientas para expandir Omni AI fuera de Google.',
      connect: 'Conectar Herramienta',
      connected: 'Activo',
      disconnected: 'No Conectado',
      status: 'Estado',
      freeTier: 'Límite Free Tier',
      bestFor: 'Ideal para',
      tools: {
        apollo: {
          name: 'Apollo.io',
          desc: 'El estándar de oro para encontrar CEOs, emails verificados y teléfonos directos.',
          limit: '50 Créditos / mes',
          use: 'Enriquecimiento de Leads y Datos B2B',
          url: 'https://www.apollo.io/'
        },
        hunter: {
          name: 'Hunter.io',
          desc: 'Encuentra y verifica correos profesionales de cualquier dominio web.',
          limit: '25 Búsquedas / mes',
          use: 'Verificación de Emails',
          url: 'https://hunter.io/'
        },
        apify: {
          name: 'Apify',
          desc: 'Scrapers en la nube para Instagram, Facebook y Maps sin bloqueos.',
          limit: '$5 Crédito Gratis / mes',
          use: 'Scraping de Redes Sociales',
          url: 'https://apify.com/'
        },
        make: {
          name: 'Make (Integromat)',
          desc: 'Conecta Omni AI con WhatsApp, Telegram o Slack vía Webhooks.',
          limit: '1,000 Ops / mes',
          use: 'Automatización y Mensajería',
          url: 'https://www.make.com/'
        }
      }
    },
    dashboard: {
      title: 'Panel de Rendimiento',
      subtitle: 'Inteligencia en tiempo real de tu red de prospección Omni AI.',
      stat1: 'Leads Totales',
      stat2: 'Tareas Activas',
      stat3: 'Escaneos Web',
      stat4: 'Agentes IA'
    },
    prospector: {
      title: 'Prospector de Inteligencia Profunda',
      subtitle: 'Rastreo avanzado de leads industriales con datos de contacto directos.',
      industryLabel: 'Industria / Nicho',
      locationLabel: 'Ubicación / Zona Industrial',
    },
    roadmap: {
      title: 'Hoja de Ruta de Desarrollo',
      subtitle: 'Implementación fase por fase del ecosistema Omni AI.',
      phases: [
        { title: 'Fase 1: Cimientos', items: ['Autenticación', 'Sincronización de Workspace', 'UI Principal'] },
        { title: 'Fase 2: Inteligencia', items: ['Prospector Gemini', 'Integración CRM', 'Puntuación IA'] },
        { title: 'Fase 3: Automatización', items: ['Agentes de Marketing', 'Calendario de Contenido', 'Motor Legal'] }
      ],
      analysis: 'Análisis Crítico del Sistema'
    },
    crm: {
      title: 'CRM Inteligente',
      subtitle: 'Gestione sus leads cualificados y siga el rendimiento impulsado por IA.',
      colNew: 'Nuevos Leads',
      colContacted: 'Contactado',
      colQualified: 'Cualificado',
      colClosed: 'Cerrado'
    },
    knowledge: {
      title: 'Inteligencia de Conocimiento',
      subtitle: 'Archivos sincronizados, manuales de marca y notas estratégicas para Omni AI.',
      addCard: 'Cargar Material'
    },
    marketing: {
      title: 'AI Outreach Studio',
      subtitle: 'Marketing inteligente con cerebro Cloud y Sincronización de Leads.'
    },
    calendar: {
      title: 'Estrategia de Contenido Cloud',
      subtitle: 'Sincronización total con Google Calendar activa.'
    },
    workplan: {
      title: 'Planificador de Equipo',
      subtitle: 'Mapa de ruta de ejecución estratégica.',
      cols: {
        todo: 'Por Hacer',
        progress: 'En Progreso',
        done: 'Hecho'
      }
    },
    workspace: {
      title: 'Espacio de Trabajo Cloud',
    },
    login: {
      title: 'Acceso de Usuario Manager',
      subtitle: 'Portal Corporativo Omni AI',
      button: 'Continuar con Google',
      terms: 'ACEPTO LOS TÉRMINOS LEGALES Y POLÍTICAS DE DATOS.',
    },
    limits: {
      title: 'Límites y Salud del Sistema',
      subtitle: 'Monitorización en tiempo real de IA Core y recursos Cloud.',
      aiSection: 'Centro de Inteligencia',
      rpm: 'Peticiones Por Minuto',
      rpd: 'Peticiones Por Día',
    }
  }
};
