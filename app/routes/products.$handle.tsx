import {Suspense} from 'react';
import {defer, redirect, type LoaderFunctionArgs} from '@netlify/remix-runtime';
import {Await, useLoaderData, type MetaFunction} from '@remix-run/react';
import type {ProductFragment} from 'storefrontapi.generated';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
} from '@shopify/hydrogen';
import type {SelectedOption} from '@shopify/hydrogen/storefront-api-types';
import {getVariantUrl} from '~/lib/variants';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import {motion} from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {Separator} from '~/components/ui/separator';
import {Badge} from '~/components/ui/badge';
import {ScrollArea} from '~/components/ui/scroll-area';
import {ChevronRight, Package, Truck, Star} from 'lucide-react';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `${data?.product.title ?? ''} | Golf Store`}];
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

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option: SelectedOption) =>
        option.name === 'Title' && option.value === 'Default Title',
    ),
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else {
    if (!product.selectedVariant) {
      throw redirectToFirstVariant({product, request});
    }
  }

  return {
    product,
  };
}

function loadDeferredData({context, params}: LoaderFunctionArgs) {
  const variants = context.storefront
    .query(VARIANTS_QUERY, {
      variables: {handle: params.handle!},
    })
    .catch((error) => {
      console.error(error);
      return null;
    });

  return {
    variants,
  };
}

function redirectToFirstVariant({
  product,
  request,
}: {
  product: ProductFragment;
  request: Request;
}) {
  const url = new URL(request.url);
  const firstVariant = product.variants.nodes[0];

  return redirect(
    getVariantUrl({
      pathname: url.pathname,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search),
    }),
    {
      status: 302,
    },
  );
}

export default function Product() {
  const {product, variants} = useLoaderData<typeof loader>();
  const selectedVariant = useOptimisticVariant(
    product.selectedVariant,
    variants,
  );

  const {title, descriptionHtml, vendor} = product;
  const isAvailable = selectedVariant?.availableForSale;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.5}}
          className="grid grid-cols-1 gap-8 lg:grid-cols-2"
        >
          {/* Product Image Section */}
          <motion.div
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.5, delay: 0.2}}
            className="lg:sticky lg:top-4 lg:h-fit"
          >
            <Card className="overflow-hidden border-none shadow-xl">
              <ProductImage
                image={selectedVariant?.image}
                className="aspect-square w-full object-cover transition-all duration-300 hover:scale-105"
              />
            </Card>

            {/* Quick Product Features */}
            <motion.div
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.5, delay: 0.4}}
              className="mt-4 grid grid-cols-2 gap-4"
            >
              <Card className="bg-white/50 backdrop-blur">
                <CardContent className="flex items-center space-x-3 p-4">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Club Rating</p>
                    <p className="text-sm text-neutral-500">
                      4.8/5 (120 reviews)
                    </p>
                  </div>
                </CardContent>
              </Card>
              {selectedVariant?.sku && (
                <Card className="bg-white/50 backdrop-blur">
                  <CardContent className="p-4">
                    <p className="font-medium">SKU</p>
                    <p className="text-sm text-neutral-500">
                      {selectedVariant.sku}
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </motion.div>

          {/* Product Details Section */}
          <motion.div
            initial={{opacity: 0, x: 20}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.5, delay: 0.2}}
            className="flex flex-col space-y-6"
          >
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-1 text-sm text-neutral-500">
              <span>Golf Store</span>
              <ChevronRight className="h-4 w-4" />
              <span>Products</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-neutral-900">{title}</span>
            </nav>

            {/* Title and Vendor */}
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
                {title}
              </h1>
              {vendor && (
                <p className="mt-2 text-lg text-neutral-600">by {vendor}</p>
              )}
            </div>

            {/* Price and Stock Status */}
            <div className="flex items-center space-x-4">
              <ProductPrice
                price={selectedVariant?.price}
                compareAtPrice={selectedVariant?.compareAtPrice}
                className="text-3xl font-bold text-neutral-900"
              />
              {isAvailable ? (
                <Badge variant="default" className="bg-green-500">
                  In Stock
                </Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            {/* Product Form */}
            <Card className="border-neutral-200 bg-white">
              <CardContent className="p-6">
                <Suspense
                  fallback={
                    <ProductForm
                      product={product}
                      selectedVariant={selectedVariant}
                      variants={[]}
                    />
                  }
                >
                  <Await
                    errorElement="There was a problem loading product variants"
                    resolve={variants}
                  >
                    {(data) => (
                      <ProductForm
                        product={product}
                        selectedVariant={selectedVariant}
                        variants={data?.product?.variants.nodes || []}
                      />
                    )}
                  </Await>
                </Suspense>
              </CardContent>
            </Card>

            {/* Shipping Info */}
            <Card className="border-neutral-200 bg-white/50 backdrop-blur">
              <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <Truck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Free Shipping</p>
                    <p className="text-sm text-neutral-500">
                      On orders over $99
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Easy Returns</p>
                    <p className="text-sm text-neutral-500">30-day returns</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Description */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem
                value="description"
                className="border-neutral-200 bg-white"
              >
                <AccordionTrigger className="px-6 text-lg font-semibold hover:no-underline">
                  Product Description
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-[300px] w-full rounded-md">
                    <div
                      className="prose prose-neutral max-w-none px-6 pb-6"
                      dangerouslySetInnerHTML={{__html: descriptionHtml}}
                    />
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="specifications"
                className="border-neutral-200 bg-white"
              >
                <AccordionTrigger className="px-6 text-lg font-semibold hover:no-underline">
                  Specifications
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-6 pb-6">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {selectedVariant?.selectedOptions.map((option) => (
                        <div key={option.name}>
                          <dt className="font-medium text-neutral-900">
                            {option.name}
                          </dt>
                          <dd className="text-neutral-500">{option.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </motion.div>
      </div>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    options {
      name
      values
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    variants(first: 1) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const PRODUCT_VARIANTS_FRAGMENT = `#graphql
  fragment ProductVariants on Product {
    variants(first: 250) {
      nodes {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const VARIANTS_QUERY = `#graphql
  ${PRODUCT_VARIANTS_FRAGMENT}
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductVariants
    }
  }
` as const;
