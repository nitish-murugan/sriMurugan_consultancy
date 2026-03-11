import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, Bus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/Card';
import Button from '../../components/Button';
import { Input } from '../../components/Input';
import './Auth.css';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await login(data.email, data.password);
    setIsLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
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
            <div className="auth-header">
              <h2>Welcome back</h2>
              <p>Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register('password')}
              />

              <div className="auth-options">
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                fullWidth
                loading={isLoading}
                icon={LogIn}
              >
                Sign In
              </Button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register">Sign up</Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
