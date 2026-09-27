'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { Category, CategoryInput, OrderRecord, Product, ProductInput, Promotion, Seller } from '@/types';
import AdminCategoryManager from '@/components/admin/AdminCategoryManager';
import AdminOrderList from '@/components/admin/AdminOrderList';
import AdminProductForm from '@/components/admin/AdminProductForm';
import AdminProductList from '@/components/admin/AdminProductList';
import AdminPromotionForm from '@/components/admin/AdminPromotionForm';
import AdminPromotionList from '@/components/admin/AdminPromotionList';
import AdminRateControl from '@/components/admin/AdminRateControl';
import AdminSellerDashboard, { SellerSaveInput } from '@/components/admin/AdminSellerDashboard';
import ConfirmDialog, { ConfirmRequest } from '@/components/admin/ConfirmDialog';
import BrandLogo from '@/components/BrandLogo';
import Icon, { IconName } from '@/components/Icons';
import { Spinner } from '@/components/ui/States';
import { useToast } from '@/context/ToastContext';
import { useCurrency } from '@/context/CurrencyContext';
import {
  addCategory,
  addProduct,
  addPromotion,
  addSeller,
  adminLogin,
  adminLogout,
  checkAdminSession,
  deleteCategory,
  deleteProduct,
  deletePromotion,
  getCategories,
  getConfig,
  getOrders,
  getProducts,
  getPromotions,
  getSellers,
  updateCategory,
  updateConfig,
  updateOrderStatus,
  updateProduct,
  updatePromotion,
  updateSeller,
} from '@/lib/api';
import { formatUSD } from '@/lib/currency';
import { CANCELLED_STATUS } from '@/lib/orders';
import { totalStock } from '@/lib/product';
import { invalidateStoreCache } from '@/hooks/useStoreData';
import './admin.css';

type AdminTab = 'orders' | 'products' | 'categories' | 'promotions' | 'sellers' | 'settings';

const TABS: Array<{ id: AdminTab; label: string; icon: IconName; title: string }> = [
  { id: 'orders', label: 'Pedidos', icon: 'orders', title: 'Pedidos' },
  { id: 'products', label: 'Productos', icon: 'products', title: 'Catálogo de productos' },
  { id: 'categories', label: 'Categorías', icon: 'folder', title: 'Categorías y subcategorías' },
  { id: 'promotions', label: 'Promociones', icon: 'tag', title: 'Promociones y combos' },
  { id: 'sellers', label: 'Vendedores', icon: 'users', title: 'Ventas por vendedor' },
  { id: 'settings', label: 'Ajustes', icon: 'settings', title: 'Ajustes de la tienda' },
];

function copyForDuplicate(product: Product): Product {
  return {
    ...product,
    id: '',
    nombre: `${product.nombre} (copia)`,
    slug: '',
    sku: '',
    activo: false,
    variantes: product.variantes.map((variant) => ({
      ...variant,
      id: globalThis.crypto?.randomUUID?.() || `${variant.id}-copia`,
      sku: '',
    })),
  };
}

