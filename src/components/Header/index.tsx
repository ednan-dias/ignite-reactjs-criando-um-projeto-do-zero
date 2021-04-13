import Link from 'next/link';
import styles from './header.module.scss';

function Header(): JSX.Element {
  return (
    <header className={styles.headerContainer}>
      <Link href="/">
        <img src="/spacetraveling.svg" alt="logo" />
      </Link>
    </header>
  );
}

export default Header;
