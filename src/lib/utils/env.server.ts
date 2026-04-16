import { z } from 'zod';

import { 
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    BETTER_AUTH_SECRET,
    BETTER_AUTH_URL,
    INTERNAL_SECRET_KEY
} from '$env/static/private';


const envSchema = z.object({
    GOOGLE_CLIENT_ID        : z.string().min(1),
    GOOGLE_CLIENT_SECRET    : z.string().min(1),
    BETTER_AUTH_SECRET      : z.string().min(1),
    BETTER_AUTH_URL         : z.url(),
    INTERNAL_SECRET_KEY     : z.string().min(1),
});


const parsedEnv = envSchema.safeParse({
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    BETTER_AUTH_SECRET,
    BETTER_AUTH_URL,
    INTERNAL_SECRET_KEY,
});


if ( !parsedEnv.success ) {
    console.error(
        '❌ Invalid environment variables:'
    );

    throw new Error( 'Invalid environment variables' );
}


export const ENV = {
    GOOGLE: {
        CLIENT_ID       : parsedEnv.data.GOOGLE_CLIENT_ID,
        CLIENT_SECRET   : parsedEnv.data.GOOGLE_CLIENT_SECRET,
    },
    BETTER_AUTH: {
        SECRET  : parsedEnv.data.BETTER_AUTH_SECRET,
        URL     : parsedEnv.data.BETTER_AUTH_URL,
    },

    INTERNAL_SECRET_KEY: parsedEnv.data.INTERNAL_SECRET_KEY,
};
