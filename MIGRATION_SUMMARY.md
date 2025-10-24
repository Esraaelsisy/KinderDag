# Database Migration Summary: Activities Split into Venues & Events

## ✅ Migration Complete

The database has been successfully migrated from a single `activities` table to separate `venues` and `events` tables with a shared `places` table.

## What Was Done

### 1. Database Schema Changes
- ✅ Created `places` table for shared location data (name, address, coordinates, contact info)
- ✅ Created `venues` table for ongoing locations with opening hours
- ✅ Created `events` table for time-based activities with start/end dates
- ✅ Updated `favorites` table to support both venues and events (dual foreign keys)
- ✅ Updated `scheduled_activities` table to support both
- ✅ Updated `reviews` table to support both
- ✅ Created `venue_category_links` and `event_category_links` tables
- ✅ Migrated all 10 existing activities (all were venues) to new structure
- ✅ Renamed old `activities` table to `activities_legacy` for safety
- ✅ Created compatibility `activities` VIEW that unions venues + events

### 2. Mobile App Updates
- ✅ Created `services/venues.ts` - Full CRUD for venues
- ✅ Created `services/events.ts` - Full CRUD for events
- ✅ Updated `services/favorites.ts` - Now supports both venues and events
- ✅ Updated `types/index.ts` - Added Venue, Event, VenueFilters, EventFilters types
- ✅ Updated `app/(tabs)/venues.tsx` - Uses new venues service
- ✅ Updated `app/(tabs)/events.tsx` - Uses new events service
- ✅ Updated `app/(tabs)/favorites.tsx` - Handles both venues and events
- ✅ Updated `components/ActivityCard.tsx` - Supports both venue and event favorites

### 3. Admin Panel Updates
- ✅ Created `admin-web/src/services/adminVenues.ts` - Admin CRUD for venues
- ✅ Created `admin-web/src/services/adminEvents.ts` - Admin CRUD for events
- ⚠️  Admin UI pages still use compatibility view (see MIGRATION_NOTES.md)

### 4. Data Migration Results
```
✅ 10 places created
✅ 10 venues created
✅ 0 events (none existed)
✅ 18 venue category links migrated
✅ 0 favorites (none existed)
```

## Key Benefits

### 1. **Data Safety**
- No data was lost during migration
- Original activities table preserved as `activities_legacy`
- All existing IDs maintained (venues kept their original activity IDs)

### 2. **Future-Proof**
- Events can exist without a registered venue (street festivals, outdoor concerts, etc.)
- Venues can have multiple events
- Clear separation of concerns

### 3. **Backward Compatibility**
- Compatibility VIEW ensures old code still works
- Admin panel continues functioning during gradual migration
- No breaking changes for existing queries

### 4. **Better Performance**
- Separate indexes for event dates and venue opening hours
- More efficient queries (no need to filter by type)
- Smaller table scans

## Data Structure

### Places (Shared Location Info)
```sql
- id, name, address, city, province
- location_lat, location_lng
- phone, email, website
```

### Venues (Ongoing Locations)
```sql
- id, place_id (FK)
- description_en, description_nl
- age range, pricing, features
- venue_opening_hours (JSON)
- seasonal info
```

### Events (Time-Based Activities)
```sql
- id, place_id (FK, nullable)
- event_start_datetime, event_end_datetime
- description_en, description_nl
- age range, pricing, features
- custom location fields (for non-venue events)
```

## Important Notes

### Favorites System
The favorites system now uses **dual foreign keys**:
- `venue_id` - References venues.id
- `event_id` - References events.id
- Constraint: Exactly one must be non-null

Mobile app uses:
- `favoritesService.toggleVenue(userId, venueId)`
- `favoritesService.toggleEvent(userId, eventId)`

### Admin Panel
The admin panel continues to work via the compatibility view. For full migration:
1. Read `admin-web/MIGRATION_NOTES.md`
2. Split Activities page into Venues and Events pages
3. Use the new `adminVenues` and `adminEvents` services

### Event-Specific Features
Events support:
- Custom locations (no place_id required)
- Start/end datetime
- No opening hours (events are one-time or fixed duration)
- No seasonal flags (events have explicit dates)

### Venue-Specific Features
Venues support:
- Opening hours by day of week
- Seasonal operation (season_start, season_end)
- Ongoing availability

## Testing

### Database Verification
```sql
-- Check migration success
SELECT 'places' as table, COUNT(*) FROM places
UNION ALL SELECT 'venues', COUNT(*) FROM venues
UNION ALL SELECT 'events', COUNT(*) FROM events;

-- Test compatibility view
SELECT id, name, legacy_type, city FROM activities LIMIT 5;

-- Test venue with place join
SELECT v.id, p.name, p.address, p.city
FROM venues v JOIN places p ON p.id = v.place_id LIMIT 3;
```

All queries return expected results ✅

### Mobile App
- Venues screen loads and displays correctly
- Events screen loads (empty, as expected)
- Favorites system works for both types
- No TypeScript errors in core functionality

## Next Steps

1. **Add Events** - Create some events through admin panel
2. **Test Event Features** - Verify event-specific UI (dates, times)
3. **Migrate Admin UI** - Split admin Activities page (optional, not urgent)
4. **Add Event-Specific Features**:
   - Recurring events
   - RSVP functionality
   - Event reminders
5. **Performance Monitoring** - Track query performance as data grows

## Rollback Plan

If needed, the original data is still available in `activities_legacy` table. To rollback:
1. Drop the compatibility view
2. Rename `activities_legacy` back to `activities`
3. Restore old mobile app code from git

However, rollback is **not recommended** as the new structure is superior.

---

Migration completed successfully on: 2025-10-24
