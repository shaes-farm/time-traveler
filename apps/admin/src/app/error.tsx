'use client'

import {useEffect} from 'react'
import {CustomError} from 'ui';
import {logger} from './actions';

export default function Error({
  error,
  _reset,
}: {
  error: Error & { status?: number; digest?: string; }
  _reset: () => void
}): JSX.Element {
  useEffect(() => {
    logger().error(error.message, {error});
  }, [error]);
 
  return (
    <CustomError dump={error} message={error.message} status={error.status} />
  );
}