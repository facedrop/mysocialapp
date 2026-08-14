import { supabase } from "./supabase";

/**
 * Качва файл в Supabase Storage bucket "uploads" и връща публичния му URL.
 */
export async function uploadImage(file, folder = "posts") {
    if (!file) return null;

    try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("uploads")
            .upload(fileName, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) {
            console.error("Грешка при качване на файла:", uploadError);
            return null;
        }

        // Вземане на публичния URL адрес
        const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);
        return data.publicUrl;
    } catch (err) {
        console.error("Storage upload error:", err);
        return null;
    }
}