# Admin Panel Migration Notes

## Current Status

The admin panel is still using the legacy `activities` table through the compatibility view. The mobile app has been fully migrated to use separate `venues` and `events` tables.

## What Still Needs to be Updated

### Pages to Update:
1. `src/pages/Activities.tsx` - Should be split into:
   - `VenuesPage.tsx` - For managing venues
   - `EventsPage.tsx` - For managing events

2. `src/pages/AddActivity.tsx` - Should be split into:
   - `AddVenue.tsx`
   - `AddEvent.tsx`

3. `src/pages/EditActivity.tsx` - Should be split into:
   - `EditVenue.tsx`
   - `EditEvent.tsx`

4. `src/pages/Categories.tsx` - Already works with the new system
5. `src/pages/Tags.tsx` - Needs minor updates for event/venue distinction

### Services Available:
- ✅ `adminVenues.ts` - Complete CRUD for venues
- ✅ `adminEvents.ts` - Complete CRUD for events
- ⚠️  `adminActivities.ts` - Legacy service, still works via compatibility view

## Migration Strategy

The legacy `activities` table has been renamed to `activities_legacy` and a VIEW named `activities` has been created that unions `venues` and `events`. This means:

1. **Current admin panel continues to work** - No data loss
2. **Mobile app uses new structure** - Better performance and clarity
3. **Admin panel can be migrated gradually** - No rush, no breaking changes

## When to Complete Migration

You should update the admin panel pages when:
- You need to add event-specific features (recurring events, RSVP, etc.)
- You need venue-specific features (opening hours management, etc.)
- You want better UX separation between venues and events
- Performance becomes an issue with the VIEW

## Compatibility View

The `activities` view automatically combines venues and events:
```sql
CREATE VIEW activities AS
  SELECT ... FROM venues ...
  UNION ALL
  SELECT ... FROM events ...
```

This view includes a `legacy_type` field ('venue' or 'event') to help with the migration.
