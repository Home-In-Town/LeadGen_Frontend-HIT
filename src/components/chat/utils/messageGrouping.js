/**
 * Determine which messages should have a tail (first in consecutive same-direction group).
 * Returns an array of booleans parallel to the messages array.
 * 
 * @param {Array} messages - Array of message objects with `sender` field
 * @returns {boolean[]} - true if message should show a tail
 */
export function computeTails(messages) {
    if (!messages || messages.length === 0) return [];
    return messages.map((msg, i) => {
        if (i === 0) return true;
        const prevDir = getDirection(messages[i - 1].sender);
        const currDir = getDirection(msg.sender);
        return prevDir !== currDir;
    });
}

/**
 * Get message direction: 'outbound' or 'inbound'
 */
export function getDirection(sender) {
    const outboundSenders = ['system', 'agent', 'builder', 'service_user', 'ai'];
    return outboundSenders.includes(sender) ? 'outbound' : 'inbound';
}
