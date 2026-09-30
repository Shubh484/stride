export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://fitness_user:fitness_password@localhost:5432/fitness_db?schema=public',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'super_secret_social_fitness_jwt_key_32_chars_min!',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
});
