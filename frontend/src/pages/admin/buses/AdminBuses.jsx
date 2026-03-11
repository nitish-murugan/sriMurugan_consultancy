import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader } from '../../../components/Card';
import Button from '../../../components/Button';
import { Input, Textarea, Select } from '../../../components/Input';
import Modal, { ModalFooter } from '../../../components/Modal';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import api from '../../../services/api';
import '../dashboard/AdminDashboard.css';

const busSchema = z.object({
  busNumber: z.string().min(2, 'Bus number is required'),
  type: z.string().min(1, 'Bus type is required'),
  capacity: z.string().transform(Number).pipe(z.number().min(1, 'Capacity required')),
  pricePerDay: z.string().transform(Number).pipe(z.number().min(1, 'Price required')),
  amenities: z.string().optional(),
});

export default function AdminBuses() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(busSchema),
  });

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const { data } = await api.get('/buses');
      setBuses(data.data?.buses || []);
    } catch (error) {
      console.error('Error fetching buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBus(null);
    reset({ busNumber: '', type: '', capacity: '', pricePerDay: '', amenities: '' });
    setShowModal(true);
  };

  const openEditModal = (bus) => {
    setEditingBus(bus);
    reset({
      busNumber: bus.busNumber,
      type: bus.type,
      capacity: bus.capacity?.toString(),
      pricePerDay: bus.pricePerDay?.toString(),
      amenities: bus.amenities?.join(', ') || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        busNumber: data.busNumber,
        type: data.type,
        capacity: data.capacity,
        pricePerDay: data.pricePerDay,
        amenities: data.amenities ? data.amenities.split(',').map(a => a.trim()) : [],
        isAC: data.type?.toLowerCase().includes('ac') && !data.type?.toLowerCase().includes('non-ac'),
        permitValidity: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      };

      if (editingBus) {
        await api.put(`/buses/${editingBus._id}`, payload);
        toast.success('Bus updated successfully');
      } else {
        await api.post('/buses', payload);
        toast.success('Bus created successfully');
      }
      setShowModal(false);
      fetchBuses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBus = async (id) => {
    if (!confirm('Are you sure you want to delete this bus?')) return;
    try {
      await api.delete(`/buses/${id}`);
      toast.success('Bus deleted');
      fetchBuses();
    } catch {
      toast.error('Delete failed');
    }
  };

  const filteredBuses = buses.filter((bus) =>
    bus.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-buses">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Buses Management</h1>
        <Button icon={Plus} onClick={openCreateModal}>Add Bus</Button>
      </div>

      <Card>
        <CardHeader>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search buses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>
        </CardHeader>
        <CardBody>
          {filteredBuses.length === 0 ? (
            <EmptyState title="No buses found" description="Add your first bus to get started" />
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bus Number</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Price/Day</th>
                    <th>Amenities</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuses.map((bus) => (
                    <tr key={bus._id}>
                      <td><code>{bus.busNumber}</code></td>
                      <td>{bus.type}</td>
                      <td>{bus.capacity} seats</td>
                      <td>₹{bus.pricePerDay?.toLocaleString()}</td>
                      <td>{bus.amenities?.join(', ') || '-'}</td>
                      <td><span className={`status-badge ${bus.status || 'active'}`}>{bus.status || 'active'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button variant="ghost" size="small" onClick={() => openEditModal(bus)}><Edit2 size={16} /></Button>
                          <Button variant="ghost" size="small" onClick={() => deleteBus(bus._id)} style={{ color: 'var(--error)' }}><Trash2 size={16} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingBus ? 'Edit Bus' : 'Add Bus'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row">
            <Input label="Bus Number" error={errors.busNumber?.message} {...register('busNumber')} />
            <Select label="Bus Type" error={errors.type?.message} {...register('type')}>
              <option value="">Select Type</option>
              <option value="AC Sleeper">AC Sleeper</option>
              <option value="Non-AC Sleeper">Non-AC Sleeper</option>
              <option value="AC Seater">AC Seater</option>
              <option value="Non-AC Seater">Non-AC Seater</option>
              <option value="Luxury Coach">Luxury Coach</option>
              <option value="Mini Bus">Mini Bus</option>
              <option value="Tempo Traveller">Tempo Traveller</option>
            </Select>
          </div>
          <div className="form-row" style={{ marginTop: '1rem' }}>
            <Input label="Capacity" type="number" error={errors.capacity?.message} {...register('capacity')} />
            <Input label="Price Per Day (₹)" type="number" error={errors.pricePerDay?.message} {...register('pricePerDay')} />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Input label="Amenities (comma separated)" placeholder="WiFi, TV, Charging Points" {...register('amenities')} />
          </div>
          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editingBus ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
