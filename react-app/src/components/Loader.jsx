import { useEffect, useRef } from 'react';

export default function Loader({ progress, msg, done }) {
  const el = useRef(null);

  useEffect(() => {
    if (done && el.current) {
      el.current.classList.add('done');
    }
  }, [done]);

  return (
    <div id="loader" ref={el}>
      <div className="loader-sq">🐿️</div>
      <div className="loader-txt">{msg}</div>
      <div className="loader-bar">
        <div className="loader-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
