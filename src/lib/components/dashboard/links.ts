import { ChartColumn, ClipboardList, FileText, House, QrCode, Users } from "lucide-svelte";

export const links = [
    { href: '/dashboard',               label: 'Inicio',        icon: House },
    { href: '/dashboard/qr-generator',  label: 'Generador QR',  icon: QrCode },
	{ href: '/dashboard/members',       label: 'Miembros',      icon: Users },
	{ href: '/dashboard/attendance',    label: 'Asistencias',   icon: ClipboardList },
	{ href: '/dashboard/analytics',     label: 'Analíticas',    icon: ChartColumn },
	{ href: '/dashboard/survey',        label: 'Encuestas',     icon: FileText }
];
