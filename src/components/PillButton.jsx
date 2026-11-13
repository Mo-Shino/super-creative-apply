export default function PillButton({ children, size = 'lg', className = '', ...rest }) {
  return (
    <button type="button" className={`pill pill--${size} ${className}`} {...rest}>
      <span className="pill__label">{children}</span>
    </button>
  )
}
