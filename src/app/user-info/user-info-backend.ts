'use server';

import { getUser, updateUser } from "@/lib/gduser-util";
import logger from "@/lib/logger";
import { getSession } from "@/lib/session";
import { UserSecurityProfile } from "@/types/firebase";

export async function getCurrentUserProfile(): Promise<UserSecurityProfile> {

    const session = await getSession();

    if (!session.userEmail) {
        throw new Error('**getCurrentUserProfile** User email not found in session');
    } else {

        logger.debug("**getCurrentUserProfile** user session: ", session);

        const userProfile = await getUser(session.userEmail);

        if (!userProfile) {
            throw new Error('**getCurrentUserProfile** User profile not found');
        } else {
            logger.debug("**getCurrentUserProfile** userProfile: ", userProfile);
            return userProfile
        }

    }
}

export async function updateUserProfile(user: UserSecurityProfile):Promise<void> {
    logger.debu("**updateUserProfile** user: ", user);
    updateUser(user);
}
