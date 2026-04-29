import { useState } from 'react';
import squirrelImg from '../squirrels.svg';

export default function TopBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <img src={squirrelImg} alt="Squirrel logo" />
          Squirrel&rsquo;s Eye View of Central Park
        </div>
        <nav>
          <a href="#ch1">Humans</a>
          <a href="#ch2">Squirrels</a>
          <a href="#ch3">N vs S</a>
          <a href="#ch4">Explore</a>
        </nav>
        <button
          className={'nav-toggle' + (open ? ' open' : '')}
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>
      </div>
      <div className={'mobile-menu' + (open ? ' open' : '')} onClick={() => setOpen(false)}>
        <a href="#ch1">Humans</a>
        <a href="#ch2">Squirrels</a>
        <a href="#ch3">N vs S</a>
        <a href="#ch4">Explore</a>
      </div>
    </>
  );
}
