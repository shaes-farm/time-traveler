'use client';

import debugLogger from 'debug';
import React, { useEffect, useState } from 'react'
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import LoadingButton from '@mui/lab/LoadingButton';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import { createClient } from '../utils/supabase/client';

const debug = debugLogger('admin:avatar-upload');

interface AvatarUploadProps {
  id: string
  url: string
  size: number
  onUpload: (url: string) => void
  onError: (msg: string) => void
}

export function AvatarUpload(props: AvatarUploadProps): JSX.Element {
  const { id, url, size, onUpload, onError } = props;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient();

  useEffect(() => {
    async function createAvatarUrl(): Promise<void> {
      const { data, error } = await supabase.storage.from('avatars').createSignedUrl(url, 60000, {
        transform: {
          quality: 100,
        }
      });
      debug('createAvatarUrl', {signedUrl: data?.signedUrl, error});
      setAvatarUrl(data?.signedUrl ?? null);
    }
    if (url && !url.startsWith('http')) {
      debug('avatarUpload', {url});
      void createAvatarUrl();
    } else {
      setAvatarUrl(url.length ? url : null);
    }
  }, [url, supabase]);

  const uploadAvatar: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const upload = async (): Promise<void> => {
      setUploading(true)

      try {
        if (!event.target.files || event.target.files.length === 0) {
          throw new Error('You must select an image to upload.')
        }

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${id}.${fileExt}`;

        debug('uploadAvatar', `Uploading ${file.name} to ${filePath} as ${file.type}`);

        const { error } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (error) {
          debug('uploadAvatar', { error });
          throw error;
        }

        onUpload(filePath);
      } catch (uploadError: unknown) {
        debug('uploadAvatar', { uploadError })
        onError((uploadError as Error).message);
      } finally {
        setUploading(false)
      }
    };
    void upload();
  }

  debug('AvatarUpload', { id, url, size, avatarUrl, uploading });

  return (
    <Grid container spacing={0} sx={{ width: "100%", mx: "auto" }}>
      <Grid alignItems="center" display="flex" item justifyContent="center" xs={12}>
        <Avatar
          alt="Avatar"
          src={avatarUrl ?? undefined}
          sx={{ width: size, height: size, mt: 1 }}
        />
      </Grid>
      <Grid alignItems="center" display="flex" item justifyContent="center" xs={12}>
        <LoadingButton
          color="inherit"
          component="label"
          loading={uploading}
          loadingPosition="start"
          startIcon={<CameraAltOutlinedIcon />}
          sx={{ mt: 1, mb: 2 }}
          variant="outlined"
        >
          Upload a Photo
          <input accept="image/*" disabled={uploading} hidden onChange={uploadAvatar} type="file" />
        </LoadingButton>
      </Grid>
    </Grid>
  )
}

export default AvatarUpload;