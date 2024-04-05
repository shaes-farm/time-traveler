'use client';

/* eslint-disable @next/next/no-img-element -- allow unoptimized img */
import React from 'react';
import Link from 'next/link';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import type { Media } from 'service';

const WEB_IMAGE_FILE_TYPES = [
    'image/apng',
    'image/avif',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp',
];

function isCommonImageType(type: string | undefined): boolean {
    return type ? WEB_IMAGE_FILE_TYPES.includes(type) : false;
}

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
                        src={isCommonImageType(item.formats) ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${item.url}?quality=100` : '/images/placeholder.svg'}
                        srcSet={isCommonImageType(item.formats) ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${item.url}?quality=100` : '/images/placeholder.svg'}
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
