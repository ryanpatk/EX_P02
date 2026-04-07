const AppFooter = () => {
  const text =
    'Extension Systems Project 02 - Produced by PERSONAL SYSTEMS LLC 2026©';

  return (
    <div className="desktop-footer">
      <div className="marquee-container">
        <div className="marquee-content">
          <span>{text}</span>
          <span>{text}</span>
          <span>{text}</span>
          <span>{text}</span>
          <span>{text}</span>
        </div>
      </div>
    </div>
  );
};

export default AppFooter;
