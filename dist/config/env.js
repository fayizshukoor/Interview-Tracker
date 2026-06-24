import 'dotenv/config.js';
const required = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};
export const env = {
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    port: Number(process.env['PORT'] ?? 3000),
    databaseUrl: required('DATABASE_URL'),
};
//# sourceMappingURL=env.js.map