'use client'
 
import {useEffect} from 'react'
import {CustomError} from 'ui';
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { status?: number; digest?: string; }
  reset: () => void
}): JSX.Element {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <CustomError message={error.message} status={error.status} />
  )
}