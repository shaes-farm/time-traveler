'use client';

import debugLogger from 'debug';
import React, { useRef, useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import slugify from 'slugify';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import {
  Box,
  Divider,
  Unstable_Grid2 as Grid,
  Tab,
  TextField,
  Typography,
} from '@mui/material';
import StarterKit from "@tiptap/starter-kit";
import {
  MenuButtonBold,
  MenuButtonItalic,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectHeading,
  RichTextEditor,
  type RichTextEditorRef,
} from "mui-tiptap";
import type {
  Story,
  Period,
} from 'service';
import {
  ContentEditor,
  Editor,
  TransferList,
} from '../../../components';
import { insert, update } from './actions';

const debug = debugLogger('admin:story-edit-view');

const validationSchema = yup.object({
  slug: yup
    .string()
    .required('Slug is required'),
  title: yup
    .string()
    .min(3, 'Title should be a minimum of 3 characters long')
    .required('Title is required'),
  subTitle: yup
    .string()
    .min(3, 'Sub-title should be a minimum of 3 characters long'),
  summary: yup
    .string()
    .min(3, 'Summary should be a minimum of 3 characters long'),
  detail: yup
    .string()
    .min(3, 'Detail should be a minimum of 3 characters long'),
  periods: yup
    .array(),
});

interface StoryEditViewProps {
  mode: 'create' | 'edit';
  story?: Story;
  periods?: readonly Period[];
}

export default function StoryEditView({ mode, story, periods }: StoryEditViewProps): JSX.Element {
  const [tabIndex, setTabIndex] = useState<string>('1');
  const rteRef = useRef<RichTextEditorRef>(null);

  const initialValues: Story = (mode === 'edit' && story) ? {
    userId: story.userId ?? '',
    slug: story.slug,
    title: story.title,
    subTitle: story.subTitle ?? '',
    summary: story.summary ?? '',
    detail: story.detail ?? '',
    periods: story.periods,
  } : {
    userId: '',
    slug: '',
    title: '',
    subTitle: '',
    summary: '',
    detail: '',
    periods: [],
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string): void => {
    setTabIndex(newValue);
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
    <ContentEditor title="Stories">
      <Editor onSubmit={formik.handleSubmit} title={`${mode === 'create' ? 'Create' : 'Edit'} Story`} url={`/stories/${formik.values.slug.length ? formik.values.slug : '(unnamed)'}`}>
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
                    void formik.setFieldValue('slug', slugify(formik.values.title));
                  }
                  formik.handleBlur(e);
                }}
                onChange={formik.handleChange}
                required
                value={formik.values.title}
              />
            </Grid>
            <Grid mb={2} sm={12}>
              <TextField
                fullWidth
                id="subTitle"
                label="Sub-Title"
                name="subTitle"
                onChange={formik.handleChange}
                value={formik.values.subTitle}
              />
            </Grid>
            <Grid border={1} borderColor="divider" borderRadius={1}>
              <TabContext value={tabIndex}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <TabList onChange={handleTabChange} aria-label="story detail editor">
                    <Tab label="Editor" value="1" />
                    <Tab label="Raw" value="2" />
                  </TabList>
                </Box>
                <TabPanel value="1">
                  <RichTextEditor
                    content={formik.values.detail}
                    extensions={[StarterKit]} // Or any Tiptap extensions you wish!
                    ref={rteRef}
                    // Optionally include `renderControls` for a menu-bar atop the editor:
                    renderControls={() => (
                      <MenuControlsContainer>
                        <MenuSelectHeading />
                        <MenuDivider />
                        <MenuButtonBold />
                        <MenuButtonItalic />
                        {/* Add more controls of your choosing here */}
                      </MenuControlsContainer>
                    )}
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
              <TextField
                fullWidth
                hidden
                id="slug"
                label="Slug"
                name="slug"
                onChange={formik.handleChange}
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
            <Divider sx={{ mt: 2 }} />
            <Typography sx={{ mt: 1, mb: 1 }} variant="h6">
              Periods
            </Typography>
            <TransferList
              available={periods ?? []}
              items={formik.values.periods}
              onChange={(_t) => { /* debug({ t }) */ }}
            />
          </Grid>
        </Grid>
      </Editor>
    </ContentEditor>
  );
}