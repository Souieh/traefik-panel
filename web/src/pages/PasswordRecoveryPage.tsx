import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { authService } from '@/services/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Send,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';

// Password strength checker
const checkPasswordStrength = (password: string) => {
  let score = 0;
  let feedback = [];

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (password.length < 8) feedback.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) feedback.push('One uppercase letter');
  if (!/[a-z]/.test(password)) feedback.push('One lowercase letter');
  if (!/[0-9]/.test(password)) feedback.push('One number');
  if (!/[^A-Za-z0-9]/.test(password)) feedback.push('One special character');

  return { score, maxScore: 5, feedback };
};

// Form validation schemas
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetPasswordSchema = z
  .object({
    recoveryCode: z.string().min(1, 'Recovery code is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function PasswordRecoveryPage() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const emailFromUrl = searchParams.get('email');
  const navigate = useNavigate();

  // State
  const [submitted, setSubmitted] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    maxScore: 5,
    feedback: [] as string[],
  });

  // Forms
  const forgotForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: emailFromUrl || '',
    },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      recoveryCode: tokenFromUrl || '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Handle password strength updates
  const handlePasswordChange = (password: string) => {
    const strength = checkPasswordStrength(password);
    setPasswordStrength(strength);
    resetForm.setValue('newPassword', password);
  };

  const handleForgotSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email: data.email });
      setSubmitted(true);
      toast.success('Reset instructions sent', {
        description: 'Check your email for password reset instructions.',
        icon: <Send className='h-5 w-5' />,
      });
    } catch (error: any) {
      toast.error('Could not send reset email', {
        description: error.response?.data?.message || 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      await authService.resetPassword({
        token: data.recoveryCode,
        new_password: data.newPassword,
      });

      toast.success('Password reset successful', {
        description: 'Your password has been updated. You can now log in.',
        icon: <CheckCircle className='h-5 w-5' />,
        action: {
          label: 'Go to Login',
          onClick: () => navigate('/auth/login'),
        },
      });

      // Navigate after toast
      setTimeout(() => navigate('/auth/login'), 1500);
    } catch (error: any) {
      toast.error('Failed to reset password', {
        description: error.response?.data?.message || 'Token may be invalid or expired.',
        icon: <AlertCircle className='h-5 w-5' />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const email = forgotForm.getValues('email');
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword({ email });
      toast.success('Email resent', {
        description: 'New reset instructions have been sent to your email.',
        icon: <RefreshCw className='h-5 w-5' />,
      });
    } catch (error) {
      toast.error('Could not resend email');
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = (score: number) => {
    if (score === 0) return 'bg-gray-200';
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = (score: number) => {
    if (score === 0) return 'No password';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Good';
    if (score <= 4) return 'Strong';
    return 'Very Strong';
  };

  const isResetMode = !!tokenFromUrl || submitted;

  return (
    <div className='flex items-center justify-center min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4'>
      <Card className='w-full max-w-md shadow-xl'>
        <CardHeader className='text-center space-y-2'>
          <div className='mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2'>
            <Shield className='h-6 w-6 text-primary' />
          </div>
          <CardTitle className='text-2xl'>
            {isResetMode ? 'Reset Your Password' : 'Forgot Password'}
          </CardTitle>
          <CardDescription>
            {isResetMode
              ? 'Create a new secure password for your account'
              : 'Enter your email to receive a password reset link'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isResetMode ? (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className='space-y-4'>
                {!tokenFromUrl && (
                  <FormField
                    control={resetForm.control}
                    name='recoveryCode'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='flex items-center gap-2'>
                          <KeyRound className='h-4 w-4' />
                          Recovery Code
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Enter the code from your email'
                            className='font-mono'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={resetForm.control}
                  name='newPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <Lock className='h-4 w-4' />
                        New Password
                      </FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder='Enter your new password'
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handlePasswordChange(e.target.value);
                            }}
                            className='pr-10'
                          />
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            className='absolute right-0 top-0 h-full px-3'
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className='h-4 w-4' />
                            ) : (
                              <Eye className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                      </FormControl>

                      {resetForm.watch('newPassword') && (
                        <div className='space-y-2 mt-2'>
                          <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>Password Strength:</span>
                            <span
                              className={`font-medium ${
                                passwordStrength.score <= 2
                                  ? 'text-red-600'
                                  : passwordStrength.score <= 3
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {getStrengthLabel(passwordStrength.score)}
                            </span>
                          </div>
                          <Progress
                            value={(passwordStrength.score / passwordStrength.maxScore) * 100}
                            className={`h-2 ${getStrengthColor(passwordStrength.score)}`}
                          />

                          {passwordStrength.feedback.length > 0 && (
                            <div className='space-y-1 text-sm'>
                              <p className='text-muted-foreground'>Requirements:</p>
                              <ul className='space-y-1'>
                                {passwordStrength.feedback.map((req, index) => (
                                  <li key={index} className='flex items-center gap-2'>
                                    <AlertCircle className='h-3 w-3 text-amber-500' />
                                    <span className='text-amber-700 dark:text-amber-500'>
                                      {req}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetForm.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <CheckCircle className='h-4 w-4' />
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder='Confirm your new password'
                            {...field}
                            className='pr-10'
                          />
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            className='absolute right-0 top-0 h-full px-3'
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className='h-4 w-4' />
                            ) : (
                              <Eye className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type='submit' className='w-full' disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <CheckCircle className='mr-2 h-4 w-4' />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...forgotForm}>
              <form onSubmit={forgotForm.handleSubmit(handleForgotSubmit)} className='space-y-4'>
                <FormField
                  control={forgotForm.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <Mail className='h-4 w-4' />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input type='email' placeholder='you@example.com' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='rounded-lg border bg-blue-50 dark:bg-blue-900/20 p-3'>
                  <div className='flex items-start gap-2'>
                    <AlertCircle className='h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5' />
                    <div className='space-y-1'>
                      <p className='text-sm font-medium text-blue-800 dark:text-blue-300'>
                        What happens next?
                      </p>
                      <ul className='text-xs text-blue-700 dark:text-blue-400 space-y-1'>
                        <li className='flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          You'll receive an email with a reset link
                        </li>
                        <li className='flex items-center gap-1'>
                          <KeyRound className='h-3 w-3' />
                          Click the link to reset your password
                        </li>
                        <li className='flex items-center gap-1'>
                          <Shield className='h-3 w-3' />
                          Create a new secure password
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button type='submit' className='w-full' disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className='mr-2 h-4 w-4' />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>

        <CardFooter className='flex flex-col space-y-4'>
          {isResetMode ? (
            <>
              <div className='text-center text-sm text-muted-foreground'>
                <p>Remember your password?</p>
                <Button
                  variant='link'
                  className='p-0 h-auto'
                  onClick={() => {
                    setSubmitted(false);
                    resetForm.reset();
                  }}
                >
                  Back to forgot password
                </Button>
              </div>

              {submitted && !tokenFromUrl && (
                <div className='w-full pt-4 border-t'>
                  <div className='text-center text-sm text-muted-foreground space-y-2'>
                    <p>Didn't receive the email?</p>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full'
                      onClick={handleResendEmail}
                      disabled={isLoading}
                    >
                      <RefreshCw className='mr-2 h-3 w-3' />
                      Resend Email
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className='text-center text-sm text-muted-foreground space-y-2'>
              <p>Remembered your password?</p>
              <Link
                to='/login'
                className='inline-flex items-center text-primary hover:underline font-medium'
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to Login
              </Link>
            </div>
          )}

          <div className='text-xs text-center text-muted-foreground pt-4 border-t'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='inline-flex items-center gap-1 cursor-help'>
                    <Shield className='h-3 w-3' />
                    <span>Secure password recovery process</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='max-w-xs'>
                    All reset links expire after 24 hours and can only be used once. Your password
                    is never stored in plain text.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
