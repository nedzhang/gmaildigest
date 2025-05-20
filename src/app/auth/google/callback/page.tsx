'use client'

import { processGoogleOAuth2Callback } from '@/lib/oauth2-util';
import { useEffect } from 'react';
import { makeCallBackUrl } from '@/lib/client-util';
import { googleOAuth2Callback } from './callback-backend';


const GoogleCallbackPage = () => {

    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        console.info('**auth/google/callback** code: ', code);

        if (!code) {
            window.location.replace(`/auth/error?message=${encodeURIComponent('No code provided')}`);
            //   return NextResponse.redirect(new URL('/auth/error', request.url));
        } else {
            const callbackUrl = makeCallBackUrl();

            

            useEffect(() => {
                const askServerToProcessOAuthResult = async () => {

                    await googleOAuth2Callback(callbackUrl, code);

                }

                askServerToProcessOAuthResult()
            }, []);
        }
    }

    return (
        <div>
            <p>Processing Google Authentication...</p>
        </div>
    );
};

export default GoogleCallbackPage;