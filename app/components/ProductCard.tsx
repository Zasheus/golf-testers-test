import {Link} from '@remix-run/react';
import {Money} from '@shopify/hydrogen';

const ProductCard = ({product}: any) => {
  return (
    <Link key={product.id} className="w-36" to={`/products/${product.handle}`}>
      <div className="overflow-hidden w-36 h-60 bg-blue-400 rounded-lg">
        <img
          src={product.images.nodes[0].url}
          alt={product.images.nodes[0].altText || ''}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <h4 className="mt-2 font-medium text-sm md:text-base truncate">
        {product.title}
      </h4>
      <small className="text-gray-600 block truncate">
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
  );
};

export default ProductCard;
