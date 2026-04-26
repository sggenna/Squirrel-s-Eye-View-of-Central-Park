export default function ChapterBanner({ num, title, visible = true }) {
  return (
    <div className="chapter-banner" style={{ opacity: visible ? 1 : 0, transition: 'opacity .2s' }}>
      <span className="cb-num">{num}</span>
      <span className="cb-title" dangerouslySetInnerHTML={{ __html: title }} />
    </div>
  );
}
