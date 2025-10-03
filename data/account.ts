import { db } from "@/lib/db";

export const getAccountByUserId = async (userId: string) => {
    try {
        const account = await db.account.findFirst({
            where: { userId }
        });
        return account;
    } catch {
        return null;
    }
};

export const getAccountsByUserId = async (userId: string) => {
    try {
        const accounts = await db.account.findMany({
            where: { userId }
        });
        return accounts;
    } catch {
        return [];
    }
};

export const linkAccount = async (
    userId: string,
    provider: string,
    providerAccountId: string,
    type: string,
    accessToken?: string,
    refreshToken?: string,
    expiresAt?: number
) => {
    try {
        const account = await db.account.create({
            data: {
                userId,
                provider,
                providerAccountId,
                type,
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: expiresAt,
            }
        });
        return account;
    } catch {
        return null;
    }
};
