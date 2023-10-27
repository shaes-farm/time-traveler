'use client'
 
import {useEffect} from 'react'
import {CustomError} from 'ui';
 
export default function Error({
  error,
  _reset,
}: {
  error: Error & { status?: number; digest?: string; }
  _reset: () => void
}): JSX.Element {
  useEffect(() => {
    // Log the error to an error reporting service
    // eslint-disable-next-line no-console -- console for now
    console.error(error)
  }, [error])
 
  return (
    <CustomError dump={error} message={error.message} status={error.status} />
  )
}