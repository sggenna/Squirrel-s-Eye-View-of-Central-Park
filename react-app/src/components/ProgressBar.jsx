import { useEffect, useRef } from 'react';

export default function ProgressBar() {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    const onScroll = () => {
      const el = document.documentElement;
      bar.style.width = (el.scrollTop / (el.scrollHeight - el.clientHeight) * 100) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return <div id="progress" ref={barRef} />;
}
