import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Check if this instance should run as a worker
  const isWorker = process.env.NODE_ENV === 'worker';

  if (isWorker) {
    // Initialize worker mode
    await app.init();
    console.log('Worker initialized successfully');
  } else {
    // Initialize API server mode
    app.setGlobalPrefix('api/v1', {
      exclude: ['/'],
    });

    const allowedOrigins = [
      process.env.FRONTEND_DEV_URL, // Local frontend
      process.env.FRONTEND_PROD_URL, // Production frontend
      "*" // Allow all origins (for testing purposes)
    ];

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    });

    await app.listen(process.env.PORT || 8000, () => {
      console.log(`API Server running on port ${process.env.PORT || 8000}`);
    });
  }
}
bootstrap();