'use client';

/* eslint-disable @next/next/no-img-element -- allow unoptimized img */
import React from 'react';
import Link from '@mui/material/Link';
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

const FILE_TYPE_ICONS = [{
    type: 'application/pdf',
    image: '/images/adobe-pdf-icon.svg'
}];

function isCommonImageType(type: string | undefined): boolean {
    return type ? WEB_IMAGE_FILE_TYPES.includes(type) : false;
}

function getIcon(type: string, fileName: string): string {
    if (isCommonImageType(type)) {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${fileName}?quality=100`;
    }

    return FILE_TYPE_ICONS.find((icon) => icon.type === type)?.image ?? '/images/placeholder.svg';
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
