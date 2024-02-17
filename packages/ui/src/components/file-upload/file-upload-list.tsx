'use client';
import { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  LinearProgress,
  type LinearProgressProps,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import type { FileUpload } from './types';

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }): JSX.Element {
  return <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <Box sx={{ width: '100%', mr: 1 }}>
      <LinearProgress variant="determinate" {...props} />
    </Box>
    <Box sx={{ minWidth: 35 }}>
      <Typography color="text.secondary" variant="body2">
        {`${Math.round(props.value)}%`}
      </Typography>
    </Box>
  </Box>
}

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  color: theme.palette.text.secondary,
}));

interface FileUploadItemProps {
  item: FileUpload;
  upload: (file: FileUpload, setProgress: (percentage: number) => void) => void;
}

function FileUploadItem({ item, upload }: FileUploadItemProps): JSX.Element {
  const [percentage, setPercentage] = useState<number>(item.progress);

  useEffect(() => {
    if (item.progress === 0) {
      upload(item, setPercentage);
    }
  }, [item, upload]);

  return (
    <Item>
      {item.file.name}<br />
      <LinearProgressWithLabel value={percentage} variant="determinate" />
    </Item>
  );
}

interface FileUploadListProps {
  fileList: FileUpload[];
  upload: (file: FileUpload, setProgress: (percentage: number) => void) => void;
}

export function FileUploadList({ fileList, upload }: FileUploadListProps): JSX.Element {
  return (
    <Box sx={{ pt: '1em', width: '100%' }}>
      <Stack spacing={2}>
        {fileList.map((file, index) => (
          <FileUploadItem item={file} key={Symbol(index).toString()} upload={upload} />
        ))}
      </Stack>
    </Box>
  );
}
