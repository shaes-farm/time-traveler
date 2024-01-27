'use client'
 
import {useEffect} from 'react'
import {CustomError} from 'ui';

const {log} = console;

export default function Error({
  error,
  _reset,
}: {
  error: Error & { status?: number; digest?: string; }
  _reset: () => void
}): JSX.Element {
  useEffect(() => {
    // TODO: Log the error to an error reporting service
    log(error)
  }, [error])
 
  return (
    <CustomError dump={error} message={error.message} status={error.status} />
  )
}