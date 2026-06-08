import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/api/auth';
import { queryKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/lib/errors';
import { LoadingSpinner } from '@/components/ui/query-state';
import ProfileForm from '@/components/profile/ProfileForm';

export default function ProfilePage() {
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: getProfile,
  });

  if (isLoading)
    return (
      <div className="p-5">
        <LoadingSpinner />
      </div>
    );
  if (error)
    return (
      <div className="p-5 text-sm text-destructive">
        {getErrorMessage(error)}
      </div>
    );
  if (!profile) return null;

  return (
    <div className="p-5 max-w-lg">
      <h1 className="mb-3">{profile.username}'s Profile Page</h1>
      <ProfileForm profile={profile} />
    </div>
  );
}
