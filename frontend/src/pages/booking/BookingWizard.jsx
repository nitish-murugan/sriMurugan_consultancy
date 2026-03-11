import { useEffect, useCallback } from 'react';
import { useBooking } from '../../context/BookingContext';
import Stepper from '../../components/Stepper';
import { Card, CardBody } from '../../components/Card';
import Step1City from './steps/Step1City';
import Step2Bus from './steps/Step2Bus';
import Step3Institution from './steps/Step3Institution';
import Step4Participants from './steps/Step4Participants';
import Step5Companies from './steps/Step5Companies';
import Step6Spots from './steps/Step6Spots';
import Step7Restaurants from './steps/Step7Restaurants';
import Step8Review from './steps/Step8Review';
import Step9Payment from './steps/Step9Payment';
import './BookingWizard.css';

const STEPS = [
  { label: 'City', description: 'Select destination' },
  { label: 'Bus', description: 'Choose transport' },
  { label: 'Institution', description: 'Your details' },
  { label: 'Participants', description: 'Traveler count' },
  { label: 'Companies', description: 'Places to visit' },
  { label: 'Spots', description: 'Tourist spots' },
  { label: 'Food', description: 'Restaurants' },
  { label: 'Review', description: 'Confirm details' },
  { label: 'Payment', description: 'Confirm & pay' },
];

export default function BookingWizard() {
  const { currentStep, goToStep, resetBooking } = useBooking();

  const reset = useCallback(() => {
    resetBooking();
  }, [resetBooking]);

  useEffect(() => {
    reset();
  }, [reset]);

  const handleStepClick = (stepNumber) => {
    // Only allow going back to completed steps
    if (stepNumber < currentStep) {
      goToStep(stepNumber);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1City />;
      case 2:
        return <Step2Bus />;
      case 3:
        return <Step3Institution />;
      case 4:
        return <Step4Participants />;
      case 5:
        return <Step5Companies />;
      case 6:
        return <Step6Spots />;
      case 7:
        return <Step7Restaurants />;
      case 8:
        return <Step8Review />;
      case 9:
        return <Step9Payment />;
      default:
        return <Step1City />;
    }
  };

  return (
    <div className="booking-wizard">
      <div className="container">
        <div className="wizard-header">
          <h1>Book Your Industrial Visit</h1>
          <p>Complete the steps below to book your tour</p>
        </div>

        <div className="wizard-stepper">
          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </div>

        <div className="wizard-content">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
