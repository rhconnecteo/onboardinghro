const SHEET_NAME = 'HRO';

const REQUIRED_BACKEND_FIELDS = [
  'matricule',
  'loginYas',
  'dateCreationYas',
  'loginCnto',
  'dateCreationCnto',
  'mailConnecteo',
];

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'list';

  if (action === 'list') {
    return jsonResponse({ ok: true, records: listRecords_() });
  }

  if (action === 'stats') {
    const records = listRecords_();
    const completed = records.filter((item) => hasAllFields_(item)).length;
    return jsonResponse({
      ok: true,
      total: records.length,
      completed,
      pending: records.length - completed,
    });
  }

  if (action === 'update') {
    const params = (e && e.parameter) || {};
    const record = {
      matricule: params.matricule || '',
      loginYas: params.loginYas || '',
      dateCreationYas: params.dateCreationYas || '',
      loginCnto: params.loginCnto || '',
      dateCreationCnto: params.dateCreationCnto || '',
      mailConnecteo: params.mailConnecteo || '',
    };

    validateRecord_(record);
    const savedRecord = updateRecord_(record);
    return jsonResponse({ ok: true, record: savedRecord });
  }

  return jsonResponse({ ok: false, message: 'Action GET non supportee.' });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action;

    if (action !== 'update') {
      return jsonResponse({ ok: false, message: 'Action POST non supportee.' });
    }

    const record = payload.record || {};
    validateRecord_(record);
    const savedRecord = updateRecord_(record);

    return jsonResponse({ ok: true, record: savedRecord });
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message });
  }
}

function listRecords_() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return [];
  }

  const headers = values[0].map((item) => normalizeHeader_(String(item)));

  return values.slice(1).map((row) => {
    const item = {};
    headers.forEach((key, index) => {
      item[key] = row[index] === null || row[index] === undefined ? '' : row[index];
    });
    return item;
  });
}

function updateRecord_(record) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map((item) => normalizeHeader_(String(item)));

  const matriculeColumn = headers.indexOf('matricule');
  if (matriculeColumn === -1) {
    throw new Error('La colonne matricule est introuvable dans la feuille.');
  }

  const rowIndex = values.findIndex((row, index) => {
    if (index === 0) {
      return false;
    }
    return String(row[matriculeColumn]) === String(record.matricule);
  });

  if (rowIndex === -1) {
    throw new Error('Matricule introuvable dans la feuille.');
  }

  const editableFields = [
    'loginYas',
    'dateCreationYas',
    'loginCnto',
    'dateCreationCnto',
    'mailConnecteo',
  ];

  editableFields.forEach((field) => {
    const column = headers.indexOf(field);
    if (column === -1) {
      return;
    }
    sheet.getRange(rowIndex + 1, column + 1).setValue(record[field] || '');
  });

  const updatedValues = sheet.getRange(rowIndex + 1, 1, 1, headers.length).getValues()[0];
  const updatedRecord = {};
  headers.forEach((header, index) => {
    updatedRecord[header] = updatedValues[index];
  });

  return updatedRecord;
}

function validateRecord_(record) {
  REQUIRED_BACKEND_FIELDS.forEach((field) => {
    if (!record[field] && field === 'matricule') {
      throw new Error('Le matricule est obligatoire.');
    }
  });
}

function hasAllFields_(record) {
  return ['loginYas', 'dateCreationYas', 'loginCnto', 'dateCreationCnto', 'mailConnecteo'].every(
    (field) => String(record[field] || '').trim()
  );
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Feuille introuvable: ' + SHEET_NAME);
  }
  return sheet;
}

function normalizeHeader_(header) {
  const map = {
    matricule: 'matricule',
    matriculegroupe: 'matriculeGroupe',
    statut: 'statut',
    'nometprenoms': 'nomPrenoms',
    fonction: 'fonction',
    rattachement: 'rattachement',
    datedintegration: 'dateIntegration',
    login: 'login',
    yas: 'loginYas',
    loginyas: 'loginYas',
    datecreationyas: 'dateCreationYas',
    datedecreationyas: 'dateCreationYas',
    logincnto: 'loginCnto',
    datecreationcnto: 'dateCreationCnto',
    datedecreationcnto: 'dateCreationCnto',
    mailconnecteo: 'mailConnecteo',
  };

  const normalized = header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  if (map[normalized]) {
    return map[normalized];
  }

  // Fallback for variants like "date de creation (yas)" or extra separators.
  if (normalized.includes('creationyas')) {
    return 'dateCreationYas';
  }

  if (normalized.includes('creationcnto')) {
    return 'dateCreationCnto';
  }

  return normalized;
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
