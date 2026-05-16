import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { loginSchema, type LoginFormValues } from '@/schemas/auth';
import { login } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField } from '@/components/ui/form-fields';

export default function Login() {
  const navigate = useNavigate();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
    mode: 'onChange',
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.username, values.password);
      navigate('/gardens');
    } catch {
      form.setError('root', { message: 'Invalid credentials' });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <h1 className="text-2xl font-semibold">Garden AI Login</h1>

        <Form form={form} onSubmit={onSubmit}>
          <TextField control={form.control} name="username" label="Username" placeholder="username" />
          <TextField control={form.control} name="password" label="Password" placeholder="password" type="password" />

          <Button type="submit" className="w-full" disabled={!form.formState.isValid || form.formState.isSubmitting}>
            Login
          </Button>

          {form.formState.errors.root && (
            <p className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </p>
          )}
        </Form>
      </div>
    </div>
  );
}
