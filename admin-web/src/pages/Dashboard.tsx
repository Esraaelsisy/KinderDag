import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  age_range: string;
  duration: number;
  materials: string[];
  indoor: boolean;
  image_url: string | null;
  created_at: string;
}

export default function Dashboard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAgeRange, setFilterAgeRange] = useState('');
  const [filterIndoor, setFilterIndoor] = useState('');
  const navigate = useNavigate();

  const [bulkEditData, setBulkEditData] = useState({
    category: '',
    age_range: '',
    indoor: '',
    duration: '',
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, filterCategory, filterAgeRange, filterIndoor]);

  const fetchActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
    } else {
      setActivities(data || []);
    }
    setLoading(false);
  };

  const filterActivities = () => {
    let filtered = activities;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(term) ||
        activity.description.toLowerCase().includes(term) ||
        activity.category.toLowerCase().includes(term) ||
        activity.materials.some(m => m.toLowerCase().includes(term))
      );
    }

    if (filterCategory) {
      filtered = filtered.filter(activity => activity.category === filterCategory);
    }

    if (filterAgeRange) {
      filtered = filtered.filter(activity => activity.age_range === filterAgeRange);
    }

    if (filterIndoor !== '') {
      const isIndoor = filterIndoor === 'true';
      filtered = filtered.filter(activity => activity.indoor === isIndoor);
    }

    setFilteredActivities(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting activity: ' + error.message);
    } else {
      fetchActivities();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let activitiesData: any[];

        if (file.name.endsWith('.json')) {
          activitiesData = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          activitiesData = parseCSV(content);
        } else {
          alert('Please upload a JSON or CSV file');
          setImporting(false);
          return;
        }

        const validActivities = activitiesData.map(activity => ({
          title: activity.title || '',
          description: activity.description || '',
          category: activity.category || '',
          age_range: activity.age_range || '',
          duration: parseInt(activity.duration) || 30,
          materials: Array.isArray(activity.materials) ? activity.materials :
                     (typeof activity.materials === 'string' ? activity.materials.split(',').map(m => m.trim()) : []),
          indoor: activity.indoor === true || activity.indoor === 'true' || activity.indoor === '1',
          image_url: activity.image_url || null,
        }));

        const { data, error } = await supabase
          .from('activities')
          .insert(validActivities)
          .select();

        if (error) {
          alert('Error importing activities: ' + error.message);
        } else {
          alert(`Successfully imported ${data.length} activities!`);
          fetchActivities();
        }
      } catch (error) {
        alert('Error parsing file: ' + (error as Error).message);
      } finally {
        setImporting(false);
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const activities = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const activity: any = {};
      headers.forEach((header, index) => {
        activity[header] = values[index];
      });
      activities.push(activity);
    }

    return activities;
  };

  const downloadTemplate = (format: 'json' | 'csv') => {
    const template = {
      title: 'Example Activity',
      description: 'A fun activity for kids',
      category: 'Creative',
      age_range: '3-5',
      duration: 30,
      materials: ['paper', 'crayons'],
      indoor: true,
      image_url: 'https://example.com/image.jpg'
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify([template], null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'activities_template.json';
      a.click();
    } else {
      const csv = 'title,description,category,age_range,duration,materials,indoor,image_url\n' +
                  'Example Activity,"A fun activity for kids",Creative,3-5,30,"paper,crayons",true,https://example.com/image.jpg';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'activities_template.csv';
      a.click();
    }
  };

  const exportActivities = (format: 'json' | 'csv') => {
    const exportData = filteredActivities.map(({ id, created_at, ...rest }) => rest);

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'activities_export.json';
      a.click();
    } else {
      const headers = 'title,description,category,age_range,duration,materials,indoor,image_url\n';
      const rows = exportData.map(activity =>
        `"${activity.title}","${activity.description}","${activity.category}","${activity.age_range}",${activity.duration},"${activity.materials.join(',')}",${activity.indoor},"${activity.image_url || ''}"`
      ).join('\n');
      const csv = headers + rows;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'activities_export.csv';
      a.click();
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredActivities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredActivities.map(a => a.id)));
    }
  };

  const handleBulkEdit = async () => {
    if (selectedIds.size === 0) {
      alert('Please select activities to edit');
      return;
    }

    const updates: any = {};
    if (bulkEditData.category) updates.category = bulkEditData.category;
    if (bulkEditData.age_range) updates.age_range = bulkEditData.age_range;
    if (bulkEditData.indoor !== '') updates.indoor = bulkEditData.indoor === 'true';
    if (bulkEditData.duration) updates.duration = parseInt(bulkEditData.duration);

    if (Object.keys(updates).length === 0) {
      alert('Please select at least one field to update');
      return;
    }

    const { error } = await supabase
      .from('activities')
      .update(updates)
      .in('id', Array.from(selectedIds));

    if (error) {
      alert('Error updating activities: ' + error.message);
    } else {
      alert(`Successfully updated ${selectedIds.size} activities!`);
      setShowBulkEdit(false);
      setSelectedIds(new Set());
      setBulkEditData({ category: '', age_range: '', indoor: '', duration: '' });
      fetchActivities();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert('Please select activities to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} activities? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from('activities')
      .delete()
      .in('id', Array.from(selectedIds));

    if (error) {
      alert('Error deleting activities: ' + error.message);
    } else {
      alert(`Successfully deleted ${selectedIds.size} activities!`);
      setSelectedIds(new Set());
      fetchActivities();
    }
  };

  const categories = Array.from(new Set(activities.map(a => a.category)));
  const ageRanges = Array.from(new Set(activities.map(a => a.age_range)));

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: 'white' }}>Loading activities...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>KinderDag Admin Dashboard</h1>
        <div style={styles.headerButtons}>
          <button onClick={() => navigate('/add')} style={styles.addButton}>
            + Add Activity
          </button>
          <div style={styles.importGroup}>
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleFileImport}
              style={{ display: 'none' }}
              id="file-import"
              disabled={importing}
            />
            <label htmlFor="file-import" style={importing ? styles.importButtonDisabled : styles.importButton}>
              {importing ? 'Importing...' : 'Import'}
            </label>
            <button onClick={() => exportActivities('json')} style={styles.exportButton}>
              Export JSON
            </button>
            <button onClick={() => exportActivities('csv')} style={styles.exportButton}>
              Export CSV
            </button>
            <button
              onClick={() => downloadTemplate('json')}
              style={styles.templateButton}
              title="Download JSON template"
            >
              Template
            </button>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filterAgeRange}
            onChange={(e) => setFilterAgeRange(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All Ages</option>
            {ageRanges.map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
          <select
            value={filterIndoor}
            onChange={(e) => setFilterIndoor(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">Indoor/Outdoor</option>
            <option value="true">Indoor</option>
            <option value="false">Outdoor</option>
          </select>
          <button onClick={() => {
            setSearchTerm('');
            setFilterCategory('');
            setFilterAgeRange('');
            setFilterIndoor('');
          }} style={styles.clearButton}>
            Clear
          </button>
        </div>

        {selectedIds.size > 0 && (
          <div style={styles.bulkActions}>
            <span style={styles.bulkText}>{selectedIds.size} selected</span>
            <button onClick={() => setShowBulkEdit(true)} style={styles.bulkEditButton}>
              Bulk Edit
            </button>
            <button onClick={handleBulkDelete} style={styles.bulkDeleteButton}>
              Bulk Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} style={styles.clearSelectionButton}>
              Clear Selection
            </button>
          </div>
        )}

        {filteredActivities.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No activities found matching your filters.</p>
          </div>
        ) : (
          <>
            <div style={styles.selectAllBar}>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredActivities.length && filteredActivities.length > 0}
                  onChange={toggleSelectAll}
                />
                <span style={styles.checkboxLabel}>Select All ({filteredActivities.length})</span>
              </label>
            </div>
            <div style={styles.grid}>
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    ...styles.card,
                    ...(selectedIds.has(activity.id) ? styles.cardSelected : {})
                  }}
                >
                  <div style={styles.cardCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(activity.id)}
                      onChange={() => toggleSelection(activity.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {activity.image_url && (
                    <img src={activity.image_url} alt={activity.title} style={styles.image} />
                  )}
                  <div style={styles.cardContent}>
                    <h3 style={styles.cardTitle}>{activity.title}</h3>
                    <p style={styles.cardDescription}>{activity.description}</p>
                    <div style={styles.cardMeta}>
                      <span style={styles.badge}>{activity.category}</span>
                      <span style={styles.badge}>{activity.age_range}</span>
                      <span style={styles.badge}>{activity.duration} min</span>
                      <span style={styles.badge}>{activity.indoor ? 'Indoor' : 'Outdoor'}</span>
                    </div>
                    <div style={styles.cardActions}>
                      <button
                        onClick={() => navigate(`/edit/${activity.id}`)}
                        style={styles.editButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showBulkEdit && (
        <div style={styles.modal} onClick={() => setShowBulkEdit(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Bulk Edit {selectedIds.size} Activities</h2>
            <p style={styles.modalSubtitle}>Only filled fields will be updated</p>

            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select
                value={bulkEditData.category}
                onChange={(e) => setBulkEditData({...bulkEditData, category: e.target.value})}
                style={styles.input}
              >
                <option value="">Don't change</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Age Range</label>
              <select
                value={bulkEditData.age_range}
                onChange={(e) => setBulkEditData({...bulkEditData, age_range: e.target.value})}
                style={styles.input}
              >
                <option value="">Don't change</option>
                {ageRanges.map(age => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Indoor/Outdoor</label>
              <select
                value={bulkEditData.indoor}
                onChange={(e) => setBulkEditData({...bulkEditData, indoor: e.target.value})}
                style={styles.input}
              >
                <option value="">Don't change</option>
                <option value="true">Indoor</option>
                <option value="false">Outdoor</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Duration (minutes)</label>
              <input
                type="number"
                value={bulkEditData.duration}
                onChange={(e) => setBulkEditData({...bulkEditData, duration: e.target.value})}
                placeholder="Leave empty to not change"
                style={styles.input}
              />
            </div>

            <div style={styles.modalActions}>
              <button onClick={handleBulkEdit} style={styles.saveButton}>
                Update Activities
              </button>
              <button onClick={() => setShowBulkEdit(false)} style={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'white',
  },
  headerButtons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  importGroup: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  importButton: {
    padding: '12px 24px',
    background: '#48bb78',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  importButtonDisabled: {
    padding: '12px 24px',
    background: '#a0aec0',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
  exportButton: {
    padding: '12px 20px',
    background: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  templateButton: {
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid white',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  addButton: {
    padding: '12px 24px',
    background: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  logoutButton: {
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid white',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  filterBar: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  searchInput: {
    flex: '2',
    minWidth: '200px',
    padding: '10px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
  },
  filterSelect: {
    flex: '1',
    minWidth: '150px',
    padding: '10px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  clearButton: {
    padding: '10px 20px',
    background: '#e2e8f0',
    color: '#4a5568',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  bulkActions: {
    background: 'white',
    padding: '16px 20px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  bulkText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#4a5568',
    flex: 1,
  },
  bulkEditButton: {
    padding: '10px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  bulkDeleteButton: {
    padding: '10px 20px',
    background: '#fc8181',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  clearSelectionButton: {
    padding: '10px 20px',
    background: '#e2e8f0',
    color: '#4a5568',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  selectAllBar: {
    background: 'white',
    padding: '12px 20px',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4a5568',
  },
  emptyState: {
    background: 'white',
    borderRadius: '12px',
    padding: '60px',
    textAlign: 'center' as const,
  },
  emptyText: {
    fontSize: '18px',
    color: '#718096',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s',
    position: 'relative' as const,
  },
  cardSelected: {
    boxShadow: '0 0 0 3px #667eea',
  },
  cardCheckbox: {
    position: 'absolute' as const,
    top: '12px',
    left: '12px',
    zIndex: 10,
    background: 'white',
    borderRadius: '4px',
    padding: '4px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  image: {
    width: '100%',
    height: '200px',
    objectFit: 'cover' as const,
  },
  cardContent: {
    padding: '20px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: '8px',
  },
  cardDescription: {
    fontSize: '14px',
    color: '#4a5568',
    marginBottom: '16px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  cardMeta: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '16px',
  },
  badge: {
    padding: '4px 12px',
    background: '#edf2f7',
    color: '#4a5568',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    flex: 1,
    padding: '10px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  deleteButton: {
    flex: 1,
    padding: '10px',
    background: '#fc8181',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: '8px',
  },
  modalSubtitle: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '10px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  saveButton: {
    flex: 1,
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    background: '#e2e8f0',
    color: '#4a5568',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
