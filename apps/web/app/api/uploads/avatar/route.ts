import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

// This function handles UPLOADING a new avatar.
// It smartly deletes the old one first.
export async function POST(request: Request) {
  const supabase = await getSupabaseServer();

  try {
    // 1. Authenticate the user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check for the old avatar's URL in your database
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", user.id)
      .single();

    // 3. If an old avatar exists, delete it from storage
    if (profile?.avatar_url) {
      const bucketName = 'user_avatar';
      const oldFilePath = profile.avatar_url.substring(
        profile.avatar_url.indexOf(bucketName) + bucketName.length + 1
      );
      await supabase.storage.from(bucketName).remove([oldFilePath]);
    }

    // 4. Upload the NEW file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const newFileName = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("user_avatar")
      .upload(newFileName, file);

    if (uploadError) throw uploadError;

    // 5. Get the public URL of the new file
    const { data: { publicUrl } } = supabase.storage
      .from("user_avatar")
      .getPublicUrl(newFileName);

    // 6. Return the new URL to the frontend
    return NextResponse.json({ url: publicUrl });

  } catch (error) {
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}

// This function handles DELETING an avatar when the user doesn't upload a new one.
export async function DELETE(request: Request) {
  const supabase = await getSupabaseServer();

  try {
    // 1. Authenticate the user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get the avatar_url from the profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", user.id)
      .single();

    // 3. If it exists, delete it from storage
    if (profile?.avatar_url) {
      const bucketName = 'user_avatar';
      const filePath = profile.avatar_url.substring(
        profile.avatar_url.indexOf(bucketName) + bucketName.length + 1
      );
      await supabase.storage.from(bucketName).remove([filePath]);
    }

    // 4. Return success
    return NextResponse.json({ message: 'Avatar deleted.' });

  } catch (error) {
    return NextResponse.json({ error: 'Deletion failed.' }, { status: 500 });
  }
}