import { redirect } from 'next/navigation'
import { getAppConfig } from '../../../../utils/config';
import { RECOVER_URL } from '../../constants';

const {
  baseUrl: appBaseUrl,
  basePath,
} = getAppConfig();

export default async function Page(): Promise<JSX.Element | null> {
  redirect(`${appBaseUrl}${basePath}${RECOVER_URL}`);
}