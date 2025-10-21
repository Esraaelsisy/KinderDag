import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  age_range: string;
  duration: number;
  materials: string[];
  indoor: boolean;
  image_url: string | null;
  created_at: string;
}

export default function Dashboard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
    } else {
      setActivities(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting activity: ' + error.message);
    } else {
      fetchActivities();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: 'white' }}>Loading activities...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>KinderDag Admin Dashboard</h1>
        <div style={styles.headerButtons}>
          <button onClick={() => navigate('/add')} style={styles.addButton}>
            + Add Activity
          </button>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {activities.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No activities yet. Create your first one!</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {activities.map((activity) => (
              <div key={activity.id} style={styles.card}>
                {activity.image_url && (
                  <img src={activity.image_url} alt={activity.title} style={styles.image} />
                )}
                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{activity.title}</h3>
                  <p style={styles.cardDescription}>{activity.description}</p>
                  <div style={styles.cardMeta}>
                    <span style={styles.badge}>{activity.category}</span>
                    <span style={styles.badge}>{activity.age_range}</span>
                    <span style={styles.badge}>{activity.duration} min</span>
                    <span style={styles.badge}>{activity.indoor ? 'Indoor' : 'Outdoor'}</span>
                  </div>
                  <div style={styles.cardActions}>
                    <button
                      onClick={() => navigate(`/edit/${activity.id}`)}
                      style={styles.editButton}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(activity.id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'white',
  },
  headerButtons: {
    display: 'flex',
    gap: '12px',
  },
  addButton: {
    padding: '12px 24px',
    background: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  logoutButton: {
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid white',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  emptyState: {
    background: 'white',
    borderRadius: '12px',
    padding: '60px',
    textAlign: 'center' as const,
  },
  emptyText: {
    fontSize: '18px',
    color: '#718096',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s',
  },
  image: {
    width: '100%',
    height: '200px',
    objectFit: 'cover' as const,
  },
  cardContent: {
    padding: '20px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: '8px',
  },
  cardDescription: {
    fontSize: '14px',
    color: '#4a5568',
    marginBottom: '16px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  cardMeta: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '16px',
  },
  badge: {
    padding: '4px 12px',
    background: '#edf2f7',
    color: '#4a5568',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    flex: 1,
    padding: '10px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  deleteButton: {
    flex: 1,
    padding: '10px',
    background: '#fc8181',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
