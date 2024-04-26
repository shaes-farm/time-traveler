'use client';

import debugLogger from 'debug';
// import Image from 'next/image';
import { useFormik } from 'formik';
import * as yup from 'yup';
import slugify from 'slugify';
import ClearIcon from '@mui/icons-material/Clear';
import {
  Box,
  Unstable_Grid2 as Grid,
  Stack,
  TextField,
} from '@mui/material';
import type {
  Media,
} from 'service';
import {
  ContentEditor,
  Editor,
  Permalink,
} from '../../../components';
import { getIcon } from '../../../utils/media';
import { update } from './actions';

const debug = debugLogger('admin:media:edit-view');

const validationSchema = yup.object({
  title: yup
    .string()
    .min(3, 'Title should be a minimum of 3 characters long')
    .required('Title is required'),
  slug: yup
    .string()
    .required('Slug is required'),
  alternativeText: yup
    .string()
    .required('Title is required'),
  caption: yup
    .string(),
  url: yup
    .string()
    .required('URL is required'),
  width: yup
    .number(),
  height: yup
    .number(),
  formats: yup
    .string()
    .required('MIME format is required'),
});

interface MediaEditViewProps {
  media: Media;
}

export default function MediaEditView({ media }: MediaEditViewProps): JSX.Element {
  const initialValues: Media = {
    userId: media.userId ?? '',
    slug: media.slug,
    alternativeText: media.alternativeText ?? '',
    caption: media.caption ?? '',
    url: media.url,
    height: media.height ? media.height : undefined,
    width: media.width ? media.width : undefined,
    formats: media.formats ?? '',
  };

  const formik = useFormik<Media>({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      debug('onSubmit', { values });
      await update(values);
    },
  });

  return (
    <ContentEditor title="Media">
      <Editor onSubmit={formik.handleSubmit} title="Edit Media">
        <Grid container spacing={2}>
          <Grid md={8} sm={12}>
            <Grid mb={2} sm={12}>
              <TextField
                fullWidth
                id="title"
                label="Title"
                name="alternativeText"
                onBlur={(e: React.SyntheticEvent) => {
                  if (formik.values.slug.trim().length === 0 && formik.values.alternativeText) {
                    void formik.setFieldValue('slug', slugify(formik.values.alternativeText, { lower: true }));
                  }
                  formik.handleBlur(e);
                }}
                onChange={formik.handleChange}
                required
                value={formik.values.alternativeText}
              />
            </Grid>
            <Grid border={1} borderColor="divider" borderRadius={1} p={1}>
              <Box maxHeight='100%' maxWidth='100%'>
                <img
                  alt={formik.values.alternativeText}
                  loading="lazy"
                  src={getIcon(formik.values.formats ?? '', formik.values.url)}
                  srcSet={getIcon(formik.values.formats ?? '', formik.values.url)}
                  width='100%'
                />
              </Box>
            </Grid>
          </Grid>
          <Grid md={4} sm={12}>
            <Grid mb={2} sm={12}>
              <Permalink url={formik.values.slug.trim().length ? `/media/${formik.values.slug}` : ''} />
            </Grid>
            <Grid mb={2} sm={12}>
              <TextField
                fullWidth
                id="slug"
                label="Slug"
                name="slug"
                onChange={formik.handleChange}
                onFocus={() => {
                  if (formik.values.slug.trim().length === 0 && formik.values.alternativeText) {
                    void formik.setFieldValue('slug', slugify(formik.values.alternativeText, { lower: true }));
                  }
                }}
                required
                value={formik.values.slug}
              />
            </Grid>
            <Grid mb={2} sm={12}>
              <TextField
                fullWidth
                id="caption"
                label="Caption"
                multiline
                name="caption"
                onChange={formik.handleChange}
                rows={4}
                value={formik.values.caption}
              />
            </Grid>
            <Grid mb={2} sm={12}>
              <Stack direction="row" spacing={1}>
                <TextField
                  id="height"
                  label="Height"
                  name="height"
                  onChange={formik.handleChange}
                  value={formik.values.height}
                />
                <Box sx={{ pt: 2 }}>
                  <ClearIcon />
                </Box>
                <TextField
                  id="width"
                  label="Width"
                  name="width"
                  onChange={formik.handleChange}
                  value={formik.values.width}
                />
              </Stack>
            </Grid>
          </Grid>
        </Grid>
      </Editor>
    </ContentEditor >
  );
}
