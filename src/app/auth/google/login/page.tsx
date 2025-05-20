'use client';

import { useEffect } from 'react';
import { createOAuthUrl } from '@/lib/oauth2-util';
import { makeCallBackUrl } from '@/lib/client-util';

const GoogleLoginPage = () => {
  console.log("**GoogleLoginPage**");


  if (typeof window !== 'undefined') {
    const currentUrl = window.location.href;

    // const currentUrlOrigin = new URL(currentUrl).origin;

    // const callbackUrl = makeCallBackUrl({"requestUrl": currentUrl});
    const callbackUrl = makeCallBackUrl();

    console.info("**GoogleLoginPage** callbackUrl: ", callbackUrl);

    useEffect(() => {
      const redirectToOAuth = async () => {
        const googleOauth2Url = await createOAuthUrl(
          {
            callbackUrl: callbackUrl,
            scopes: ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/gmail.readonly"],
          });

        console.log("**GoogleLoginPage** googleOauth2Url: ", googleOauth2Url);

        window.location.replace(googleOauth2Url);
      };

      redirectToOAuth();

    }, []);
  }

return (
  <div>
    <p>Redirecting to Google login...</p>
  </div>
);
};

export default GoogleLoginPage;