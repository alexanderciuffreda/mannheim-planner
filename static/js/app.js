/**
 * Mannheim DS Planner - Cloud Version
 * 
 * All state is stored in LocalStorage.
 * Server only provides read-only catalog data.
 */

const STORAGE_KEY = 'mmds_planner_selections';
const STORAGE_KEY_LANG = 'mmds_planner_lang';
const STORAGE_VERSION = '1.0';

// =============================================================================
// Internationalization (i18n)
// =============================================================================

const i18n = {
  de: {
    // Header
    cloud_version: 'Cloud Version - Daten werden lokal im Browser gespeichert',
    export: 'Export',
    
    // KPI Cards
    ects_planned: 'ECTS geplant',
    modules: 'Module',
    planned: 'geplant',
    completed: 'abgeschlossen',
    progress: 'Fortschritt',
    areas: 'Bereiche',
    filter: 'Filter',
    all_areas: 'Alle Bereiche',
    filter_active: 'Filter aktiv',
    reset: 'Zurücksetzen',
    
    // Progress Section
    progress_by_area: 'Fortschritt nach Bereich',
    click_to_filter: 'Klicke auf einen Bereich um zu filtern',
    
    // Module Section
    modules_title: 'Module',
    in_catalog: 'im Katalog',
    search_placeholder: 'Module suchen...',
    title: 'Titel',
    h_index: 'H-Index',
    
    // Planned Section
    planned_section: 'Geplant',
    remove_all: 'Alle entfernen',
    confirm_remove_all: 'Alle geplanten Module entfernen?',
    
    // Catalog Section
    catalog: 'Katalog',
    modules_available: 'Module verfügbar',
    variable: 'Variabel',
    ects_available: 'ECTS verfügbar',
    of: 'von',
    add: 'Hinzufügen',
    no_modules_found: 'Keine Module gefunden.',
    reset_filter: 'Filter zurücksetzen',
    
    // Export
    export_plan: 'Plan exportieren',
    formatted_text: 'Formatierter Text',
    spreadsheet: 'Tabellenkalkulation',
    structured_data: 'Strukturierte Daten',
    backup: 'Backup',
    save_backup: 'Backup speichern',
    save_local_data: 'Lokale Daten sichern',
    load_backup: 'Backup laden',
    restore_data: 'Daten wiederherstellen',
    
    // Messages
    loading_catalog: 'Katalog wird geladen...',
    error_loading: 'Fehler beim Laden des Katalogs.',
    error_saving: 'Fehler beim Speichern. Bitte LocalStorage-Limit prüfen.',
    export_failed: 'Export fehlgeschlagen.',
    invalid_file: 'Ungültige Datei.',
    import_error: 'Fehler beim Importieren',
    import_confirm: 'Module importieren? Aktuelle Planung wird ersetzt.',
    enter_ects: 'Bitte ECTS-Anzahl eingeben (mind. 1)',
    enter_ects_ac: 'Bitte ECTS-Anzahl eingeben für Additional Course Module.',
    max_ects_available: 'Maximal {n} ECTS verfügbar',
    
    // Footer
    footer_cloud: 'Mannheim DS Planner - Cloud Version',
    footer_storage: 'Daten werden lokal im Browser gespeichert (LocalStorage)',
    
    // Metrics
    citations: 'Zitationen',
    k_citations: 'K Zitationen',
  },
  
  en: {
    // Header
    cloud_version: 'Cloud Version - Data stored locally in browser',
    export: 'Export',
    
    // KPI Cards
    ects_planned: 'ECTS Planned',
    modules: 'Modules',
    planned: 'planned',
    completed: 'completed',
    progress: 'Progress',
    areas: 'Areas',
    filter: 'Filter',
    all_areas: 'All Areas',
    filter_active: 'Filter active',
    reset: 'Reset',
    
    // Progress Section
    progress_by_area: 'Progress by Area',
    click_to_filter: 'Click on an area to filter',
    
    // Module Section
    modules_title: 'Modules',
    in_catalog: 'in catalog',
    search_placeholder: 'Search modules...',
    title: 'Title',
    h_index: 'H-Index',
    
    // Planned Section
    planned_section: 'Planned',
    remove_all: 'Remove All',
    confirm_remove_all: 'Remove all planned modules?',
    
    // Catalog Section
    catalog: 'Catalog',
    modules_available: 'modules available',
    variable: 'Variable',
    ects_available: 'ECTS available',
    of: 'of',
    add: 'Add',
    no_modules_found: 'No modules found.',
    reset_filter: 'Reset filter',
    
    // Export
    export_plan: 'Export Plan',
    formatted_text: 'Formatted text',
    spreadsheet: 'Spreadsheet',
    structured_data: 'Structured data',
    backup: 'Backup',
    save_backup: 'Save Backup',
    save_local_data: 'Save local data',
    load_backup: 'Load Backup',
    restore_data: 'Restore data',
    
    // Messages
    loading_catalog: 'Loading catalog...',
    error_loading: 'Error loading catalog.',
    error_saving: 'Error saving. Please check LocalStorage limit.',
    export_failed: 'Export failed.',
    invalid_file: 'Invalid file.',
    import_error: 'Import error',
    import_confirm: 'Import modules? Current plan will be replaced.',
    enter_ects: 'Please enter ECTS (min. 1)',
    enter_ects_ac: 'Please enter ECTS for Additional Course module.',
    max_ects_available: 'Maximum {n} ECTS available',
    
    // Footer
    footer_cloud: 'Mannheim DS Planner - Cloud Version',
    footer_storage: 'Data stored locally in browser (LocalStorage)',
    
    // Metrics
    citations: 'citations',
    k_citations: 'K citations',
  }
};

