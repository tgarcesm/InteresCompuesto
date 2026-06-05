export function Card({ icon, title, children, className = '' }) {
  return (
    <article className={`card${className ? ' ' + className : ''}`}>
      {title && (
        <div className="ch">
          <div className="ch-title">
            {icon && (
              <div className="ch-icon" aria-hidden="true">
                {icon}
              </div>
            )}
            {title}
          </div>
        </div>
      )}
      <div className="cb cb-stack">{children}</div>
    </article>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`cb${className ? ' ' + className : ''}`}>{children}</div>;
}
