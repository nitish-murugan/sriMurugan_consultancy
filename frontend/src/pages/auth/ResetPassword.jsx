import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Bus, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/Card';
import Button from '../../components/Button';
import { Input } from '../../components/Input';
import './Auth.css';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await resetPassword(token, data.password);
    setIsLoading(false);

    if (result.success) {
      setResetSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-logo">
          <Bus size={48} />
          <h1>Sri Murugan Tours</h1>
          <p>Industrial Visit Booking Platform</p>
        </div>

        <Card className="auth-card">
          <CardBody>
            {resetSuccess ? (
              <div className="auth-success">
                <CheckCircle size={64} className="success-icon" />
                <h2>Password Reset Successful</h2>
                <p>
                  Your password has been reset successfully.
                  Redirecting you to login page...
                </p>
              </div>
            ) : (
              <>
                <div className="auth-header">
                  <h2>Reset Password</h2>
                  <p>Enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Enter new password"
                    error={errors.password?.message}
                    {...register('password')}
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Confirm new password"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    loading={isLoading}
                    icon={KeyRound}
                  >
                    Reset Password
                  </Button>
                </form>

                <div className="auth-footer">
                  <p>
                    Remember your password?{' '}
                    <Link to="/login">Sign in</Link>
                  </p>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
