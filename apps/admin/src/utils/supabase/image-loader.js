export default function supabaseLoader({ src, width, quality }){
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${src}?width=${width}&quality=${
    quality || 75
  }`
}
