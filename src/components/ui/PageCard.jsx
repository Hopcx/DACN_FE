export default function PageCard({ children, className = '' }) {
  return <div className={`page-card ${className}`}>{children}</div>
}
