import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/schemas/auth';
import { forgotPassword } from '@/api/auth';
import { applyServerErrors } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField } from '@/components/ui/form-fields';
import { FormRootError } from '@/components/ui/form-root-error';
import { routes } from '@/lib/routes';

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onChange',
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await forgotPassword(values.email);
      setSubmitted(true);
    } catch (err) {
      applyServerErrors(err, form, ['email']);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-6 p-8">
          <h1 className="text-2xl font-semibold">Check your email</h1>
          <p className="text-muted-foreground text-sm">
            If that email is registered, you'll receive a link to reset your password shortly.
          </p>
          <Link to={routes.login()} className="text-sm underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="text-muted-foreground text-sm">Enter your email and we'll send you a reset link.</p>
        </div>

        <Form form={form} onSubmit={onSubmit}>
          <TextField control={form.control} name="email" label="Email" placeholder="you@example.com" type="email" />

          <Button type="submit" className="w-full" disabled={!form.formState.isValid || form.formState.isSubmitting}>
            Send reset link
          </Button>

          <FormRootError message={form.formState.errors.root?.message} />
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          <Link to={routes.login()} className="underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
