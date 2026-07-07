const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://whatsrye_db_user:tDahYFzP6xbWRUin@cluster0.vyv2ezx.mongodb.net/realcars?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    // Define simple schema
    const CarSchema = new mongoose.Schema({}, { strict: false });
    const Car = mongoose.model('Car', CarSchema, 'cars'); // 'cars' is collection name
    
    const countAll = await Car.countDocuments({});
    console.log('Total documents in cars collection:', countAll);
    
    const nonMock = await Car.countDocuments({ isMock: { $ne: true } });
    console.log('Non-mock documents:', nonMock);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
