export function maskToken(token?: string | null) {
    if (!token) {
        return 'нет токена';
    }
    const trimmed = token.trim();
    if (trimmed.length <= 8) {
        return 'токен скрыт';
    }
    return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}
