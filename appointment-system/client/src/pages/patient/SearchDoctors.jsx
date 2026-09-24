import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function SearchDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.name = search;
      if (specFilter) params.specialization = specFilter;
      const { data } = await api.get('/doctors', { params });
      setDoctors(data.data || []);
    } catch { /* handled by interceptor */ }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div className="fade-in" style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
          <span className="gradient-text">Find a Doctor 🔍</span>
        </h1>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
          Search by doctor name or specialization
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input
          id="search-name"
          type="text"
          className="input"
          style={{ flex: '1 1 200px', maxWidth: '400px' }}
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          id="search-spec"
          type="text"
          className="input"
          style={{ flex: '1 1 200px', maxWidth: '300px' }}
          placeholder="Specialization..."
          value={specFilter}
          onChange={(e) => setSpecFilter(e.target.value)}
        />
        <button type="submit" id="search-btn" className="btn btn-primary">Search</button>
      </form>

      {loading ? (
        <LoadingSpinner />
      ) : doctors.length === 0 ? (
        <EmptyState
          icon="🩺"
          title="No doctors found"
          message="Try adjusting your search or check back later for more doctors."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {doctors.map((doc) => (
            <div key={doc._id} className="card fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0
                }}>👨‍⚕️</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700 }}>{doc.user?.name}</h3>
                  <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                    {doc.specialization}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Experience</p>
                  <p style={{ margin: '0.125rem 0 0', fontSize: '0.9375rem', fontWeight: 600 }}>{doc.experience} yrs</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fee</p>
                  <p style={{ margin: '0.125rem 0 0', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-success)' }}>${doc.fee}</p>
                </div>
              </div>

              <Link to={`/patient/book/${doc._id}`} className="btn btn-primary" style={{ width: '100%' }}>
                Book Appointment
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
