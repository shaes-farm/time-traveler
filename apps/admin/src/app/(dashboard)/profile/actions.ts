'use server';

import debugFactory from 'debug';
import getConfig from 'next/config';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation';
import { mapApiProfileToModel } from 'service';
import type { Profile, PostgrestProfile } from 'service';
import { createClient } from '../../../utils/supabase/server';
import type { NextConfig } from '../../../types';

const debug = debugFactory('admin:profile:actions');

const {
  publicRuntimeConfig: {
    app: {
      baseUrl: appBaseUrl,
      basePath,
    }
  },
} = getConfig() as NextConfig;

export async function queryById(id: string): Promise<Profile | null> {
  const supabase = createClient(cookies());

  debug('queryById', { id });

  const { error, data } = await supabase
    .from('profiles')
    .select()
    .eq('id', id)
    .maybeSingle();

  debug('queryById', { error, data });

  if (error) {
    debug({ error });
    throw new Error(error.message);
  }

  const profile = data as PostgrestProfile | null;

  if (profile?.avatar_url) {
    const { data: avatar } = await supabase.storage.from('avatars').createSignedUrl(profile.avatar_url, 60000, {
      transform: {
        quality: 50,
      }
    });

    if (avatar?.signedUrl) {
      profile.avatar_url = avatar.signedUrl;
    }
  }

  return profile ? mapApiProfileToModel(profile) : null;
}

export interface ActionResult {
  message: string;
  success: boolean;
}

export async function update(profile: Profile): Promise<ActionResult> {
  const supabase = createClient(cookies());

  const { data: { session } } = await supabase.auth.getSession();

  debug('update', { session });

  if (!session) {
    redirect(`${appBaseUrl}${basePath}/signin`);
  }

  debug('update', { profile });

  const { error, data } = await supabase
    .from('profiles')
    .update({
      first_name: profile.firstName,
      last_name: profile.lastName,
      bio: profile.bio,
      avatar_url: profile.avatarUrl,
      username: profile.userName,
      website: profile.website,
      social_x: profile.socialX,
      social_facebook: profile.socialFacebook,
      social_instagram: profile.socialInstagram,
      social_pinterest: profile.socialPinterest,
      social_youtube: profile.socialYouTube,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.user.id);

  debug('update', { error, data });

  if (error) {
    return ({
      message: 'Could not update profile.',
      success: false,
    });
  }

  revalidatePath(`${appBaseUrl}${basePath}/profile`, 'page');

  return ({
    message: 'Profile updated successfully!',
    success: true,
  })
}

export async function updateEmail(email: string): Promise<ActionResult> {
  const supabase = createClient(cookies());

  const { data: { session } } = await supabase.auth.getSession();

  debug('updateEmail', { session });

  if (!session) {
    redirect(`${appBaseUrl}${basePath}/signin`);
  }

  debug('updateEmail', { email });

  const { data, error } = await supabase.auth.updateUser({ email });

  debug('updateEmail', { error, data });

  if (error) {
    return ({
      message: 'Could not update email.',
      success: false,
    });
  }

  revalidatePath(`${appBaseUrl}${basePath}/profile`, 'page');

  return ({
    message: 'Email updated successfully!',
    success: true,
  })
}

export async function updatePassword(password: string, newPassword: string): Promise<ActionResult> {
  const supabase = createClient(cookies());

  const { data: { session } } = await supabase.auth.getSession();

  debug('updatePassword', { session });

  if (!session) {
    redirect(`${appBaseUrl}${basePath}/signin`);
  }

  debug('updatePassword', { password, newPassword });

  if (password === newPassword) {
    return ({
      message: 'Passwords are the same.',
      success: false,
    });
  }

  const credentials = {
    email: session.user.email ?? '',
    password,
  };

  const { error: signinError } = await supabase.auth.signInWithPassword(credentials);

  if (signinError) {
    return ({
      message: 'Invalid credentials.',
      success: false,
    });
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  debug('updatePassword', { error, data });

  if (error) {
    return ({
      message: 'Could not update password.',
      success: false,
    });
  }

  revalidatePath(`${appBaseUrl}${basePath}/profile`, 'page');

  return ({
    message: 'Password updated successfully!',
    success: true,
  })
}