import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { adminEventsService, Event } from '../services/adminEvents';
import { supabase } from '../lib/supabase';

export default function AddEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [useCustomLocation, setUseCustomLocation] = useState(false);

  const [formData, setFormData] = useState<Event>({
    event_name: '',
    place_id: null,
    custom_location_name: '',
    custom_address: '',
    custom_lat: 0,
    custom_lng: 0,
    custom_city: '',
    custom_province: '',
    event_start_datetime: '',
    event_end_datetime: '',
    description_en: '',
    description_nl: '',
    age_min: 0,
    age_max: 12,
    price_min: 0,
    price_max: 0,
    is_free: false,
    is_indoor: false,
    is_outdoor: false,
    weather_dependent: false,
    booking_url: '',
    images: [],
    is_featured: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: cats } = await supabase.from('activity_categories').select('*').order('name_en');
    setCategories(cats || []);

    const { data: pls } = await supabase.from('places').select('*').order('name');
    setPlaces(pls || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventData = useCustomLocation
        ? { ...formData, place_id: null }
        : { ...formData, place_id: formData.place_id || null };

      await adminEventsService.create(eventData, selectedCategories);
      alert('Event created successfully!');
      navigate('/events');
    } catch (error: any) {
      console.error('Failed to create event:', error);
      alert(`Failed to create event: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>
          Add Event
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Event Name */}
          <div style={{ backgroundColor: '#1f2937', padding: '24px', borderRadius: '12px' }}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Event Name</h2>
            <input
              type="text"
              placeholder="Event Name"
              value={formData.event_name}
              onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none' }}
            />
          </div>

          {/* Location */}
          <div style={{ backgroundColor: '#1f2937', padding: '24px', borderRadius: '12px' }}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Location</h2>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <input
                type="checkbox"
                checked={useCustomLocation}
                onChange={(e) => setUseCustomLocation(e.target.checked)}
              />
              <span style={{ color: 'white' }}>Use custom location (not a venue)</span>
            </label>

            {useCustomLocation ? (
              <>
                <input
                  type="text"
                  placeholder="Location Name"
                  value={formData.custom_location_name || ''}
                  onChange={(e) => setFormData({ ...formData, custom_location_name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', marginBottom: '12px' }}
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.custom_address || ''}
                  onChange={(e) => setFormData({ ...formData, custom_address: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', marginBottom: '12px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.custom_city || ''}
                    onChange={(e) => setFormData({ ...formData, custom_city: e.target.value })}
                    required
                    style={{ padding: '12px', borderRadius: '8px', border: 'none' }}
                  />
                  <input
                    type="text"
                    placeholder="Province"
                    value={formData.custom_province || ''}
                    onChange={(e) => setFormData({ ...formData, custom_province: e.target.value })}
                    required
                    style={{ padding: '12px', borderRadius: '8px', border: 'none' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={formData.custom_lat || ''}
                    onChange={(e) => setFormData({ ...formData, custom_lat: parseFloat(e.target.value) })}
                    required
                    style={{ padding: '12px', borderRadius: '8px', border: 'none' }}
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={formData.custom_lng || ''}
                    onChange={(e) => setFormData({ ...formData, custom_lng: parseFloat(e.target.value) })}
                    required
                    style={{ padding: '12px', borderRadius: '8px', border: 'none' }}
                  />
                </div>
              </>
            ) : (
              <select
                value={formData.place_id || ''}
                onChange={(e) => setFormData({ ...formData, place_id: e.target.value || null })}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none' }}
              >
                <option value="">Select a venue</option>
                {places.map(place => (
                  <option key={place.id} value={place.id}>
                    {place.name} - {place.city}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Event Details */}
          <div style={{ backgroundColor: '#1f2937', padding: '24px', borderRadius: '12px' }}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Event Details</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.event_start_datetime}
                  onChange={(e) => setFormData({ ...formData, event_start_datetime: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none' }}
                />
              </div>
              <div>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '4px' }}>End Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.event_end_datetime}
                  onChange={(e) => setFormData({ ...formData, event_end_datetime: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none' }}
                />
              </div>
            </div>

            <textarea
              placeholder="Description (English)"
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              required
              rows={4}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', marginBottom: '12px', fontFamily: 'inherit' }}
            />

            <textarea
              placeholder="Description (Dutch)"
              value={formData.description_nl}
              onChange={(e) => setFormData({ ...formData, description_nl: e.target.value })}
              required
              rows={4}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* Age & Pricing */}
          <div style={{ backgroundColor: '#1f2937', padding: '24px', borderRadius: '12px' }}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Age & Pricing</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <input
                type="number"
                placeholder="Min Age"
                value={formData.age_min}
                onChange={(e) => setFormData({ ...formData, age_min: parseInt(e.target.value) })}
                required
                style={{ padding: '12px', borderRadius: '8px', border: 'none' }}
              />
              <input
                type="number"
                placeholder="Max Age"
                value={formData.age_max}
                onChange={(e) => setFormData({ ...formData, age_max: parseInt(e.target.value) })}
                required
                style={{ padding: '12px', borderRadius: '8px', border: 'none' }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                checked={formData.is_free}
                onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
              />
              <span style={{ color: 'white' }}>Free Event</span>
            </label>

            {!formData.is_free && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Min Price (€)"
                  value={formData.price_min}
                  onChange={(e) => setFormData({ ...formData, price_min: parseFloat(e.target.value) })}
                  style={{ padding: '12px', borderRadius: '8px', border: 'none' }}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Max Price (€)"
                  value={formData.price_max}
                  onChange={(e) => setFormData({ ...formData, price_max: parseFloat(e.target.value) })}
                  style={{ padding: '12px', borderRadius: '8px', border: 'none' }}
                />
              </div>
            )}
          </div>

          {/* Environment & Features */}
          <div style={{ backgroundColor: '#1f2937', padding: '24px', borderRadius: '12px' }}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Environment</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_indoor}
                  onChange={(e) => setFormData({ ...formData, is_indoor: e.target.checked })}
                />
                <span style={{ color: 'white' }}>Indoor</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_outdoor}
                  onChange={(e) => setFormData({ ...formData, is_outdoor: e.target.checked })}
                />
                <span style={{ color: 'white' }}>Outdoor</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.weather_dependent}
                  onChange={(e) => setFormData({ ...formData, weather_dependent: e.target.checked })}
                />
                <span style={{ color: 'white' }}>Weather Dependent</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                />
                <span style={{ color: 'white' }}>Featured Event</span>
              </label>
            </div>
          </div>

          {/* Categories */}
          <div style={{ backgroundColor: '#1f2937', padding: '24px', borderRadius: '12px' }}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Categories</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {categories.map(cat => (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => handleCategoryToggle(cat.id)}
                  />
                  <span style={{ color: 'white' }}>{cat.name_en}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div style={{ backgroundColor: '#1f2937', padding: '24px', borderRadius: '12px' }}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Additional Info</h2>

            <input
              type="url"
              placeholder="Booking URL"
              value={formData.booking_url || ''}
              onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', marginBottom: '12px' }}
            />

            <textarea
              placeholder="Image URLs (one per line)"
              value={formData.images.join('\n')}
              onChange={(e) => setFormData({ ...formData, images: e.target.value.split('\n').filter(Boolean) })}
              rows={4}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/events')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4b5563',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
