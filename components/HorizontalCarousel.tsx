import { FlatList, View, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.7;
const CARD_SPACING = 12;

interface HorizontalCarouselProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
}

export default function HorizontalCarousel<T>({
  data,
  renderItem,
  keyExtractor,
}: HorizontalCarouselProps<T>) {
  return (
    <FlatList
      data={data.slice(0, 6)}
      renderItem={({ item, index }) => (
        <View style={[styles.cardContainer, index === 0 && styles.firstCard]}>
          {renderItem(item, index)}
        </View>
      )}
      keyExtractor={keyExtractor}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_WIDTH + CARD_SPACING}
      decelerationRate="fast"
      contentContainerStyle={styles.contentContainer}
      removeClippedSubviews
      maxToRenderPerBatch={3}
      initialNumToRender={3}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingRight: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginLeft: CARD_SPACING,
  },
  firstCard: {
    marginLeft: 20,
  },
});