// =============================================================================
// LocalStorage Functions
// =============================================================================

function loadSelectionsFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    // Version check for future migrations
    if (parsed.version !== STORAGE_VERSION) {
      console.log('Storage version mismatch, migrating...');
      // Future migration logic here
    }
    return parsed.selections || [];
  } catch (e) {
    console.error('Failed to load selections from storage:', e);
    return [];
  }
}

function saveSelectionsToStorage(selections, lang = 'de') {
  try {
    const data = {
      version: STORAGE_VERSION,
      selections: selections,
      lastModified: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save selections to storage:', e);
    alert(i18n[lang]?.error_saving || i18n.de.error_saving);
  }
}

function generateSelectionId() {
  return 'sel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// =============================================================================
// Alpine.js App
// =============================================================================

function plannerApp() {
  return {
    // Data from server (read-only)
    catalog: [],
    rules: null,
    areaColors: {},
    
    // User state (LocalStorage)
    selections: [],
    
    // UI state
    filters: { q: '', areas: [] },
    sort: { by: 'title', dir: 'asc' },
    collapsedAreas: { planned: [], catalog: [] },
    additionalCourseEcts: {},
    loading: true,
    error: null,
    
    // Language
    lang: localStorage.getItem(STORAGE_KEY_LANG) || 'de',
    
    // ==========================================================================
    // Initialization
    // ==========================================================================
    
    async init() {
      try {
        // Load catalog from server
        const response = await fetch('/api/catalog');
        if (!response.ok) throw new Error('Failed to load catalog');
        const data = await response.json();
        
        this.catalog = data.courses || [];
        this.rules = data.rules || {};
        this.areaColors = data.area_colors || {};
        
        // Load selections from LocalStorage
        this.selections = loadSelectionsFromStorage();
        
        this.loading = false;
        
        // Initialize chart after DOM is ready
        this.$nextTick(() => this.renderChart());
      } catch (e) {
        console.error('Init failed:', e);
        this.error = this.t('error_loading');
        this.loading = false;
      }
    },
    
    // ==========================================================================
    // Computed Properties
    // ==========================================================================
    
    get courses() {
      // Merge catalog with selections
      const selectionMap = {};
      for (const sel of this.selections) {
        if (!selectionMap[sel.course_id]) {
          selectionMap[sel.course_id] = [];
        }
        selectionMap[sel.course_id].push(sel);
      }
      
      let result = [];
      
      for (const course of this.catalog) {
        const courseSelections = selectionMap[course.id] || [];
        
        if (course.is_additional_course) {
          // AC modules: show each selection as separate entry
          for (const sel of courseSelections) {
            result.push({
              ...course,
              ects: sel.ects || course.ects,
              status: sel.status,
              completed: sel.status === 'completed',
              selection_id: sel.selection_id,
            });
          }
          
          // Also show catalog entry if remaining ECTS > 0
          const plannedEcts = courseSelections.reduce((sum, s) => sum + (s.ects || 0), 0);
          const remaining = (course.max_ects || 18) - plannedEcts;
          if (remaining > 0) {
            result.push({
              ...course,
              status: '',
              completed: false,
              selection_id: null,
              remaining_ects: remaining,
              planned_ects: plannedEcts,
            });
          }
        } else {
          // Regular courses
          const sel = courseSelections[0];
          result.push({
            ...course,
            status: sel ? sel.status : '',
            completed: sel?.status === 'completed',
            selection_id: sel?.selection_id || null,
          });
        }
      }
      
      // Apply filters
      if (this.filters.q) {
        const q = this.filters.q.toLowerCase();
        result = result.filter(c => 
          c.title.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.professor.toLowerCase().includes(q)
        );
      }
      
      if (this.filters.areas.length > 0) {
        result = result.filter(c => this.filters.areas.includes(c.area_id));
      }
      
      // Sort
      const sortKey = this.sort.by;
      const sortDir = this.sort.dir === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        let aVal = a[sortKey] || '';
        let bVal = b[sortKey] || '';
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return -1 * sortDir;
        if (aVal > bVal) return 1 * sortDir;
        return 0;
      });
      
      return result;
    },
    
    get summary() {
      let plannedEcts = 0;
      let completedEcts = 0;
      
      for (const sel of this.selections) {
        const course = this.catalog.find(c => c.id === sel.course_id);
        const ects = sel.ects || course?.ects || 0;
        plannedEcts += ects;
        if (sel.status === 'completed') {
          completedEcts += ects;
        }
      }
      
      return {
        planned_ects: plannedEcts,
        completed_ects: completedEcts,
        progress: plannedEcts / 120,
      };
    },
    
    get area_progress() {
      if (!this.rules?.areas) return [];
      
      // Calculate ECTS per area
      const ectsByArea = {};
      for (const sel of this.selections) {
        const course = this.catalog.find(c => c.id === sel.course_id);
        if (!course) continue;
        const areaId = course.area_id || 'unassigned';
        const ects = sel.ects || course.ects || 0;
        ectsByArea[areaId] = (ectsByArea[areaId] || 0) + ects;
      }
      
      return this.rules.areas.map(area => ({
        area_id: area.id,
        area_name: area.name,
        min_ects: area.min_ects,
        max_ects: area.max_ects,
        required_ects: area.required_ects,
        planned_ects: ectsByArea[area.id] || 0,
        progress: Math.min(1, (ectsByArea[area.id] || 0) / (area.min_ects || 1)),
      }));
    },
    
    // ==========================================================================
    // Actions
    // ==========================================================================
    
    planCourse(courseId) {
      const course = this.catalog.find(c => c.id === courseId);
      if (!course) return;
      
      // Check if already planned
      if (this.selections.some(s => s.course_id === courseId)) return;
      
      // Don't allow planning AC modules with regular plan action
      if (course.is_additional_course) {
        alert(this.t('enter_ects_ac'));
        return;
      }
      
      this.selections.push({
        course_id: courseId,
        status: 'planned',
        selection_id: generateSelectionId(),
        ects: null, // Use course ECTS
      });
      
      saveSelectionsToStorage(this.selections, this.lang);
    },
    
    addAdditionalCourse(courseId) {
      const course = this.catalog.find(c => c.id === courseId);
      if (!course || !course.is_additional_course) return;
      
      const ects = parseInt(this.additionalCourseEcts[courseId]);
      if (!ects || ects < 1) {
        alert(this.t('enter_ects'));
        return;
      }
      
      // Check remaining ECTS
      const plannedEcts = this.selections
        .filter(s => s.course_id === courseId)
        .reduce((sum, s) => sum + (s.ects || 0), 0);
      const remaining = (course.max_ects || 18) - plannedEcts;
      
      if (ects > remaining) {
        alert(this.t('max_ects_available', { n: remaining }));
        return;
      }
      
      this.selections.push({
        course_id: courseId,
        status: 'planned',
        selection_id: generateSelectionId(),
        ects: ects,
      });
      
      this.additionalCourseEcts[courseId] = null;
      saveSelectionsToStorage(this.selections, this.lang);
    },
    
    removeCourse(courseId, selectionId = null) {
      if (selectionId) {
        this.selections = this.selections.filter(s => s.selection_id !== selectionId);
      } else {
        this.selections = this.selections.filter(s => s.course_id !== courseId);
      }
      saveSelectionsToStorage(this.selections, this.lang);
    },
    
    toggleCompleted(courseId, selectionId = null) {
      for (const sel of this.selections) {
        if (selectionId && sel.selection_id === selectionId) {
          sel.status = sel.status === 'completed' ? 'planned' : 'completed';
          break;
        } else if (!selectionId && sel.course_id === courseId) {
          sel.status = sel.status === 'completed' ? 'planned' : 'completed';
          break;
        }
      }
      saveSelectionsToStorage(this.selections, this.lang);
    },
    
    removeAllPlanned() {
      if (!confirm(this.t('confirm_remove_all'))) return;
      this.selections = [];
      saveSelectionsToStorage(this.selections, this.lang);
    },
    
    // ==========================================================================
    // Export
    // ==========================================================================
    
    async exportPlan(format) {
      try {
        const response = await fetch(`/api/export/${format}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selections: this.selections }),
        });
        
        if (!response.ok) throw new Error('Export failed');
        
        // Get filename from Content-Disposition header
        const disposition = response.headers.get('Content-Disposition');
        let filename = `studienplan.${format === 'md' ? 'md' : format}`;
        if (disposition) {
          const match = disposition.match(/filename=(.+)/);
          if (match) filename = match[1];
        }
        
        // Download file
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Export failed:', e);
        alert(this.t('export_failed'));
      }
    },
    
    // ==========================================================================
    // Import/Export LocalStorage Data
    // ==========================================================================
    
    exportLocalData() {
      const data = {
        version: STORAGE_VERSION,
        exportDate: new Date().toISOString(),
        selections: this.selections,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mmds_plan_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    
    importLocalData(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.selections && Array.isArray(data.selections)) {
            if (confirm(`${data.selections.length} ${this.t('import_confirm')}`)) {
              this.selections = data.selections;
              saveSelectionsToStorage(this.selections, this.lang);
              this.$nextTick(() => this.renderChart());
            }
          } else {
            alert(this.t('invalid_file'));
          }
        } catch (err) {
          alert(this.t('import_error') + ': ' + err.message);
        }
      };
      reader.readAsText(file);
    },
    
    // ==========================================================================
    // Language / i18n
    // ==========================================================================
    
    t(key, params = {}) {
      const str = i18n[this.lang]?.[key] || i18n['de'][key] || key;
      // Simple parameter replacement: {n} -> params.n
      return str.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '');
    },
    
    toggleLang() {
      this.lang = this.lang === 'de' ? 'en' : 'de';
      localStorage.setItem(STORAGE_KEY_LANG, this.lang);
      // Re-render chart with new language (area names stay same, just UI text)
      this.$nextTick(() => this.renderChart());
    },
    
    // ==========================================================================
    // UI Helpers
    // ==========================================================================
    
    fmt(n) {
      return Number(n || 0).toFixed(0);
    },
    
    fmtK(n) {
      // Format large numbers as "7.0K"
      if (n >= 1000) {
        return (n / 1000).toFixed(1) + 'K';
      }
      return String(n);
    },
    
    plannedStats() {
      const planned = this.courses.filter(c => c.status);
      return {
        total: planned.length,
        completed: planned.filter(c => c.completed).length,
        totalEcts: planned.reduce((sum, c) => sum + (c.ects || 0), 0),
      };
    },
    
    groupByArea(courses) {
      const groups = {};
      for (const c of courses) {
        const areaId = c.area_id || 'unassigned';
        const areaName = c.area_name || 'Unassigned';
        if (!groups[areaId]) {
          groups[areaId] = { area_id: areaId, area_name: areaName, courses: [] };
        }
        groups[areaId].courses.push(c);
      }
      return Object.values(groups).sort((a, b) => a.area_name.localeCompare(b.area_name));
    },
    
    colorForArea(areaId) {
      return this.areaColors[areaId] || '#d2c8bf';
    },
    
    toggleSort(field) {
      if (this.sort.by === field) {
        this.sort.dir = this.sort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sort.by = field;
        this.sort.dir = 'asc';
      }
    },
    
    setAreaOnly(areaId) {
      if (this.filters.areas.includes(areaId)) {
        this.filters.areas = [];
      } else {
        this.filters.areas = [areaId];
      }
    },
    
    clearAreas() {
      this.filters.areas = [];
    },
    
    toggleAreaCollapse(section, areaId) {
      const arr = this.collapsedAreas[section];
      const idx = arr.indexOf(areaId);
      if (idx >= 0) {
        arr.splice(idx, 1);
      } else {
        arr.push(areaId);
      }
    },
    
    isAreaCollapsed(section, areaId) {
      return this.collapsedAreas[section].includes(areaId);
    },
    
    // ==========================================================================
    // Chart
    // ==========================================================================
    
    renderChart() {
      const container = document.getElementById('areaDashboard');
      if (!container || !this.rules?.areas) return;
      
      // Simple bar chart using CSS
      container.innerHTML = '';
      
      const chartHtml = this.area_progress
        .filter(a => a.area_id !== 'unassigned')
        .map(area => {
          const pct = Math.min(100, (area.planned_ects / area.min_ects) * 100);
          const color = this.colorForArea(area.area_id);
          const fulfilled = area.planned_ects >= area.min_ects;
          
          return `
            <div class="mb-4">
              <div class="flex justify-between text-sm mb-1">
                <span class="font-medium text-stone-700">${area.area_name}</span>
                <span class="tabular-nums ${fulfilled ? 'text-emerald-600' : 'text-stone-500'}">
                  ${area.planned_ects.toFixed(0)} / ${area.min_ects} ECTS
                  ${fulfilled ? '✓' : ''}
                </span>
              </div>
              <div class="h-3 bg-sand-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500" 
                     style="width: ${pct}%; background-color: ${color}"></div>
              </div>
            </div>
          `;
        }).join('');
      
      container.innerHTML = chartHtml;
    },
  };
}
