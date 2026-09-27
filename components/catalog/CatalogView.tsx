'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/Icons';
import { ProductGrid } from '@/components/product/ProductCard';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useProducts } from '@/hooks/useStoreData';
import { useDialog } from '@/hooks/useDialog';
import {
  CatalogFilters,
  EMPTY_FILTERS,
  SORT_LABELS,
  SortOption,
  activeFilterCount,
  applyCatalog,
  computeFacets,
  filtersFromParams,
  filtersToQuery,
} from '@/lib/catalog';
import { formatUSD } from '@/lib/currency';
import FilterPanel from './FilterPanel';

const PAGE_SIZE = 24;

export default function CatalogView({
  title = 'Tienda',
  eyebrow = 'GutiStore',
  basePath = '/tienda',
  forced,
}: {
  title?: string;
  eyebrow?: string;
  basePath?: string;
  /** Filtros fijos de la página (por ejemplo, /ofertas siempre filtra ofertas). */
  forced?: Partial<CatalogFilters>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { data: products, loading, error, reload } = useProducts();

  const filters = useMemo(() => ({ ...filtersFromParams(new URLSearchParams(params.toString())), ...forced }), [params, forced]);
  const [search, setSearch] = useState(filters.q);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  useDialog(drawerOpen, drawerRef, () => setDrawerOpen(false));

  useEffect(() => setSearch(filters.q), [filters.q]);

  const update = useCallback(
    (patch: Partial<CatalogFilters>) => {
      const next = { ...filters, ...patch };
      if (forced) {
        (Object.keys(forced) as Array<keyof CatalogFilters>).forEach((key) => {
          (next as Record<string, unknown>)[key] = (EMPTY_FILTERS as unknown as Record<string, unknown>)[key];
        });
      }
      router.replace(`${pathname || basePath}${filtersToQuery(next)}`, { scroll: false });
      setVisible(PAGE_SIZE);
    },
    [filters, forced, router, pathname, basePath]
  );

  // Búsqueda con pequeña espera para no recalcular en cada tecla.
  useEffect(() => {
    if (search === filters.q) return;
    const timer = window.setTimeout(() => update({ q: search }), 300);
    return () => window.clearTimeout(timer);
  }, [search, filters.q, update]);

  const results = useMemo(() => applyCatalog(products, filters), [products, filters]);
  const facets = useMemo(() => computeFacets(products, filters), [products, filters]);
  const filterCount = activeFilterCount(filters) - (forced ? activeFilterCount({ ...EMPTY_FILTERS, ...forced }) : 0);

  const chips: Array<{ key: string; label: string; clear: Partial<CatalogFilters> }> = [];
  if (!forced?.categoria && filters.categoria) chips.push({ key: 'cat', label: filters.categoria, clear: { categoria: '', subcategoria: '' } });
  if (filters.subcategoria) chips.push({ key: 'sub', label: filters.subcategoria, clear: { subcategoria: '' } });
  filters.marcas.forEach((marca) => chips.push({ key: `m-${marca}`, label: marca, clear: { marcas: filters.marcas.filter((m) => m !== marca) } }));
  filters.tallas.forEach((talla) => chips.push({ key: `t-${talla}`, label: `Talla ${talla}`, clear: { tallas: filters.tallas.filter((t) => t !== talla) } }));
  filters.colores.forEach((color) => chips.push({ key: `c-${color}`, label: color, clear: { colores: filters.colores.filter((c) => c !== color) } }));
  if (filters.min !== null) chips.push({ key: 'min', label: `Desde ${formatUSD(filters.min)}`, clear: { min: null } });
  if (filters.max !== null) chips.push({ key: 'max', label: `Hasta ${formatUSD(filters.max)}`, clear: { max: null } });
  if (filters.disponible) chips.push({ key: 'stock', label: 'Disponibles', clear: { disponible: false } });
  if (!forced?.oferta && filters.oferta) chips.push({ key: 'oferta', label: 'En oferta', clear: { oferta: false } });
  if (filters.nuevo) chips.push({ key: 'nuevo', label: 'Nuevos', clear: { nuevo: false } });
  if (filters.destacado) chips.push({ key: 'dest', label: 'Destacados', clear: { destacado: false } });

  const clearAll = () => {
    setSearch('');
    update({ ...EMPTY_FILTERS, orden: filters.orden });
  };

  const heading = filters.q
    ? `Resultados para “${filters.q}”`
    : filters.subcategoria
      ? filters.subcategoria
      : filters.categoria && !forced?.categoria
        ? filters.categoria
        : title;

  return (
    <div className="catalog">
      <header className="catalog-hero">
        <div className="container">
          <nav className="breadcrumbs breadcrumbs-light" aria-label="Ruta de navegación">
            <ol>
              <li>
                <Link href="/">Inicio</Link>
              </li>
              <li aria-current={filters.categoria ? undefined : 'page'}>
                <Link href={basePath}>{title}</Link>
              </li>
              {filters.categoria && !forced?.categoria && <li aria-current="page">{filters.categoria}</li>}
            </ol>
          </nav>
          <span className="eyebrow eyebrow-light">{eyebrow}</span>
          <h1>{heading}</h1>

          <div className="catalog-search">
            <Icon name="search" size={19} />
            <label htmlFor="catalog-search" className="sr-only">
              Buscar en la tienda
            </label>
            <input
              id="catalog-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Busca por nombre, marca, categoría o etiqueta"
              enterKeyHint="search"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Borrar búsqueda">
                <Icon name="close" size={17} />
              </button>
            )}
          </div>

          {facets.categorias.length > 1 && !forced?.categoria && (
            <div className="category-pills" role="list" aria-label="Categorías">
              <button
                type="button"
                role="listitem"
                className={`pill ${!filters.categoria ? 'active' : ''}`}
                onClick={() => update({ categoria: '', subcategoria: '' })}
              >
                Todos
              </button>
              {facets.categorias.map((facet) => (
                <button
                  type="button"
                  role="listitem"
                  key={facet.value}
                  className={`pill ${filters.categoria === facet.value ? 'active' : ''}`}
                  onClick={() => update({ categoria: facet.value, subcategoria: '' })}
                >
                  {facet.value}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="container catalog-layout">
        <aside className="catalog-sidebar" aria-label="Filtros">
          <div className="catalog-sidebar-head">
            <h2>Filtros</h2>
            {(filterCount > 0 || filters.q) && (
              <button type="button" className="link-button" onClick={clearAll}>
                Limpiar todo
              </button>
            )}
          </div>
          <FilterPanel filters={filters} facets={facets} update={update} />
        </aside>

        <section className="catalog-results" aria-label="Productos">
          <div className="catalog-toolbar">
            <p className="results-count" aria-live="polite">
              {loading ? 'Cargando productos…' : `${results.length} producto${results.length === 1 ? '' : 's'}`}
            </p>
            <div className="catalog-toolbar-actions">
              <button type="button" className="btn btn-outline-dark btn-sm filters-toggle" onClick={() => setDrawerOpen(true)}>
                <Icon name="sliders" size={16} /> Filtros
                {filterCount > 0 && <span className="count-dot">{filterCount}</span>}
              </button>
              <label className="sort-select">
                <span className="sr-only">Ordenar por</span>
                <select value={filters.orden} onChange={(event) => update({ orden: event.target.value as SortOption })}>
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                    <option key={option} value={option}>
                      {SORT_LABELS[option]}
                    </option>
                  ))}
                </select>
                <Icon name="chevronDown" size={16} />
              </label>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="active-filters" aria-label="Filtros activos">
              {chips.map((chip) => (
                <button type="button" key={chip.key} className="active-chip" onClick={() => update(chip.clear)} aria-label={`Quitar filtro ${chip.label}`}>
                  {chip.label} <Icon name="close" size={14} />
                </button>
              ))}
              <button type="button" className="link-button" onClick={clearAll}>
                Limpiar todo
              </button>
            </div>
          )}

          {error && !products.length ? (
            <ErrorState message={error} onRetry={reload} />
          ) : loading ? (
            <ProductGrid products={[]} loading skeletons={8} />
          ) : products.length === 0 ? (
            <EmptyState icon="package" title="Aún no hay productos publicados" description="Vuelve pronto: estamos preparando el catálogo." />
          ) : results.length === 0 && forced && filterCount === 0 && !filters.q ? (
            <EmptyState
              icon="tag"
              title="Por ahora no hay productos con precio especial"
              description="Revisa los combos disponibles o explora toda la tienda."
              action={{ label: 'Ir a la tienda', href: '/tienda' }}
            />
          ) : results.length === 0 ? (
            <EmptyState
              icon="search"
              title={filters.q ? 'No encontramos coincidencias' : 'No hay productos con estos filtros'}
              description={filters.q ? 'Revisa la ortografía o prueba con otra palabra.' : 'Quita algún filtro para ver más resultados.'}
              action={{ label: 'Limpiar filtros', onClick: clearAll }}
            />
          ) : (
            <>
              <ProductGrid products={results.slice(0, visible)} />
              {results.length > visible && (
                <div className="load-more">
                  <p>
                    Mostrando {visible} de {results.length}
                  </p>
                  <button type="button" className="btn btn-outline-dark" onClick={() => setVisible((value) => value + PAGE_SIZE)}>
                    Ver más productos
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {drawerOpen && (
        <div className="drawer-root" role="presentation">
          <button type="button" className="drawer-backdrop" aria-label="Cerrar filtros" onClick={() => setDrawerOpen(false)} />
          <div className="drawer drawer-bottom filters-drawer" role="dialog" aria-modal="true" aria-labelledby="filters-title" ref={drawerRef} tabIndex={-1}>
            <div className="drawer-header">
              <h2 id="filters-title">Filtros</h2>
              <button type="button" className="nav-icon-btn" onClick={() => setDrawerOpen(false)} aria-label="Cerrar filtros">
                <Icon name="close" size={22} />
              </button>
            </div>
            <div className="drawer-body">
              <FilterPanel filters={filters} facets={facets} update={update} />
            </div>
            <div className="drawer-footer drawer-actions">
              <button type="button" className="btn btn-outline-dark" onClick={clearAll} disabled={filterCount === 0 && !filters.q}>
                Limpiar
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setDrawerOpen(false)}>
                Ver {results.length} resultado{results.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
