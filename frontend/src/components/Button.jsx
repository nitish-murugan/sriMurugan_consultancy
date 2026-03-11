import { forwardRef } from 'react';
import './Button.css';

const Button = forwardRef(({
  children,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  className = '',
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${loading ? 'btn-loading' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner"></span>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={size === 'small' ? 14 : 18} className="btn-icon" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon size={size === 'small' ? 14 : 18} className="btn-icon" />}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
