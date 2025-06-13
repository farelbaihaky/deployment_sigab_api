const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and service key must be provided in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to ensure bucket exists
const ensureBucketExists = async () => {
  try {
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw listError;
    }

    // Check if 'images' bucket exists
    const imagesBucket = buckets.find(b => b.name === 'images');
    
    if (!imagesBucket) {
      console.log('Creating images bucket...');
      // Create the bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        throw createError;
      }
      console.log('Images bucket created successfully');
    } else {
      console.log('Images bucket already exists');
    }
  } catch (error) {
    console.error('Error in ensureBucketExists:', error);
    throw error;
  }
};

// Call ensureBucketExists when the module is loaded
ensureBucketExists().catch(console.error);

module.exports = supabase; 