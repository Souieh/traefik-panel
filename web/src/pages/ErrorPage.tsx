import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, FileWarning, Home } from 'lucide-react';
import type { FC } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

const ErrorPage: FC = () => {
  const { status } = useParams();
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message');
  const navigate = useNavigate();

  const is404 = status === '404';
  const Icon = is404 ? FileWarning : AlertTriangle;
  const title = is404 ? 'Page Not Found' : 'Something Went Wrong';
  const subtitle =
    message ||
    (is404
      ? "The page you're looking for doesn't exist or has been moved."
      : 'An unexpected error occurred. Please try again.');

  return (
    <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 p-4'>
      <Card className='max-w-md w-full shadow-xl border-gray-200'>
        <CardHeader className='space-y-4 text-center pb-6'>
          <div className='relative mx-auto'>
            <div className='absolute inset-0 bg-linear-to-br from-red-100 to-orange-100 rounded-full blur-md opacity-60'></div>
            <Icon className='relative h-16 w-16 text-red-500 mx-auto' />
          </div>

          <div className='space-y-2'>
            {status && (
              <span className='inline-block px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-full border border-red-100'>
                Error {status}
              </span>
            )}
            <CardTitle className='text-2xl font-bold text-gray-900 mt-2'>{title}</CardTitle>
            <p className='text-gray-600 text-sm leading-relaxed'>{subtitle}</p>
          </div>
        </CardHeader>

        <CardContent className='space-y-3 pt-2'>
          <button
            onClick={() => navigate(-1)}
            className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm hover:shadow'
          >
            <ArrowLeft className='h-4 w-4' />
            Go Back
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors'
          >
            <Home className='h-4 w-4' />
            Dashboard
          </button>

          {!is404 && (
            <p className='text-xs text-gray-500 text-center pt-2'>
              If the problem persists, contact support
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorPage;
