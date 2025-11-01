import { View, Text, StyleSheet } from 'react-native';
import type { Collection } from '@/types';

interface CollectionTagsProps {
  collections: Collection[];
}

export default function CollectionTags({ collections }: CollectionTagsProps) {
  if (!collections || collections.length === 0) return null;

  return (
    <View style={styles.collectionsContainer}>
      {collections.map((collection) => (
        <View
          key={collection.id}
          style={[styles.collectionTag, { backgroundColor: collection.color + '20' }]}
        >
          <Text style={[styles.collectionTagText, { color: collection.color }]}>
            {collection.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  collectionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  collectionTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  collectionTagText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
