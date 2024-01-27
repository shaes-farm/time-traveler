'use client';
import React from 'react';
import {useRouter} from 'next/navigation';
import {
  Box,
  Button,
  Link,
  Typography,
  Unstable_Grid2 as Grid2
} from '@mui/material';

interface ContentEditorProps {
  title: string;
  count?: number;
  createNewLink: string;
  children: React.ReactNode;
}

export function ContentEditor({title, count, createNewLink, children}: ContentEditorProps): JSX.Element {
  const router = useRouter();
  return (
    <Box sx={{ p: '1em', mt: '3em', width: '100%' }}>
      <Grid2 container>
        <Grid2 md={8} sm={12}>
          <Link href="#" onClick={() => {router.back()}}>&lt;&nbsp;Back</Link>
          <Typography color="text.primary" variant="h2">
            {title}
          </Typography>
          <Typography color="text.secondary" variant="body1">
            {`${count ?? 'No'} entries found`}
          </Typography>
        </Grid2>
        <Grid2 md={4}>
          <Box display="flex" justifyContent="flex-end">
            <Button href={createNewLink} variant="contained">+ Create New Entry</Button>
          </Box>
        </Grid2>
      </Grid2>
      {children}
    </Box>
  );
}
