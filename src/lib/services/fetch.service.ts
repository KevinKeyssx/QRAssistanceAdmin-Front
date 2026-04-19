import { METHOD } from './http-codes';


// const BASE_URL = import.meta.env.VITE_API_URL as string;
import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';

const BASE_URL = env.PUBLIC_VITE_API_URL;


type Connect = {
    endpoint    : string;
    method?     : METHOD;
    body?       : object;
    isInternal? : boolean;
    headers?    : Record<string, string>;
}


export type ApiError = {
    message : string;
    code    : string;
    status? : number;
    data?   : unknown;
}


export const isApiError = ( error: any ): error is ApiError => 
    typeof error === 'object' && error !== null && 'message' in error && 'code' in error;


export default async function connectRequest<T>({
    method = METHOD.GET,
    body,
    endpoint,
    headers,
    isInternal = true,
}: Connect ): Promise<T | ApiError> {
    // const url      = isInternal ? `/api/${endpoint}` : `${BASE_URL}/${endpoint}`;
    let url = '';

    if (isInternal) {
        // En el navegador, /api/ funciona perfecto.
        // En el servidor (Vercel Function), DEBES usar la URL completa del frontend.
        url = browser 
            ? `/api/${endpoint}` 
            : `${env.PUBLIC_VITE_FRONTEND_URL}/api/${endpoint}`; 
    } else {
        url = `${BASE_URL}/${endpoint}`;
    }
    console.log('🚀 ~************************************************* connectRequest ~ url:', url)
    const response = await fetch( url, {
        method,
        body    : body ? JSON.stringify( body ) : undefined,
        cache   : 'no-cache',
        headers : {
            'Content-Type' : 'application/json',
            Accept         : 'application/json',
            ...headers
        }
    });

    if ( !response.ok ) {
        const errorData = await response.json().catch( () => ({}) );

        throw {
            message : errorData.message || 'Request failed',
            code    : `HTTP_${response.status}`,
            status  : response.status,
            data    : errorData,
        } as ApiError;
    }

    if ( response.status === 204 ) return true as T;

    return await response.json() as T;

}
