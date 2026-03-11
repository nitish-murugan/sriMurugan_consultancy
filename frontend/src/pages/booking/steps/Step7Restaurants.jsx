import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Utensils, Plus, X, Sparkles } from 'lucide-react';
import { useBooking } from '../../../context/BookingContext';
import { Card, CardBody } from '../../../components/Card';
import Button from '../../../components/Button';
import { Input, Select, Textarea } from '../../../components/Input';
import Badge from '../../../components/Badge';
import api from '../../../services/api';

const mealTypes = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks/Refreshments' },
];

const cuisineTypes = [
  { value: 'vegetarian', label: 'Pure Vegetarian' },
  { value: 'non-vegetarian', label: 'Non-Vegetarian' },
  { value: 'both', label: 'Both Options' },
];

export default function Step7Restaurants() {
  const { bookingData, updateBookingData, nextStep, prevStep } = useBooking();
  const [meals, setMeals] = useState(bookingData.meals || []);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchAISuggestions = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post('/spots/ai-suggest', {
        city: bookingData.city?.name,
        type: 'restaurants',
        participantCount: bookingData.participants?.total,
      });
      setAiSuggestion(data.data?.suggestion || 'Great restaurants available in the area!');
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      setAiSuggestion('');
    } finally {
      setAiLoading(false);
    }
  };

  const onAddMeal = (data) => {
    const newMeal = {
      id: Date.now(),
      type: data.mealType,
      restaurant: data.restaurant,
      cuisine: data.cuisine,
      budget: data.budget,
      notes: data.notes,
    };
    setMeals([...meals, newMeal]);
    reset();
    setShowForm(false);
  };

  const removeMeal = (id) => {
    setMeals(meals.filter((m) => m.id !== id));
  };

  const handleNext = () => {
    updateBookingData({ meals });
    nextStep();
  };

  return (
    <Card className="step-card">
      <CardBody>
        <h2 className="step-title">Food & Restaurants</h2>
        <p className="step-description">
          Plan meals for your trip (optional)
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <Button
            variant="outline"
            size="small"
            icon={Sparkles}
            onClick={fetchAISuggestions}
            loading={aiLoading}
          >
            Get AI Restaurant Suggestions
          </Button>
        </div>

        {aiSuggestion && (
          <div className="ai-suggestion-box">
            <div className="ai-suggestion-header">
              <Sparkles size={20} color="var(--primary)" />
              <span>AI Restaurant Recommendations</span>
            </div>
            <div className="ai-suggestion-content">{aiSuggestion}</div>
          </div>
        )}

        {meals.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Planned Meals</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Utensils size={16} color="var(--primary)" />
                      <span style={{ fontWeight: 600 }}>
                        {mealTypes.find((t) => t.value === meal.type)?.label}
                      </span>
                      <Badge variant="info" size="small">
                        {cuisineTypes.find((c) => c.value === meal.cuisine)?.label}
                      </Badge>
                    </div>
                    {meal.restaurant && (
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Restaurant: {meal.restaurant}
                      </p>
                    )}
                    {meal.budget && (
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Budget: ₹{meal.budget} per person
                      </p>
                    )}
                    {meal.notes && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {meal.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeMeal(meal.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--error)',
                      padding: '0.25rem',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showForm ? (
          <form onSubmit={handleSubmit(onAddMeal)} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '1rem' }}>Add Meal</h4>
            <div className="form-row">
              <Select
                label="Meal Type"
                error={errors.mealType?.message}
                {...register('mealType', { required: 'Select meal type' })}
              >
                <option value="">Select type</option>
                {mealTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Cuisine Preference"
                error={errors.cuisine?.message}
                {...register('cuisine', { required: 'Select cuisine' })}
              >
                <option value="">Select cuisine</option>
                {cuisineTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="form-row" style={{ marginTop: '1rem' }}>
              <Input
                label="Restaurant Name (Optional)"
                placeholder="Preferred restaurant"
                {...register('restaurant')}
              />
              <Input
                label="Budget per Person (₹)"
                type="number"
                placeholder="e.g., 150"
                {...register('budget')}
              />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Textarea
                label="Special Notes (Optional)"
                placeholder="Any dietary restrictions, allergies, etc."
                rows={2}
                {...register('notes')}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <Button type="submit" size="small">
                Add Meal
              </Button>
              <Button type="button" variant="ghost" size="small" onClick={() => { reset(); setShowForm(false); }}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            icon={Plus}
            onClick={() => setShowForm(true)}
            fullWidth
            style={{ marginBottom: '1rem' }}
          >
            Add Meal Plan
          </Button>
        )}

        <div className="step-actions">
          <Button variant="outline" onClick={prevStep}>
            Back
          </Button>
          <div className="step-actions-right">
            <Button variant="ghost" onClick={() => { updateBookingData({ meals: [] }); nextStep(); }}>
              Skip
            </Button>
            <Button onClick={handleNext}>
              Continue
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
