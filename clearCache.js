// Clear Mongoose model cache
Object.keys(require.cache).forEach(function(key) {
  if (key.includes('models/Booking.js')) {
    delete require.cache[key];
  }
});
