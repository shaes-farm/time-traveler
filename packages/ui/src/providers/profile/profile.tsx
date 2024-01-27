'use client';
import React, {createContext, useContext} from 'react';
import type { Profile } from './_types';

interface ProfileContextProps {
  profile: Profile;
  setProfile: (profile: Profile) => void
}

const ProfileContext = createContext<ProfileContextProps|null>(null);

export function useProfile(): ProfileContextProps {
  const context = useContext<ProfileContextProps|null>(ProfileContext);

  if (!context) {
    throw new Error('useProfile must be called inside of ProfileProvider');
  }

  return context;
}

export interface ProfileProviderProps {
  profile: Profile;
  setProfile: (profile: Profile) => void
  children?: React.ReactNode;
}

export function ProfileProvider({profile, setProfile, children}: ProfileProviderProps): JSX.Element {
  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export default ProfileProvider;