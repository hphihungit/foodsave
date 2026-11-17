import { router } from 'expo-router';
import type { Role } from '@/api/types';

/** Where a newly registered account goes after OTP. */
export function afterSignup(role: Role) {
  if (role === 'store') router.replace('/store/onboard/register');
  else if (role === 'volunteer') router.replace('/volunteer/onboard');
  else router.replace({ pathname: '/(auth)/location', params: { next: 'interests' } });
}
