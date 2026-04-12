export interface Member {
	_id			: string;
	name		: string;
	last_name	: string;
	classes		: string[];
	saveFinger	: boolean;
	ulid_token	: string;
	created_at	: string;
	updated_at	: string;
}


export interface MemberResponse {
	items	: Member[];
	total	: number;
	page	: number;
	size	: number;
	pages	: number;
}
