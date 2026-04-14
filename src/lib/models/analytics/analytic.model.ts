export interface MainChartItemDTO {
    label : number;
    type  : string;
    total : number;
}


export interface RetentionDTO {
    totalMembers     : number;
    recurringMembers : number;
}


export interface LoyaltyStatusDTO {
    status     : string;
    totalCount : number;
    members    : string[];
}


export interface PunctualityItemDTO {
    hour  : number;
    block : number;
    total : number;
}


export interface GrowthItemDTO {
    year   : number;
    month  : number;
    total  : number;
    growth : string;
}
