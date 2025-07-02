import { useState } from 'react';

interface NewsletterFormProps {
  className?: string;
}

export default function NewsletterForm({ className }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('https://assets.mailerlite.com/jsonp/1607931/forms/157779078195184889/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: { email },
          anticsrf: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Subscription failed');
      }

      setIsSuccess(true);
      setEmail('');
    } catch (err) {
      setError('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full max-w-md ${className}`}>
      {!isSuccess ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 min-w-0 px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      ) : (
        <div className="text-center">
          <p className="text-sm text-gray-900">Thanks for subscribing!</p>
          <p className="mt-1 text-sm text-gray-600">You'll receive updates in your inbox.</p>
        </div>
      )}
    </div>
  );
} 