export default function PageHeader({ title, description, extra }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-header__title">{title}</h1>
        {description && <p className="page-header__desc">{description}</p>}
      </div>
      {extra && <div className="page-header__extra">{extra}</div>}
    </header>
  )
}
