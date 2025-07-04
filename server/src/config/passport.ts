import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import User from '../models/User';
import dotenv from 'dotenv';
dotenv.config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
},
async (accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: any) => void) => {
  try {
    if (!profile.emails || profile.emails.length === 0) {
      return done(new Error('No email found in Google profile'), undefined);
    }
    const email = profile.emails[0].value;
    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: profile.displayName,
        role: 'pending', // Mark as pending if role not chosen
        emailVerified: true,
        googleId: profile.id,
      });
    } else {
      // If user exists and is not verified, mark as verified
      if (!user.emailVerified) {
        user.emailVerified = true;
        await user.save();
      }
    }
    return done(null, user);
  } catch (err) {
    return done(err, undefined);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});


passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});