'use client'
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';

interface ErrorCardProps {
  title: string;
  message: string;
}

export function ErrorCard(props: ErrorCardProps): JSX.Element {
  const {title, message} = props;
  return (
    <Card sx={{ textAlign: 'center' }}>
      <CardHeader
        subheader={title}
        title="Something Unexpected Happened"
      />
      <CardContent>
        {message}
      </CardContent>
    </Card>
  );
}
