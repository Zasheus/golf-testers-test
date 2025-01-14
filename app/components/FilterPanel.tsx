import {ChevronDown} from 'lucide-react';
import {Checkbox} from '~/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import {Slider} from '~/components/ui/slider';

export interface FilterState {
  hand: string[];
  category: string[];
  brand: string[];
  condition: string[];
  level: string[];
}

export interface CategoryOption {
  value: string;
  label: string;
}

export interface FilterPanelProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  clubCategories: CategoryOption[];
  brands: CategoryOption[];
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
        ? current.filter((item: any) => item !== value)
        : [...current, value];
      return {...prev, [key]: updated};
    });
  };

  return (
    <div className="space-y-1 text-sm">
      <div>
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

export default FilterPanel;
