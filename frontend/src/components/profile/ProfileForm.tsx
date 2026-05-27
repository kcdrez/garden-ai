import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileSchema, type ProfileFormValues } from '@/schemas/profile';
import type { UserProfile } from '@/types/auth';
import { updateProfile } from '@/api/auth';
import { applyServerErrors } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField, NativeSelectField } from '@/components/ui/form-fields';
import { FormRootError } from '@/components/ui/form-root-error';

const TIMEZONES: string[] = (() => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'];
  }
})();

type Props = {
  profile: UserProfile;
};

const toFormValues = (profile: UserProfile): ProfileFormValues => ({
  firstName: profile.firstName ?? '',
  lastName: profile.lastName ?? '',
  email: profile.email,
  timezone: profile.timezone,
});

export default function ProfileForm({ profile }: Props) {
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(profile),
    mode: 'onChange',
  });

  // Keep form in sync if the profile prop changes externally (e.g. page revisit)
  useEffect(() => {
    form.reset(toFormValues(profile));
  }, [profile.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateProfile({
        firstName: values.firstName || '',
        lastName: values.lastName || '',
        email: values.email,
        timezone: values.timezone,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      form.reset(toFormValues(updated));
    },
    onError: (err) => {
      applyServerErrors(err, form, ['firstName', 'lastName', 'email', 'timezone']);
    },
  });

  function handleCancel() {
    form.reset(toFormValues(profile));
  }

  const isDirty = form.formState.isDirty;

  return (
    <Form form={form} onSubmit={(v) => mutation.mutate(v)}>
      <div className="flex gap-3">
        <TextField control={form.control} name="firstName" label="First name" placeholder="Alice" />
        <TextField control={form.control} name="lastName" label="Last name" placeholder="Smith" />
      </div>
      <TextField control={form.control} name="email" label="Email" type="email" placeholder="you@example.com" />
      <NativeSelectField control={form.control} name="timezone" label="Timezone">
        {TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>{tz}</option>
        ))}
      </NativeSelectField>
      <FormRootError message={form.formState.errors.root?.message} />
      <div className="flex gap-2 mt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={!isDirty}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isDirty || !form.formState.isValid || mutation.isPending}
        >
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </Form>
  );
}
