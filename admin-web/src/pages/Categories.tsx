import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminCategoriesService, Category } from '../services/adminCategories';
import { adminActivitiesService } from '../services/adminActivities';

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'bulk-edit'>('add');
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, activitiesData] = await Promise.all([
        adminCategoriesService.getAll(),
        adminActivitiesService.getAll(),
      ]);
      const sorted = (categoriesData || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      setCategories(sorted);
      setActivities(activitiesData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === categories.length ? [] : categories.map((c) => c.id));
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleAdd = () => {
    setModalMode('add');
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleEdit = (category: any) => {
    setModalMode('edit');
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleBulkEdit = () => {
    setModalMode('bulk-edit');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? This will unlink all activities from this category.')) {
      try {
        await adminCategoriesService.delete(id);
        await loadData();
      } catch (error) {
        alert('Failed to delete category');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedIds.length} categories? This will unlink all their activities.`)) {
      try {
        await adminCategoriesService.bulkDelete(selectedIds);
        setSelectedIds([]);
        await loadData();
      } catch (error) {
        alert('Failed to delete categories');
      }
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newCategories = [...categories];
    const [moved] = newCategories.splice(index, 1);
    newCategories.splice(newIndex, 0, moved);

    const updates = newCategories.map((cat, idx) => ({
      id: cat.id,
      sort_order: idx,
    }));

    setCategories(newCategories);

    try {
      await adminCategoriesService.updateSortOrders(updates);
    } catch (error) {
      alert('Failed to update sort order');
      await loadData();
    }
  };

  return (
    <AdminLayout>
      <div>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>Categories</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleAdd}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              + Add Category
            </button>
            {selectedIds.length > 0 && (
              <>
                <button onClick={handleBulkEdit} style={{ padding: '12px 24px', backgroundColor: '#8b5cf6', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                  Bulk Edit ({selectedIds.length})
                </button>
                <button onClick={handleBulkDelete} style={{ padding: '12px 24px', backgroundColor: '#ef4444', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                  Delete ({selectedIds.length})
                </button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'white' }}>Loading...</p>
        ) : (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#334155' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left' }}>
                    <input type="checkbox" checked={selectedIds.length === categories.length && categories.length > 0} onChange={handleSelectAll} />
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Sort</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Name (EN)</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Name (NL)</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Color</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Activities</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr key={category.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '16px' }}>
                      <input type="checkbox" checked={selectedIds.includes(category.id)} onChange={() => handleSelectOne(category.id)} />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => moveCategory(index, 'up')}
                          disabled={index === 0}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: index === 0 ? '#334155' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveCategory(index, 'down')}
                          disabled={index === categories.length - 1}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: index === categories.length - 1 ? '#334155' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: index === categories.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'white' }}>{category.name_en}</td>
                    <td style={{ padding: '16px', color: '#94a3b8' }}>{category.name_nl}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: category.color }}></div>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{category.color}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8' }}>{category.activityCount} activities</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEdit(category)} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(category.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <CategoryModal
            mode={modalMode}
            category={editingCategory}
            selectedIds={selectedIds}
            activities={activities}
            onClose={() => setShowModal(false)}
            onSave={async () => {
              setShowModal(false);
              setSelectedIds([]);
              await loadData();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

interface CategoryModalProps {
  mode: 'add' | 'edit' | 'bulk-edit';
  category: any;
  selectedIds: string[];
  activities: any[];
  onClose: () => void;
  onSave: () => void;
}

function CategoryModal({ mode, category, selectedIds, activities, onClose, onSave }: CategoryModalProps) {
  const [formData, setFormData] = useState<any>(
    category ? {
      name_en: category.name_en,
      name_nl: category.name_nl,
      icon: category.icon,
      color: category.color,
      sort_order: category.sort_order,
    } : {
      name_en: '',
      name_nl: '',
      icon: 'activity',
      color: '#3b82f6',
      sort_order: 0,
    }
  );

  const [selectedActivities, setSelectedActivities] = useState<string[]>(
    category?.activities?.map((link: any) => link.activity.id) || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'add') {
        await adminCategoriesService.create(formData, selectedActivities);
      } else if (mode === 'edit') {
        await adminCategoriesService.update(category.id, formData, selectedActivities);
      } else if (mode === 'bulk-edit') {
        if (selectedActivities.length > 0) {
          for (const id of selectedIds) {
            await adminCategoriesService.unlinkAllActivities(id);
            await adminCategoriesService.linkActivities(id, selectedActivities);
          }
        }
      }
      onSave();
    } catch (error) {
      alert('Failed to save category');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '24px' }}>
          {mode === 'add' ? 'Add Category' : mode === 'edit' ? 'Edit Category' : `Bulk Edit ${selectedIds.length} Categories`}
        </h2>
        <form onSubmit={handleSubmit}>
          {mode !== 'bulk-edit' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Name (English) *</label>
                <input type="text" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Name (Dutch) *</label>
                <input type="text" value={formData.name_nl} onChange={(e) => setFormData({ ...formData, name_nl: e.target.value })} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Color</label>
                <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a' }} />
              </div>
            </>
          )}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Activities</label>
            <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
              {activities.map((activity) => (
                <label key={activity.id} style={{ display: 'block', color: 'white', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedActivities.includes(activity.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedActivities([...selectedActivities, activity.id]);
                      } else {
                        setSelectedActivities(selectedActivities.filter((id) => id !== activity.id));
                      }
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  {activity.name}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '12px 24px', borderRadius: '8px', backgroundColor: '#334155', color: 'white', border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" style={{ padding: '12px 24px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>
              {mode === 'add' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
