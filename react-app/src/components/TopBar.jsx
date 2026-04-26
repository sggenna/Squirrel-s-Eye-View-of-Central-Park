import SquirrelSvg from './SquirrelSvg';

export default function TopBar() {
  return (
    <div className="topbar">
      <div className="brand">
        <SquirrelSvg suffix="nav" />
        Squirrel&rsquo;s Eye View of Central Park
      </div>
      <nav>
        <a href="#ch1">Humans</a>
        <a href="#ch2">Squirrels</a>
        <a href="#ch3">Behaviors</a>
        <a href="#ch4">N vs S</a>
        <a href="#ch5">Explore</a>
      </nav>
    </div>
  );
}
