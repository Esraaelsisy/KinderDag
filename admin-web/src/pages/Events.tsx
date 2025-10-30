import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminEventsService, Event } from '../services/adminEvents';

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await adminEventsService.getAll();
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
    setLoading(false);
  };

  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === events.length ? [] : events.map((e) => e.id));
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleAdd = () => {
    alert('Add Event - Feature coming soon');
  };

  const handleBulkAdd = () => {
    alert('Bulk Add Events - Feature coming soon');
  };

  const handleEdit = (id: string) => {
    alert(`Edit Event ${id} - Feature coming soon`);
  };

  const handleBulkEdit = () => {
    alert(`Bulk Edit ${selectedIds.length} Events - Feature coming soon`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await adminEventsService.delete(id);
      await loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} events?`)) return;

    try {
      await Promise.all(selectedIds.map((id) => adminEventsService.delete(id)));
      setSelectedIds([]);
      await loadEvents();
    } catch (error) {
      console.error('Failed to delete events:', error);
      alert('Failed to delete events');
    }
  };

  const formatDateTime = (datetime: string) => {
    return new Date(datetime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            Events ({events.length})
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
              + Add Event
            </button>
            <button
              onClick={handleBulkAdd}
              style={{
                padding: '12px 24px',
                backgroundColor: '#06b6d4',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              + Bulk Add
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

        {events.length === 0 ? (
          <div style={{
            backgroundColor: '#1e293b',
            padding: '48px',
            borderRadius: '12px',
            border: '1px solid #334155',
            textAlign: 'center',
          }}>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              No events found. They will appear here once migrated.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {events.map((event) => {
              const locationName = event.place?.name || event.custom_location_name || 'Location TBD';
              const city = event.place?.city || event.custom_city || 'Unknown';
              const province = event.place?.province || event.custom_province || 'Unknown';

              return (
                <div
                  key={event.id}
                  style={{
                    backgroundColor: '#1e293b',
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                  }}
                >
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'start', paddingTop: '8px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(event.id)}
                        onChange={() => handleSelectOne(event.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </div>
                    {event.images && event.images.length > 0 && (
                      <img
                        src={event.images[0]}
                        alt={locationName}
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
                            {locationName}
                          </h3>
                          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
                            {city}, {province}
                          </p>
                          <p style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                            {formatDateTime(event.event_start_datetime)} - {formatDateTime(event.event_end_datetime)}
                          </p>
                          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>
                            {event.description_en?.substring(0, 150)}...
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {event.is_featured && (
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
                          {event.is_free && (
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
                          {event.is_indoor && (
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
                          {event.is_outdoor && (
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
                          Ages: {event.age_min}-{event.age_max}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                          Price: €{event.price_min}-€{event.price_max}
                        </span>
                        {event.categories && event.categories.length > 0 && (
                          <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                            Categories: {event.categories.map((c: any) => c.category?.name_en).filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(event.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
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
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
