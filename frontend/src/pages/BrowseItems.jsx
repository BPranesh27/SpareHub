import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { itemService } from '../services/item.service';
import { ItemCard } from '../components/items/ItemCard';
import { SearchBar } from '../components/items/SearchBar';
import { FilterPanel } from '../components/items/FilterPanel';
import { Pagination } from '../components/items/Pagination';
import { LoadingSkeleton } from '../components/items/LoadingSkeleton';
import { EmptyState } from '../components/items/EmptyState';
import { Sparkles } from 'lucide-react';

export const BrowseItems = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialLocation = searchParams.get('location') || '';
  const initialPage = parseInt(searchParams.get('page') || '0', 10);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [locationFilter, setLocationFilter] = useState(initialLocation);
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(9);

  const [itemsPage, setItemsPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await itemService.getAllItems({
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        location: locationFilter || undefined,
        page,
        size: pageSize,
        sortBy: 'id',
        sortDir: 'desc',
      });
      setItemsPage(data);
    } catch (err) {
      console.error('Error fetching marketplace items:', err);
      setError('Failed to load marketplace items. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, locationFilter, page, pageSize]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Sync URL Search Params
  useEffect(() => {
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory) params.category = selectedCategory;
    if (locationFilter) params.location = locationFilter;
    if (page > 0) params.page = page.toString();
    setSearchParams(params);
  }, [searchQuery, selectedCategory, locationFilter, page, setSearchParams]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setPage(0); // Reset pagination on search change
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setPage(0);
  };

  const handleLocationChange = (loc) => {
    setLocationFilter(loc);
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setLocationFilter('');
    setPage(0);
  };

  const hasActiveFilters = !!(searchQuery || selectedCategory || locationFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-950 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Peer-to-Peer Rental Catalog</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Marketplace Item Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">
            Discover high-value cameras, power tools, gaming consoles, and gear available near you
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar value={searchQuery} onChange={handleSearchChange} />

      {/* Filter Panel */}
      <FilterPanel
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        locationFilter={locationFilter}
        onChangeLocation={handleLocationChange}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Loading Skeleton */}
      {loading ? (
        <LoadingSkeleton count={pageSize} />
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs text-center">
          {error}
        </div>
      ) : itemsPage && itemsPage.content.length > 0 ? (
        /* Items Grid */
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {itemsPage.content.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={itemsPage.number}
            totalPages={itemsPage.totalPages}
            totalElements={itemsPage.totalElements}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          title="No Matching Listings Found"
          description="Try adjusting your keyword search, selecting another category, or clearing location filters."
          onReset={hasActiveFilters ? handleResetFilters : undefined}
        />
      )}

    </div>
  );
};