export default function AdminPage() {
  const { notify } = useToast();
  const { rate: publicRate } = useCurrency();

  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState('');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [rate, setRate] = useState(publicRate);
  const [loading, setLoading] = useState({ products: true, orders: true, promotions: true, sellers: true });

  const [productMode, setProductMode] = useState<'list' | 'form'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [savingPromotion, setSavingPromotion] = useState(false);
  const [deletingPromoId, setDeletingPromoId] = useState<string | null>(null);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);
  const [savingSellerId, setSavingSellerId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const fail = useCallback(
    (message: string | undefined, fallback: string) => notify({ title: 'Algo salió mal', description: message || fallback, tone: 'error' }),
    [notify]
  );

  const loadProducts = useCallback(async () => {
    setLoading((s) => ({ ...s, products: true }));
    const response = await getProducts('admin');
    if (response.ok && response.data) setProducts(response.data);
    else fail(response.message, 'No se pudieron cargar los productos.');
    setLoading((s) => ({ ...s, products: false }));
  }, [fail]);

  const loadCategories = useCallback(async () => {
    const response = await getCategories();
    if (response.ok && response.data) {
      setCategories(response.data);
      setCategoriesError('');
    } else {
      setCategoriesError(response.message || 'No se pudieron cargar las categorías.');
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading((s) => ({ ...s, orders: true }));
    const response = await getOrders();
    if (response.ok && response.data) setOrders(response.data);
    else fail(response.message, 'No se pudieron cargar los pedidos.');
    setLoading((s) => ({ ...s, orders: false }));
  }, [fail]);

  const loadPromotions = useCallback(async () => {
    setLoading((s) => ({ ...s, promotions: true }));
    const response = await getPromotions('admin');
    if (response.ok && response.data) setPromotions(response.data);
    else fail(response.message, 'No se pudieron cargar las promociones.');
    setLoading((s) => ({ ...s, promotions: false }));
  }, [fail]);

  const loadSellers = useCallback(async () => {
    setLoading((s) => ({ ...s, sellers: true }));
    const response = await getSellers();
    if (response.ok && response.data) setSellers(response.data);
    else fail(response.message, 'No se pudieron cargar los vendedores.');
    setLoading((s) => ({ ...s, sellers: false }));
  }, [fail]);

  const loadRate = useCallback(async () => {
    const response = await getConfig();
    if (response.ok && response.data) setRate(response.data.tasaBs);
  }, []);

  useEffect(() => {
    let active = true;
    checkAdminSession().then((response) => {
      if (!active) return;
      setAuthenticated(Boolean(response.ok && response.data?.authenticated));
      setCheckingSession(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    void loadProducts();
    void loadCategories();
    void loadOrders();
    void loadPromotions();
    void loadSellers();
    void loadRate();
  }, [authenticated, loadProducts, loadCategories, loadOrders, loadPromotions, loadSellers, loadRate]);

  const stats = useMemo(() => {
    const pending = orders.filter((order) => order.estado === 'Pendiente').length;
    const requestedValue = orders.filter((order) => order.estado !== CANCELLED_STATUS).reduce((sum, order) => sum + order.total, 0);
    const lowStock = products.filter((product) => product.activo && totalStock(product) <= 5).length;
    return { pending, requestedValue, lowStock, published: products.filter((p) => p.activo).length };
  }, [orders, products]);

  /* ---------- Sesión ---------- */

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const response = await adminLogin(passwordInput);
    if (response.ok && response.data?.authenticated) {
      setAuthenticated(true);
      setPasswordInput('');
    } else {
      setAuthError(response.message || 'No se pudo iniciar sesión.');
    }
    setAuthLoading(false);
  };

  /* ---------- Productos ---------- */

  const openProductForm = (product: Product | null) => {
    setEditingProduct(product);
    setProductMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProduct = async (data: ProductInput) => {
    setSavingProduct(true);
    const response = editingProduct?.id ? await updateProduct({ ...data, id: editingProduct.id }) : await addProduct(data);
    setSavingProduct(false);
    if (response.ok) {
      notify({ title: editingProduct?.id ? 'Producto actualizado' : 'Producto creado', description: data.nombre });
      invalidateStoreCache();
      setProductMode('list');
      setEditingProduct(null);
      await loadProducts();
      return true;
    }
    fail(response.message, 'No se pudo guardar el producto.');
    await loadProducts();
    return false;
  };

  const handleToggleActive = async (product: Product) => {
    setBusyProductId(product.id);
    const { id, createdAt: _createdAt, ...rest } = product;
    void _createdAt;
    const response = await updateProduct({ ...rest, id, activo: !product.activo });
    setBusyProductId(null);
    if (response.ok && response.data) {
      setProducts((current) => current.map((item) => (item.id === id ? (response.data as Product) : item)));
      notify({ title: response.data.activo ? 'Producto publicado' : 'Producto ocultado', description: product.nombre });
      invalidateStoreCache();
    } else fail(response.message, 'No se pudo cambiar el estado.');
  };

  const handleDeleteProduct = (product: Product) =>
    setConfirm({
      title: `¿Eliminar “${product.nombre}”?`,
      description: 'Se borrará de forma permanente. Si solo quieres ocultarlo, usa el botón de visibilidad. Los pedidos anteriores conservan su información.',
      confirmLabel: 'Eliminar producto',
      tone: 'danger',
      onConfirm: async () => {
        setBusyProductId(product.id);
        const response = await deleteProduct(product.id);
        setBusyProductId(null);
        if (response.ok) {
          notify({ title: 'Producto eliminado', description: product.nombre });
          invalidateStoreCache();
          await loadProducts();
        } else fail(response.message, 'No se pudo eliminar el producto.');
      },
    });

  /* ---------- Categorías ---------- */

  const handleSaveCategory = async (category: CategoryInput & { id?: string }) => {
    setSavingCategory(true);
    const response = category.id ? await updateCategory({ ...category, id: category.id }) : await addCategory(category);
    setSavingCategory(false);
    if (response.ok) {
      notify({ title: category.id ? 'Categoría actualizada' : 'Categoría creada', description: category.nombre });
      invalidateStoreCache();
      await Promise.all([loadCategories(), loadProducts()]);
      return true;
    }
    fail(response.message, 'No se pudo guardar la categoría.');
    return false;
  };

  const handleDeleteCategory = (category: Category) =>
    setConfirm({
      title: `¿Eliminar la categoría “${category.nombre}”?`,
      description: category.parentId
        ? 'Los productos conservarán su subcategoría escrita y seguirán visibles.'
        : 'También se eliminarán sus subcategorías registradas. Los productos no se borran y conservan su categoría escrita.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
      onConfirm: async () => {
        const response = await deleteCategory(category.id);
        if (response.ok) {
          notify({ title: 'Categoría eliminada', description: category.nombre });
          invalidateStoreCache();
          await loadCategories();
        } else fail(response.message, 'No se pudo eliminar la categoría.');
      },
    });

  /* ---------- Promociones ---------- */

  const handleSavePromotion = async (data: Omit<Promotion, 'id'>) => {
    setSavingPromotion(true);
    const response = editingPromotion ? await updatePromotion({ ...data, id: editingPromotion.id }) : await addPromotion(data);
    setSavingPromotion(false);
    if (response.ok) {
      notify({ title: editingPromotion ? 'Promoción actualizada' : 'Promoción creada', description: data.titulo });
      setEditingPromotion(null);
      invalidateStoreCache();
      await loadPromotions();
    } else fail(response.message, 'No se pudo guardar la promoción.');
  };

  const handleDeletePromotion = (id: string) => {
    const promotion = promotions.find((item) => item.id === id);
    setConfirm({
      title: `¿Eliminar “${promotion?.titulo || 'esta promoción'}”?`,
      description: 'Se borrará de forma permanente. Puedes desactivarla si solo quieres ocultarla.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
      onConfirm: async () => {
        setDeletingPromoId(id);
        const response = await deletePromotion(id);
        setDeletingPromoId(null);
        if (response.ok) {
          invalidateStoreCache();
          await loadPromotions();
        } else fail(response.message, 'No se pudo eliminar la promoción.');
      },
    });
  };

  /* ---------- Vendedores ---------- */

  const handleSaveSeller = async (seller: SellerSaveInput) => {
    setSavingSellerId(seller.id || 'new');
    const response = seller.id
      ? await updateSeller({ id: seller.id, nombre: seller.nombre, codigo: seller.codigo, activo: seller.activo, fechaCreacion: seller.fechaCreacion || '' })
      : await addSeller({ nombre: seller.nombre, codigo: seller.codigo, activo: seller.activo });
    setSavingSellerId(null);
    if (response.ok) {
      await loadSellers();
      return true;
    }
    fail(response.message, 'No se pudo guardar el vendedor.');
    return false;
  };

  const handleToggleSeller = async (seller: Seller) => {
    setSavingSellerId(seller.id);
    const response = await updateSeller({ ...seller, activo: !seller.activo });
    setSavingSellerId(null);
    if (response.ok && response.data) {
      setSellers((current) => current.map((item) => (item.id === seller.id ? (response.data as Seller) : item)));
    } else fail(response.message, 'No se pudo cambiar el estado del vendedor.');
  };

  /* ---------- Pedidos ---------- */

  const applyOrderStatus = async (id: string, status: string) => {
    setChangingStatusId(id);
    const previous = orders;
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, estado: status } : order)));
    const response = await updateOrderStatus(id, status);
    setChangingStatusId(null);
    if (response.ok && response.data) {
      setOrders((current) => current.map((order) => (order.id === id ? (response.data as OrderRecord) : order)));
      if (response.data.controlStock) {
        invalidateStoreCache();
        void loadProducts();
      }
    } else {
      setOrders(previous);
      fail(response.message, 'No se pudo actualizar el estado del pedido.');
    }
  };

  const handleOrderStatus = async (id: string, status: string) => {
    const order = orders.find((item) => item.id === id);
    if (status === CANCELLED_STATUS && order?.controlStock) {
      setConfirm({
        title: '¿Cancelar este pedido?',
        description: 'El stock de los productos del pedido se devolverá automáticamente al inventario.',
        confirmLabel: 'Sí, cancelar pedido',
        tone: 'danger',
        onConfirm: () => applyOrderStatus(id, status),
      });
      return;
    }
    await applyOrderStatus(id, status);
  };

  /* ---------- Ajustes ---------- */

  const handleSaveRate = async (value: number) => {
    const response = await updateConfig({ tasaBs: value });
    if (response.ok && response.data) {
      setRate(response.data.tasaBs);
      return true;
    }
    return false;
  };

  const refreshCurrent = () => {
    if (activeTab === 'orders') void loadOrders();
    else if (activeTab === 'sellers') {
      void loadSellers();
      void loadOrders();
    } else if (activeTab === 'promotions') void loadPromotions();
    else if (activeTab === 'categories') {
      void loadCategories();
      void loadProducts();
    } else if (activeTab === 'settings') void loadRate();
    else void loadProducts();
  };

  /* ================= Render ================= */

  if (checkingSession) {
    return (
      <main className="admin-login-page">
        <Spinner label="Comprobando sesión…" />
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-card" aria-labelledby="login-title">
          <BrandLogo variant="full" className="admin-login-logo" priority />
          <h1 id="login-title">Panel administrativo</h1>
          <p>Gestiona pedidos, catálogo, categorías, promociones y vendedores.</p>
          {authError && (
            <div className="notice notice-error" role="alert">
              <Icon name="alert" size={17} />
              <p>{authError}</p>
            </div>
          )}
          <form onSubmit={handleLogin} className="stack-form">
            <div className="field">
              <label htmlFor="admin-password">Contraseña</label>
              <div className="password-field">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                  autoComplete="current-password"
                  autoFocus
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={authLoading || !passwordInput}>
              {authLoading ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Verificando…
                </>
              ) : (
                <>
                  Entrar <Icon name="arrowRight" size={18} />
                </>
              )}
            </button>
          </form>
          <a href="/" className="admin-back-store">
            <Icon name="arrowLeft" size={15} /> Volver a la tienda
          </a>
        </section>
      </main>
    );
  }

  const currentTab = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const badgeFor = (tab: AdminTab) =>
    tab === 'orders' ? stats.pending : tab === 'products' ? products.length : tab === 'promotions' ? promotions.length : tab === 'sellers' ? sellers.length : tab === 'categories' ? categories.length : 0;

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Navegación del panel">
        <a href="/" className="admin-sidebar-brand" aria-label="Ir a la tienda">
          <BrandLogo variant="horizontal" />
        </a>
        <nav className="admin-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'active' : ''}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              onClick={() => {
                setActiveTab(tab.id);
                setSidebarOpen(false);
                if (tab.id === 'products') setProductMode('list');
              }}
            >
              <Icon name={tab.icon} size={19} />
              <span>{tab.label}</span>
              {badgeFor(tab.id) > 0 && <b className={tab.id === 'orders' ? 'hot' : ''}>{badgeFor(tab.id)}</b>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <a href="/" className="admin-sidebar-link" target="_blank" rel="noreferrer">
            <Icon name="store" size={18} /> Ver tienda
          </a>
          <button
            type="button"
            className="admin-sidebar-link"
            onClick={() => {
              void adminLogout();
              setAuthenticated(false);
            }}
          >
            <Icon name="logout" size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>
      {sidebarOpen && <button type="button" className="admin-sidebar-backdrop" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} />}

      <main className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="admin-icon-btn admin-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú del panel">
            <Icon name="menu" size={20} />
          </button>
          <div className="admin-topbar-title">
            <span className="eyebrow">GutiStore Admin</span>
            <h1>{currentTab.title}</h1>
          </div>
          <button type="button" className="btn btn-outline-dark btn-sm" onClick={refreshCurrent}>
            <Icon name="refresh" size={15} /> <span className="hide-sm">Actualizar</span>
          </button>
        </header>

        <div className="admin-content">
          {!(activeTab === 'products' && productMode === 'form') && (
            <section className="admin-stats" aria-label="Resumen">
              <article>
                <span className="admin-stat-icon">
                  <Icon name="orders" size={20} />
                </span>
                <div>
                  <small>Pedidos pendientes</small>
                  <strong>{stats.pending}</strong>
                </div>
              </article>
              <article>
                <span className="admin-stat-icon">
                  <Icon name="dollar" size={20} />
                </span>
                <div>
                  <small>Valor en pedidos</small>
                  <strong>{formatUSD(stats.requestedValue)}</strong>
                </div>
              </article>
              <article>
                <span className="admin-stat-icon">
                  <Icon name="package" size={20} />
                </span>
                <div>
                  <small>Productos publicados</small>
                  <strong>{stats.published}</strong>
                </div>
              </article>
              <article className={stats.lowStock > 0 ? 'is-alert' : ''}>
                <span className="admin-stat-icon">
                  <Icon name="alert" size={20} />
                </span>
                <div>
                  <small>Stock bajo (≤ 5)</small>
                  <strong>{stats.lowStock}</strong>
                </div>
              </article>
            </section>
          )}

          {activeTab === 'orders' &&
            (loading.orders ? (
              <Spinner label="Cargando pedidos…" />
            ) : (
              <AdminOrderList orders={orders} changingStatusId={changingStatusId} onStatusChange={handleOrderStatus} />
            ))}

          {activeTab === 'products' &&
            (productMode === 'form' ? (
              <AdminProductForm
                editingProduct={editingProduct}
                categories={categories}
                products={products}
                onSubmit={handleSaveProduct}
                onCancel={() => {
                  setProductMode('list');
                  setEditingProduct(null);
                }}
                saving={savingProduct}
              />
            ) : loading.products ? (
              <Spinner label="Cargando catálogo…" />
            ) : (
              <AdminProductList
                products={products}
                onCreate={() => openProductForm(null)}
                onEdit={(product) => openProductForm(product)}
                onDuplicate={(product) => openProductForm(copyForDuplicate(product))}
                onDelete={handleDeleteProduct}
                onToggleActive={handleToggleActive}
                busyId={busyProductId}
              />
            ))}

          {activeTab === 'categories' && (
            <AdminCategoryManager
              categories={categories}
              products={products}
              error={categoriesError}
              saving={savingCategory}
              onSave={handleSaveCategory}
              onDelete={handleDeleteCategory}
            />
          )}

          {activeTab === 'promotions' && (
            <div className="admin-split">
              <AdminPromotionForm
                editingPromotion={editingPromotion}
                onSubmit={handleSavePromotion}
                onCancelEdit={() => setEditingPromotion(null)}
                loading={savingPromotion}
              />
              {loading.promotions ? (
                <Spinner label="Cargando promociones…" />
              ) : (
                <AdminPromotionList
                  promotions={promotions}
                  onEdit={(promotion) => {
                    setEditingPromotion(promotion);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onDelete={handleDeletePromotion}
                  deletingId={deletingPromoId}
                />
              )}
            </div>
          )}

          {activeTab === 'sellers' &&
            (loading.sellers || loading.orders ? (
              <Spinner label="Cargando vendedores…" />
            ) : (
              <AdminSellerDashboard sellers={sellers} orders={orders} savingSellerId={savingSellerId} onSave={handleSaveSeller} onToggle={handleToggleSeller} />
            ))}

          {activeTab === 'settings' && (
            <div className="admin-settings">
              <AdminRateControl rate={rate} onSave={handleSaveRate} />
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
