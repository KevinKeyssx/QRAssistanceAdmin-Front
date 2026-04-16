import type { Member } from '$lib/models/member/member.model';
import type { QR }     from '$lib/models/qr/qr.model';


export interface Assistance {
    _id         : string;
    member      : Member;
    qr          : QR;
    created_at  : string;
    updated_at  : string;
}


export interface AssistanceResponse {
    items   : Assistance[];
    total   : number;
    page    : number;
    size    : number;
    pages   : number;
}
