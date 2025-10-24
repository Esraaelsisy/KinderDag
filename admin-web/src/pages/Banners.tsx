import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminBannersService, Banner, BannerInput } from '../services/adminBanners';

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activities, setActivities] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name_en: string; name_nl: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerInput>({
    title_en: '',
    title_nl: '',
    subtitle_en: '',
    subtitle_nl: '',
    image_url: '',
    action_type: null,
    action_value: null,
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bannersData, activitiesData, categoriesData] = await Promise.all([
        adminBannersService.getAll(),
        adminBannersService.getAllActivities(),
        adminBannersService.getAllCategories(),
      ]);
      setBanners(bannersData);
      setActivities(activitiesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await adminBannersService.update(editingBanner.id, formData);
      } else {
        await adminBannersService.create(formData);
      }
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Failed to save banner:', error);
      alert('Failed to save banner');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title_en: banner.title_en,
      title_nl: banner.title_nl,
      subtitle_en: banner.subtitle_en,
      subtitle_nl: banner.subtitle_nl,
      image_url: banner.image_url,
      action_type: banner.action_type,
      action_value: banner.action_value,
      is_active: banner.is_active,
      sort_order: banner.sort_order,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      await adminBannersService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete banner:', error);
      alert('Failed to delete banner');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingBanner(null);
    setFormData({
      title_en: '',
      title_nl: '',
      subtitle_en: '',
      subtitle_nl: '',
      image_url: '',
      action_type: null,
      action_value: null,
      is_active: true,
      sort_order: 0,
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
      <div style={{ maxWidth: '1200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>Banners</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            {showForm ? 'Cancel' : 'Add New Banner'}
          </button>
        </div>

        {showForm && (
          <div style={{
            backgroundColor: '#1e293b',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '32px',
            border: '1px solid #334155',
          }}>
            <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '24px' }}>
              {editingBanner ? 'Edit Banner' : 'Add New Banner'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: 'white',
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    Title (Dutch) *
                  </label>
                  <input
                    type="text"
                    value={formData.title_nl}
                    onChange={(e) => setFormData({ ...formData, title_nl: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: 'white',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    Subtitle (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle_en}
                    onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: 'white',
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    Subtitle (Dutch) *
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle_nl}
                    onChange={(e) => setFormData({ ...formData, subtitle_nl: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: 'white',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                  Image URL *
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  required
                  placeholder="https://images.pexels.com/..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: 'white',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    Action Type
                  </label>
                  <select
                    value={formData.action_type || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      action_type: e.target.value as any,
                      action_value: null,
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: 'white',
                    }}
                  >
                    <option value="">None</option>
                    <option value="activity">Activity</option>
                    <option value="category">Category</option>
                    <option value="url">URL</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    Action Value
                  </label>
                  {formData.action_type === 'activity' ? (
                    <select
                      value={formData.action_value || ''}
                      onChange={(e) => setFormData({ ...formData, action_value: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        color: 'white',
                      }}
                    >
                      <option value="">Select Activity</option>
                      {activities.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                          {activity.name}
                        </option>
                      ))}
                    </select>
                  ) : formData.action_type === 'category' ? (
                    <select
                      value={formData.action_value || ''}
                      onChange={(e) => setFormData({ ...formData, action_value: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        color: 'white',
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name_en}
                        </option>
                      ))}
                    </select>
                  ) : formData.action_type === 'url' ? (
                    <input
                      type="url"
                      value={formData.action_value || ''}
                      onChange={(e) => setFormData({ ...formData, action_value: e.target.value })}
                      placeholder="https://example.com"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        color: 'white',
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      disabled
                      placeholder="Select action type first"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        color: '#64748b',
                      }}
                    />
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    Sort Order *
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    required
                    min="0"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: 'white',
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    Status
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ color: 'white' }}>Active</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    backgroundColor: '#64748b',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'grid', gap: '16px' }}>
          {banners.map((banner) => (
            <div
              key={banner.id}
              style={{
                backgroundColor: '#1e293b',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #334155',
                display: 'flex',
                gap: '24px',
              }}
            >
              <img
                src={banner.image_url}
                alt={banner.title_en}
                style={{
                  width: '200px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {banner.title_en}
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>{banner.subtitle_en}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: banner.is_active ? '#10b981' : '#64748b',
                        color: 'white',
                      }}
                    >
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                      }}
                    >
                      Order: {banner.sort_order}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '4px' }}>
                    <strong>Dutch:</strong> {banner.title_nl} - {banner.subtitle_nl}
                  </p>
                  {banner.action_type && (
                    <p style={{ color: '#64748b', fontSize: '14px' }}>
                      <strong>Action:</strong> {banner.action_type} ({banner.action_value})
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(banner)}
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
                    onClick={() => handleDelete(banner.id)}
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
          ))}

          {banners.length === 0 && (
            <div style={{
              backgroundColor: '#1e293b',
              padding: '48px',
              borderRadius: '12px',
              border: '1px solid #334155',
              textAlign: 'center',
            }}>
              <p style={{ color: '#64748b', fontSize: '16px' }}>
                No banners yet. Click "Add New Banner" to create one.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
