import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/schemas/auth';
import { resetPassword } from '@/api/auth';
import { applyServerErrors } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField } from '@/components/ui/form-fields';
import { FormRootError } from '@/components/ui/form-root-error';
import { routes } from '@/lib/routes';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid') ?? '';
  const token = searchParams.get('token') ?? '';

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: '', confirm_password: '' },
    mode: 'onChange',
  });

  if (!uid || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-6 p-8">
          <h1 className="text-2xl font-semibold">Invalid reset link</h1>
          <p className="text-muted-foreground text-sm">This link is missing required information. Please request a new reset link.</p>
          <Link to={routes.forgotPassword()} className="text-sm underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      await resetPassword(uid, token, values.new_password);
      navigate(routes.login(), { state: { passwordReset: true } });
    } catch (err) {
      applyServerErrors(err, form, ['new_password', 'confirm_password']);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <h1 className="text-2xl font-semibold">Set a new password</h1>

        <Form form={form} onSubmit={onSubmit}>
          <TextField control={form.control} name="new_password" label="New password" placeholder="password" type="password" />
          <TextField control={form.control} name="confirm_password" label="Confirm new password" placeholder="confirm password" type="password" />

          <Button type="submit" className="w-full" disabled={!form.formState.isValid || form.formState.isSubmitting}>
            Reset password
          </Button>

          <FormRootError message={form.formState.errors.root?.message} />
        </Form>
      </div>
    </div>
  );
}
