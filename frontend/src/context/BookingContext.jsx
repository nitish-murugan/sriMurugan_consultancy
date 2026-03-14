import { useState, useCallback } from 'react';
import { BookingContext } from './useBooking';

// Re-export hook for backwards compatibility
export { useBooking } from './useBooking';

const initialBookingState = {
  // Step 1: Group Details
  groupDetails: {
    boys: 0,
    girls: 0,
    staff: 0,
    total: 0
  },
  // Step 2: Trip Details
  tripDetails: {
    departureCity: '',
    destination: '',
    duration: 1,
    startDate: null,
    endDate: null
  },
  // Step 3: Transportation
  transport: {
    busType: '',
    bus: null
  },
  // Step 4: Accommodation
  accommodation: {
    type: '',
    guideRequired: false
  },
  // Step 5: Company Visit
  companyVisit: {
    domain: '',
    selectedCompany: null
  },
  // Step 6: Visiting Spots
  visitingSpots: [],
  // Step 7: Food Arrangement
  foodArrangement: {
    required: false,
    selectedRestaurants: []
  },
  // Step 8: Payment
  payment: {
    amount: 0,
    status: 'pending'
  }
};

export const BookingProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState(initialBookingState);
  const [completedBooking, setCompletedBooking] = useState(null);

  const totalSteps = 9;

  const updateBookingData = useCallback((sectionOrData, data) => {
    // If called with single object argument, merge directly
    if (typeof sectionOrData === 'object' && data === undefined) {
      setBookingData(prev => ({
        ...prev,
        ...sectionOrData
      }));
    } else {
      // Called with (section, data) - merge into section
      setBookingData(prev => ({
        ...prev,
        [sectionOrData]: {
          ...prev[sectionOrData],
          ...data
        }
      }));
    }
  }, []);

  const updateGroupDetails = useCallback((data) => {
    const total = (parseInt(data.boys) || 0) + (parseInt(data.girls) || 0) + (parseInt(data.staff) || 0);
    setBookingData(prev => ({
      ...prev,
      groupDetails: {
        ...prev.groupDetails,
        ...data,
        total
      }
    }));
  }, []);

  const updateTripDetails = useCallback((data) => {
    setBookingData(prev => {
      const newTripDetails = { ...prev.tripDetails, ...data };
      
      // Calculate end date if start date and duration are set
      if (newTripDetails.startDate && newTripDetails.duration) {
        const endDate = new Date(newTripDetails.startDate);
        endDate.setDate(endDate.getDate() + parseInt(newTripDetails.duration) - 1);
        newTripDetails.endDate = endDate;
      }
      
      return {
        ...prev,
        tripDetails: newTripDetails
      };
    });
  }, []);

  const updateTransport = useCallback((data) => {
    updateBookingData('transport', data);
  }, [updateBookingData]);

  const updateAccommodation = useCallback((data) => {
    updateBookingData('accommodation', data);
  }, [updateBookingData]);

  const updateCompanyVisit = useCallback((data) => {
    updateBookingData('companyVisit', data);
  }, [updateBookingData]);

  const updateVisitingSpots = useCallback((spots) => {
    setBookingData(prev => ({
      ...prev,
      visitingSpots: spots
    }));
  }, []);

  const toggleSpot = useCallback((spot) => {
    setBookingData(prev => {
      const exists = prev.visitingSpots.find(s => s.id === spot.id);
      if (exists) {
        return {
          ...prev,
          visitingSpots: prev.visitingSpots.filter(s => s.id !== spot.id)
        };
      } else {
        return {
          ...prev,
          visitingSpots: [...prev.visitingSpots, spot]
        };
      }
    });
  }, []);

  const updateFoodArrangement = useCallback((data) => {
    updateBookingData('foodArrangement', data);
  }, [updateBookingData]);

  const updatePayment = useCallback((data) => {
    updateBookingData('payment', data);
  }, [updateBookingData]);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  }, []);

  const resetBooking = useCallback(() => {
    setBookingData(initialBookingState);
    setCurrentStep(1);
    setCompletedBooking(null);
  }, []);

  const calculateEstimatedPrice = useCallback(() => {
    const { groupDetails, tripDetails, transport, accommodation, foodArrangement } = bookingData;
    
    let basePrice = 0;
    
    // Base price per person per day
    const pricePerPersonPerDay = 500;
    basePrice += groupDetails.total * tripDetails.duration * pricePerPersonPerDay;
    
    // Bus price (if selected)
    if (transport.bus?.pricePerDay) {
      basePrice += transport.bus.pricePerDay * tripDetails.duration;
    }
    
    // Accommodation multiplier
    const accommodationMultipliers = {
      'Hotel': 1.5,
      'Dormitory': 1.0,
      'Lodge': 1.2,
      'No Accommodation': 0.8
    };
    basePrice *= accommodationMultipliers[accommodation.type] || 1;
    
    // Guide fee
    if (accommodation.guideRequired) {
      basePrice += 2000 * tripDetails.duration;
    }
    
    // Food arrangement
    if (foodArrangement.required) {
      basePrice += groupDetails.total * tripDetails.duration * 300;
    }
    
    return Math.round(basePrice);
  }, [bookingData]);

  const value = {
    currentStep,
    totalSteps,
    bookingData,
    completedBooking,
    setCompletedBooking,
    updateBookingData,
    updateGroupDetails,
    updateTripDetails,
    updateTransport,
    updateAccommodation,
    updateCompanyVisit,
    updateVisitingSpots,
    toggleSpot,
    updateFoodArrangement,
    updatePayment,
    nextStep,
    prevStep,
    goToStep,
    resetBooking,
    calculateEstimatedPrice
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export default BookingContext;
