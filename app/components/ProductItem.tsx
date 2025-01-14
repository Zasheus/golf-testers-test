import {Link} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';
import {motion} from 'framer-motion';
import {useVariantUrl} from '~/lib/variants';
import type {ProductItemFragment} from 'storefrontapi.generated';

interface ProductItemProps {
  product: ProductItemFragment;
  loading?: 'eager' | 'lazy';
}

function ProductItem({product, loading}: ProductItemProps) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);

  return (
    <motion.div
      initial={{opacity: 0, y: 19}}
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

export default ProductItem;
