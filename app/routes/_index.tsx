import {defer, type LoaderFunctionArgs} from '@netlify/remix-runtime';
import {Await, useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {ChevronDown} from 'lucide-react';
import {motion} from 'motion/react';
import titliest from '~/assets/titleist.svg';
import taylormade from '~/assets/taylormade.png';
import callaway from '~/assets/callaway.png';
import mizuno from '~/assets/mizuno.svg';
import hero from '~/assets/hero.png';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader(args: LoaderFunctionArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return defer({...deferredData, ...criticalData});
}

async function loadCriticalData({context}: LoaderFunctionArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
  ]);

  return {
    featuredCollection: collections.nodes[0],
  };
}

function loadDeferredData({context}: LoaderFunctionArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <FeaturedCollection collection={data.featuredCollection} />
      <BrandBanner />
      <RecommendedProducts products={data.recommendedProducts} />
    </div>
  );
}

const BrandBanner = () => {
  const brands = [
    {id: 1, name: 'Mizuno', src: mizuno},
    {id: 2, name: 'Titleist', src: titliest},
    {id: 3, name: 'TaylorMade', src: taylormade},
    {id: 4, name: 'Callaway', src: callaway},
  ];

  const duplicatedBrands = [...brands, ...brands];

  return (
    <div className="w-full bg-gray-100 py-10 overflow-hidden">
      <motion.div
        className="flex items-center gap-x-32"
        animate={{x: ['0%', '-50%']}}
        transition={{
          duration: 20,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        {duplicatedBrands.map((brand) => (
          <img
            key={brand.id}
            src={brand.src}
            alt={`${brand.name} logo`}
            className="h-11 w-auto flex-shrink-0 object-contain"
          />
        ))}
      </motion.div>
    </div>
  );
};

function FeaturedCollection({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <>
      {image && (
        <div className="relative h-[70vh] w-full">
          <img
            src={hero}
            alt={image.altText || ''}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
            <h2 className="text-6xl font-bold text-white mb-2">
              Summer is here
            </h2>
            <h2 className="text-2xl font-light text-white">SS 2024</h2>
          </div>

          <Link
            className="block relative"
            to={`/collections/${collection.handle}`}
          >
            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center text-white">
              <span className="mb-2 font-medium">View More</span>
              <ChevronDown className="animate-bounce" size={32} />
            </div>
          </Link>
        </div>
      )}
    </>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <div className="px-32 py-20">
      <h2 className="text-lg text-gray-500 font-medium">Discover</h2>
      <h2 className="text-5xl font-bold">Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              {response
                ? response.products.nodes.map((product) => (
                    <Link
                      key={product.id}
                      className="group"
                      to={`/products/${product.handle}`}
                    >
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={product.images.nodes[0].url}
                          alt={product.images.nodes[0].altText || ''}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <h4 className="mt-2 font-medium">{product.title}</h4>
                      <small className="text-gray-600">
                        <Money data={product.priceRange.minVariantPrice} />
                      </small>
                    </Link>
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
      <div className="mt-8" />
    </div>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
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
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;

export default Homepage;
