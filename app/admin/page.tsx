'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminProductForm from '@/components/AdminProductForm';
import AdminProductList from '@/components/AdminProductList';
import AdminPromotionForm from '@/components/AdminPromotionForm';
import AdminPromotionList from '@/components/AdminPromotionList';
import AdminOrderList from '@/components/AdminOrderList';
import AdminSellerDashboard, { SellerSaveInput } from '@/components/AdminSellerDashboard';
import BrandLogo from '@/components/BrandLogo';
import Loader from '@/components/Loader';
import Icon from '@/components/Icons';
import {
  addProduct,
  adminLogin,
  adminLogout,
  checkAdminSession,
  addPromotion,
  addSeller,
  deleteProduct,
  deletePromotion,
  getOrders,
  getProducts,
  getPromotions,
  getSellers,
  updateOrderStatus,
  updateProduct,
  updatePromotion,
  updateSeller,
} from '@/lib/api';
import { OrderRecord, Product, Promotion, Seller } from '@/types';

type AdminTab = 'orders' | 'products' | 'promotions' | 'sellers';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingPromoForm, setLoadingPromoForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingPromoId, setDeletingPromoId] = useState<string | null>(null);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);
  const [savingSellerId, setSavingSellerId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      const response = await checkAdminSession();
      if (!active) return;
      setAuthenticated(Boolean(response.ok && response.data?.authenticated));
      setCheckingSession(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authenticated) {
      void loadProducts();
      void loadOrders();
      void loadPromotions();
      void loadSellers();
    }
  }, [authenticated]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    const response = await getProducts();
    if (response.ok && response.data) {
      setProducts(response.data);
    } else {
      setGlobalError(response.message || 'No se pudieron cargar los productos.');
    }
    setLoadingProducts(false);
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    const response = await getOrders();
    if (response.ok && response.data) {
      setOrders(response.data);
    } else {
      setGlobalError(response.message || 'No se pudieron cargar los pedidos.');
    }
    setLoadingOrders(false);
  };

  const loadPromotions = async () => {
    setLoadingPromotions(true);
    const response = await getPromotions();
    if (response.ok && response.data) {
      setPromotions(response.data);
    } else if (response.message) {
      setGlobalError(response.message);
    }
    setLoadingPromotions(false);
  };

  const loadSellers = async () => {
    setLoadingSellers(true);
    const response = await getSellers();
    if (response.ok && response.data) {
      setSellers(response.data);
    } else if (response.message) {
      setGlobalError(response.message);
    }
    setLoadingSellers(false);
  };

  const handleLogin = async (event: React.FormEvent) => {
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

  const handleAddOrUpdate = async (data: Omit<Product, 'id'>) => {
    setLoadingForm(true);
    setGlobalError('');

    const response = editingProduct
      ? await updateProduct({ ...data, id: editingProduct.id })
      : await addProduct(data);

    if (response.ok) {
      setEditingProduct(null);
      await loadProducts();
    } else {
      setGlobalError(response.message || 'No se pudo guardar el producto.');
    }
    setLoadingForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar este producto de forma permanente?')) return;
    setDeletingId(id);
    const response = await deleteProduct(id);
    if (response.ok) {
      await loadProducts();
    } else {
      setGlobalError(response.message || 'No se pudo eliminar el producto.');
    }
    setDeletingId(null);
  };

  const handleAddOrUpdatePromotion = async (data: Omit<Promotion, 'id'>) => {
    setLoadingPromoForm(true);
    setGlobalError('');

    const response = editingPromotion
      ? await updatePromotion({ ...data, id: editingPromotion.id })
      : await addPromotion(data);

    if (response.ok) {
      setEditingPromotion(null);
      await loadPromotions();
    } else {
      setGlobalError(response.message || 'No se pudo guardar la oferta.');
    }
    setLoadingPromoForm(false);
  };

  const handleDeletePromotion = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar esta oferta de forma permanente?')) return;
    setDeletingPromoId(id);
    const response = await deletePromotion(id);
    if (response.ok) {
      await loadPromotions();
    } else {
      setGlobalError(response.message || 'No se pudo eliminar la oferta.');
    }
    setDeletingPromoId(null);
  };

  const handleSaveSeller = async (seller: SellerSaveInput) => {
    const sellerId = seller.id || 'new';
    setSavingSellerId(sellerId);
    setGlobalError('');

    const response = seller.id
      ? await updateSeller({
          id: seller.id,
          nombre: seller.nombre,
          codigo: seller.codigo,
          activo: seller.activo,
          fechaCreacion: seller.fechaCreacion || '',
        })
      : await addSeller({
          nombre: seller.nombre,
          codigo: seller.codigo,
          activo: seller.activo,
        });

    if (response.ok) {
      await loadSellers();
      setSavingSellerId(null);
      return true;
    }

    setGlobalError(response.message || 'No se pudo guardar el vendedor.');
    setSavingSellerId(null);
    return false;
  };

  const handleToggleSeller = async (seller: Seller) => {
    setSavingSellerId(seller.id);
    setGlobalError('');
    const response = await updateSeller({ ...seller, activo: !seller.activo });

    if (response.ok && response.data) {
      setSellers((current) => current.map((item) => item.id === seller.id ? response.data as Seller : item));
    } else {
      setGlobalError(response.message || 'No se pudo cambiar el estado del vendedor.');
    }
    setSavingSellerId(null);
  };

  const handleOrderStatus = async (id: string, status: string) => {
    setChangingStatusId(id);
    const previous = orders;
    setOrders((current) => current.map((order) => order.id === id ? { ...order, estado: status } : order));

    const response = await updateOrderStatus(id, status);
    if (!response.ok) {
      setOrders(previous);
      setGlobalError(response.message || 'No se pudo actualizar el estado del pedido.');
    }
    setChangingStatusId(null);
  };

  const stats = useMemo(() => {
    const pending = orders.filter((order) => order.estado === 'Pendiente').length;
    const activeOrders = orders.filter((order) => order.estado !== 'Cancelado');
    const requestedValue = activeOrders.reduce((sum, order) => sum + order.total, 0);
    const lowStock = products.filter((product) => product.stock <= 5).length;
    return { pending, requestedValue, lowStock, totalOrders: orders.length };
  }, [orders, products]);

  if (checkingSession) {
    return (
      <main className="admin-login-page">
        <Loader label="Comprobando sesión administrativa..." />
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-decoration" />
        <section className="admin-login-shell">
          <aside className="admin-login-aside">
            <div className="admin-login-aside-glow" />
            <div className="admin-login-aside-top">
              <span className="admin-login-chip"><Icon name="lock" size={14} /> Área privada</span>
              <h2>Gestiona tu tienda desde un solo lugar.</h2>
              <p>Controla pedidos, inventario y catálogo con una vista clara y ordenada.</p>
            </div>
            <img className="admin-login-illustration" src="/art/admin-panel.svg" alt="Panel de gestión" />
            <ul className="admin-login-highlights">
              <li><Icon name="orders" size={16} /> Seguimiento de pedidos en tiempo real</li>
              <li><Icon name="products" size={16} /> Alta y edición de productos</li>
              <li><Icon name="barChart" size={16} /> Indicadores clave a la vista</li>
            </ul>
          </aside>

          <div className="admin-login-card">
            <div className="admin-login-brand"><BrandLogo /></div>
            <span className="admin-login-icon"><Icon name="lock" size={24} /></span>
            <span className="eyebrow">Panel administrativo</span>
            <h1>Bienvenido de nuevo</h1>
            <p>Ingresa tu contraseña para acceder a la gestión de GutiSupplements.</p>

            {authError && <div className="alert alert-error">{authError}</div>}

            <form onSubmit={handleLogin}>
              <div className="field">
                <label htmlFor="admin-password">Contraseña</label>
                <input
                  id="admin-password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={authLoading}>
                {authLoading ? (
                  <><span className="spinner" /> Verificando...</>
                ) : (
                  <>Entrar al panel <Icon name="arrowRight" size={18} /></>
                )}
              </button>
            </form>
            <a href="/" className="admin-back-store"><Icon name="chevronLeft" size={16} /> Volver a la tienda</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-app-shell">
      <aside className="admin-sidebar">
        <a href="/" className="admin-sidebar-brand"><BrandLogo /></a>
        <div className="admin-nav-label">Gestión</div>
        <nav className="admin-nav">
          <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
            <Icon name="orders" size={19} />
            <span>Pedidos</span>
            {stats.pending > 0 && <b>{stats.pending}</b>}
          </button>
          <button className={activeTab === 'sellers' ? 'active' : ''} onClick={() => setActiveTab('sellers')}>
            <Icon name="users" size={19} />
            <span>Vendedores</span>
            <b>{sellers.length}</b>
          </button>
          <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
            <Icon name="products" size={19} />
            <span>Productos</span>
            <b>{products.length}</b>
          </button>
          <button className={activeTab === 'promotions' ? 'active' : ''} onClick={() => setActiveTab('promotions')}>
            <Icon name="tag" size={19} />
            <span>Ofertas</span>
            <b>{promotions.length}</b>
          </button>
        </nav>

        <div className="admin-sidebar-card">
          <span className="admin-sidebar-card-icon"><Icon name="sparkles" size={18} /></span>
          <strong>Tienda activa</strong>
          <p>Tu catálogo está publicado y recibiendo solicitudes.</p>
        </div>

        <div className="admin-sidebar-footer">
          <a href="/" className="admin-sidebar-link"><Icon name="store" size={18} /> Ver tienda</a>
          <button
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

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">GutiSupplements Admin</span>
            <h1>
              {activeTab === 'orders'
                ? 'Gestión de pedidos'
                : activeTab === 'sellers'
                ? 'Ventas por vendedor'
                : activeTab === 'promotions'
                ? 'Gestión de ofertas'
                : 'Gestión del catálogo'}
            </h1>
          </div>
          <div className="admin-topbar-actions">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                if (activeTab === 'orders') void loadOrders();
                else if (activeTab === 'sellers') { void loadSellers(); void loadOrders(); }
                else if (activeTab === 'promotions') void loadPromotions();
                else void loadProducts();
              }}
            >
              <Icon name="refresh" size={15} /> Actualizar
            </button>
            <a href="/" className="btn btn-primary btn-sm"><Icon name="store" size={16} /> Ver tienda</a>
          </div>
        </header>

        <div className="admin-content">
          {globalError && (
            <div className="alert alert-error admin-global-alert">
              <span>{globalError}</span>
              <button onClick={() => setGlobalError('')}><Icon name="close" size={16} /></button>
            </div>
          )}

          <section className="admin-welcome">
            <div className="admin-welcome-copy">
              <span className="eyebrow"><Icon name="sparkles" size={13} /> Resumen general</span>
              <h2>
                {activeTab === 'orders'
                  ? 'Tus pedidos, siempre bajo control'
                  : activeTab === 'sellers'
                  ? 'Tus ventas, asociadas al vendedor correcto'
                  : activeTab === 'promotions'
                  ? 'Tus ofertas, listas para publicar'
                  : 'Tu catálogo, siempre ordenado'}
              </h2>
              <p>Revisa los indicadores clave y gestiona todo desde un mismo panel.</p>
            </div>
            <div className="admin-welcome-art" aria-hidden="true">
              <Icon name="trending" size={30} />
            </div>
          </section>

          <section className="admin-stats-grid">
            <article className="admin-stat admin-stat-amber">
              <span className="admin-stat-icon"><Icon name="orders" size={21} /></span>
              <div><small>Pedidos pendientes</small><strong>{stats.pending}</strong><p>Requieren contacto</p></div>
            </article>
            <article className="admin-stat admin-stat-gold">
              <span className="admin-stat-icon"><Icon name="dollar" size={21} /></span>
              <div><small>Valor solicitado</small><strong>${stats.requestedValue.toFixed(2)}</strong><p>USD sin cancelados</p></div>
            </article>
            <article className="admin-stat admin-stat-rose">
              <span className="admin-stat-icon"><Icon name="package" size={21} /></span>
              <div><small>Productos publicados</small><strong>{products.length}</strong><p>Catálogo activo</p></div>
            </article>
            <article className="admin-stat admin-stat-wine">
              <span className="admin-stat-icon"><Icon name="clock" size={21} /></span>
              <div><small>Stock bajo</small><strong>{stats.lowStock}</strong><p>5 unidades o menos</p></div>
            </article>
          </section>

          {activeTab === 'orders' ? (
            loadingOrders ? <Loader label="Cargando pedidos..." /> : (
              <AdminOrderList
                orders={orders}
                changingStatusId={changingStatusId}
                onStatusChange={handleOrderStatus}
              />
            )
          ) : activeTab === 'sellers' ? (
            loadingSellers || loadingOrders ? <Loader label="Cargando vendedores y pedidos..." /> : (
              <AdminSellerDashboard
                sellers={sellers}
                orders={orders}
                savingSellerId={savingSellerId}
                onSave={handleSaveSeller}
                onToggle={handleToggleSeller}
              />
            )
          ) : activeTab === 'promotions' ? (
            <div className="admin-products-layout">
              <div className="admin-promotions-side">
                <AdminPromotionForm
                  editingPromotion={editingPromotion}
                  onSubmit={handleAddOrUpdatePromotion}
                  onCancelEdit={() => setEditingPromotion(null)}
                  loading={loadingPromoForm}
                />
              </div>
              {loadingPromotions ? <Loader label="Cargando ofertas..." /> : (
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
          ) : (
            <div className="admin-products-layout">
              <AdminProductForm
                editingProduct={editingProduct}
                onSubmit={handleAddOrUpdate}
                onCancelEdit={() => setEditingProduct(null)}
                loading={loadingForm}
              />
              {loadingProducts ? <Loader label="Cargando catálogo..." /> : (
                <AdminProductList
                  products={products}
                  onEdit={(product) => {
                    setEditingProduct(product);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onDelete={handleDelete}
                  deletingId={deletingId}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
