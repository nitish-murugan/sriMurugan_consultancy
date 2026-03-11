import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, UserCheck, GraduationCap } from 'lucide-react';
import { useBooking } from '../../../context/BookingContext';
import { Card, CardBody } from '../../../components/Card';
import Button from '../../../components/Button';
import { Input, Textarea } from '../../../components/Input';

const participantsSchema = z.object({
  studentCount: z.string().min(1, 'Required').transform(Number).pipe(
    z.number().min(1, 'At least 1 student required').max(500, 'Maximum 500 students')
  ),
  staffCount: z.string().min(1, 'Required').transform(Number).pipe(
    z.number().min(1, 'At least 1 staff required').max(50, 'Maximum 50 staff')
  ),
  boyCount: z.string().optional().transform((val) => val ? Number(val) : 0),
  girlCount: z.string().optional().transform((val) => val ? Number(val) : 0),
  specialRequirements: z.string().optional(),
});

export default function Step4Participants() {
  const { bookingData, updateBookingData, nextStep, prevStep } = useBooking();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(participantsSchema),
    defaultValues: {
      studentCount: bookingData.participants?.students?.toString() || '',
      staffCount: bookingData.participants?.staff?.toString() || '',
      boyCount: bookingData.participants?.boys?.toString() || '',
      girlCount: bookingData.participants?.girls?.toString() || '',
      specialRequirements: bookingData.specialRequirements || '',
    },
  });

  const studentCount = watch('studentCount');
  const staffCount = watch('staffCount');
  const totalCount = (parseInt(studentCount) || 0) + (parseInt(staffCount) || 0);

  const busCapacity = bookingData.bus?.capacity || 0;
  const isOverCapacity = totalCount > busCapacity;

  const onSubmit = (data) => {
    updateBookingData({
      participants: {
        students: data.studentCount,
        staff: data.staffCount,
        boys: data.boyCount,
        girls: data.girlCount,
        total: data.studentCount + data.staffCount,
      },
      specialRequirements: data.specialRequirements,
    });
    nextStep();
  };

  return (
    <Card className="step-card">
      <CardBody>
        <h2 className="step-title">Participant Details</h2>
        <p className="step-description">
          Enter the number of participants for the trip
        </p>

        {bookingData.bus && (
          <div 
            style={{ 
              background: isOverCapacity ? 'rgba(220, 53, 69, 0.1)' : 'var(--primary-light)', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              border: isOverCapacity ? '1px solid var(--error)' : '1px solid var(--primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Users size={20} color={isOverCapacity ? 'var(--error)' : 'var(--primary)'} />
              <span style={{ fontWeight: 600, color: isOverCapacity ? 'var(--error)' : 'var(--primary)' }}>
                Bus Capacity: {busCapacity} seats
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              Total selected: {totalCount} participants
              {isOverCapacity && (
                <span style={{ color: 'var(--error)', fontWeight: 500 }}>
                  {' '}(exceeds capacity by {totalCount - busCapacity})
                </span>
              )}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row">
            <div>
              <Input
                label="Number of Students"
                type="number"
                min="1"
                placeholder="Enter student count"
                error={errors.studentCount?.message}
                {...register('studentCount')}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <GraduationCap size={14} />
                <span>Students participating in the visit</span>
              </div>
            </div>
            <div>
              <Input
                label="Number of Staff"
                type="number"
                min="1"
                placeholder="Enter staff count"
                error={errors.staffCount?.message}
                {...register('staffCount')}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <UserCheck size={14} />
                <span>Teachers/coordinators accompanying</span>
              </div>
            </div>
          </div>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
            Gender Distribution (Optional)
          </h3>

          <div className="form-row">
            <Input
              label="Number of Boys"
              type="number"
              min="0"
              placeholder="Boys count"
              {...register('boyCount')}
            />
            <Input
              label="Number of Girls"
              type="number"
              min="0"
              placeholder="Girls count"
              {...register('girlCount')}
            />
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <Textarea
              label="Special Requirements (Optional)"
              placeholder="Any special requirements like wheelchair access, dietary restrictions, medical needs, etc."
              rows={3}
              {...register('specialRequirements')}
            />
          </div>

          <div className="step-actions">
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
            <div className="step-actions-right">
              <Button type="submit" disabled={isOverCapacity}>
                Continue
              </Button>
            </div>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
