import {defer, redirect, type LoaderFunctionArgs} from '@netlify/remix-runtime';
import {useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {getPaginationVariables, Image, Money} from '@shopify/hydrogen';
import {useState, useMemo} from 'react';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import {Checkbox} from '~/components/ui/checkbox';
import {ChevronDown} from 'lucide-react';
import {Slider} from '~/components/ui/slider';
import {Separator} from '~/components/ui/separator';
import {motion} from 'framer-motion';

// Type definitions
interface FilterState {
  hand: string[];
  category: string[];
  brand: string[];
  condition: string[];
  level: string[];
}

interface CategoryOption {
  value: string;
  label: string;
}

interface FilterPanelProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  clubCategories: CategoryOption[];
  brands: CategoryOption[];
}

interface ProductItemProps {
  product: ProductItemFragment;
  loading?: 'eager' | 'lazy';
}

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Golf Clubs | ${data?.collection.title ?? ''}`}];
};

export async function loader(args: LoaderFunctionArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return defer({...deferredData, ...criticalData});
}

async function loadCriticalData({
  context,
  params,
  request,
}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {pageBy: 12});

  if (!handle) {
    throw redirect('/collections');
  }

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables},
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  return {collection};
}

function loadDeferredData({context}: LoaderFunctionArgs) {
  return {};
}

export default function Collection() {
  const {collection} = useLoaderData<typeof loader>();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [filters, setFilters] = useState<FilterState>({
    hand: [],
    category: [],
    brand: [],
    condition: [],
    level: [],
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

  // Filter products based on selected categories and other filters
  const filteredProducts = useMemo(() => {
    let filtered = collection.products.nodes;

    // Filter by category
    if (filters.category.length > 0) {
      filtered = filtered.filter((product) => {
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

    // Filter by brand
    if (filters.brand.length > 0) {
      filtered = filtered.filter((product) => {
        const productTitle = product.title.toLowerCase();
        return filters.brand.some((brand) =>
          productTitle.includes(brand.toLowerCase()),
        );
      });
    }

    // Filter by price range
    filtered = filtered.filter((product) => {
      const price = parseFloat(product.priceRange.minVariantPrice.amount);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Filter by hand preference if specified
    if (filters.hand.length > 0) {
      filtered = filtered.filter((product) => {
        const productTitle = product.title.toLowerCase();
        return filters.hand.some((hand) =>
          productTitle.includes(hand.toLowerCase()),
        );
      });
    }

    return {
      ...collection.products,
      nodes: filtered,
    };
  }, [collection.products, filters, priceRange]);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1800px] px-4 md:px-8 py-6">
        <div className="flex gap-8">
          {/* Filter Panel */}
          <aside className="hidden lg:block w-[200px] flex-shrink-0 sticky top-6 h-[calc(100vh-3rem)] bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="p-4">
              <div className="pb-3 mb-2 border-b border-neutral-200">
                <h1 className="text-lg font-bold text-neutral-900">
                  {collection.title}
                </h1>
              </div>
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                clubCategories={clubCategories}
                brands={brands}
              />
            </div>
          </aside>

          {/* Mobile Layout */}
          <div className="w-full lg:hidden">
            <div className="p-4 bg-white border-b border-gray-200">
              <h1 className="text-2xl font-bold mb-4">{collection.title}</h1>
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

          {/* Product Grid */}
          <main className="flex-1 p-3 lg:p-6">
            {filteredProducts.nodes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No products match the selected filters
              </div>
            ) : (
              <PaginatedResourceSection
                connection={filteredProducts}
                resourcesClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
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
          </main>
        </div>
      </div>
    </div>
  );
}

function FilterPanel({
  filters,
  setFilters,
  priceRange,
  setPriceRange,
  clubCategories,
  brands,
}: FilterPanelProps) {
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[key];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return {...prev, [key]: updated};
    });
  };

  return (
    <div className="space-y-1 text-sm">
      <div>
        <h3 className="font-semibold mb-3">Filters</h3>
        <Separator className="mb-4" />

        <div className="space-y-3">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 font-medium">
              Hand Preference
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="right-handed"
                  checked={filters.hand.includes('right')}
                  onCheckedChange={() => handleFilterChange('hand', 'right')}
                />
                <label htmlFor="right-handed">Right Handed</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="left-handed"
                  checked={filters.hand.includes('left')}
                  onCheckedChange={() => handleFilterChange('hand', 'left')}
                />
                <label htmlFor="left-handed">Left Handed</label>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 font-medium">
              Club Category
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {clubCategories.map((category) => (
                <div
                  key={category.value}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={category.value}
                    checked={filters.category.includes(category.value)}
                    onCheckedChange={() =>
                      handleFilterChange('category', category.value)
                    }
                  />
                  <label htmlFor={category.value}>{category.label}</label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 font-medium">
              Brand
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {brands.map((brand) => (
                <div key={brand.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={brand.value}
                    checked={filters.brand.includes(brand.value)}
                    onCheckedChange={() =>
                      handleFilterChange('brand', brand.value)
                    }
                  />
                  <label htmlFor={brand.value}>{brand.label}</label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 font-medium">
              Price Range
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="px-2">
                <Slider
                  defaultValue={[0, 2000]}
                  max={2000}
                  step={50}
                  value={priceRange}
                  onValueChange={(value) =>
                    setPriceRange(value as [number, number])
                  }
                  className="mt-2"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 font-medium">
              Condition
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {[
                {value: 'new', label: 'New'},
                {value: 'like-new', label: 'Like New'},
                {value: 'good', label: 'Good'},
                {value: 'fair', label: 'Fair'},
              ].map((condition) => (
                <div
                  key={condition.value}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={condition.value}
                    checked={filters.condition.includes(condition.value)}
                    onCheckedChange={() =>
                      handleFilterChange('condition', condition.value)
                    }
                  />
                  <label htmlFor={condition.value}>{condition.label}</label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 font-medium">
              Player Level
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {[
                {value: 'beginner', label: 'Beginner'},
                {value: 'intermediate', label: 'Intermediate'},
                {value: 'advanced', label: 'Advanced'},
                {value: 'pro', label: 'Professional'},
              ].map((level) => (
                <div key={level.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={level.value}
                    checked={filters.level.includes(level.value)}
                    onCheckedChange={() =>
                      handleFilterChange('level', level.value)
                    }
                  />
                  <label htmlFor={level.value}>{level.label}</label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

function ProductItem({product, loading}: ProductItemProps) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);

  return (
    <motion.div
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.3}}
    >
      <Link
        className="group block bg-white rounded-md shadow-sm hover:shadow transition-shadow duration-200"
        key={product.id}
        prefetch="intent"
        to={variantUrl}
      >
        {product.featuredImage && (
          <div className="aspect-square rounded-t-lg overflow-hidden">
            <Image
              alt={product.featuredImage.altText || product.title}
              aspectRatio="1/1"
              data={product.featuredImage}
              loading={loading}
              sizes="(min-width: 45em) 400px, 100vw"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-3">
          <h4 className="font-medium text-sm text-neutral-800 truncate">
            {product.title}
          </h4>
          <div className="mt-1">
            <Money
              className="text-sm font-semibold text-neutral-900"
              data={product.priceRange.minVariantPrice}
            />
          </div>
        </div>
      </Link>
    </motion.div>
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

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
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
  }
` as const;
