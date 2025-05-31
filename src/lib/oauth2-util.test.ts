/**
 * @jest-environment node
 */

import {
    createOAuthUrl,
    getAccessToken,
    processGoogleOAuth2Callback,
} from "@/lib/oauth2-util";
import { LogContext } from "./logger";
import { Donegal_One, The_Nautigal } from "next/font/google";

const mockLogContext: LogContext = {
    requestId: "test-request",
    additional: {},
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

describe("OAuth2 Utility", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetAllMocks();
        process.env = {
            ...originalEnv,
            FIREBASE_WEB_APP_GOOGLE_CLIENT_ID: "test-client-id",
            FIREBASE_WEB_APP_GOOGLE_CLIENT_SECRET: "test-client-secret",
            GOOGLE_AUTH_CALL_BACK_URL: "https://callback.test",
            GOOGLE_TOKEN_URL: "https://token.test",
            GOOGLE_OAUTH_URL: "https://oauth.test",
        };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe("createOAuthUrl", () => {
        it("should generate valid OAuth URL", async () => {
            const result = await createOAuthUrl({
                scopes: ["scope1", "scope2"],
            });

            expect(result).toContain("oauth.test");
            expect(result).toContain("client_id=test-client-id");
            expect(result).toContain(
                "redirect_uri=https%3A%2F%2Fcallback.test",
            );
            expect(result).toContain("scope=scope1+scope2");
            expect(result).toContain("access_type=offline");
        });

        it("should throw error when scopes are missing", async () => {
            await expect(createOAuthUrl({ scopes: [] }))
                .rejects
                .toThrow("**createOAuthUrl** Missing scopes parameter");
        });
    });

    describe("getAuthToken", () => {
        it("Should get a renewed token.", (done) => {
            getAccessToken(mockLogContext, "ned.zhang@paracognition.ai")
                .then((newToken) => {
                    delay(3000) // wait 3 seconds for the logging to complete
                        .then(() => {
                            expect(newToken).toBeDefined();
                            expect(newToken.length).toBeGreaterThan(0);

                            // need to let jest know that we are done

                            done();
                        });
                });
        });
    });
});
