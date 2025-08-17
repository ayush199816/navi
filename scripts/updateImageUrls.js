require('dotenv').config();
const mongoose = require('mongoose');
const GuestSightseeing = require('../models/GuestSightseeing');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/navigatio';

async function updateImageUrls() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all guest sightseeings with images
    const sightseeings = await GuestSightseeing.find({
      $or: [
        { images: { $exists: true, $ne: [] } },
        { 'images.url': { $exists: true } }
      ]
    });

    console.log(`Found ${sightseeings.length} sightseeings with images to check`);

    let updatedCount = 0;
    
    for (const sightseeing of sightseeings) {
      let needsUpdate = false;
      
      // Update images array
      if (sightseeing.images && sightseeing.images.length > 0) {
        sightseeing.images = sightseeing.images.map(img => {
          if (typeof img === 'string') {
            needsUpdate = true;
            return img.replace('http://', 'https://');
          } else if (img && img.url) {
            needsUpdate = true;
            return {
              ...img,
              url: img.url.replace('http://', 'https://')
            };
          }
          return img;
        });
      }
      
      // Update featuredImage if it exists
      if (sightseeing.featuredImage && sightseeing.featuredImage.startsWith('http://')) {
        sightseeing.featuredImage = sightseeing.featuredImage.replace('http://', 'https://');
        needsUpdate = true;
      }

      if (needsUpdate) {
        await sightseeing.save();
        updatedCount++;
        console.log(`Updated sightseeing: ${sightseeing._id}`);
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Total sightseeings checked: ${sightseeings.length}`);
    console.log(`Sightseeings updated: ${updatedCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
updateImageUrls();
