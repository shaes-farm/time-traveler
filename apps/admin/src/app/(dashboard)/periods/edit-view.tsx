'use client';
import debugLogger from 'debug';
import { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import slugify from 'slugify';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import {
  Box,
  Unstable_Grid2 as Grid,
  Tab,
  TextField,
} from '@mui/material';
import type {
  Period,
  Timeline,
} from 'service';
import {
  ItemList,
  RichTextEditor,
} from 'ui';
import {
  ContentEditor,
  Editor,
  Permalink,
} from '../../../components';
import { insert, update } from './actions';

const debug = debugLogger('admin:period-edit-view');

const validationSchema = yup.object({
  title: yup
    .string()
    .min(3, 'Title should be a minimum of 3 characters long')
    .required('Title is required'),
  slug: yup
    .string()
    .required('Slug is required'),
  summary: yup
    .string(),
  beginDate: yup
    .string()
    .required('Begin date is required.'),
  endDate: yup
    .string()
    .required('End date is required'),
  timelines: yup
    .array(),
});

interface PeriodEditViewProps {
  mode: 'create' | 'edit';
  period?: Period;
  timelines?: readonly Timeline[];
}

export default function PeriodEditView({ mode, period, timelines }: PeriodEditViewProps): JSX.Element {
  const [tabIndex, setTabIndex] = useState<string>('1');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string): void => {
    setTabIndex(newValue);
  };

  const initialValues: Period = (mode === 'edit' && period) ? {
    userId: period.userId ?? '',
    title: period.title,
    slug: period.slug,
    summary: period.summary ?? '',
    detail: period.detail ?? '',
    beginDate: period.beginDate,
    endDate: period.endDate,
    timelines: period.timelines,
  } : {
    userId: '',
    title: '',
    slug: '',
    summary: '',
    detail: '',
    beginDate: '',
    endDate: '',
    timelines: [],
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      debug('onSubmit', { mode, values });
      mode === 'create' ? await insert(values) : await update(values);
    },
  });

  return (
    <ContentEditor title="Periods">
      <Editor
        onSubmit={formik.handleSubmit}
        title={`${mode === 'create' ? 'Create' : 'Edit'} Period`}
      >
        <Grid container spacing={2}>
          <Grid md={8} sm={12}>
            <Grid mb={2} sm={12}>
              <TextField
                fullWidth
                id="title"
                label="Title"
                name="title"
                onBlur={(e: unknown) => {
                  if (formik.values.slug.length === 0) {
                    void formik.setFieldValue('slug', slugify(formik.values.title, { lower: true }));
                  }
                  formik.handleBlur(e);
                }}
                onChange={formik.handleChange}
                required
                value={formik.values.title}
              />
            </Grid>
            <Grid border={1} borderColor="divider" borderRadius={1}>
              <TabContext value={tabIndex}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <TabList aria-label="story detail editor tabs" onChange={handleTabChange}>
                    <Tab label="Edit" value="1" />
                    <Tab label="Raw" value="2" />
                  </TabList>
                </Box>
                <TabPanel value="1">
                  <RichTextEditor
                    content={formik.values.detail}
                    onUpdate={(doc: object) => { void formik.setFieldValue('detail', doc) }}
                    placeHolder="Add a detailed description of the period..."
                  />
                </TabPanel>
                <TabPanel value="2">
                  <TextField
                    fullWidth
                    id="detail"
                    label="Detail"
                    multiline
                    name="detail"
                    onChange={formik.handleChange}
                    rows={25}
                    value={formik.values.detail}
                  />
                </TabPanel>
              </TabContext>
            </Grid>
          </Grid>
          <Grid md={4} sm={12}>
            <Grid mb={2} sm={12}>
              <Permalink url={formik.values.slug.length ? `/periods/${formik.values.slug}` : ''} />
            </Grid>
            <Grid mb={2} sm={12}>
              <TextField
                fullWidth
                hidden
                id="slug"
                label="Slug"
                name="slug"
                onChange={formik.handleChange}
                onFocus={() => {
                  if (formik.values.slug.length === 0) {
                    void formik.setFieldValue('slug', slugify(formik.values.title, { lower: true }));
                  }
                }}
                required
                value={formik.values.slug}
              />
            </Grid>
            <Grid mb={2} sm={12}>
              <TextField
                fullWidth
                id="summary"
                label="Summary"
                multiline
                name="summary"
                onChange={formik.handleChange}
                rows={4}
                value={formik.values.summary}
              />
            </Grid>
            <Grid mb={2} sm={12}>
              <ItemList
                available={timelines ?? []}
                itemNames={{ singular: 'timeline', plural: 'timelines' }}
                items={formik.values.timelines}
                onChange={(items) => {
                  void formik.setFieldValue('timelines', items)
                }}
                title="Timelines"
                value=""
              />
            </Grid>
          </Grid>
        </Grid>
      </Editor>
    </ContentEditor>
  );
}
