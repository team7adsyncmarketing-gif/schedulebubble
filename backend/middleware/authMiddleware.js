import { supabase } from '../config/supabase.js';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token === 'null' || token === 'undefined') {
    token = null;
  }

  if (token) {
    try {
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        throw new Error('Not authorized');
      }

      // Fetch profile from our profiles table
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // If profile doesn't exist (PGRST116), create it automatically
      if (profileError && profileError.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            profile_picture: user.user_metadata?.avatar_url || ''
          })
          .select()
          .single();
          
        if (insertError) throw new Error('Failed to auto-create profile');
        profile = newProfile;
      } else if (profileError || !profile) {
        throw new Error(`Profile fetch error: ${profileError ? profileError.message || profileError.code : 'No profile returned'}`);
      }

      req.user = profile;
      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error);
      res.status(401).json({ message: 'Not authorized', error: error.message || error.toString() });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export { protect };
