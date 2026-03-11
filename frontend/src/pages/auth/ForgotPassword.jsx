import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Bus, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/Card';
import Button from '../../components/Button';
import { Input } from '../../components/Input';
import './Auth.css';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await forgotPassword(data.email);
    setIsLoading(false);

    if (result.success) {
      setEmailSent(true);
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
            {emailSent ? (
              <div className="auth-success">
                <CheckCircle size={64} className="success-icon" />
                <h2>Check your email</h2>
                <p>
                  We've sent a password reset link to your email address.
                  Please check your inbox and follow the instructions.
                </p>
                <Link to="/login">
                  <Button variant="outline" icon={ArrowLeft}>
                    Back to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="auth-header">
                  <h2>Forgot Password?</h2>
                  <p>Enter your email to receive a reset link</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="Enter your registered email"
                    error={errors.email?.message}
                    {...register('email')}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    loading={isLoading}
                    icon={Mail}
                  >
                    Send Reset Link
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
