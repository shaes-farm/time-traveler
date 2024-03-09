'use client';
import debugFactory from 'debug';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Paper, Stack } from '@mui/material';
import type { Profile } from 'service';
import type { NavRoute, NavRouter } from 'ui';
import {
  Dashboard,
  Copyright,
  ProfileProvider,
} from 'ui';
import { MAIN_ROUTES, TOOLBAR_ROUTES } from '../app/constants';
import { createClient } from '../utils/supabase/client';

const debug = debugFactory('admin:layouts:dashboard-layout');

interface DashboardLayoutProps {
  userProfile: Profile;
  name: string;
  url: string;
  year: number;
  children: React.ReactNode;
}

export function DashboardLayout({ name, url, year, userProfile, children }: DashboardLayoutProps): JSX.Element {
  const [profile, setProfile] = useState<Profile>(userProfile);
  const nextRouter = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        debug(event, session)

        // const storageList = [
        //   window.localStorage,
        //   window.sessionStorage,
        // ];

        // // clear local and session storage
        // storageList.forEach((storage) => {
        //   Object.entries(storage).forEach(([key]) => {
        //     if (key.endsWith('auth-token')) {
        //       storage.removeItem(key)
        //     }
        //   })
        // });

        setTimeout(() => { nextRouter.push('/signin') });
      } else if (event === 'PASSWORD_RECOVERY') {
        debug(event, session);
      } else if (event === 'TOKEN_REFRESHED') {
        debug(event, session);
      } else if (event === 'USER_UPDATED') {
        debug(event, session);
      } else if (event === 'INITIAL_SESSION') {
        debug(event, session);
      } else {
        debug(event, session);
      }
    });
  });

  const router: NavRouter = (route: NavRoute) => {
    if (typeof route.page === 'string') {
      nextRouter.push(route.page);
    }
    else {
      throw new Error('Unsupported route page type');
    }
  };

  return (
    <ProfileProvider profile={profile} setProfile={setProfile} >
      <Dashboard
        router={router}
        routes={MAIN_ROUTES}
        toolbar={TOOLBAR_ROUTES}
      >
        <Container maxWidth="lg" sx={{ m: 'auto' }}>
          <Stack
            alignItems="stretch"
            justifyContent="flex-end"
            useFlexGap
          >
            <Paper elevation={0}>
              {children}
            </Paper>
            <Copyright
              holder={name}
              sx={{ marginTop: 'auto', pt: 4 }}
              url={url}
              year={year}
            />
          </Stack>
        </Container>
      </Dashboard>
    </ProfileProvider>
  );
}
