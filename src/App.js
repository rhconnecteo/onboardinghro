import './App.css';
import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbw8mYNiax0hTw1_kHZGINyl_yt7UhyGaKM2utrP9oz9NxQNF82RqZDAWpt6wt-Umw2bMw/exec';
const AUTH_USERNAME = 'tyfannie';
const AUTH_PASSWORD = 'onboarding';

const REQUIRED_FIELDS = [
  'loginYas',
  'dateCreationYas',
  'loginCnto',
  'dateCreationCnto',
  'mailConnecteo',
];

const FIELD_LABELS = {
  loginYas: 'Login YAS',
  dateCreationYas: 'Date de creation YAS',
  loginCnto: 'Login CNTO',
  dateCreationCnto: 'Date de creation CNTO',
  mailConnecteo: 'Mail Connecteo',
};

const SAMPLE_DATA = [
  {
    matricule: 'M1001',
    matriculeGroupe: 'G01',
    statut: 'Actif',
    nomPrenoms: 'Amina Ndao',
    fonction: 'RH Junior',
    rattachement: 'DRH',
    dateIntegration: '2026-01-12',
    login: 'andao',
    loginYas: '',
    dateCreationYas: '',
    loginCnto: '',
    dateCreationCnto: '',
    mailConnecteo: '',
  },
  {
    matricule: 'M1002',
    matriculeGroupe: 'G01',
    statut: 'Actif',
    nomPrenoms: 'Cheikh Fall',
    fonction: 'Analyste Data',
    rattachement: 'DSI',
    dateIntegration: '2025-11-08',
    login: 'cfall',
    loginYas: 'cheikh.fall',
    dateCreationYas: '2025-11-10',
    loginCnto: '',
    dateCreationCnto: '',
    mailConnecteo: '',
  },
  {
    matricule: 'M1003',
    matriculeGroupe: 'G02',
    statut: 'Actif',
    nomPrenoms: 'Fatou Diallo',
    fonction: 'Comptable',
    rattachement: 'Finance',
    dateIntegration: '2025-06-17',
    login: 'fdiallo',
    loginYas: 'fatou.diallo',
    dateCreationYas: '2025-06-18',
    loginCnto: 'fdiallo.cnto',
    dateCreationCnto: '2025-06-18',
    mailConnecteo: 'fatou.diallo@connecteo.sn',
  },
];

function hasAllRequiredValues(record) {
  return REQUIRED_FIELDS.every((field) => String(record[field] || '').trim());
}

function getMissingFields(record) {
  return REQUIRED_FIELDS.filter((field) => !String(record[field] || '').trim());
}

function getCompletionStatus(record) {
  const missing = getMissingFields(record);
  if (!missing.length) {
    return { isComplete: true, text: 'Complete', missing: [] };
  }

  return {
    isComplete: false,
    text: 'A completer',
    missing,
  };
}

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 20h4l10.5-10.5a1.8 1.8 0 0 0 0-2.5l-1.5-1.5a1.8 1.8 0 0 0-2.5 0L4 16v4Z" />
      <path d="M13.5 6.5 17.5 10.5" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M15 5v-1h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4v-1" />
    </svg>
  );
}

function IconPanelToggle() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 4v16" />
      <path d="M16 8l-4 4 4 4" />
    </svg>
  );
}

function IconTable() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 5h16v14H4z" />
      <path d="M4 10h16" />
      <path d="M10 5v14" />
      <path d="M16 5v14" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
    </svg>
  );
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toLocalDateOnly(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }

  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
}

function normalizeRecordDates(record) {
  return {
    ...record,
    dateIntegration: toLocalDateOnly(record.dateIntegration),
    dateCreationYas: toLocalDateOnly(record.dateCreationYas),
    dateCreationCnto: toLocalDateOnly(record.dateCreationCnto),
  };
}

async function fetchRecords() {
  if (!API_BASE_URL) {
    return SAMPLE_DATA.map((item) => normalizeRecordDates(item));
  }

  const response = await fetch(`${API_BASE_URL}?action=list`);
  if (!response.ok) {
    throw new Error('Impossible de charger les donnees depuis le backend.');
  }
  const payload = await response.json();
  return (payload.records || []).map((item) => normalizeRecordDates(item));
}

