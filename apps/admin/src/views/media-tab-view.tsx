'use client';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import type { Media } from 'service';
import { MediaImageView } from './media-image-view';
import { MediaListView } from './media-list-view';

interface MediaTabViewProps {
    media: Media[];
}

export function MediaTabView({ media }: MediaTabViewProps): JSX.Element {
    const [value, setValue] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number): void => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
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
                    createLink="/media/create"
                    deleteLink="/media/[slug]/delete"
                    editLink="/media/[slug]"
                    media={media}
                /> : null}
            {value === 1 ?
                <MediaImageView
                    createLink="/media/create"
                    deleteLink="/media/[slug]/delete"
                    editLink="/media/[slug]"
                    media={media}
                /> : null}
        </Box>
    );
}
