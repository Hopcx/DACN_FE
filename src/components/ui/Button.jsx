export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  return (
    <button
      type={type}
      className={`ui-button ui-button--${variant}`}
      {...props}
    >
      {children}
    </button>
  )
}
