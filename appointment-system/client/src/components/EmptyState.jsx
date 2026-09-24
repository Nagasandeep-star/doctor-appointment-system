/**
 * EmptyState — shown when a list has no items.
 * @param {string} icon     - Emoji or icon character
 * @param {string} title    - Short heading
 * @param {string} message  - Optional sub-text
 * @param {ReactNode} action - Optional action button
 */
export default function EmptyState({ icon = '🗂️', title, message, action }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
        gap: '1rem',
      }}
    >
      <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text)' }}>
        {title}
      </h3>
      {message && (
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: '28rem' }}>
          {message}
        </p>
      )}
      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </div>
  );
}
