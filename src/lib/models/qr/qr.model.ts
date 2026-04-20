import type { LDSClass } from "$lib/types";

export interface QR {
    _id             : string;
    session_id      : string;
    type            : string;
    date            : string;
    start_hour      : string;
    end_hour        : string;

    assist_count?   : number;

    created_at      : string;
    updated_at      : string;
}


export interface QRHistoryResponse {
    items   : QR[];
    total   : number;
    page    : number;
    size    : number;
    pages   : number;
}


export interface QRMapped {
    id          : string;
    url         : string;
    date        : string;
    startHour   : string;
    endHour     : string;
    original    : QR;
    appClass    : LDSClass;
}