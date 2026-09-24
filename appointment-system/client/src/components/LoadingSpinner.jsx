/**
 * LoadingSpinner component.
 * @param {boolean} fullScreen - centers the spinner in the entire viewport
 * @param {string}  size       - 'sm' | 'md' | 'lg'
 */
export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizeMap = { sm: '1.25rem', md: '2rem', lg: '3rem' };
  const dim = sizeMap[size] || '2rem';

  const spinner = (
    <div
      style={{
        width: dim,
        height: dim,
        border: '3px solid rgba(99,102,241,0.2)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );

  if (fullScreen) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
        }}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      {spinner}
    </div>
  );
}
