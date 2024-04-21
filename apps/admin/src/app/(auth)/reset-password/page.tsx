'use client';
import debugLogger from 'debug';
import { PasswordResetForm } from 'ui/src/components/auth';
// import { getAppConfig } from '../../../utils/config';
import { reset } from '../actions';
import { RECOVER_URL, SIGNIN_URL } from '../constants';

const debug = debugLogger('admin:auth:reset-password');

// const {
//     title,
// } = getAppConfig();

const title = 'Foo';

interface SearchParams {
    code?: string;
    error?: string;
    error_code?: string;
    error_description?: string;
}

interface PageProps {
    params: unknown;
    searchParams: SearchParams;
}

export default function Page({ params, searchParams }: PageProps): JSX.Element {
    debug({ params, searchParams });

    const { code, error_description: errorDescription } = searchParams;

    return (
        <PasswordResetForm
            error={errorDescription}
            recoverPasswordUrl={RECOVER_URL}
            resetPassword={reset}
            signInUrl={SIGNIN_URL}
            subTitle={`Welcome to ${title}!`}
            title="Password Reset"
        />
    );
}
