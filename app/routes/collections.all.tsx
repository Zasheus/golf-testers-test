import {defer, type LoaderFunctionArgs} from '@netlify/remix-runtime';
import {
  Link,
  type MetaFunction,
  useLoaderData,
  useSearchParams,
} from '@remix-run/react';
import {getPaginationVariables} from '@shopify/hydrogen';
import {AnimatePresence, motion} from 'framer-motion';
import {Filter, X} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import type {ProductItemFragment} from 'storefrontapi.generated';
import CollectionNav from '~/components/CollectionNav';
import FilterPanel, {
  CategoryOption,
  FilterState,
} from '~/components/FilterPanel';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import ProductItem from '~/components/ProductItem';
import {Button} from '~/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

type SortOption = 'bestMatch' | 'priceLowToHigh' | 'priceHighToLow';

export const meta: MetaFunction = () => {
  return [{title: 'Golf Clubs'}];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {pageBy: 12});

  const [{products}, {collections}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables},
    }),
    storefront.query(CATEGORIES_QUERY),
  ]);

  return defer({
    products,
    collections: collections.nodes,
  });
}

export default function AllProducts() {
  const {products, collections} = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('bestMatch');

  // Get current collection handle from URL
  const currentPath = window.location.pathname;
  const currentHandle = currentPath.split('/').pop();

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<FilterState>({
    hand: searchParams.getAll('hand'),
    category: searchParams.getAll('category'),
    brand: searchParams.getAll('brand'),
    condition: searchParams.getAll('condition'),
    level: searchParams.getAll('level'),
  });

  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const minPrice = searchParams.has('minPrice')
      ? Number(searchParams.get('minPrice'))
      : 0;
    const maxPrice = searchParams.has('maxPrice')
      ? Number(searchParams.get('maxPrice'))
      : 2000;
    return [minPrice, maxPrice];
  });

  const clubCategories: CategoryOption[] = [
    {value: 'drivers', label: 'Drivers'},
    {value: 'irons', label: 'Iron Sets'},
    {value: 'wedges', label: 'Wedges'},
    {value: 'putters', label: 'Putters'},
    {value: 'woods', label: 'Fairway Woods'},
    {value: 'hybrids', label: 'Hybrids'},
  ];

  const brands: CategoryOption[] = [
    {value: 'titleist', label: 'Titleist'},
    {value: 'taylormade', label: 'TaylorMade'},
    {value: 'callaway', label: 'Callaway'},
    {value: 'ping', label: 'PING'},
    {value: 'mizuno', label: 'Mizuno'},
    {value: 'cobra', label: 'Cobra'},
  ];

  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    let hasActiveFilters = false;

    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) {
        hasActiveFilters = true;
        values.forEach((value: any) => {
          newSearchParams.append(key, value);
        });
      }
    });

    if (priceRange[0] !== 0 || priceRange[1] !== 2000) {
      hasActiveFilters = true;
      newSearchParams.set('minPrice', priceRange[0].toString());
      newSearchParams.set('maxPrice', priceRange[1].toString());
    }

    if (hasActiveFilters) {
      setSearchParams(newSearchParams, {replace: true});
    } else {
      setSearchParams({}, {replace: true});
    }
  }, [filters, priceRange, setSearchParams]);

  const filteredProducts = useMemo(() => {
    let filtered = products.nodes;

    if (filters.category.length > 0) {
      filtered = filtered.filter((product: any) => {
        const productTags = product.tags || [];
        const productTitle = product.title.toLowerCase();
        return filters.category.some((category) => {
          const categoryName = category.toLowerCase();
          return (
            productTags.includes(categoryName) ||
            productTitle.includes(categoryName)
          );
        });
      });
    }

    if (filters.brand.length > 0) {
      filtered = filtered.filter((product: any) => {
        const productTitle = product.title.toLowerCase();
        return filters.brand.some((brand) =>
          productTitle.includes(brand.toLowerCase()),
        );
      });
    }

    filtered = filtered.filter((product: any) => {
      const price = parseFloat(product.priceRange.minVariantPrice.amount);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (filters.hand.length > 0) {
      filtered = filtered.filter((product: any) => {
        const productTitle = product.title.toLowerCase();
        return filters.hand.some((hand) =>
          productTitle.includes(hand.toLowerCase()),
        );
      });
    }

    if (filters.condition.length > 0) {
      filtered = filtered.filter((product: any) => {
        const productTags = product.tags || [];
        return filters.condition.some((condition) =>
          productTags.includes(condition.toLowerCase()),
        );
      });
    }

    if (filters.level.length > 0) {
      filtered = filtered.filter((product: any) => {
        const productTags = product.tags || [];
        return filters.level.some((level) =>
          productTags.includes(level.toLowerCase()),
        );
      });
    }

    return {
      ...products,
      nodes: filtered,
    };
  }, [products, filters, priceRange]);

  const sortedAndFilteredProducts = useMemo(() => {
    let sorted = [...filteredProducts.nodes];

    switch (sortBy) {
      case 'priceLowToHigh':
        sorted.sort(
          (a, b) =>
            parseFloat(a.priceRange.minVariantPrice.amount) -
            parseFloat(b.priceRange.minVariantPrice.amount),
        );
        break;
      case 'priceHighToLow':
        sorted.sort(
          (a, b) =>
            parseFloat(b.priceRange.minVariantPrice.amount) -
            parseFloat(a.priceRange.minVariantPrice.amount),
        );
        break;
      default:
        break;
    }

    return {
      ...filteredProducts,
      nodes: sorted,
    };
  }, [filteredProducts, sortBy]);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        {/* Page Title Section */}
        <div className="py-8 px-4">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            {currentHandle === 'all'
              ? 'Golf Clubs'
              : collections.find((c: any) => c.handle === currentHandle)
                  ?.title || 'Products'}
          </h1>
          <p className="text-neutral-600">
            {currentHandle === 'all'
              ? 'Browse our complete collection of premium second hand golf clubs'
              : `Explore our selection of ${
                  collections.find((c: any) => c.handle === currentHandle)
                    ?.title || 'products'
                }`}
          </p>
        </div>

        {/* Collections Navigation */}
        <CollectionNav
          collections={collections}
          currentHandle={currentHandle}
        />

        {/* Sticky Top Controls for both Mobile and Desktop */}
        <div className=" bg-white z-40 py-4 pb-0 px-3 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.innerWidth >= 1024) {
                    setShowDesktopFilters(!showDesktopFilters);
                  } else {
                    setShowMobileFilters(!showMobileFilters);
                  }
                }}
                className="flex items-center gap-2"
              >
                {showMobileFilters || showDesktopFilters ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
                Filters
              </Button>
              <p className="text-sm">{`${sortedAndFilteredProducts.nodes.length} Products`}</p>
            </div>

            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="bestMatch">Best Match</SelectItem>
                <SelectItem value="priceLowToHigh">
                  Price: Low to High
                </SelectItem>
                <SelectItem value="priceHighToLow">
                  Price: High to Low
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex pt-4">
          {/* Mobile Filters */}
          <AnimatePresence>
            {showMobileFilters && (
              <motion.div
                initial={{x: '-100%', opacity: 1}}
                animate={{x: 0, opacity: 1}}
                exit={{x: '-100%', opacity: 1}}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
                className="lg:hidden fixed inset-y-0 left-0 z-50 w-full bg-white shadow-xl"
              >
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                    <h1 className="text-lg font-bold text-neutral-900">
                      Filters
                    </h1>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMobileFilters(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <FilterPanel
                      filters={filters}
                      setFilters={setFilters}
                      priceRange={priceRange}
                      setPriceRange={setPriceRange}
                      clubCategories={clubCategories}
                      brands={brands}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Filters */}
          <AnimatePresence mode="wait">
            {showDesktopFilters && (
              <motion.div
                initial={{width: 0, opacity: 0}}
                animate={{width: 280, opacity: 1}}
                exit={{width: 0, opacity: 0}}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
                className="hidden lg:block"
              >
                <div className="w-[280px] mr-8">
                  <div className="bg-white rounded-lg border-neutral-200 h-full overflow-hidden">
                    <div className="p-4">
                      <FilterPanel
                        filters={filters}
                        setFilters={setFilters}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        clubCategories={clubCategories}
                        brands={brands}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <motion.main
            className="flex-1 min-h-0"
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          >
            {/* Product Grid */}
            <motion.div className="flex-1 p-4">
              {sortedAndFilteredProducts.nodes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No products match the selected filters
                </div>
              ) : (
                <PaginatedResourceSection
                  connection={sortedAndFilteredProducts}
                  resourcesClassName={`grid gap-3 ${
                    showDesktopFilters
                      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5'
                      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6'
                  }`}
                >
                  {({
                    node: product,
                    index,
                  }: {
                    node: ProductItemFragment;
                    index: number;
                  }) => (
                    <ProductItem
                      key={product.id}
                      product={product}
                      loading={index < 12 ? 'eager' : undefined}
                    />
                  )}
                </PaginatedResourceSection>
              )}
            </motion.div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    tags
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 1) {
      nodes {
        selectedOptions {
          name
          value
        }
      }
    }
  }
` as const;

const CATALOG_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...ProductItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        endCursor
        startCursor
      }
    }
  }
` as const;

const CATEGORIES_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query StoreCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 6, sortKey: UPDATED_AT, reverse: false) {
      nodes {
        ...Collection
      }
    }
  }
` as const;