async function updateRecord(recordUpdate) {
  if (!API_BASE_URL) {
    return { ok: true, record: recordUpdate };
  }

  const params = new URLSearchParams({
    action: 'update',
    matricule: String(recordUpdate.matricule || ''),
    loginYas: String(recordUpdate.loginYas || ''),
    dateCreationYas: String(recordUpdate.dateCreationYas || ''),
    loginCnto: String(recordUpdate.loginCnto || ''),
    dateCreationCnto: String(recordUpdate.dateCreationCnto || ''),
    mailConnecteo: String(recordUpdate.mailConnecteo || ''),
  });

  const response = await fetch(`${API_BASE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('La mise a jour a echoue cote backend.');
  }

  return response.json();
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [yasFilter, setYasFilter] = useState('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [activeView, setActiveView] = useState('form');
  const [records, setRecords] = useState([]);
  const [selectedMatricule, setSelectedMatricule] = useState('');
  const [formState, setFormState] = useState({
    loginYas: '',
    dateCreationYas: '',
    loginCnto: '',
    dateCreationCnto: '',
    mailConnecteo: '',
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [rowActionMode, setRowActionMode] = useState('view');

  const selectedRecord = useMemo(
    () => records.find((item) => item.matricule === selectedMatricule) || records[0],
    [records, selectedMatricule]
  );

  useEffect(() => {
    if (!API_BASE_URL) {
      const demoData = SAMPLE_DATA.map((item) => normalizeRecordDates(item));
      setRecords(demoData);
      setSelectedMatricule(demoData[0]?.matricule || '');
      return;
    }

    fetchRecords()
      .then((loadedRecords) => {
        if (!loadedRecords.length) {
          setRecords([]);
          setSelectedMatricule('');
          return;
        }

        setRecords(loadedRecords);
        setSelectedMatricule(loadedRecords[0].matricule);
      })
      .catch((error) => {
        setRecords([]);
        setSelectedMatricule('');
        setErrorMessage(error.message);
      });
  }, []);

  useEffect(() => {
    if (!selectedRecord) {
      return;
    }
    setFormState({
      loginYas: selectedRecord.loginYas || '',
      dateCreationYas: toLocalDateOnly(selectedRecord.dateCreationYas),
      loginCnto: selectedRecord.loginCnto || '',
      dateCreationCnto: toLocalDateOnly(selectedRecord.dateCreationCnto),
      mailConnecteo: selectedRecord.mailConnecteo || '',
    });
  }, [selectedRecord]);

  const completedRecords = useMemo(
    () => records.filter((item) => hasAllRequiredValues(item)),
    [records]
  );

  const pendingRecords = useMemo(
    () => records.filter((item) => !hasAllRequiredValues(item)),
    [records]
  );

  const completionByField = useMemo(() => {
    return REQUIRED_FIELDS.map((field) => {
      const filledCount = records.filter((item) => String(item[field] || '').trim()).length;
      return {
        field,
        label: FIELD_LABELS[field],
        filledCount,
        percent: records.length ? Math.round((filledCount / records.length) * 100) : 0,
      };
    });
  }, [records]);

  const globalCompletionRate = records.length
    ? Math.round((completedRecords.length / records.length) * 100)
    : 0;

  const displayedRecords = useMemo(() => {
    if (yasFilter === 'missingYas') {
      return records.filter((item) => !String(item.loginYas || '').trim());
    }
    return records;
  }, [records, yasFilter]);

  useEffect(() => {
    if (!displayedRecords.length) {
      setSelectedMatricule('');
      return;
    }

    const stillVisible = displayedRecords.some((item) => item.matricule === selectedMatricule);
    if (!stillVisible) {
      setSelectedMatricule(displayedRecords[0].matricule);
    }
  }, [displayedRecords, selectedMatricule]);

  function onRowAction(matricule, mode) {
    setSelectedMatricule(matricule);
    setRowActionMode(mode);
    setStatusMessage('');
    setErrorMessage('');
  }

  async function onSubmitForm(event) {
    event.preventDefault();
    if (!selectedRecord || isSaving) {
      return;
    }

    const updatedRecord = {
      ...selectedRecord,
      ...formState,
    };

    setStatusMessage('Enregistrement en cours...');
    setErrorMessage('');
    setIsSaving(true);

    try {
      const payload = await updateRecord(updatedRecord);
      const savedRecord = normalizeRecordDates({
        ...(payload && payload.record ? payload.record : {}),
        ...updatedRecord,
      });

      setRecords((previous) =>
        previous.map((item) => (item.matricule === updatedRecord.matricule ? savedRecord : item))
      );
      setStatusMessage('Formulaire enregistre avec succes.');
    } catch (error) {
      setErrorMessage(error.message);
      setStatusMessage('');
    } finally {
      setIsSaving(false);
    }
  }

  const currentMissingFields = selectedRecord ? getMissingFields(selectedRecord) : [];

  function handleLogin(event) {
    event.preventDefault();

    if (
      loginForm.username.trim().toLowerCase() === AUTH_USERNAME &&
      loginForm.password === AUTH_PASSWORD
    ) {
      setIsAuthenticated(true);
      setLoginError('');
      setLoginForm({ username: '', password: '' });
      return;
    }

    setLoginError('Nom d\'utilisateur ou mot de passe incorrect.');
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setActiveView('form');
    setSelectedMatricule('');
    setRowActionMode('view');
    setStatusMessage('');
    setErrorMessage('');
  }

  function toggleSidebar() {
    setIsSidebarCollapsed((current) => !current);
  }

  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="login-badge">Onboarding HRO</div>
          <h1>Connexion</h1>

          <label>
            Nom d'utilisateur
            <input
              type="text"
              value={loginForm.username}
              onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
              placeholder="Entrez votre nom d'utilisateur"
            />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Entrez votre mot de passe"
            />
          </label>

          {loginError && <p className="status-ko login-error">{loginError}</p>}

          <button type="submit" className="login-btn">
            Se connecter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={isSidebarCollapsed ? 'app-shell sidebar-collapsed' : 'app-shell sidebar-expanded'}>
      <aside className={isSidebarCollapsed ? 'sidebar collapsed' : 'sidebar'}>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? 'Ouvrir la sidebar' : 'Replier la sidebar'}
          title={isSidebarCollapsed ? 'Ouvrir' : 'Replier'}
        >
          <IconPanelToggle />
        </button>
        <div className="sidebar-brand">
          <h1>{isSidebarCollapsed ? 'HRO' : 'Onboarding HRO'}</h1>
          {!isSidebarCollapsed && <p>Suivi login YAS, mail Connecteo</p>}
        </div>

        <nav className="menu">
          <button
            className={activeView === 'form' ? 'menu-btn active' : 'menu-btn'}
            onClick={() => setActiveView('form')}
            title="Formulaire"
          >
            <IconTable />
            {!isSidebarCollapsed && <span>Formulaire a completer</span>}
          </button>
          <button
            className={activeView === 'analytics' ? 'menu-btn active' : 'menu-btn'}
            onClick={() => setActiveView('analytics')}
            title="Analytiques"
          >
            <IconChart />
            {!isSidebarCollapsed && <span>Analytiques</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          {!isSidebarCollapsed && (
            <>
              <div className="stat-box">
                <span>Total</span>
                <strong>{records.length}</strong>
              </div>
              <div className="stat-box">
                <span>Complets</span>
                <strong>{completedRecords.length}</strong>
              </div>
              <div className="stat-box">
                <span>Incomplets</span>
                <strong>{pendingRecords.length}</strong>
              </div>
            </>
          )}
          <button type="button" className="logout-btn" onClick={handleLogout}>
            <IconLogout />
            {!isSidebarCollapsed && <span>{AUTH_USERNAME}</span>}
          </button>
        </div>
      </aside>

      <main className="main-content">
        {activeView === 'form' && (
          <section className="panel">
            <div className="panel-head">
              <h2>Base HRO - Formulaire et Suivi</h2>
            </div>

            <div className="table-toolbar">
              <label>
                Filtre Login YAS
                <select value={yasFilter} onChange={(event) => setYasFilter(event.target.value)}>
                  <option value="all">Tous les collaborateurs</option>
                  <option value="missingYas">Sans login YAS</option>
                </select>
              </label>
              <p>
                {displayedRecords.length} resultat(s)
                {yasFilter === 'missingYas' ? ' sans login YAS' : ''}
              </p>
            </div>

            <div className="table-wrap">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Nom et Prenoms</th>
                    <th>Fonction</th>
                    <th>Statut</th>
                    <th>Rattachement</th>
                    <th>Date integration</th>
                    <th>Login YAS</th>
                    <th>Date creation YAS</th>
                    <th>Login CNTO</th>
                    <th>Date creation CNTO</th>
                    <th>Mail Connecteo</th>
                    <th>Action</th>
                    <th>Statut completude</th>
                  </tr>
                </thead>
                <tbody>
                  {!displayedRecords.length && (
                    <tr>
                      <td colSpan="13" className="empty-cell">
                        Aucune donnee pour ce filtre.
                      </td>
                    </tr>
                  )}

                  {displayedRecords.map((item) => {
                    const completion = getCompletionStatus(item);
                    const isActive = selectedRecord?.matricule === item.matricule;
                    return (
                      <tr key={item.matricule} className={isActive ? 'active-row' : ''}>
                        <td>{item.matricule || '-'}</td>
                        <td>{item.nomPrenoms || '-'}</td>
                        <td>{item.fonction || '-'}</td>
                        <td>{item.statut || '-'}</td>
                        <td>{item.rattachement || '-'}</td>
                        <td>{toLocalDateOnly(item.dateIntegration) || '-'}</td>
                        <td>{item.loginYas || '-'}</td>
                        <td>{toLocalDateOnly(item.dateCreationYas) || '-'}</td>
                        <td>{item.loginCnto || '-'}</td>
                        <td>{toLocalDateOnly(item.dateCreationCnto) || '-'}</td>
                        <td>{item.mailConnecteo || '-'}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="action-icon-btn"
                              onClick={() => onRowAction(item.matricule, 'view')}
                              aria-label={`Visualiser ${item.matricule}`}
                              title="Visualiser"
                            >
                              <IconEye />
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn edit"
                              onClick={() => onRowAction(item.matricule, 'edit')}
                              aria-label={`Modifier ${item.matricule}`}
                              title="Modifier"
                            >
                              <IconEdit />
                            </button>
                          </div>
                        </td>
                        <td>
                          {completion.isComplete ? (
                            <span className="badge ok">Complete</span>
                          ) : (
                            <div className="missing-list">
                              <span className="badge ko">A completer</span>
                              {completion.missing.map((field) => (
                                <div key={field} className="missing-item">
                                  {FIELD_LABELS[field]}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedRecord && (
              <>
                <div className="record-details">
                  <div className="record-details-head">
                    <h3>
                      {rowActionMode === 'edit'
                        ? 'Modification du collaborateur'
                        : 'Visualisation du collaborateur'}
                    </h3>
                    <p>
                      {selectedRecord.matricule} - {selectedRecord.nomPrenoms}
                    </p>
                  </div>

                  <div className="identity-grid">
                    <div>
                      <span>Matricule Groupe</span>
                      <strong>{selectedRecord.matriculeGroupe || '-'}</strong>
                    </div>
                    <div>
                      <span>Statut</span>
                      <strong>{selectedRecord.statut || '-'}</strong>
                    </div>
                    <div>
                      <span>Fonction</span>
                      <strong>{selectedRecord.fonction || '-'}</strong>
                    </div>
                    <div>
                      <span>Rattachement</span>
                      <strong>{selectedRecord.rattachement || '-'}</strong>
                    </div>
                  </div>

                  {rowActionMode === 'edit' ? (
                    <form className="form-grid" onSubmit={onSubmitForm}>
                      <label>
                        Login YAS
                        <input
                          type="text"
                          value={formState.loginYas}
                          onChange={(event) =>
                            setFormState((current) => ({ ...current, loginYas: event.target.value }))
                          }
                          required
                        />
                      </label>

                      <label>
                        Date creation YAS
                        <input
                          type="date"
                          value={formState.dateCreationYas}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              dateCreationYas: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>

                      <label>
                        Login CNTO
                        <input
                          type="text"
                          value={formState.loginCnto}
                          onChange={(event) =>
                            setFormState((current) => ({ ...current, loginCnto: event.target.value }))
                          }
                          required
                        />
                      </label>

                      <label>
                        Date creation CNTO
                        <input
                          type="date"
                          value={formState.dateCreationCnto}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              dateCreationCnto: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>

                      <label className="full-width">
                        Mail Connecteo
                        <input
                          type="email"
                          value={formState.mailConnecteo}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              mailConnecteo: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>

                      <button type="submit" className="save-btn" disabled={isSaving}>
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </form>
                  ) : (
                    <div className="view-grid">
                      <div>
                        <span>Login YAS</span>
                        <strong>{selectedRecord.loginYas || '-'}</strong>
                      </div>
                      <div>
                        <span>Date creation YAS</span>
                        <strong>{toLocalDateOnly(selectedRecord.dateCreationYas) || '-'}</strong>
                      </div>
                      <div>
                        <span>Login CNTO</span>
                        <strong>{selectedRecord.loginCnto || '-'}</strong>
                      </div>
                      <div>
                        <span>Date creation CNTO</span>
                        <strong>{toLocalDateOnly(selectedRecord.dateCreationCnto) || '-'}</strong>
                      </div>
                      <div className="full-width">
                        <span>Mail Connecteo</span>
                        <strong>{selectedRecord.mailConnecteo || '-'}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div className="helper-box">
                  <h3>Champs manquants pour ce collaborateur</h3>
                  {currentMissingFields.length ? (
                    <ul>
                      {currentMissingFields.map((field) => (
                        <li key={field}>{FIELD_LABELS[field]}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Tous les champs requis sont renseignes.</p>
                  )}
                </div>
              </>
            )}

            {!selectedRecord && (
              <div className="helper-box">
                <h3>Aucune donnee disponible</h3>
                <p>
                  {API_BASE_URL
                    ? 'Le backend est configure, mais aucune ligne ne remonte. Verifiez le deploiement Apps Script, le nom de la feuille et les autorisations.'
                    : 'Passez en mode API pour charger vos donnees reelles.'}
                </p>
              </div>
            )}

            {statusMessage && <p className="status-ok">{statusMessage}</p>}
            {errorMessage && <p className="status-ko">{errorMessage}</p>}
          </section>
        )}

        {activeView === 'analytics' && (
          <section className="panel">
            <div className="panel-head">
              <h2>Analytiques de completion</h2>
              <p>Visualisation globale des comptes crees et des actions restantes.</p>
            </div>

            <div className="cards-grid">
              <article className="metric-card">
                <span>Taux global</span>
                <strong>{globalCompletionRate}%</strong>
              </article>
              <article className="metric-card">
                <span>Dossiers complets</span>
                <strong>{completedRecords.length}</strong>
              </article>
              <article className="metric-card">
                <span>Dossiers incomplets</span>
                <strong>{pendingRecords.length}</strong>
              </article>
            </div>

            <div className="progress-wrap">
              <div className="progress-bar">
                <span style={{ width: `${globalCompletionRate}%` }} />
              </div>
              <p>{globalCompletionRate}% des collaborateurs ont tous les champs requis.</p>
            </div>

            <div className="field-bars">
              {completionByField.map((item) => (
                <div className="field-row" key={item.field}>
                  <div className="field-meta">
                    <span>{item.label}</span>
                    <strong>{item.percent}%</strong>
                  </div>
                  <div className="line-bar">
                    <span style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="lists-grid">
              <article className="list-card">
                <h3>Sans Login YAS complet</h3>
                <ul>
                  {records
                    .filter((item) => !String(item.loginYas || '').trim())
                    .map((item) => (
                      <li key={`yas-${item.matricule}`}>
                        {item.matricule} - {item.nomPrenoms}
                      </li>
                    ))}
                </ul>
              </article>

              <article className="list-card">
                <h3>Avec Login YAS</h3>
                <ul>
                  {records
                    .filter((item) => String(item.loginYas || '').trim())
                    .map((item) => (
                      <li key={`ok-yas-${item.matricule}`}>
                        {item.matricule} - {item.nomPrenoms}
                      </li>
                    ))}
                </ul>
              </article>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
