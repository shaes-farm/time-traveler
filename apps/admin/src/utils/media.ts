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

export function getIcon(type: string, fileName: string): string {
    if (isCommonImageType(type)) {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${fileName}?quality=100`;
    }

    return FILE_TYPE_ICONS.find((icon) => icon.type === type)?.image ?? '/images/placeholder.svg';
}
