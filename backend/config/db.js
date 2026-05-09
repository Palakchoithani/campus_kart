const mongoose = require('mongoose')

async function connectToDatabase(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI is required')
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  return mongoose.connection
}

module.exports = { connectToDatabase }