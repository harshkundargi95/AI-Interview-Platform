import { Link } from 'react-router'

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button type="button" className={`button button-${variant} ${className}`} {...props}>{children}</button>
}

export function ButtonLink({ children, to, variant = 'primary', ...props }) {
  return <Link to={to} className={`button button-${variant}`} {...props}>{children}</Link>
}

export function Card({ children, className = '', ...props }) {
  return <section className={`card ${className}`} {...props}>{children}</section>
}

export function PageHeading({ eyebrow, title, children }) {
  return <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <p className="intro">{children}</p>}</div>
}

export function SelectField({ id, label, hint, children, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props}>{children}</select>
      {hint && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
    </div>
  )
}

export function TextAreaField({ id, label, hint, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
      {hint && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
    </div>
  )
}

export function EmptyState({ title, children, to = '/setup', action = 'Explore interview setup' }) {
  return <Card className="empty-state"><span className="empty-symbol" aria-hidden="true">◇</span><h2>{title}</h2><p>{children}</p><ButtonLink to={to}>{action}</ButtonLink></Card>
}
