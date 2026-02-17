import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  await app.init();
  console.log('🚀 Train AI Worker started successfully');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start Train AI Worker:', error);
  process.exit(1);
});