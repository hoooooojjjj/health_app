export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Health App
      </h1>
      <p style={{ color: '#888888', fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.6' }}>
        Successfully initialized with Next.js and Supabase SSR authentication utilities.
        Start building your application by editing <code>src/app/page.tsx</code>.
      </p>
    </main>
  )
}
