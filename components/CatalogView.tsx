'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ProductCard from './ProductCard';
import Loader from './Loader';
import Icon from './Icons';
import { getCategories, getProducts } from '@/lib/api';
import type { Category, Product } from '@/types';

interface Props {
  initialCategorySlug?: string;
  initialQuery?: string;
}

export default function CatalogView({ initialCategorySlug = '', initialQuery = '' }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(initialQuery);
  const [categorySlug, setCategorySlug] = useState(initialCategorySlug);
  const [brand, setBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availability, setAvailability] = useState<'all' | 'stock'>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [attributeFilters, setAttributeFilters] = useState<Record<string, string>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [productResponse, categoryResponse] = await Promise.all([getProducts(), getCategories()]);
      if (!active) return;
      if (productResponse.ok && productResponse.data) setProducts(productResponse.data);
      else setError(productResponse.message || 'No pudimos cargar el catálogo.');
      if (categoryResponse.ok && categoryResponse.data) setCategories(categoryResponse.data);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const category = useMemo(() => categories.find((item) => item.slug === categorySlug), [categories, categorySlug]);

  const scopeProducts = useMemo(() => categorySlug ? products.filter((product) => product.categoriaSlug === categorySlug) : products, [products, categorySlug]);

  const brands = useMemo(() => Array.from(new Set(scopeProducts.map((product) => product.marca?.trim()).filter(Boolean) as string[])).sort(), [scopeProducts]);

  const dynamicAttributes = useMemo(() => {
    const map = new Map<string, Set<string>>();
    scopeProducts.forEach((product) => {
      (product.atributos || []).forEach((attr) => {
        if (!map.has(attr.name)) map.set(attr.name, new Set());
        map.get(attr.name)!.add(attr.value);
      });
      (product.variantes || []).forEach((variant) => Object.entries(variant.attributes).forEach(([name, value]) => {
        if (!map.has(name)) map.set(name, new Set());
        map.get(name)!.add(value);
      }));
    });
    return Array.from(map.entries())
      .map(([name, values]) => ({ name, values: Array.from(values).sort() }))
      .filter((item) => item.values.length >= 2 && item.values.length <= 20)
      .slice(0, 6);
  }, [scopeProducts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);
    return scopeProducts.filter((product) => {
      if (brand && product.marca !== brand) return false;
      if (availability === 'stock' && product.stock <= 0) return false;
      if (featuredOnly && !product.destacado) return false;
      if (min !== null && Number.isFinite(min) && product.precio < min) return false;
      if (max !== null && Number.isFinite(max) && product.precio > max) return false;

      if (term) {
        const haystack = [product.nombre, product.marca, product.categoria, product.descripcion, product.descripcionCorta, product.sku,
          ...(product.atributos || []).flatMap((attr) => [attr.name, attr.value]),
          ...(product.variantes || []).flatMap((variant) => [variant.sku, ...Object.values(variant.attributes)])]
          .filter(Boolean).join(' ').toLowerCase();
        const terms = term.split(/\s+/).filter(Boolean);
        if (!terms.every((word) => haystack.includes(word))) return false;
      }

      for (const [name, value] of Object.entries(attributeFilters)) {
        if (!value) continue;
        const productValues = new Set<string>();
        (product.atributos || []).filter((attr) => attr.name === name).forEach((attr) => productValues.add(attr.value));
        (product.variantes || []).forEach((variant) => { if (variant.attributes[name]) productValues.add(variant.attributes[name]); });
        if (!productValues.has(value)) return false;
      }
      return true;
    });
  }, [scopeProducts, search, brand, minPrice, maxPrice, availability, featuredOnly, attributeFilters]);

  const resetFilters = () => {
    setBrand(''); setMinPrice(''); setMaxPrice(''); setAvailability('all'); setFeaturedOnly(false); setAttributeFilters({});
  };

  const filterPanel = (
    <div className="catalog-filter-panel">
      <div className="filter-panel-heading"><strong>Filtros</strong><button onClick={resetFilters}>Limpiar</button></div>
      {!initialCategorySlug && (
        <div className="filter-group"><label>Categoría</label><select value={categorySlug} onChange={(event) => { setCategorySlug(event.target.value); setBrand(''); setAttributeFilters({}); }}><option value="">Todas</option>{categories.map((item) => <option value={item.slug} key={item.id}>{item.name}</option>)}</select></div>
      )}
      {brands.length > 0 && <div className="filter-group"><label>Marca</label><select value={brand} onChange={(event) => setBrand(event.target.value)}><option value="">Todas</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></div>}
      <div className="filter-group"><label>Precio</label><div className="price-filter"><input inputMode="decimal" placeholder="Mín." value={minPrice} onChange={(event) => setMinPrice(event.target.value)} /><input inputMode="decimal" placeholder="Máx." value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} /></div></div>
      {dynamicAttributes.map((attribute) => (
        <div className="filter-group" key={attribute.name}><label>{attribute.name}</label><select value={attributeFilters[attribute.name] || ''} onChange={(event) => setAttributeFilters((current) => ({ ...current, [attribute.name]: event.target.value }))}><option value="">Todos</option>{attribute.values.map((value) => <option key={value}>{value}</option>)}</select></div>
      ))}
      <label className="filter-check"><input type="checkbox" checked={availability === 'stock'} onChange={(event) => setAvailability(event.target.checked ? 'stock' : 'all')} /><span>Solo disponibles</span></label>
      <label className="filter-check"><input type="checkbox" checked={featuredOnly} onChange={(event) => setFeaturedOnly(event.target.checked)} /><span>Solo destacados</span></label>
      <button className="btn btn-primary btn-block mobile-apply-filter" onClick={() => setFiltersOpen(false)}>Ver {filtered.length} resultados</button>
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="catalog-page">
        <section className="catalog-hero">
          <div className="container">
            <span className="eyebrow">GutiStore</span>
            <h1>{category ? category.name : 'Todos los productos'}</h1>
            <p>{category?.description || 'Explora el catálogo completo y encuentra exactamente lo que necesitas.'}</p>
            <div className="catalog-search-large"><Icon name="search" size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por producto, marca, categoría, SKU o atributo" /></div>
          </div>
        </section>

        <section className="container catalog-layout">
          <aside className="catalog-sidebar">{filterPanel}</aside>
          <div className="catalog-results">
            <div className="catalog-result-toolbar">
              <div><strong>{filtered.length}</strong> resultado{filtered.length === 1 ? '' : 's'}</div>
              <button className="btn btn-outline mobile-filter-btn" onClick={() => setFiltersOpen(true)}><Icon name="layers" size={16} /> Filtros</button>
            </div>

            {loading ? <Loader label="Cargando productos..." /> : error ? (
              <div className="state-card error-state"><Icon name="close" size={28} /><h2>No pudimos cargar el catálogo</h2><p>{error}</p></div>
            ) : filtered.length ? (
              <div className="grid-products">{filtered.map((product) => <ProductCard product={product} key={product.id} />)}</div>
            ) : (
              <div className="state-card"><Icon name="search" size={30} /><h2>No encontramos resultados</h2><p>Prueba con otra búsqueda o limpia algunos filtros.</p><button className="btn btn-outline" onClick={() => { setSearch(''); resetFilters(); }}>Limpiar filtros</button></div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {filtersOpen && <div className="filter-drawer-overlay" onMouseDown={(event) => event.target === event.currentTarget && setFiltersOpen(false)}><aside className="filter-drawer"><header><strong>Filtrar productos</strong><button className="icon-btn" onClick={() => setFiltersOpen(false)}><Icon name="close" size={20} /></button></header>{filterPanel}</aside></div>}
    </>
  );
}
