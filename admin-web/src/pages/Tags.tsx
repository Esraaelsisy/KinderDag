import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminTagsService, Tag } from '../services/adminTags';
import { adminActivitiesService } from '../services/adminActivities';

export default function Tags() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'bulk-edit'>('add');
  const [editingCollection, setEditingCollection] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const collectionsData = await adminTagsService.getAll();
      const sorted = (collectionsData || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      setCollections(sorted);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === collections.length ? [] : collections.map((c) => c.id));
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleAdd = () => {
    setModalMode('add');
    setEditingCollection(null);
    setShowModal(true);
  };

  const handleEdit = (collection: any) => {
    setModalMode('edit');
    setEditingCollection(collection);
    setShowModal(true);
  };

  const handleBulkEdit = () => {
    setModalMode('bulk-edit');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? This will unlink all items from this collection.')) {
      try {
        await adminTagsService.delete(id);
        await loadData();
      } catch (error) {
        alert('Failed to delete collection');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedIds.length} collections? This will unlink all their items.`)) {
      try {
        await adminTagsService.bulkDelete(selectedIds);
        setSelectedIds([]);
        await loadData();
      } catch (error) {
        alert('Failed to delete collections');
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

  const moveCollection = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === collections.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newCollections = [...collections];
    const [moved] = newCollections.splice(index, 1);
    newCollections.splice(newIndex, 0, moved);

    const updates = newCollections.map((collection, idx) => ({
      id: collection.id,
      sort_order: idx,
    }));

    setCollections(newCollections);

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
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>Collections</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleAdd} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
              + Add Collection
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
                    <input type="checkbox" checked={selectedIds.length === collections.length && collections.length > 0} onChange={handleSelectAll} />
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Sort</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Slug</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Color</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Show on Home</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Items</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((collection, index) => (
                  <tr key={collection.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '16px' }}>
                      <input type="checkbox" checked={selectedIds.includes(collection.id)} onChange={() => handleSelectOne(collection.id)} />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => moveCollection(index, 'up')}
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
                          onClick={() => moveCollection(index, 'down')}
                          disabled={index === collections.length - 1}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: index === collections.length - 1 ? '#334155' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: index === collections.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'white' }}>{collection.name}</td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '12px' }}>{collection.slug}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: collection.color }}></div>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{collection.color}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => toggleActive(collection.id, collection.is_active)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          backgroundColor: collection.is_active ? '#10b981' : '#64748b',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {collection.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => toggleShowOnHome(collection.id, collection.show_on_home)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          backgroundColor: collection.show_on_home ? '#10b981' : '#64748b',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {collection.show_on_home ? '✓ Shown' : 'Hidden'}
                      </button>
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8' }}>{collection.itemCount || 0} items</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEdit(collection)} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(collection.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
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
          <CollectionModal
            mode={modalMode}
            collection={editingCollection}
            selectedIds={selectedIds}
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

interface CollectionModalProps {
  mode: 'add' | 'edit' | 'bulk-edit';
  collection: any;
  selectedIds: string[];
  onClose: () => void;
  onSave: () => void;
}

function CollectionModal({ mode, collection, selectedIds, onClose, onSave }: CollectionModalProps) {
  const [formData, setFormData] = useState<any>(
    collection || {
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
        await adminTagsService.create(formData);
      } else if (mode === 'edit') {
        await adminTagsService.update(collection.id, formData);
      } else if (mode === 'bulk-edit') {
        const updates: any = {};
        if (formData.is_active !== undefined) updates.is_active = formData.is_active;
        if (formData.show_on_home !== undefined) updates.show_on_home = formData.show_on_home;
        if (Object.keys(updates).length > 0) {
          await adminTagsService.bulkUpdate(selectedIds, updates);
        }
      }
      onSave();
    } catch (error) {
      alert('Failed to save collection');
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
