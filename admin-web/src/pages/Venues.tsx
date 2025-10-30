import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminVenuesService, Venue } from '../services/adminVenues';

export default function Venues() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'bulk-edit'>('add');
  const [editingVenue, setEditingVenue] = useState<any>(null);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const data = await adminVenuesService.getAll();
      setVenues(data || []);
    } catch (error) {
      console.error('Failed to load venues:', error);
    }
    setLoading(false);
  };

  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === venues.length ? [] : venues.map((v) => v.id));
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleAdd = () => {
    setModalMode('add');
    setEditingVenue(null);
    setShowModal(true);
  };

  const handleEdit = (venue: any) => {
    setModalMode('edit');
    setEditingVenue(venue);
    setShowModal(true);
  };

  const handleBulkEdit = () => {
    setModalMode('bulk-edit');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this venue?')) return;

    try {
      await adminVenuesService.delete(id);
      await loadVenues();
    } catch (error) {
      console.error('Failed to delete venue:', error);
      alert('Failed to delete venue');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} venues?`)) return;

    try {
      await adminVenuesService.bulkDelete(selectedIds);
      setSelectedIds([]);
      await loadVenues();
    } catch (error) {
      console.error('Failed to delete venues:', error);
      alert('Failed to delete venues');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <p style={{ color: 'white' }}>Loading...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
            Venues ({venues.length})
          </h1>
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
              + Add Venue
            </button>
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={handleBulkEdit}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Bulk Edit ({selectedIds.length})
                </button>
                <button
                  onClick={handleBulkDelete}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Delete ({selectedIds.length})
                </button>
              </>
            )}
          </div>
        </div>

        {venues.length === 0 ? (
          <div style={{
            backgroundColor: '#1e293b',
            padding: '48px',
            borderRadius: '12px',
            border: '1px solid #334155',
            textAlign: 'center',
          }}>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              No venues found. Click "Add Venue" to create one.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {venues.map((venue) => (
              <div
                key={venue.id}
                style={{
                  backgroundColor: '#1e293b',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #334155',
                }}
              >
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'start' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(venue.id)}
                      onChange={() => handleSelectOne(venue.id)}
                      style={{ marginTop: '4px' }}
                    />
                  </div>

                  {venue.images && venue.images.length > 0 && (
                    <img
                      src={venue.images[0]}
                      alt={venue.place?.name || 'Venue'}
                      style={{
                        width: '200px',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                          {venue.place?.name || 'Unnamed Venue'}
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
                          {venue.place?.city || 'Unknown City'}, {venue.place?.province || 'Unknown Province'}
                        </p>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>
                          {venue.description_en?.substring(0, 150)}...
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {venue.is_featured && (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                          }}>
                            Featured
                          </span>
                        )}
                        {venue.is_free && (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: '#10b981',
                            color: 'white',
                          }}>
                            Free
                          </span>
                        )}
                        {venue.is_indoor && (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                          }}>
                            Indoor
                          </span>
                        )}
                        {venue.is_outdoor && (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: '#06b6d4',
                            color: 'white',
                          }}>
                            Outdoor
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                        Ages: {venue.age_min}-{venue.age_max}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                        Price: €{venue.price_min}-€{venue.price_max}
                      </span>
                      {venue.categories && venue.categories.length > 0 && (
                        <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                          Categories: {venue.categories.map((c: any) => c.category?.name_en).filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(venue)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(venue.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
            }}>
              <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '24px' }}>
                {modalMode === 'add' ? 'Add Venue' : modalMode === 'edit' ? 'Edit Venue' : `Bulk Edit ${selectedIds.length} Venues`}
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
                Modal functionality coming soon. For now, please manage venues through the database or API.
              </p>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#334155',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
