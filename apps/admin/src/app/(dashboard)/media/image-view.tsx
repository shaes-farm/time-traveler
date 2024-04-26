'use client';

/* eslint-disable @next/next/no-img-element -- allow unoptimized img */
import React from 'react';
import Link from '@mui/material/Link';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import type { Media } from 'service';
import {getIcon} from '../../../utils/media';

interface MediaImageViewProps {
    media: Media[];
    createLink: string;
    deleteLink: string;
    editLink: string;
}

export function MediaImageView({ media }: MediaImageViewProps): JSX.Element {
    return (
        <ImageList cols={4} sx={{ width: '100%', height: '500' }} variant="masonry">
            {media.map((item) => (
                <ImageListItem key={item.slug}>
                    <img
                        alt={item.alternativeText}
                        loading="lazy"
                        src={getIcon(item.formats ?? '', item.url)}
                        srcSet={getIcon(item.formats ?? '', item.url)}
                    />
                    <Link href={`/media/${item.slug}`}>
                        <ImageListItemBar
                            position="below"
                            subtitle={item.alternativeText}
                            title={item.caption}
                        />
                    </Link>
                </ImageListItem>
            ))}
        </ImageList>
    );
}
