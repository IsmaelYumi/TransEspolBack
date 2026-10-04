import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api/v1';

  @IsString()
  @IsOptional()
  CORS_ORIGINS: string = '*';

  @IsNotEmpty({ message: 'DATABASE_URL is required to connect to PostgreSQL (Prisma 7)' })
  @IsString()
  DATABASE_URL: string;

  @IsNotEmpty({ message: 'REDIS_HOST is required for realtime tracking cache' })
  @IsString()
  REDIS_HOST: string = 'localhost';

  @Type(() => Number)
  @IsNumber()
  REDIS_PORT: number = 6379;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  REDIS_DB: number = 0;

  @IsString()
  @IsOptional()
  REDIS_KEY_PREFIX: string = 'transespol:';

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  REDIS_COORDINATES_TTL_SECONDS: number = 120;

  @IsNotEmpty({ message: 'JWT_SECRET is mandatory for authentication security' })
  @IsString()
  @MinLength(16, { message: 'JWT_SECRET must have at least 16 characters' })
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '1d';

  @IsNotEmpty({ message: 'JWT_REFRESH_SECRET is mandatory for refresh tokens' })
  @IsString()
  @MinLength(16, { message: 'JWT_REFRESH_SECRET must have at least 16 characters' })
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsNotEmpty({ message: 'MICROSOFT_CLIENT_ID is required for ESPOL institutional OAuth' })
  @IsString()
  MICROSOFT_CLIENT_ID: string;

  @IsNotEmpty({ message: 'MICROSOFT_CLIENT_SECRET is required for ESPOL institutional OAuth' })
  @IsString()
  MICROSOFT_CLIENT_SECRET: string;

  @IsNotEmpty({ message: 'MICROSOFT_TENANT_ID is required for Azure AD / ESPOL tenant' })
  @IsString()
  MICROSOFT_TENANT_ID: string = 'common';

  @IsString()
  @IsOptional()
  MICROSOFT_ALLOWED_DOMAIN: string = 'espol.edu.ec';

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  THROTTLE_TTL: number = 60;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  THROTTLE_LIMIT: number = 100;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const formattedErrors = errors
      .map(
        (err) =>
          `\n - Property: "${err.property}" | Violations: ${Object.values(err.constraints || {}).join(', ')}`,
      )
      .join('');

    throw new Error(
      `🚨 [TransEspol Configuration Error] Fatal: Protected environment variables failed validation:${formattedErrors}\n\nPlease check your .env file or deployment secrets.`,
    );
  }

  return validatedConfig;
}
