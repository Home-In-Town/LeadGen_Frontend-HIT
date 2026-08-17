/**
 * Sort conversations by most recent message timestamp (descending).
 * @param {Array} conversations
 * @returns {Array} sorted copy
 */
export function sortByRecency(conversations) {
    return [...conversations].sort((a, b) => {
        const aTime = new Date(a.latestMessage?.createdAt || a.updatedAt || 0).getTime();
        const bTime = new Date(b.latestMessage?.createdAt || b.updatedAt || 0).getTime();
        return bTime - aTime;
    });
}
