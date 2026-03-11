import { Check } from 'lucide-react';
import './Stepper.css';

const steps = [
  { number: 1, title: 'Group Details' },
  { number: 2, title: 'Trip Details' },
  { number: 3, title: 'Transportation' },
  { number: 4, title: 'Accommodation' },
  { number: 5, title: 'Company Visit' },
  { number: 6, title: 'Visiting Spots' },
  { number: 7, title: 'Food' },
  { number: 8, title: 'Review & Pay' },
  { number: 9, title: 'Invoice' }
];

const Stepper = ({ currentStep, onStepClick }) => {
  return (
    <div className="stepper">
      <div className="stepper-container">
        {steps.map((step, index) => (
          <div key={step.number} className="stepper-item">
            <div 
              className={`stepper-circle ${
                currentStep > step.number 
                  ? 'completed' 
                  : currentStep === step.number 
                    ? 'active' 
                    : ''
              }`}
              onClick={() => currentStep > step.number && onStepClick?.(step.number)}
              style={{ cursor: currentStep > step.number ? 'pointer' : 'default' }}
            >
              {currentStep > step.number ? (
                <Check size={16} />
              ) : (
                step.number
              )}
            </div>
            <span className={`stepper-title ${currentStep >= step.number ? 'active' : ''}`}>
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <div className={`stepper-line ${currentStep > step.number ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stepper;
