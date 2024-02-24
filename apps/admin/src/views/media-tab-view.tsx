'use client';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import type { Media } from 'service';
import { ContentViewer } from '../components';
import { MediaImageView } from './media-image-view';
import { MediaListView } from './media-list-view';

interface MediaTabViewProps {
    media: Media[];
    createLink: string;
    deleteLink: string;
    editLink: string;
  }

export function MediaTabView({ media, createLink, deleteLink, editLink }: MediaTabViewProps): JSX.Element {
    const [value, setValue] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number): void => {
        setValue(newValue);
    };

    return (
        <ContentViewer
            count={media.length}
            createLink={createLink}
            title="Media"
        >
            <Box sx={{ width: '100%' }}>
                <Tabs
                    aria-label="media view selection tabs"
                    onChange={handleChange}
                    textColor="inherit"
                    value={value}
                >
                    <Tab label="List View" />
                    <Tab label="Image View" />
                </Tabs>
                {value === 0 ?
                    <MediaListView
                        createLink={createLink}
                        deleteLink={deleteLink}
                        editLink={editLink}
                        media={media}
                    /> : null}
                {value === 1 ?
                    <MediaImageView
                        createLink={createLink}
                        deleteLink={deleteLink}
                        editLink={editLink}
                        media={media}
                    /> : null}
            </Box>
        </ContentViewer>
    );
}
