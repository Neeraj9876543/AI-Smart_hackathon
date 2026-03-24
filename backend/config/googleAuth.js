module.exports = {
  google: {
    clientID: '485182531995-guq60ejs56jlatbtfmtjqhlk6ec0r6tr.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret-here',
    callbackURL: 'http://localhost:5000/api/auth/google/callback'
  }
};
