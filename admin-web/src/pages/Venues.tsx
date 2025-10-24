import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminVenuesService, Venue } from '../services/adminVenues';

export default function Venues() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this play spot?')) return;

    try {
      await adminVenuesService.delete(id);
      await loadVenues();
    } catch (error) {
      console.error('Failed to delete venue:', error);
      alert('Failed to delete play spot');
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
            Play Spots ({venues.length})
          </h1>
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
              No play spots found. They will appear here once migrated.
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
      </div>
    </AdminLayout>
  );
}
