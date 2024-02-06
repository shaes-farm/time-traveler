'use client';
import { useEffect, useState } from 'react';
import Dropzone from 'react-dropzone';
import { styled } from '@mui/material/styles';
import {
  Box,
  Button,
  LinearProgress,
  type LinearProgressProps,
  Paper,
  Stack,
  Typography
} from '@mui/material';

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }): JSX.Element {
  return <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <Box sx={{ width: '100%', mr: 1 }}>
      <LinearProgress variant="determinate" {...props} />
    </Box>
    <Box sx={{ minWidth: 35 }}>
      <Typography color="text.secondary" variant="body2">{`${Math.round(
        props.value,
      )}%`}</Typography>
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

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export function DragAndDropUpload(): JSX.Element {
  const [ fileList, setFileList ] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const { log } = console;

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 500);

    return () => {
      clearInterval(timer);
    };
  }, [fileList]);

  return (
    <>
      <Dropzone onDrop={(acceptedFiles) => {
        setFileList(fileList.concat(acceptedFiles));
        setProgress(0);
        acceptedFiles.forEach((file) => {
          const reader = new FileReader();
          reader.onabort = () => { log('file upload was aborted') }
          reader.onerror = () => { log('file upload has failed') }
          reader.onload = () => {
            const binaryStr = reader.result;
            log({ file, result: binaryStr });
          }
          reader.readAsArrayBuffer(file);
        });
      }}>
        {({ getRootProps, getInputProps }) => (
          <Box sx={{
            border: 3,
            borderColor: 'primary.main',
            borderRadius: 3,
            borderStyle: 'dashed',
            textAlign: 'center',
            p: '3em',
            width: '100%',
          }} {...getRootProps()}>
            <Typography component="div" variant="h6">
              Drop files here to upload
            </Typography>
            <Typography sx={{ py: '1em' }} variant="body1">
              or
            </Typography>
            <Button component="label" variant="outlined">
              Select files
            </Button>
            <VisuallyHiddenInput {...getInputProps()} />
          </Box>
        )}
      </Dropzone>
      <Box sx={{ pt: '1em', width: '100%' }}>
        <Stack spacing={2}>
          {fileList.map((file, index) => (
            <Item key={Symbol(index).toString()}>
              {file.name}<br/>
              <LinearProgressWithLabel value={progress} variant="determinate" />
            </Item>
          ))}
        </Stack>
      </Box>
    </>
  );
}
