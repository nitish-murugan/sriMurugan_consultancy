import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBooking } from '../../../context/BookingContext';
import { Card, CardBody } from '../../../components/Card';
import Button from '../../../components/Button';
import { Input, Select, Textarea } from '../../../components/Input';

const institutionSchema = z.object({
  institutionName: z.string().min(2, 'Institution name is required'),
  institutionType: z.string().min(1, 'Please select institution type'),
  departmentName: z.string().optional(),
  coordinatorName: z.string().min(2, 'Coordinator name is required'),
  coordinatorPhone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  coordinatorEmail: z.string().email('Invalid email'),
  alternatePhone: z.string().optional(),
  address: z.string().min(10, 'Please enter full address'),
});

const institutionTypes = [
  { value: 'engineering', label: 'Engineering College' },
  { value: 'arts_science', label: 'Arts & Science College' },
  { value: 'polytechnic', label: 'Polytechnic' },
  { value: 'school', label: 'School' },
  { value: 'university', label: 'University' },
  { value: 'other', label: 'Other' },
];

export default function Step3Institution() {
  const { bookingData, updateBookingData, nextStep, prevStep } = useBooking();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(institutionSchema),
    defaultValues: {
      institutionName: bookingData.institution?.name || '',
      institutionType: bookingData.institution?.type || '',
      departmentName: bookingData.institution?.department || '',
      coordinatorName: bookingData.coordinator?.name || '',
      coordinatorPhone: bookingData.coordinator?.phone || '',
      coordinatorEmail: bookingData.coordinator?.email || '',
      alternatePhone: bookingData.coordinator?.alternatePhone || '',
      address: bookingData.institution?.address || '',
    },
  });

  const onSubmit = (data) => {
    updateBookingData({
      institution: {
        name: data.institutionName,
        type: data.institutionType,
        department: data.departmentName,
        address: data.address,
      },
      coordinator: {
        name: data.coordinatorName,
        phone: data.coordinatorPhone,
        email: data.coordinatorEmail,
        alternatePhone: data.alternatePhone,
      },
    });
    nextStep();
  };

  return (
    <Card className="step-card">
      <CardBody>
        <h2 className="step-title">Institution Details</h2>
        <p className="step-description">
          Enter your institution and coordinator information
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row">
            <Input
              label="Institution Name"
              placeholder="Enter institution name"
              error={errors.institutionName?.message}
              {...register('institutionName')}
            />
            <Select
              label="Institution Type"
              error={errors.institutionType?.message}
              {...register('institutionType')}
            >
              <option value="">Select type</option>
              {institutionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="form-row" style={{ marginTop: '1rem' }}>
            <Input
              label="Department Name (Must for Searching Company)"
              placeholder="E.g., Computer Science"
              error={errors.departmentName?.message}
              {...register('departmentName')}
            />
          </div>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
            Coordinator Details
          </h3>

          <div className="form-row">
            <Input
              label="Coordinator Name"
              placeholder="Full name"
              error={errors.coordinatorName?.message}
              {...register('coordinatorName')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="coordinator@email.com"
              error={errors.coordinatorEmail?.message}
              {...register('coordinatorEmail')}
            />
          </div>

          <div className="form-row" style={{ marginTop: '1rem' }}>
            <Input
              label="Phone Number"
              type="tel"
              placeholder="10-digit phone number"
              error={errors.coordinatorPhone?.message}
              {...register('coordinatorPhone')}
            />
            <Input
              label="Alternate Phone (Optional)"
              type="tel"
              placeholder="Alternate number"
              error={errors.alternatePhone?.message}
              {...register('alternatePhone')}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Textarea
              label="Institution Address"
              placeholder="Enter complete address"
              rows={3}
              error={errors.address?.message}
              {...register('address')}
            />
          </div>

          <div className="step-actions">
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
            <div className="step-actions-right">
              <Button type="submit">
                Continue
              </Button>
            </div>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
