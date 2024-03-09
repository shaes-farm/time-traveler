'use client';

import React, { useEffect, useState } from 'react'
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import LoadingButton from '@mui/lab/LoadingButton';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from 'service';
import { createClient } from '../utils/supabase/client';

const {log} = console;

async function downloadAvatar(supabase: SupabaseClient<Database>, path: string): Promise<string | null> {
  let url: string | null = null;

  try {
    const { data, error } = await supabase.storage
      .from('avatars')
      .download(path);

    if (error) {
      throw error;
    }

    url = URL.createObjectURL(data);
  } catch (error: unknown) {
    log({error});
  }

  return url;
}

interface AvatarUploadProps {
  id: string
  url: string
  size: number
  onUpload: (url: string) => void
  onError: (msg: string) => void
}

export function AvatarUpload(props: AvatarUploadProps): JSX.Element {
  const { id, url, size, onUpload, onError } = props;
  const [avatarUrl, setAvatarUrl] = useState<string|null>(null)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient();
  
  useEffect(() => {
    async function download(): Promise<void> {
      if (url) {
        const blobUrl = await downloadAvatar(supabase, url)
        setAvatarUrl(blobUrl);
      }
    }
    void download();
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

        log(`Uploading ${file.name} to ${filePath} as ${file.type}`);

        const { error } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (error) {
          throw error;
        }

        onUpload(filePath);
      } catch (uploadError: unknown) {
        log({uploadError})
        onError((uploadError as Error).message);
      } finally {
        setUploading(false)
      }
    };
    void upload();
  }

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