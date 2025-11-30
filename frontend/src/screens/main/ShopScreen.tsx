import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function ShopScreen() {
  const { colors } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartCount, setCartCount] = useState(3);

  // 商品分类
  const categories = [
    { id: 'all', label: '全部', icon: 'grid-outline' },
    { id: 'supplements', label: '营养补剂', icon: 'medkit-outline' },
    { id: 'equipment', label: '运动器材', icon: 'fitness-outline' },
    { id: 'food', label: '健康食品', icon: 'restaurant-outline' },
    { id: 'clothing', label: '运动服饰', icon: 'shirt-outline' },
  ];

  // 轮播图数据
  const banners = [
    {
      id: 1,
      title: '夏季减脂特惠',
      subtitle: '全场营养品8折起',
      color: '#4ABAB8',
      discount: '限时8折',
    },
    {
      id: 2,
      title: '健身装备季',
      subtitle: '新用户专享优惠',
      color: '#FFD88C',
      discount: '立减100元',
    },
  ];

  // 商品数据
  const products = [
    {
      id: 1,
      name: '高蛋白乳清粉',
      brand: 'Optimum Nutrition',
      category: 'supplements',
      price: 299,
      originalPrice: 399,
      rating: 4.8,
      sales: 2341,
      image: 'protein',
      discount: 25,
      tags: ['热销', '补剂'],
      description: '优质乳清蛋白，快速吸收',
    },
    {
      id: 2,
      name: '专业瑜伽垫',
      brand: 'Lululemon',
      category: 'equipment',
      price: 599,
      originalPrice: 799,
      rating: 4.9,
      sales: 1567,
      image: 'yoga-mat',
      discount: 25,
      tags: ['瑜伽', '防滑'],
      description: '天然橡胶材质，超强防滑',
    },
    {
      id: 3,
      name: '复合维生素',
      brand: 'Swisse',
      category: 'supplements',
      price: 159,
      originalPrice: 199,
      rating: 4.7,
      sales: 3456,
      image: 'vitamins',
      discount: 20,
      tags: ['维生素', '保健'],
      description: '全面营养，增强免疫力',
    },
    {
      id: 4,
      name: '智能手环',
      brand: 'Xiaomi',
      category: 'equipment',
      price: 199,
      originalPrice: 299,
      rating: 4.6,
      sales: 8921,
      image: 'smartband',
      discount: 33,
      tags: ['智能', '运动'],
      description: '24小时心率监测，睡眠分析',
    },
    {
      id: 5,
      name: '有机燕麦片',
      brand: 'Quaker',
      category: 'food',
      price: 39,
      originalPrice: 59,
      rating: 4.5,
      sales: 5678,
      image: 'oatmeal',
      discount: 34,
      tags: ['早餐', '有机'],
      description: '高纤维低热量，营养早餐首选',
    },
    {
      id: 6,
      name: '速干运动T恤',
      brand: 'Nike',
      category: 'clothing',
      price: 129,
      originalPrice: 199,
      rating: 4.7,
      sales: 2134,
      image: 'sports-shirt',
      discount: 35,
      tags: ['速干', '透气'],
      description: 'Dri-FIT面料，快速排汗',
    },
  ];

  // 筛选后的商品
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => product.category === selectedCategory);

  const renderProduct = ({ item }: { item: typeof products[0] }) => (
    <TouchableOpacity style={styles.productCard}>
      {/* 商品图片占位 */}
      <View style={styles.productImage}>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{item.discount}%</Text>
        </View>
        <Ionicons name="cube-outline" size={40} color="#D1D5DB" />
        <Text style={styles.imagePlaceholderText}>{item.name}</Text>
      </View>

      <View style={styles.productContent}>
        {/* 商品标签 */}
        <View style={styles.productTags}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.productTag}>
              <Text style={styles.productTagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productBrand}>{item.brand}</Text>
        <Text style={styles.productDescription}>{item.description}</Text>

        {/* 评分和销量 */}
        <View style={styles.productStats}>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color="#FFB800" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <Text style={styles.salesText}>已售 {item.sales}</Text>
        </View>

        {/* 价格区域 */}
        <View style={styles.priceSection}>
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>¥{item.price}</Text>
            <Text style={styles.originalPrice}>¥{item.originalPrice}</Text>
          </View>

          <TouchableOpacity style={styles.addToCartButton}>
            <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* 搜索栏 */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>搜索健康商品...</Text>
          </View>

          <TouchableOpacity style={styles.cartButton}>
            <Ionicons name="cart-outline" size={20} color="#4ABAB8" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 商品分类 */}
        <View style={styles.categoriesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.activeCategory
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Ionicons
                    name={category.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={selectedCategory === category.id ? '#FFFFFF' : '#6B7280'}
                  />
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.activeCategoryText
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 轮播横幅 */}
        <View style={styles.bannerSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.bannersContainer}>
              {banners.map((banner) => (
                <TouchableOpacity key={banner.id} style={[styles.banner, { backgroundColor: banner.color + '20' }]}>
                  <View style={styles.bannerContent}>
                    <View style={styles.bannerDiscount}>
                      <Text style={[styles.bannerDiscountText, { color: banner.color }]}>
                        {banner.discount}
                      </Text>
                    </View>
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                    <View style={styles.bannerAction}>
                      <Text style={[styles.bannerActionText, { color: banner.color }]}>
                        立即抢购 →
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 限时秒杀 */}
        <View style={styles.flashSaleSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.flashSaleHeader}>
              <Ionicons name="flash-outline" size={20} color="#EF4444" />
              <Text style={styles.sectionTitle}>限时秒杀</Text>
              <Text style={styles.countdown}>02:15:36</Text>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreButtonText}>更多</Text>
              <Ionicons name="chevron-forward" size={14} color="#4ABAB8" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.flashSaleProducts}>
              {products.slice(0, 4).map((product) => (
                <TouchableOpacity key={product.id} style={styles.flashSaleCard}>
                  <View style={styles.flashSaleImage}>
                    <Text style={styles.flashSaleDiscount}>-{product.discount}%</Text>
                    <Ionicons name="cube-outline" size={30} color="#D1D5DB" />
                  </View>
                  <Text style={styles.flashSaleName} numberOfLines={1}>{product.name}</Text>
                  <View style={styles.flashSalePrice}>
                    <Text style={styles.flashSaleCurrentPrice}>¥{product.price}</Text>
                    <Text style={styles.flashSaleOriginalPrice}>¥{product.originalPrice}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 商品列表 */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? '全部商品' : categories.find(c => c.id === selectedCategory)?.label}
            </Text>
            <TouchableOpacity style={styles.sortButton}>
              <Ionicons name="funnel-outline" size={16} color="#6B7280" />
              <Text style={styles.sortButtonText}>筛选</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.productsRow}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoriesSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  activeCategory: {
    backgroundColor: '#4ABAB8',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  bannerSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  bannersContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  banner: {
    borderRadius: 16,
    padding: 20,
    minWidth: width - 48,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  bannerContent: {
    gap: 8,
  },
  bannerDiscount: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  bannerDiscountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  bannerAction: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  bannerActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  flashSaleSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  flashSaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  countdown: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  moreButtonText: {
    fontSize: 12,
    color: '#4ABAB8',
    fontWeight: '500',
  },
  flashSaleProducts: {
    flexDirection: 'row',
    gap: 12,
  },
  flashSaleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: 100,
  },
  flashSaleImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  flashSaleDiscount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  flashSaleName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  flashSalePrice: {
    alignItems: 'center',
    gap: 2,
  },
  flashSaleCurrentPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  flashSaleOriginalPrice: {
    fontSize: 10,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  productsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  productsRow: {
    gap: 12,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    height: 140,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  imagePlaceholderText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  productContent: {
    padding: 12,
    gap: 8,
  },
  productTags: {
    flexDirection: 'row',
    gap: 4,
  },
  productTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productTagText: {
    fontSize: 10,
    color: '#6B7280',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  productBrand: {
    fontSize: 12,
    color: '#6B7280',
  },
  productDescription: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 14,
  },
  productStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  salesText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  addToCartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4ABAB8',
    justifyContent: 'center',
    alignItems: 'center',
  },
});