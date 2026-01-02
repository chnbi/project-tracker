// Status-specific CSS classes
// These classes are defined in index.css with proper light/dark mode colors
const STATUS_CLASSES: Record<string, string> = {
    'backlog': 'status-backlog',
    'blocker': 'status-blocker',
    'pending update': 'status-pending',
    'in progress': 'status-progress',
    'in development': 'status-progress',
    'review': 'status-review',
    'qa': 'status-qa',
    'deployed to iot': 'status-iot',
    'pushed to iot': 'status-iot',
    'iot': 'status-iot',
    'pdc': 'status-pdc',
    'done': 'status-done',
    'completed': 'status-done',
    'live': 'status-done',
};

// Fallback classes for non-status strings (categories, PICs, etc.)
const FALLBACK_CLASSES = [
    'status-backlog',
    'status-pending',
    'status-review',
    'status-done',
    'status-progress',
    'status-qa',
    'status-pdc',
    'status-blocker',
];

export const getColorForString = (str: string): { class: string } => {
    if (!str) return { class: FALLBACK_CLASSES[0] };

    // Check for status-specific class first (case-insensitive)
    const statusClass = STATUS_CLASSES[str.toLowerCase()];
    if (statusClass) return { class: statusClass };

    // Fallback to hash-based class for other strings
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % FALLBACK_CLASSES.length;
    return { class: FALLBACK_CLASSES[index] };
};
