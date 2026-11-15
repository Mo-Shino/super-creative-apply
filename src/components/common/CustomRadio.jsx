export default function CustomRadio({ name, value, checked, onChange, onBlur, label, disabled = false, id }) {
  return (
    <label className={`custom-radio ${checked ? 'is-checked' : ''} ${disabled ? 'is-disabled' : ''}`}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className="custom-radio__input"
      />
      <span className="custom-radio__circle" aria-hidden="true">
        <span className="custom-radio__dot" />
      </span>
      <span className="custom-radio__label">{label}</span>
    </label>
  )
}
