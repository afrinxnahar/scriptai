import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';

@Module({
  imports: [SupabaseModule],
  controllers: [CourseController],
  providers: [CourseService],
})
export class CourseModule {}
