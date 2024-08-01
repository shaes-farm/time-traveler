'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import MuiLink from '@mui/material/Link';

interface LinkProps {
    href: string;
    children: React.ReactNode;
}

export function Link({ href, children }: LinkProps): JSX.Element {
    const router = useRouter();
    return (
        <MuiLink href={href} onClick={(e: React.SyntheticEvent) => { e.preventDefault(); router.push(href); }}>
            {children}
        </MuiLink>
    );
}