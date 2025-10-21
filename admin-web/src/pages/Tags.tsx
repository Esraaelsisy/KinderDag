import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminTagsService, Tag } from '../services/adminTags';
import { adminActivitiesService } from '../services/adminActivities';

export default function Tags() {
  const [tags, setTags] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'bulk-edit'>('add');
  const [editingTag, setEditingTag] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tagsData, activitiesData] = await Promise.all([
        adminTagsService.getAll(),
        adminActivitiesService.getAll(),
      ]);
      const sorted = (tagsData || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      setTags(sorted);
      setActivities(activitiesData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === tags.length ? [] : tags.map((t) => t.id));
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleAdd = () => {
    setModalMode('add');
    setEditingTag(null);
    setShowModal(true);
  };

  const handleEdit = (tag: any) => {
    setModalMode('edit');
    setEditingTag(tag);
    setShowModal(true);
  };

  const handleBulkEdit = () => {
    setModalMode('bulk-edit');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? This will unlink all activities from this tag.')) {
      try {
        await adminTagsService.delete(id);
        await loadData();
      } catch (error) {
        alert('Failed to delete tag');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedIds.length} tags? This will unlink all their activities.`)) {
      try {
        await adminTagsService.bulkDelete(selectedIds);
        setSelectedIds([]);
        await loadData();
      } catch (error) {
        alert('Failed to delete tags');
      }
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await adminTagsService.update(id, { is_active: !currentStatus });
      await loadData();
    } catch (error) {
      alert('Failed to toggle tag status');
    }
  };

  const toggleShowOnHome = async (id: string, currentStatus: boolean) => {
    try {
      await adminTagsService.update(id, { show_on_home: !currentStatus });
      await loadData();
    } catch (error) {
      alert('Failed to toggle show on home');
    }
  };

  const moveTag = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === tags.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newTags = [...tags];
    const [moved] = newTags.splice(index, 1);
    newTags.splice(newIndex, 0, moved);

    const updates = newTags.map((tag, idx) => ({
      id: tag.id,
      sort_order: idx,
    }));

    setTags(newTags);

    try {
      await adminTagsService.updateSortOrders(updates);
    } catch (error) {
      alert('Failed to update sort order');
      await loadData();
    }
  };

  return (
    <AdminLayout>
      <div>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>Tags Management</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleAdd} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
              + Add Tag
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
                    <input type="checkbox" checked={selectedIds.length === tags.length && tags.length > 0} onChange={handleSelectAll} />
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Sort</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Slug</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Color</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Show on Home</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Activities</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag, index) => (
                  <tr key={tag.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '16px' }}>
                      <input type="checkbox" checked={selectedIds.includes(tag.id)} onChange={() => handleSelectOne(tag.id)} />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => moveTag(index, 'up')}
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
                          onClick={() => moveTag(index, 'down')}
                          disabled={index === tags.length - 1}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: index === tags.length - 1 ? '#334155' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: index === tags.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'white' }}>{tag.name}</td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '12px' }}>{tag.slug}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: tag.color }}></div>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{tag.color}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => toggleActive(tag.id, tag.is_active)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          backgroundColor: tag.is_active ? '#10b981' : '#64748b',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {tag.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => toggleShowOnHome(tag.id, tag.show_on_home)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          backgroundColor: tag.show_on_home ? '#10b981' : '#64748b',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {tag.show_on_home ? '✓ Shown' : 'Hidden'}
                      </button>
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8' }}>{tag.activityCount} activities</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEdit(tag)} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(tag.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
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
          <TagModal
            mode={modalMode}
            tag={editingTag}
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

interface TagModalProps {
  mode: 'add' | 'edit' | 'bulk-edit';
  tag: any;
  selectedIds: string[];
  activities: any[];
  onClose: () => void;
  onSave: () => void;
}

function TagModal({ mode, tag, selectedIds, activities, onClose, onSave }: TagModalProps) {
  const [formData, setFormData] = useState<any>(
    tag || {
      name: '',
      slug: '',
      description: '',
      color: '#8b5cf6',
      icon: 'tag',
      is_active: true,
      show_on_home: false,
      sort_order: 0,
    }
  );

  const [selectedActivities, setSelectedActivities] = useState<string[]>(
    tag?.activities?.map((link: any) => link.activity.id) || []
  );

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'add') {
        await adminTagsService.create(formData, selectedActivities);
      } else if (mode === 'edit') {
        await adminTagsService.update(tag.id, formData, selectedActivities);
      } else if (mode === 'bulk-edit') {
        if (selectedActivities.length > 0) {
          for (const id of selectedIds) {
            await adminTagsService.unlinkAllActivities(id);
            await adminTagsService.linkActivities(id, selectedActivities);
          }
        }
        const updates: any = {};
        if (formData.is_active !== undefined) updates.is_active = formData.is_active;
        if (Object.keys(updates).length > 0) {
          await adminTagsService.bulkUpdate(selectedIds, updates);
        }
      }
      onSave();
    } catch (error) {
      alert('Failed to save tag');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '24px' }}>
          {mode === 'add' ? 'Add Tag' : mode === 'edit' ? 'Edit Tag' : `Bulk Edit ${selectedIds.length} Tags`}
        </h2>
        <form onSubmit={handleSubmit}>
          {mode !== 'bulk-edit' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({ ...formData, name, slug: generateSlug(name) });
                  }}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Slug *</label>
                <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Color</label>
                <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                  Active
                </label>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.show_on_home} onChange={(e) => setFormData({ ...formData, show_on_home: e.target.checked })} />
                  Show on Home Screen
                </label>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px', marginLeft: '24px' }}>
                  When enabled, this tag will appear as a carousel section on the home screen
                </p>
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
