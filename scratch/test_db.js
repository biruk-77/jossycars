const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://whatsrye_db_user:tDahYFzP6xbWRUin@cluster0.vyv2ezx.mongodb.net/realcars?retryWrites=true&w=majority&appName=Cluster0';

console.log('Attempting to connect to MongoDB Atlas...');
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 8000
})
  .then(() => {
    console.log('SUCCESS: Connected successfully to MongoDB Atlas!');
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILED to connect:', err);
    process.exit(1);
  });
