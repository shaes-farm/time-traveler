'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Link,
  Typography,
  Unstable_Grid2 as Grid2
} from '@mui/material';

interface ContentFormProps {
  title: string;
  children: React.ReactNode;
}

export function ContentForm({ title, children }: ContentFormProps): JSX.Element {
  const router = useRouter();
  return (
    <Box sx={{ p: '1em', mt: '3em', width: '100%' }}>
      <Grid2 container mb="1em">
        <Grid2 xs={12}>
          <Link href="#" onClick={() => { router.back() }}>&lt;&nbsp;Back</Link>
          <Typography color="text.primary" variant="h2">
            {title}
          </Typography>
        </Grid2>
      </Grid2>
      {children}
    </Box>
  );
}
