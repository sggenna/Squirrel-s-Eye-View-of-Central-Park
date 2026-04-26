import SquirrelSvg from './SquirrelSvg';

export default function HeroSection() {
  return (
    <section className="hero" id="hero">
      <div>
        <div className="hero-kicker">NYC Squirrel Census 2018</div>
        <h1>Squirrel&rsquo;s <em>Eye View</em> of Central Park</h1>
        <p className="dek">
          How 3,023 squirrels and 22 million humans navigate the same 843 acres — and what
          their behavior reveals about each other.
        </p>
        <div className="byline">
          <div><span>Dataset</span><b>2018 NYC Squirrel Census</b></div>
          <div><span>Location</span><b>Central Park, NYC</b></div>
          <div><span>Period</span><b>October 2018</b></div>
        </div>
      </div>
      <div className="hero-viz">
        <SquirrelSvg suffix="hero" />
      </div>
      <div className="scroll-cue">
        <div className="scroll-line" />
        scroll
      </div>
    </section>
  );
}
