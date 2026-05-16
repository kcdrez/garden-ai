import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterFormValues } from '@/schemas/auth';
import { register } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField } from '@/components/ui/form-fields';
import { getDRFFieldErrors } from '@/lib/errors';

export default function Register() {
  const navigate = useNavigate();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', password_confirm: '' },
    mode: 'onChange',
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await register(values.username, values.password, values.password_confirm, values.email || undefined);
      navigate('/gardens');
    } catch (err) {
      const fieldErrors = getDRFFieldErrors(err);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof RegisterFormValues, { message: messages[0] });
        });
      } else {
        form.setError('root', { message: 'Registration failed. Please try again.' });
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <h1 className="text-2xl font-semibold">Create an account</h1>

        <Form form={form} onSubmit={onSubmit}>
          <TextField control={form.control} name="username" label="Username" placeholder="username" />
          <TextField control={form.control} name="email" label="Email (optional)" placeholder="you@example.com" type="email" />
          <TextField control={form.control} name="password" label="Password" placeholder="password" type="password" />
          <TextField control={form.control} name="password_confirm" label="Confirm Password" placeholder="confirm password" type="password" />

          <Button type="submit" className="w-full" disabled={!form.formState.isValid || form.formState.isSubmitting}>
            Create Account
          </Button>

          {form.formState.errors.root && (
            <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
          )}
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
