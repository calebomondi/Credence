'use client';

import styles from '@/app/ambient-bg.module.css';

export default function AmbientBackground() {
  return (
    <div className={styles.ambientBg} aria-hidden="true">
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />
    </div>
  );
}
