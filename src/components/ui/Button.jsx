export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      {...props}
      className={`ui-button ui-button--${variant} ${className}`.trim()}
    >
      {children}
    </button>
  )
}
