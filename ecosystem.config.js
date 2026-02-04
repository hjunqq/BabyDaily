module.exports = {
    apps: [
        {
            name: 'babydaily-backend',
            cwd: './backend',
            script: 'dist/main.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                DB_HOST: 'localhost',
                DB_PORT: 54320,
                DB_USERNAME: 'postgres',
                DB_PASSWORD: 'postgres',
                DB_DATABASE: 'babydaily',
                JWT_SECRET: 'babydaily_secret_token_2024',
                ENABLE_DEV_LOGIN: 'true'
            }
        }
    ]
};
