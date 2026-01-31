
/**
 * OMNI AI - ENGINE v8.0 (FULL SYNC UPDATE)
 */

var DB_SHEET = 'OMNI_DATABASE';
var SETTINGS_SHEET = 'OMNI_SETTINGS';
var KNOWLEDGE_SHEET = 'OMNI_KNOWLEDGE';
var LOGS_SHEET = 'OMNI_RESEARCH_LOGS';
var FOLDER_NAME = 'OMNI_KNOWLEDGE_ASSETS';

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🛡️ OMNI ADMIN')
    .addItem('🚀 Sincronizar Todo', 'uiInitializeSystem')
    .addItem('🧹 Limpiar Duplicados', 'uiCleanupDuplicates')
    .addToUi();
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Endpoint para ping
    if (e && e.parameter && e.parameter.ping === 'true') return createJsonResponse({ status: 'connected', version: '7.5' });

    var getData = function (sheetName, mapper) {
      var s = ss.getSheetByName(sheetName);
      if (!s || s.getLastRow() <= 1) return [];
      return s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn()).getValues().map(mapper);
    };

    // Recuperar Configuración (API Keys, etc)
    var settings = {};
    var sSheet = ss.getSheetByName(SETTINGS_SHEET);
    if (sSheet && sSheet.getLastRow() > 1) {
      var sData = sSheet.getRange(2, 1, sSheet.getLastRow() - 1, 2).getValues();
      sData.forEach(function (r) { settings[r[0]] = r[1]; });
    }

    return createJsonResponse({
      status: 'success',
      leads: getData(DB_SHEET, function (r) {
        return { id: String(r[0]), businessName: String(r[2]), industry: String(r[3]), email: String(r[5]), phone: String(r[7]), instagram: String(r[8]), facebook: String(r[9]), aiScore: Number(r[10]), website: String(r[11]), status: String(r[12]), attackPlan: String(r[13]) };
      }),
      knowledge: getData(KNOWLEDGE_SHEET, function (r) {
        return { id: String(r[0]), category: String(r[1]), title: String(r[2]), content: String(r[3]), fileUrl: String(r[4]) };
      }),
      researchLogs: getData(LOGS_SHEET, function (r) {
        return { id: String(r[0]), date: String(r[1]), leadName: String(r[2]), plan: String(r[3]) };
      }),
      tasks: getData('OMNI_TASKS', function (r) {
        return { id: String(r[0]), title: String(r[2]), assignee: String(r[3]), priority: String(r[4]), status: String(r[5]), leadId: String(r[6]) };
      }),
      events: getData('OMNI_EVENTS', function (r) {
        return { id: String(r[0]), title: String(r[2]), date: String(r[3]), type: String(r[4]), socialNetwork: String(r[5]), status: String(r[6]) };
      }),
      campaigns: getData('OMNI_CAMPAIGNS', function (r) {
        return { id: String(r[0]), name: String(r[2]), targetIndustry: String(r[3]), description: String(r[4]), status: String(r[5]), leadsReached: Number(r[6]), openRate: String(r[7]) };
      }),
      settings: settings
    });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var request = JSON.parse(e.postData.contents);
    var action = request.action;
    var payload = request.payload;

    if (action === 'saveLead') {
      var sheet = ss.getSheetByName(DB_SHEET);
      var signature = createSignature(payload.businessName);
      var data = [
        payload.id, new Date().toLocaleString(), payload.businessName, payload.industry || '', payload.ceoName || '',
        payload.email || '', payload.linkedin || '', payload.phone || '', payload.instagram || '', payload.facebook || '',
        payload.aiScore || 0, payload.website || '', payload.status || 'NEW', payload.attackPlan || '', signature
      ];

      if (sheet.getLastRow() > 1) {
        var range = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
        var values = range.getValues();
        for (var i = 0; i < values.length; i++) {
          if (values[i][14] === signature || values[i][0] === payload.id) {
            sheet.getRange(i + 2, 1, 1, data.length).setValues([data]);
            return createJsonResponse({ status: 'updated' });
          }
        }
      }
      sheet.appendRow(data);
      return createJsonResponse({ status: 'saved' });
    }

    if (action === 'saveSetting') {
      var s = ss.getSheetByName(SETTINGS_SHEET);
      var keys = s.getRange(2, 1, s.getLastRow(), 1).getValues().map(function (r) { return r[0]; });
      var idx = keys.indexOf(payload.key);
      if (idx !== -1) {
        s.getRange(idx + 2, 2).setValue(payload.value);
      } else {
        s.appendRow([payload.key, payload.value, new Date().toLocaleString()]);
      }
      return createJsonResponse({ status: 'setting_saved' });
    }

    if (action === 'saveKnowledge') {
      var s = ss.getSheetByName(KNOWLEDGE_SHEET);
      var url = '';
      if (payload.fileData) {
        var folder = getOrCreateFolder(FOLDER_NAME);
        var file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(payload.fileData), payload.mimeType, payload.fileName));
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        url = file.getUrl();
      }
      s.appendRow([new Date().toLocaleString(), payload.category, payload.title, payload.content || '', url]);
      return createJsonResponse({ status: 'saved', url: url });
    }

    if (action === 'logResearch') {
      var s = ss.getSheetByName(LOGS_SHEET);
      s.appendRow([payload.leadId, new Date().toLocaleString(), payload.businessName, payload.attackPlan]);
      return createJsonResponse({ status: 'logged' });
    }

    // === NUEVOS HANDLERS v8.0 ===

    if (action === 'saveTask') {
      var s = ss.getSheetByName('OMNI_TASKS') || createTaskSheet(ss);
      var data = [payload.id, new Date().toLocaleString(), payload.title, payload.assignee || '', payload.priority || 'medium', payload.status || 'todo', payload.leadId || '', payload.reminderAt || ''];
      if (s.getLastRow() > 1) {
        var range = s.getRange(2, 1, s.getLastRow() - 1, 1);
        var ids = range.getValues().map(function (r) { return r[0]; });
        var idx = ids.indexOf(payload.id);
        if (idx !== -1) {
          s.getRange(idx + 2, 1, 1, data.length).setValues([data]);
          return createJsonResponse({ status: 'updated' });
        }
      }
      s.appendRow(data);
      return createJsonResponse({ status: 'saved' });
    }

    if (action === 'saveEvent') {
      var s = ss.getSheetByName('OMNI_EVENTS') || createEventSheet(ss);
      var data = [payload.id, new Date().toLocaleString(), payload.title, payload.date, payload.type || 'meeting', payload.socialNetwork || '', payload.status || 'draft'];
      if (s.getLastRow() > 1) {
        var range = s.getRange(2, 1, s.getLastRow() - 1, 1);
        var ids = range.getValues().map(function (r) { return r[0]; });
        var idx = ids.indexOf(payload.id);
        if (idx !== -1) {
          s.getRange(idx + 2, 1, 1, data.length).setValues([data]);
          return createJsonResponse({ status: 'updated' });
        }
      }
      s.appendRow(data);
      return createJsonResponse({ status: 'saved' });
    }

    if (action === 'saveCampaign') {
      var s = ss.getSheetByName('OMNI_CAMPAIGNS') || createCampaignSheet(ss);
      var data = [payload.id, new Date().toLocaleString(), payload.name, payload.targetIndustry || '', payload.description || '', payload.status || 'Draft', payload.leadsReached || 0, payload.openRate || '0%'];
      if (s.getLastRow() > 1) {
        var range = s.getRange(2, 1, s.getLastRow() - 1, 1);
        var ids = range.getValues().map(function (r) { return r[0]; });
        var idx = ids.indexOf(payload.id);
        if (idx !== -1) {
          s.getRange(idx + 2, 1, 1, data.length).setValues([data]);
          return createJsonResponse({ status: 'updated' });
        }
      }
      s.appendRow(data);
      return createJsonResponse({ status: 'saved' });
    }

    if (action === 'deleteLead') {
      var s = ss.getSheetByName(DB_SHEET);
      if (s.getLastRow() > 1) {
        var range = s.getRange(2, 1, s.getLastRow() - 1, 1);
        var ids = range.getValues().map(function (r) { return r[0]; });
        var idx = ids.indexOf(payload.id);
        if (idx !== -1) {
          s.deleteRow(idx + 2);
          return createJsonResponse({ status: 'deleted' });
        }
      }
      return createJsonResponse({ status: 'not_found' });
    }

    return createJsonResponse({ status: 'error', message: 'Unknown action' });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function createSignature(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// === HELPER FUNCTIONS v8.0 ===

function createTaskSheet(ss) {
  var sheet = ss.insertSheet('OMNI_TASKS');
  sheet.appendRow(['ID', 'DATE', 'TITLE', 'ASSIGNEE', 'PRIORITY', 'STATUS', 'LEAD_ID', 'REMINDER']);
  sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f3f4f6');
  return sheet;
}

function createEventSheet(ss) {
  var sheet = ss.insertSheet('OMNI_EVENTS');
  sheet.appendRow(['ID', 'DATE', 'TITLE', 'EVENT_DATE', 'TYPE', 'SOCIAL', 'STATUS']);
  sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f3f4f6');
  return sheet;
}

function createCampaignSheet(ss) {
  var sheet = ss.insertSheet('OMNI_CAMPAIGNS');
  sheet.appendRow(['ID', 'DATE', 'NAME', 'INDUSTRY', 'DESCRIPTION', 'STATUS', 'LEADS', 'OPEN_RATE']);
  sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f3f4f6');
  return sheet;
}

function uiInitializeSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = [
    { name: DB_SHEET, h: ['ID', 'DATE', 'NAME', 'INDUSTRY', 'CEO', 'EMAIL', 'LINKEDIN', 'PHONE', 'INSTAGRAM', 'FACEBOOK', 'SCORE', 'WEBSITE', 'STATUS', 'PLAN', 'SIGNATURE'] },
    { name: SETTINGS_SHEET, h: ['KEY', 'VALUE', 'UPDATED'] },
    { name: KNOWLEDGE_SHEET, h: ['DATE', 'CAT', 'TITLE', 'CONTENT', 'URL'] },
    { name: LOGS_SHEET, h: ['ID', 'DATE', 'NAME', 'PLAN'] },
    { name: 'OMNI_TASKS', h: ['ID', 'DATE', 'TITLE', 'ASSIGNEE', 'PRIORITY', 'STATUS', 'LEAD_ID', 'REMINDER'] },
    { name: 'OMNI_EVENTS', h: ['ID', 'DATE', 'TITLE', 'EVENT_DATE', 'TYPE', 'SOCIAL', 'STATUS'] },
    { name: 'OMNI_CAMPAIGNS', h: ['ID', 'DATE', 'NAME', 'INDUSTRY', 'DESCRIPTION', 'STATUS', 'LEADS', 'OPEN_RATE'] }
  ];
  sheets.forEach(function (s) {
    var sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.appendRow(s.h);
      sheet.getRange(1, 1, 1, s.h.length).setFontWeight('bold').setBackground('#f3f4f6');
    }
  });
  getOrCreateFolder(FOLDER_NAME);
  SpreadsheetApp.getUi().alert('✅ Omni AI v8.0 Sincronizado.');
}
