const AppFooter = () => {
  const text = 'Extension Systems Project 02 [EX_P02] Version 0.0.1 | Produced by Intelligent Design LLC 2025©';

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

