import { forwardRef } from 'react';
import './Input.css';

export const Input = forwardRef(({
  label,
  type = 'text',
  error,
  helperText,
  icon: Icon,
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`input-wrapper ${fullWidth ? 'full-width' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className={`input-container ${error ? 'error' : ''} ${Icon ? 'has-icon' : ''}`}>
        {Icon && <Icon className="input-icon" size={18} />}
        <input
          ref={ref}
          type={type}
          className="input-field"
          {...props}
        />
      </div>
      {(error || helperText) && (
        <span className={`input-helper ${error ? 'error' : ''}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Select = forwardRef(({
  label,
  options = [],
  error,
  helperText,
  placeholder = 'Select an option',
  fullWidth = true,
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div className={`input-wrapper ${fullWidth ? 'full-width' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className={`input-container select-container ${error ? 'error' : ''}`}>
        <select ref={ref} className="input-field select-field" {...props}>
          {children || (
            <>
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </>
          )}
        </select>
      </div>
      {(error || helperText) && (
        <span className={`input-helper ${error ? 'error' : ''}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export const Textarea = forwardRef(({
  label,
  error,
  helperText,
  rows = 4,
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`input-wrapper ${fullWidth ? 'full-width' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className={`input-container ${error ? 'error' : ''}`}>
        <textarea
          ref={ref}
          className="input-field textarea-field"
          rows={rows}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <span className={`input-helper ${error ? 'error' : ''}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;
