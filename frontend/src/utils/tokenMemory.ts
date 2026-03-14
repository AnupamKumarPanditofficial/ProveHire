// Store Access Token strictly in memory (Ticket #8)
let memoryAccessToken: string | null = null;

export const setMemoryToken = (token: string | null) => {
    memoryAccessToken = token;
};

export const getMemoryToken = () => {
    return memoryAccessToken;
};
