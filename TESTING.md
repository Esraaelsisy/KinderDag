# KinderDag - Testing Guide

## Testing the App on Your Mobile Device

### Option 1: Using Expo Go (Recommended for Quick Testing)

1. **Install Expo Go** on your mobile device:
   - iOS: Download from the App Store
   - Android: Download from Google Play Store

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Scan the QR Code**:
   - iOS: Use your Camera app to scan the QR code displayed in the terminal
   - Android: Use the Expo Go app to scan the QR code

4. **Wait for the app to load** on your device (first load may take 30-60 seconds)

**Important Note:** If you see "This screen doesn't exist" error:
- This was a routing issue that has been fixed
- Close Expo Go completely and restart it
- Clear Metro cache: `npx expo start -c`
- Scan the QR code again

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more help.

### Option 2: Using a Development Build

For a more native experience with full functionality:

1. **Create a development build**:
   ```bash
   npx expo run:ios    # For iOS
   npx expo run:android # For Android
   ```

2. The app will be installed on your device/emulator

## Test Accounts

### Sample User Account
You can create your own account through the sign-up flow, or use:
- Email: test@kinderdag.nl
- Password: test123

## Testing Checklist

### Authentication & Onboarding
- [ ] Sign up with email
- [ ] Complete onboarding (language selection, add kids, enable location)
- [ ] Sign out and sign back in
- [ ] Test language switching between English and Dutch

### Home Screen
- [ ] View featured activities carousel
- [ ] See banner auto-rotation (every 3 seconds)
- [ ] Filter activities by category
- [ ] Scroll through different activity sections
- [ ] Pull to refresh content

### Discover Screen
- [ ] Search for activities by name or city
- [ ] Apply filters (Indoor/Outdoor, Free, Age range)
- [ ] Test distance filter (if location enabled)
- [ ] View filtered results

### Activity Details
- [ ] View activity information
- [ ] Add/remove from favorites
- [ ] Schedule an activity
- [ ] Open booking URL (if available)
- [ ] Call venue phone number

### Activities (Schedule) Screen
- [ ] View scheduled activities
- [ ] Delete a scheduled activity
- [ ] Navigate to activity details

### Favorites Screen
- [ ] View saved favorites
- [ ] Remove from favorites
- [ ] Navigate to activity details
- [ ] Sign out

## Sample Data

The app includes 10 sample activities in the Amsterdam area:
- NEMO Science Museum
- Efteling Theme Park
- Vondelpark Playground
- Kinderkookcafe
- Artis Royal Zoo
- TunFun Indoor Playground
- Beach at Zandvoort
- Micropia Microbe Museum
- De Ceuvel Playground
- Kids Workshop

## Features Implemented

### ✅ Phase 1 (MVP) - Completed
- Authentication (Email/Password)
- Onboarding flow with language selection, kids info, and location
- Home screen with carousels, categories, and banners
- Discover screen with search and filters
- Activity detail screen with favorites and scheduling
- Favorites management
- Scheduled activities calendar
- Multi-language support (English/Dutch)
- Location services integration
- Supabase database integration

### 🔄 Future Enhancements (Phase 2)
- Social login (Google, Apple, Facebook)
- Push notifications for reminders
- Weather API integration with 7-day forecast
- Map view for activities
- User reviews and ratings
- Activity recommendations based on AI
- Share activities with friends
- Offline mode

## Known Limitations

1. **Weather Integration**: Currently shows a placeholder. Weather API integration planned for Phase 2.
2. **Push Notifications**: Basic structure is ready but needs additional setup for production.
3. **Social Login**: Email/password only in current version.
4. **Maps**: Static location info only; interactive map view coming in Phase 2.

## Environment Variables

The app requires the following environment variables (already configured in .env):
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

## Troubleshooting

### App won't load
- Ensure your device is on the same network as your computer
- Check that the Metro bundler is running
- Try clearing the Expo cache: `npx expo start -c`

### Location not working
- Ensure location permissions are granted in device settings
- On iOS, location services must be enabled system-wide

### Database connection issues
- Verify .env file contains correct Supabase credentials
- Check Supabase project is active and accessible

## Support

For issues or questions about KinderDag, please check:
1. This testing guide
2. The main README.md
3. Expo documentation: https://docs.expo.dev

---

Happy Testing! 🎉
