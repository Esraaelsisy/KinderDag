import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminActivitiesService, Activity } from '../services/adminActivities';
import { adminCategoriesService, Category } from '../services/adminCategories';
import { adminTagsService, Tag } from '../services/adminTags';
import { supabase } from '../lib/supabase';

export default function Activities() {
  const [activities, setActivities] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'bulk-edit'>('add');
  const [editingActivity, setEditingActivity] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activitiesData, categoriesData, tagsData, citiesData] = await Promise.all([
        adminActivitiesService.getAll(),
        adminCategoriesService.getAll(),
        adminTagsService.getAll(),
        loadCities(),
      ]);
      setActivities(activitiesData || []);
      setCategories(categoriesData || []);
      setTags(tagsData || []);
      setCities(citiesData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const loadCities = async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('name')
      .order('name');

    if (error) {
      console.error('Failed to load cities:', error);
      return [];
    }

    return data?.map((city) => city.name) || [];
  };

  const handleSelectAll = () => {
    if (selectedIds.length === activities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activities.map((a) => a.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    setModalMode('add');
    setEditingActivity(null);
    setShowModal(true);
  };

  const handleEdit = (activity: any) => {
    setModalMode('edit');
    setEditingActivity(activity);
    setShowModal(true);
  };

  const handleBulkEdit = () => {
    setModalMode('bulk-edit');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      try {
        await adminActivitiesService.delete(id);
        await loadData();
      } catch (error) {
        alert('Failed to delete activity');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} activities?`)) {
      try {
        await adminActivitiesService.bulkDelete(selectedIds);
        setSelectedIds([]);
        await loadData();
      } catch (error) {
        alert('Failed to delete activities');
      }
    }
  };

  return (
    <AdminLayout>
      <div>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>Activities Management</h1>
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
              + Add Activity
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

        {loading ? (
          <p style={{ color: 'white' }}>Loading...</p>
        ) : (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#334155' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === activities.length && activities.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>City</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Age</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Price</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Categories</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Tags</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '16px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(activity.id)}
                        onChange={() => handleSelectOne(activity.id)}
                      />
                    </td>
                    <td style={{ padding: '16px', color: 'white' }}>{activity.name}</td>
                    <td style={{ padding: '16px', color: '#94a3b8' }}>{activity.city}</td>
                    <td style={{ padding: '16px', color: '#94a3b8' }}>
                      {activity.age_min}-{activity.age_max}
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8' }}>
                      {activity.is_free ? 'Free' : `€${activity.price_min}-€${activity.price_max}`}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {activity.categories?.map((link: any) => (
                          <span
                            key={link.category.id}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          >
                            {link.category.name_en}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {activity.tags?.map((link: any) => (
                          <span
                            key={link.tag.id}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: link.tag.color || '#8b5cf6',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          >
                            {link.tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(activity)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(activity.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
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
          <ActivityModal
            mode={modalMode}
            activity={editingActivity}
            selectedIds={selectedIds}
            categories={categories}
            tags={tags}
            cities={cities}
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

interface ActivityModalProps {
  mode: 'add' | 'edit' | 'bulk-edit';
  activity: any;
  selectedIds: string[];
  categories: Category[];
  tags: Tag[];
  cities: string[];
  onClose: () => void;
  onSave: () => void;
}

function ActivityModal({ mode, activity, selectedIds, categories, tags, cities, onClose, onSave }: ActivityModalProps) {
  const [formData, setFormData] = useState<any>(
    activity || {
      name: '',
      description_en: '',
      description_nl: '',
      location_lat: 0,
      location_lng: 0,
      address: '',
      city: '',
      province: '',
      age_min: 0,
      age_max: 12,
      price_min: 0,
      price_max: 0,
      is_free: false,
      is_indoor: false,
      is_outdoor: false,
      weather_dependent: false,
      phone: '',
      email: '',
      website: '',
      booking_url: '',
      images: [],
      opening_hours: {},
      is_featured: false,
      is_seasonal: false,
      season_start: '',
      season_end: '',
      type: 'venue',
      event_start_datetime: '',
      event_end_datetime: '',
      venue_opening_hours: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '10:00', close: '16:00', closed: false },
      },
    }
  );

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    activity?.categories?.map((link: any) => link.category.id) || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    activity?.tags?.map((link: any) => link.tag.id) || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'add') {
        await adminActivitiesService.create(formData, selectedCategories, selectedTags);
      } else if (mode === 'edit') {
        await adminActivitiesService.update(activity.id, formData, selectedCategories, selectedTags);
      } else if (mode === 'bulk-edit') {
        const updates: any = {};
        if (selectedCategories.length > 0) {
          for (const id of selectedIds) {
            await adminActivitiesService.unlinkAllCategories(id);
            await adminActivitiesService.linkCategories(id, selectedCategories);
          }
        }
        if (selectedTags.length > 0) {
          for (const id of selectedIds) {
            await adminActivitiesService.unlinkAllTags(id);
            await adminActivitiesService.linkTags(id, selectedTags);
          }
        }
        if (formData.is_featured !== undefined) updates.is_featured = formData.is_featured;
        if (formData.is_seasonal !== undefined) updates.is_seasonal = formData.is_seasonal;
        if (Object.keys(updates).length > 0) {
          await adminActivitiesService.bulkUpdate(selectedIds, updates);
        }
      }
      onSave();
    } catch (error) {
      alert('Failed to save activity');
      console.error(error);
    }
  };

  return (
    <div
      style={{
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '24px' }}>
          {mode === 'add' ? 'Add Activity' : mode === 'edit' ? 'Edit Activity' : `Bulk Edit ${selectedIds.length} Activities`}
        </h2>

        <form onSubmit={handleSubmit}>
          {mode !== 'bulk-edit' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: 'white',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>City *</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: 'white',
                  }}
                >
                  <option value="">Select a city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Min Age</label>
                  <input
                    type="number"
                    value={formData.age_min}
                    onChange={(e) => setFormData({ ...formData, age_min: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      backgroundColor: '#0f172a',
                      color: 'white',
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Max Age</label>
                  <input
                    type="number"
                    value={formData.age_max}
                    onChange={(e) => setFormData({ ...formData, age_max: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      backgroundColor: '#0f172a',
                      color: 'white',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Type *</label>
                <select
                  value={formData.type || 'venue'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: 'white',
                  }}
                >
                  <option value="venue">Venue</option>
                  <option value="event">Event</option>
                </select>
              </div>

              {formData.type === 'event' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Event Start *</label>
                      <input
                        type="datetime-local"
                        value={formData.event_start_datetime || ''}
                        onChange={(e) => setFormData({ ...formData, event_start_datetime: e.target.value })}
                        required={formData.type === 'event'}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #334155',
                          backgroundColor: '#0f172a',
                          color: 'white',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Event End *</label>
                      <input
                        type="datetime-local"
                        value={formData.event_end_datetime || ''}
                        onChange={(e) => setFormData({ ...formData, event_end_datetime: e.target.value })}
                        required={formData.type === 'event'}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #334155',
                          backgroundColor: '#0f172a',
                          color: 'white',
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {formData.type === 'venue' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: 'white', display: 'block', marginBottom: '12px' }}>Venue Opening Hours</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <div key={day} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                        <label style={{ color: 'white', textTransform: 'capitalize' }}>{day}</label>
                        <input
                          type="time"
                          value={formData.venue_opening_hours?.[day]?.open || '09:00'}
                          onChange={(e) => setFormData({
                            ...formData,
                            venue_opening_hours: {
                              ...formData.venue_opening_hours,
                              [day]: { ...formData.venue_opening_hours?.[day], open: e.target.value }
                            }
                          })}
                          disabled={formData.venue_opening_hours?.[day]?.closed}
                          style={{
                            padding: '8px',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            backgroundColor: formData.venue_opening_hours?.[day]?.closed ? '#1e293b' : '#0f172a',
                            color: 'white',
                          }}
                        />
                        <input
                          type="time"
                          value={formData.venue_opening_hours?.[day]?.close || '17:00'}
                          onChange={(e) => setFormData({
                            ...formData,
                            venue_opening_hours: {
                              ...formData.venue_opening_hours,
                              [day]: { ...formData.venue_opening_hours?.[day], close: e.target.value }
                            }
                          })}
                          disabled={formData.venue_opening_hours?.[day]?.closed}
                          style={{
                            padding: '8px',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            backgroundColor: formData.venue_opening_hours?.[day]?.closed ? '#1e293b' : '#0f172a',
                            color: 'white',
                          }}
                        />
                        <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={formData.venue_opening_hours?.[day]?.closed || false}
                            onChange={(e) => setFormData({
                              ...formData,
                              venue_opening_hours: {
                                ...formData.venue_opening_hours,
                                [day]: { ...formData.venue_opening_hours?.[day], closed: e.target.checked }
                              }
                            })}
                          />
                          Closed
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Categories</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: selectedCategories.includes(cat.id!) ? '#3b82f6' : '#334155',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id!)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, cat.id!]);
                      } else {
                        setSelectedCategories(selectedCategories.filter((id) => id !== cat.id));
                      }
                    }}
                    style={{ marginRight: '4px' }}
                  />
                  {cat.name_en}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Tags</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: selectedTags.includes(tag.id!) ? tag.color : '#334155',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id!)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags([...selectedTags, tag.id!]);
                      } else {
                        setSelectedTags(selectedTags.filter((id) => id !== tag.id));
                      }
                    }}
                    style={{ marginRight: '4px' }}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                backgroundColor: '#334155',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {mode === 'add' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
