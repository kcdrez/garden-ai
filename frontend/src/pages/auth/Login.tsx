import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginFormValues } from '@/schemas/auth';
import { routes } from '@/lib/routes';
import { login } from '@/api/auth';
import { applyServerErrors } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField } from '@/components/ui/form-fields';
import { FormRootError } from '@/components/ui/form-root-error';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const passwordReset = (location.state as { passwordReset?: boolean } | null)?.passwordReset;
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
    mode: 'onChange',
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.username, values.password);
      navigate(routes.gardens());
    } catch (err) {
      applyServerErrors(err, form, ['username', 'password']);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <h1 className="text-2xl font-semibold">Garden AI Login</h1>

        {passwordReset && (
          <p className="text-sm text-green-600 dark:text-green-400">Password reset successfully. You can now log in.</p>
        )}

        <Form form={form} onSubmit={onSubmit}>
          <TextField control={form.control} name="username" label="Username" placeholder="username" />
          <div className="space-y-1">
            <TextField control={form.control} name="password" label="Password" placeholder="password" type="password" />
            <div className="text-right">
              <Link to={routes.forgotPassword()} className="text-muted-foreground text-xs underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!form.formState.isValid || form.formState.isSubmitting}>
            Log in
          </Button>

          <FormRootError message={form.formState.errors.root?.message} />
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to={routes.register()} className="underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
