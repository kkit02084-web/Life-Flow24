// Life Flow - Supabase public config
// IMPORTANT: put ONLY the project URL and the anon (public) key here.
// Never put the service_role key in the frontend.
// Fill these after creating a project: https://supabase.com
window.LF_SUPABASE = {
    // Example: 'https://xxxx.supabase.co'
    url: 'https://iilwbzpilwboyzsymotq.supabase.co',
    // Example: 'eyJhbGciOi...' (anon public key from Project Settings → API)
    anonKey: 'sb_publishable_KApeY8QQPs2iUmn5sJMe8w_0XlqRujv',
    // Storage buckets
    buckets: {
        userImages: 'user-images',
        sharedImages: 'shared-images'
    },
    // Set true only after schema is applied and URL/key filled
    enabled: function () {
        return !!(this.url && this.anonKey);
    }
};
