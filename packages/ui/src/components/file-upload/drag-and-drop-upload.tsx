'use client';
import { useState } from 'react';
import Dropzone from 'react-dropzone';
import { styled } from '@mui/material/styles';
import {
  Box,
  Button,
  Typography
} from '@mui/material';
import type { FileUpload } from './_types';
import { FileUploadList } from './file-upload-list';

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

interface DragAndDropUploadProps {
  upload: (file: FileUpload, setProgress: (percentage: number) => void, onError: (error: Error) => void) => void;
}

export function DragAndDropUpload({ upload }: DragAndDropUploadProps): JSX.Element {
  const [fileList, setFileList] = useState<FileUpload[]>([]);
  return (
    <>
      <Dropzone onDrop={(acceptedFiles) => {
        const files = acceptedFiles.map((file) => {
          return {
            file,
            progress: 0
          }
        });
        setFileList(fileList.concat(files));
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
            <Typography component="div" gutterBottom variant="h6">
              Drop files here to upload
            </Typography>
            <Typography gutterBottom sx={{ py: '1em' }} variant="body1">
              or
            </Typography>
            <Button component="label" variant="outlined">
              Select files
            </Button>
            <VisuallyHiddenInput {...getInputProps()} />
          </Box>
        )}
      </Dropzone>
      <FileUploadList fileList={fileList} upload={upload} />
    </>
  );
}
