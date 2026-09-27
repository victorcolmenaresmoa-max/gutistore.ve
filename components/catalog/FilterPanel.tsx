'use client';

import { useEffect, useState } from 'react';
import type { CatalogFacets, CatalogFilters } from '@/lib/catalog';
import ColorSwatch from '@/components/product/ColorSwatch';

type Update = (patch: Partial<CatalogFilters>) => void;

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function FilterGroup({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="filter-group" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="filter-group-body">{children}</div>
    </details>
  );
}

function PriceFilter({ filters, facets, update }: { filters: CatalogFilters; facets: CatalogFacets; update: Update }) {
  const [min, setMin] = useState(filters.min === null ? '' : String(filters.min));
  const [max, setMax] = useState(filters.max === null ? '' : String(filters.max));

  useEffect(() => setMin(filters.min === null ? '' : String(filters.min)), [filters.min]);
  useEffect(() => setMax(filters.max === null ? '' : String(filters.max)), [filters.max]);

  const apply = () => {
    const parse = (value: string) => (value.trim() === '' || !Number.isFinite(Number(value)) ? null : Math.max(0, Number(value)));
    let nextMin = parse(min);
    let nextMax = parse(max);
    if (nextMin !== null && nextMax !== null && nextMin > nextMax) [nextMin, nextMax] = [nextMax, nextMin];
    update({ min: nextMin, max: nextMax });
  };

  return (
    <form
      className="price-filter"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <label>
        <span>Mín.</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={min}
          placeholder={String(facets.precio.min)}
          onChange={(event) => setMin(event.target.value)}
          onBlur={apply}
          aria-label="Precio mínimo en USD"
        />
      </label>
      <span className="price-filter-sep" aria-hidden="true">–</span>
      <label>
        <span>Máx.</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={max}
          placeholder={String(facets.precio.max)}
          onChange={(event) => setMax(event.target.value)}
          onBlur={apply}
          aria-label="Precio máximo en USD"
        />
      </label>
      <button type="submit" className="btn btn-sm btn-dark">
        Aplicar
      </button>
    </form>
  );
}

export default function FilterPanel({
  filters,
  facets,
  update,
}: {
  filters: CatalogFilters;
  facets: CatalogFacets;
  update: Update;
}) {
  return (
    <div className="filter-panel">
      {facets.categorias.length > 0 && (
        <FilterGroup title="Categoría">
          <ul className="filter-list">
            <li>
              <button
                type="button"
                className={`filter-link ${!filters.categoria ? 'active' : ''}`}
                onClick={() => update({ categoria: '', subcategoria: '' })}
              >
                Todas
              </button>
            </li>
            {facets.categorias.map((facet) => (
              <li key={facet.value}>
                <button
                  type="button"
                  className={`filter-link ${filters.categoria === facet.value ? 'active' : ''}`}
                  onClick={() => update({ categoria: facet.value, subcategoria: '' })}
                  aria-pressed={filters.categoria === facet.value}
                >
                  <span>{facet.value}</span>
                  <small>{facet.count}</small>
                </button>
              </li>
            ))}
          </ul>
        </FilterGroup>
      )}

      {facets.subcategorias.length > 0 && (
        <FilterGroup title="Subcategoría">
          <div className="filter-chips">
            {facets.subcategorias.map((facet) => (
              <button
                key={facet.value}
                type="button"
                className={`chip ${filters.subcategoria === facet.value ? 'active' : ''}`}
                onClick={() => update({ subcategoria: filters.subcategoria === facet.value ? '' : facet.value })}
                aria-pressed={filters.subcategoria === facet.value}
              >
                {facet.value} <small>{facet.count}</small>
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Disponibilidad y destacados">
        <div className="filter-checks">
          <label className="check">
            <input type="checkbox" checked={filters.disponible} onChange={(event) => update({ disponible: event.target.checked })} />
            <span>Solo disponibles</span>
          </label>
          {(facets.hayOfertas || filters.oferta) && (
            <label className="check">
              <input type="checkbox" checked={filters.oferta} onChange={(event) => update({ oferta: event.target.checked })} />
              <span>En oferta</span>
            </label>
          )}
          {(facets.hayNuevos || filters.nuevo) && (
            <label className="check">
              <input type="checkbox" checked={filters.nuevo} onChange={(event) => update({ nuevo: event.target.checked })} />
              <span>Nuevos</span>
            </label>
          )}
          {(facets.hayDestacados || filters.destacado) && (
            <label className="check">
              <input type="checkbox" checked={filters.destacado} onChange={(event) => update({ destacado: event.target.checked })} />
              <span>Destacados</span>
            </label>
          )}
        </div>
      </FilterGroup>

      {facets.precio.max > 0 && (
        <FilterGroup title="Precio (USD)">
          <PriceFilter filters={filters} facets={facets} update={update} />
        </FilterGroup>
      )}

      {facets.tallas.length > 0 && (
        <FilterGroup title="Talla">
          <div className="filter-chips">
            {facets.tallas.map((facet) => (
              <button
                key={facet.value}
                type="button"
                className={`chip chip-size ${filters.tallas.includes(facet.value) ? 'active' : ''}`}
                onClick={() => update({ tallas: toggle(filters.tallas, facet.value) })}
                aria-pressed={filters.tallas.includes(facet.value)}
              >
                {facet.value}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      {facets.colores.length > 0 && (
        <FilterGroup title="Color">
          <div className="filter-colors">
            {facets.colores.map((facet) => {
              const active = filters.colores.includes(facet.value);
              return (
                <button
                  key={facet.value}
                  type="button"
                  className={`filter-color ${active ? 'active' : ''}`}
                  onClick={() => update({ colores: toggle(filters.colores, facet.value) })}
                  aria-pressed={active}
                  title={facet.value}
                >
                  <ColorSwatch nombre={facet.value} hex={facet.hex} size="sm" />
                  <span>{facet.value}</span>
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {facets.marcas.length > 0 && (
        <FilterGroup title="Marca" defaultOpen={facets.marcas.length <= 8}>
          <div className="filter-checks">
            {facets.marcas.map((facet) => (
              <label className="check" key={facet.value}>
                <input
                  type="checkbox"
                  checked={filters.marcas.includes(facet.value)}
                  onChange={() => update({ marcas: toggle(filters.marcas, facet.value) })}
                />
                <span>{facet.value}</span>
                <small>{facet.count}</small>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}
    </div>
  );
}
