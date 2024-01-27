'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Container, Paper} from '@mui/material';
import type {
  NavRoute,
  NavRouter,
  Profile
} from 'ui';
import {
  Dashboard,
  Copyright,
  ProfileProvider,
} from 'ui';
import {mainRoutes, toolBarRoutes} from '../app/routes';

export const userProfile: Profile = {
  id: '123',
  firstName: 'Joe',
  lastName: 'User',
  bio: 'I am a user',
  avatarUrl: '',
  website: 'https://www.example.com',
  loading: false,
};

interface DashboardLayoutProps {
  name: string;
  url: string;
  year: number;
  children: React.ReactNode;
}

export function DashboardLayout({name, url, year, children}: DashboardLayoutProps): JSX.Element {
  const [profile, setProfile] = useState<Profile>(userProfile);
  const nextRouter = useRouter();

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
          routes={mainRoutes}
          toolbar={toolBarRoutes}
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
