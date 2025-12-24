// Status-specific colors in the requested sequence
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    'backlog': { bg: 'bg-gray-200', text: 'text-gray-700' },
    'blocker': { bg: 'bg-red-100', text: 'text-red-700' },
    'pending update': { bg: 'bg-orange-100', text: 'text-orange-700' },
    'in progress': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    'qa': { bg: 'bg-purple-100', text: 'text-purple-700' },
    'deployed to iot': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'pushed to iot': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'pdc': { bg: 'bg-pink-100', text: 'text-pink-700' },
    'done': { bg: 'bg-green-100', text: 'text-green-700' },
    'completed': { bg: 'bg-green-100', text: 'text-green-700' },
    'live': { bg: 'bg-green-100', text: 'text-green-700' },
};

// Fallback colors for non-status strings (categories, PICs, etc.)
const COLORS = [
    { bg: 'bg-gray-200', text: 'text-gray-700' },
    { bg: 'bg-orange-100', text: 'text-orange-700' },
    { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    { bg: 'bg-green-100', text: 'text-green-700' },
    { bg: 'bg-blue-100', text: 'text-blue-700' },
    { bg: 'bg-purple-100', text: 'text-purple-700' },
    { bg: 'bg-pink-100', text: 'text-pink-700' },
    { bg: 'bg-red-100', text: 'text-red-700' },
];

export const getColorForString = (str: string) => {
    if (!str) return COLORS[0];

    // Check for status-specific color first (case-insensitive)
    const statusColor = STATUS_COLORS[str.toLowerCase()];
    if (statusColor) return statusColor;

    // Fallback to hash-based color for other strings
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLORS.length;
    return COLORS[index];
};
