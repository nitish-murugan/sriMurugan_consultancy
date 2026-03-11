import './Card.css';

export const Card = ({ 
  children, 
  className = '', 
  onClick, 
  selected = false,
  hoverable = false,
  padding = 'normal'
}) => {
  return (
    <div 
      className={`card ${className} ${selected ? 'selected' : ''} ${hoverable ? 'hoverable' : ''} padding-${padding}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`card-header ${className}`}>{children}</div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`card-body ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`card-footer ${className}`}>{children}</div>
);

export default Card;
