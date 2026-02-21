import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const BUCKET = 'user_avatar';

@Injectable()
export class UploadService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided.');

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .single();

    if (profile?.avatar_url) {
      const oldPath = profile.avatar_url.substring(
        profile.avatar_url.indexOf(BUCKET) + BUCKET.length + 1,
      );
      await this.supabase.storage.from(BUCKET).remove([oldPath]);
    }

    const newFileName = `${userId}/${Date.now()}_${file.originalname}`;
    const { error: uploadError } = await this.supabase.storage
      .from(BUCKET)
      .upload(newFileName, file.buffer, { contentType: file.mimetype });

    if (uploadError) throw new InternalServerErrorException('Upload failed.');

    const { data: { publicUrl } } = this.supabase.storage
      .from(BUCKET)
      .getPublicUrl(newFileName);

    return { url: publicUrl };
  }

  async deleteAvatar(userId: string) {
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .single();

    if (profile?.avatar_url) {
      const filePath = profile.avatar_url.substring(
        profile.avatar_url.indexOf(BUCKET) + BUCKET.length + 1,
      );
      await this.supabase.storage.from(BUCKET).remove([filePath]);
    }

    return { message: 'Avatar deleted.' };
  }
}
