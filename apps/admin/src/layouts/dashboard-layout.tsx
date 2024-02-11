'use client';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Container, Paper} from '@mui/material';
import type {Profile} from 'service';
import type {NavRoute, NavRouter} from 'ui';
import {
  Dashboard,
  Copyright,
  ProfileProvider,
} from 'ui';
import {MAIN_ROUTES, TOOLBAR_ROUTES} from '../app/constants';
import {createClient} from '../utils/supabase/client';

interface DashboardLayoutProps {
  userProfile: Profile;
  name: string;
  url: string;
  year: number;
  children: React.ReactNode;
}

export function DashboardLayout({name, url, year, userProfile, children}: DashboardLayoutProps): JSX.Element {
  const [profile, setProfile] = useState<Profile>(userProfile);
  const nextRouter = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        const {log} = console;
        log(event, session)
  
        const storageList = [
          window.localStorage,
          window.sessionStorage,
        ];
  
        // clear local and session storage
        storageList.forEach((storage) => {
          Object.entries(storage)
            .forEach(([key]) => {
              storage.removeItem(key)
            })
        });
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
          <Paper>
              {children}
          </Paper>
          <Copyright
              holder={name}
              sx={{ pt: 4 }}
              url={url}
              year={year}
          />
          </Container>
      </Dashboard>
    </ProfileProvider>
  );
}
