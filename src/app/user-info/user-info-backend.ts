'use server';

import { getUser, updateUser } from "@/lib/firestore/user-store";
import logger, { LogContext } from "@/lib/logger";
import { getSession } from "@/lib/session";
import { UserSecurityProfile } from "@/types/firebase";

export async function getCurrentUserProfile(logContext: LogContext): Promise<UserSecurityProfile> {

    const session = await getSession();

    if (!session.userEmail) {
        throw new Error('**getCurrentUserProfile** User email not found in session');
    } else {

        logger.debug("**getCurrentUserProfile** user session: ", session);

        const userProfile = await getUser(logContext, session.userEmail);

        if (!userProfile) {
            throw new Error('**getCurrentUserProfile** User profile not found');
        } else {
            logger.debug("**getCurrentUserProfile** userProfile: ", userProfile);
            return userProfile
        }

    }
}

export async function updateUserProfile(logContext: LogContext, user: UserSecurityProfile):Promise<void> {
    logger.debug("**updateUserProfile** user: ", user);
    updateUser(logContext, user);
}
