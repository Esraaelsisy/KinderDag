import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function EditActivity() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Creative',
    age_range: '0-2',
    duration: 30,
    materials: '',
    indoor: true,
    image_url: '',
  });

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      setError('Failed to load activity');
      setLoading(false);
      return;
    }

    if (data) {
      setFormData({
        title: data.title,
        description: data.description,
        category: data.category,
        age_range: data.age_range,
        duration: data.duration,
        materials: Array.isArray(data.materials) ? data.materials.join(', ') : '',
        indoor: data.indoor,
        image_url: data.image_url || '',
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const materialsArray = formData.materials
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    const { error } = await supabase
      .from('activities')
      .update({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        age_range: formData.age_range,
        duration: formData.duration,
        materials: materialsArray,
        indoor: formData.indoor,
        image_url: formData.image_url || null,
      })
      .eq('id', id);

    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      navigate('/');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked :
        type === 'number' ? Number(value) :
        value,
    }));
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: 'white', textAlign: 'center' }}>Loading activity...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Edit Activity</h1>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            Back to Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Activity title"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              style={{ ...styles.input, minHeight: '100px', resize: 'vertical' as const }}
              placeholder="Describe the activity"
            />
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="Creative">Creative</option>
                <option value="Active">Active</option>
                <option value="Educational">Educational</option>
                <option value="Sensory">Sensory</option>
                <option value="Social">Social</option>
                <option value="Music">Music</option>
                <option value="Nature">Nature</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Age Range *</label>
              <select
                name="age_range"
                value={formData.age_range}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="0-2">0-2 years</option>
                <option value="3-5">3-5 years</option>
                <option value="6-8">6-8 years</option>
                <option value="9-12">9-12 years</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Duration (minutes) *</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                min="1"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Location *</label>
              <select
                name="indoor"
                value={formData.indoor ? 'true' : 'false'}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, indoor: e.target.value === 'true' }))
                }
                style={styles.input}
              >
                <option value="true">Indoor</option>
                <option value="false">Outdoor</option>
              </select>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Materials (comma-separated)</label>
            <input
              type="text"
              name="materials"
              value={formData.materials}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., paper, crayons, scissors"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Image URL</label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              style={styles.input}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <button type="submit" disabled={saving} style={styles.submitButton}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
  },
  card: {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a202c',
  },
  backButton: {
    padding: '10px 20px',
    background: '#e2e8f0',
    color: '#2d3748',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748',
  },
  input: {
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  submitButton: {
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    padding: '12px',
    background: '#fed7d7',
    color: '#c53030',
    borderRadius: '6px',
    fontSize: '14px',
  },
};
