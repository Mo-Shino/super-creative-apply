export function Check() {
  return (
    <span className="field__ok" aria-hidden="true">
      <svg viewBox="0 0 20 20" width="14" height="14">
        <path d="M4.5 10.5l3.6 3.6L15.5 6.5" fill="none" stroke="#000" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export default function Field({ id, label, hint, error, ok, helper, className = '', children }) {
  return (
    <div className={`field ${error ? 'is-invalid' : ''} ${className}`.trim()}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
          {hint && <span className="field__hint"> {hint}</span>}
        </label>
      )}
      <div className="field__control">
        {children}
        {ok && <Check />}
      </div>
      {helper && <p className="field__helper">{helper}</p>}
      {error && (
        <p className="field__error" id={id ? `${id}-err` : undefined} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
