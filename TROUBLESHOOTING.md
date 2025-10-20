# Troubleshooting Guide

## Common Issues and Solutions

### "This screen doesn't exist" Error in Expo Go

**Problem:** When scanning the QR code, Expo Go shows "This screen doesn't exist" or similar navigation errors.

**Solution:** This has been fixed in the latest version. The issue was:
1. Missing screen declarations in the root Stack navigator
2. Router trying to navigate before contexts were fully initialized

**What was fixed:**
- Added explicit `<Stack.Screen>` declarations for all routes in `app/_layout.tsx`
- Changed index routing from `useEffect` with `router.replace()` to using `<Redirect>` component
- This ensures proper screen registration with Expo Router

**If the error persists:**
1. Close the Expo Go app completely
2. Clear Metro bundler cache: `npx expo start -c`
3. Scan the QR code again
4. Wait for the bundle to reload

---

### Authentication Issues

**Problem:** Can't sign up or sign in

**Solution:**
1. Check that `.env` file exists and contains valid Supabase credentials
2. Verify internet connection
3. Check Supabase dashboard to ensure project is active
4. Try clearing app data in Expo Go (iOS: shake device → Clear app data)

---

### Location Not Working

**Problem:** Location features not showing or distance calculations missing

**Solution:**
1. Enable location permissions in device settings:
   - **iOS:** Settings → Privacy → Location Services → Expo Go → While Using
   - **Android:** Settings → Apps → Expo Go → Permissions → Location → Allow
2. Ensure location services are enabled system-wide
3. On iOS simulator, use Debug → Location → Custom Location

---

### App Crashes or White Screen

**Problem:** App shows white screen or crashes immediately

**Solution:**
1. Check for JavaScript errors in terminal
2. Restart Metro bundler: Press 'r' in terminal or `npx expo start -c`
3. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   npm install
   ```
4. Clear Expo cache:
   ```bash
   npx expo start -c
   ```

---

### Images Not Loading

**Problem:** Activity images appear as gray boxes

**Solution:**
1. Check internet connection
2. Verify Pexels image URLs are accessible
3. Wait a few seconds for images to load (they're from external CDN)
4. Some images may be blocked by corporate networks

---

### Database/Supabase Errors

**Problem:** "Failed to load activities" or empty screens

**Solution:**
1. Verify Supabase project is active at https://supabase.com/dashboard
2. Check Row Level Security policies are enabled
3. Ensure sample data was inserted correctly:
   ```bash
   # You can re-run the migration if needed
   ```
4. Check network connectivity to Supabase

---

### Performance Issues

**Problem:** App is slow or laggy

**Solution:**
1. This is common with Expo Go in development mode
2. For better performance, create a development build:
   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```
3. Production builds will be much faster
4. Reduce number of images loaded simultaneously

---

### TypeScript Errors

**Problem:** Type errors when building

**Solution:**
1. Run type check: `npm run typecheck`
2. Restart TypeScript server in your editor
3. Delete `.expo` cache folder
4. Reinstall dependencies

---

### Navigation Not Working

**Problem:** Tapping buttons/cards doesn't navigate

**Solution:**
1. Ensure you're using correct navigation syntax:
   ```tsx
   router.push('/path')  // Correct
   router.navigate('/path')  // Also works
   ```
2. Check that target screen exists
3. Look for errors in console

---

## Getting Help

If you encounter issues not covered here:

1. **Check the Console:** Look for error messages in the terminal running `npm run dev`
2. **Check Expo Go:** Shake device to open developer menu and view errors
3. **Review Docs:**
   - Expo Router: https://docs.expo.dev/router/introduction/
   - Supabase: https://supabase.com/docs
4. **Clear Everything:**
   ```bash
   npx expo start -c
   rm -rf node_modules .expo
   npm install
   npm run dev
   ```

## Diagnostic Commands

```bash
# Check TypeScript
npm run typecheck

# Clear cache and restart
npx expo start -c

# Check Node/npm versions
node --version
npm --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Environment Requirements

- Node.js 18+ recommended
- npm 9+
- Expo Go latest version
- iOS 13+ or Android 5+
- Active internet connection
- Valid Supabase credentials in .env
