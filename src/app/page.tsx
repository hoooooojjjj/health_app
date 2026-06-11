import styles from './page.module.css'

export default function Home() {
  const colors = [
    { color: 'var(--accent-green)',       label: 'Green' },
    { color: 'var(--accent-green-light)', label: 'G-Light' },
    { color: 'var(--accent-blue)',        label: 'Blue' },
    { color: 'var(--accent-yellow)',      label: 'Yellow' },
    { color: 'var(--accent-zinc)',        label: 'Zinc' },
  ]

  const navItems = [
    { label: '홈',  active: false },
    { label: '기록', active: true },
    { label: '통계', active: false },
    { label: '소셜', active: false },
    { label: '메뉴', active: false },
  ]

  return (
    <div className={styles.wrapper}>
      {/* App Container */}
      <div className={styles.appContainer}>

        {/* Background FX */}
        <div className={styles.bgGrid} />
        <div className={styles.bgScanlines} />

        {/* Header */}
        <header className={styles.header}>
          <span className={styles.labelSystem}>// health_app</span>
          <h1 className={styles.pageTitle}>디자인 시스템</h1>
        </header>

        {/* Main */}
        <main className={styles.main}>

          {/* Color Palette */}
          <div className={styles.section}>
            <span className={styles.label}>Accent Colors</span>
            <div className={`${styles.card} ${styles.colorGrid}`}>
              {colors.map((c) => (
                <div key={c.label} className={styles.colorSwatch}>
                  <div
                    className={styles.colorBox}
                    style={{ backgroundColor: c.color }}
                  />
                  <span className={styles.colorLabel}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Pill */}
          <div className={styles.section}>
            <span className={styles.label}>Status Pill</span>
            <div className={styles.statusPill}>
              <div className={styles.statusPillDot} />
              <span className={styles.statusPillText}>[ SYS.ACTIVE ]</span>
            </div>
          </div>

          {/* Buttons */}
          <div className={styles.section}>
            <span className={styles.label}>Buttons</span>
            <div className={styles.buttonRow}>
              <button className={styles.btnPrimary}>Primary</button>
              <button className={styles.btnGhost}>Ghost</button>
              <button className={styles.btnIcon} aria-label="추가">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5"  y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Dot Indicators */}
          <div className={styles.section}>
            <span className={styles.label}>Dot Indicators</span>
            <div className={styles.dotRow}>
              <div className={styles.dotItem}>
                <div className={`${styles.dot} ${styles.dotGreen}`} />
                <span>운동</span>
              </div>
              <div className={styles.dotItem}>
                <div className={`${styles.dot} ${styles.dotYellow}`} />
                <span>사진</span>
              </div>
              <div className={styles.dotItem}>
                <div className={`${styles.dot} ${styles.dotBlue}`} />
                <span>신체</span>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className={styles.section}>
            <span className={styles.label}>Typography</span>
            <div className={`${styles.card} ${styles.typoCard}`}>
              <h1 className={styles.titlePage}>Page Title / 24px</h1>
              <h2 className={styles.titleSection}>Section Title / 18px</h2>
              <p className={styles.bodyText}>
                Body text — <span style={{ fontVariantNumeric: 'tabular-nums' }}>2026-06-11</span>
              </p>
              <span className={styles.labelSystem}>// system_label / 9px tracking-widest</span>
              <p className={styles.numDisplay}>42</p>
            </div>
          </div>

        </main>

        {/* Bottom Nav */}
        <nav className={styles.bottomNav}>
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`${styles.navItem} ${item.active ? styles.navItemActive : ''}`}
            >
              <div className={styles.navIcon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

      </div>
    </div>
  )
}
