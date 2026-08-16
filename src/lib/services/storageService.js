// storageService.js — uploads chat attachments to the private "documents"
// Supabase Storage bucket. Files live under <user_id>/... so the storage
// RLS policy (see supabase/schema.sql) can enforce that a user only ever
// reaches their own files.
import { supabase } from "../supabaseClient";

export async function uploadAttachment(file, userId) {
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (error) throw error;
    return path; // stored alongside the message if you later want a re-download link
}

export async function getAttachmentUrl(path) {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 60); // 1hr
    if (error) throw error;
    return data.signedUrl;
}