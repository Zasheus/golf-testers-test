import {ChevronDown} from 'lucide-react';
import {Checkbox} from '~/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import {Input} from '~/components/ui/input';
import {Label} from '~/components/ui/label';
import * as Slider from '@radix-ui/react-slider';

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
  hideClubCategories?: boolean;
}

function FilterPanel({
  filters,
  setFilters,
  priceRange,
  setPriceRange,
  clubCategories,
  brands,
  hideClubCategories = false,
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

  const handlePriceInputChange = (index: number, value: string) => {
    const newValue = Number(value);
    if (isNaN(newValue)) return;

    const newRange = [...priceRange] as [number, number];
    newRange[index] = Math.min(Math.max(newValue, 0), 2000);

    // Ensure min doesn't exceed max and vice versa
    if (index === 0 && newRange[0] > newRange[1]) {
      newRange[0] = newRange[1];
    } else if (index === 1 && newRange[1] < newRange[0]) {
      newRange[1] = newRange[0];
    }

    setPriceRange(newRange);
  };

  return (
    <div className="space-y-1 text-sm pb-8">
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

          {!hideClubCategories && (
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
          )}

          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 font-medium">
              Price Range
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="px-2 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="grid gap-2 flex-1">
                    <Label htmlFor="minPrice">Min ($)</Label>
                    <Input
                      id="minPrice"
                      type="number"
                      min={0}
                      max={priceRange[1]}
                      value={priceRange[0]}
                      onChange={(e) =>
                        handlePriceInputChange(0, e.target.value)
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="grid gap-2 flex-1">
                    <Label htmlFor="maxPrice">Max ($)</Label>
                    <Input
                      id="maxPrice"
                      type="number"
                      min={priceRange[0]}
                      max={2000}
                      value={priceRange[1]}
                      onChange={(e) =>
                        handlePriceInputChange(1, e.target.value)
                      }
                      className="h-8"
                    />
                  </div>
                </div>

                {/* Slider wrapper with enhanced scroll prevention */}
                <div className="py-4">
                  <div
                    className="touch-none select-none"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Slider.Root
                      className="relative flex items-center select-none touch-none w-full h-5"
                      value={priceRange}
                      min={0}
                      max={2000}
                      step={50}
                      onValueChange={(value) => {
                        setPriceRange(value as [number, number]);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Slider.Track className="bg-neutral-200 relative grow rounded-full h-2">
                        <Slider.Range className="absolute bg-neutral-900 rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb
                        className="block w-4 h-4 bg-white border-2 border-neutral-900 rounded-full hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors cursor-grab active:cursor-grabbing"
                        aria-label="Min price"
                      />
                      <Slider.Thumb
                        className="block w-4 h-4 bg-white border-2 border-neutral-900 rounded-full hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors cursor-grab active:cursor-grabbing"
                        aria-label="Max price"
                      />
                    </Slider.Root>
                  </div>
                </div>
              </div>
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

          <Collapsible defaultOpen>
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

          <Collapsible defaultOpen>
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
