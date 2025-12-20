// Simple hash function to get consistent specific colors like Notion
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
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLORS.length;
    return COLORS[index];
};
