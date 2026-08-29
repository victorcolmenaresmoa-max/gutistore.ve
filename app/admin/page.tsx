'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminProductForm from '@/components/AdminProductForm';
import AdminProductList from '@/components/AdminProductList';
import AdminCategoryManager from '@/components/AdminCategoryManager';
import AdminInventory from '@/components/AdminInventory';
import AdminPromotionForm from '@/components/AdminPromotionForm';
import AdminPromotionList from '@/components/AdminPromotionList';
import AdminOrderList from '@/components/AdminOrderList';
import AdminSellerDashboard, { SellerSaveInput } from '@/components/AdminSellerDashboard';
import AdminRateControl from '@/components/AdminRateControl';
import ConfirmDialog from '@/components/ConfirmDialog';
import BrandLogo from '@/components/BrandLogo';
import Loader from '@/components/Loader';
import Icon from '@/components/Icons';
import {
  addCategory, addProduct, adminLogin, adminLogout, checkAdminSession,
  addPromotion, addSeller, deleteCategory, deleteProduct, deletePromotion,
  getCategories, getConfig, getOrders, getProducts, getPromotions, getSellers,
  updateCategory, updateConfig, updateOrderStatus, updateProduct, updatePromotion, updateSeller,
} from '@/lib/api';
import type { Category, OrderRecord, Product, Promotion, Seller, StoreConfig } from '@/types';

type AdminTab = 'dashboard' | 'orders' | 'products' | 'categories' | 'inventory' | 'promotions' | 'sellers' | 'settings';

const NAV: Array<{ id: AdminTab; label: string; icon: Parameters<typeof Icon>[0]['name'] }> = [
  { id: 'dashboard', label: 'Dashboard', icon: 'barChart' },
  { id: 'orders', label: 'Pedidos', icon: 'orders' },
  { id: 'products', label: 'Productos', icon: 'products' },
  { id: 'categories', label: 'Categorías', icon: 'layers' },
  { id: 'inventory', label: 'Inventario', icon: 'package' },
  { id: 'promotions', label: 'Promociones', icon: 'tag' },
  { id: 'sellers', label: 'Vendedores / Referidos', icon: 'users' },
  { id: 'settings', label: 'Configuración', icon: 'store' },
];

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [highlightOrderId, setHighlightOrderId] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [config, setConfig] = useState<StoreConfig>({ tasaBs: 0 });
  const [loadingData, setLoadingData] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingPromoForm, setLoadingPromoForm] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deletingPromoId, setDeletingPromoId] = useState<string | null>(null);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);
  const [savingSellerId, setSavingSellerId] = useState<string | null>(null);
  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null);
  const [confirmPromo, setConfirmPromo] = useState<Promotion | null>(null);
  const [globalError, setGlobalError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const orderId = query.get('pedido') || '';
    if (orderId) { setHighlightOrderId(orderId); setActiveTab('orders'); }
    void checkAdminSession().then((response) => {
      setAuthenticated(Boolean(response.ok && response.data?.authenticated));
      setCheckingSession(false);
    });
  }, []);

  const loadAll = async () => {
    setLoadingData(true); setGlobalError('');
    const [p, c, o, pr, s, cfg] = await Promise.all([getProducts({ admin: true }), getCategories({ admin: true }), getOrders(), getPromotions(), getSellers(), getConfig()]);
    if (p.ok && p.data) setProducts(p.data); else setGlobalError(p.message || 'No se pudieron cargar los productos.');
    if (c.ok && c.data) setCategories(c.data); else if (c.message) setGlobalError(c.message);
    if (o.ok && o.data) setOrders(o.data); else if (o.message) setGlobalError(o.message);
    if (pr.ok && pr.data) setPromotions(pr.data); else if (pr.message) setGlobalError(pr.message);
    if (s.ok && s.data) setSellers(s.data); else if (s.message) setGlobalError(s.message);
    if (cfg.ok && cfg.data) setConfig(cfg.data);
    setLoadingData(false);
  };

  useEffect(() => { if (authenticated) void loadAll(); }, [authenticated]);

  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2600); };

  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setAuthLoading(true); setAuthError('');
    const response = await adminLogin(passwordInput);
    if (response.ok && response.data?.authenticated) { setAuthenticated(true); setPasswordInput(''); }
    else setAuthError(response.message || 'No se pudo iniciar sesión.');
    setAuthLoading(false);
  };

  const saveProduct = async (data: Omit<Product, 'id'>) => {
    setLoadingForm(true); setGlobalError('');
    const response = editingProduct ? await updateProduct({ ...data, id: editingProduct.id }) : await addProduct(data);
    if (response.ok && response.data) {
      setEditingProduct(null);
      setProducts((current) => editingProduct ? current.map((product) => product.id === response.data!.id ? response.data! : product) : [response.data!, ...current]);
      showNotice(editingProduct ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
    } else setGlobalError(response.message || 'No se pudo guardar el producto.');
    setLoadingForm(false);
  };

  const archiveProduct = async () => {
    if (!confirmProduct) return;
    setDeletingId(confirmProduct.id);
    const response = await deleteProduct(confirmProduct.id);
    if (response.ok) { setProducts((current) => current.map((product) => product.id === confirmProduct.id ? { ...product, activo: false, estado: 'archived' } : product)); showNotice('Producto archivado sin afectar pedidos históricos.'); }
    else setGlobalError(response.message || 'No se pudo archivar el producto.');
    setDeletingId(null); setConfirmProduct(null);
  };

  const saveCategory = async (category: Omit<Category, 'id'> | Category) => {
    setSavingCategory(true); setGlobalError('');
    const response = 'id' in category ? await updateCategory(category as Category) : await addCategory(category as Omit<Category, 'id' | 'createdAt' | 'updatedAt'>);
    setSavingCategory(false);
    if (response.ok && response.data) {
      setCategories((current) => 'id' in category ? current.map((item) => item.id === response.data!.id ? response.data! : item).sort((a,b) => a.displayOrder-b.displayOrder) : [...current, response.data!].sort((a,b) => a.displayOrder-b.displayOrder));
      showNotice('Categoría guardada correctamente.'); return true;
    }
    setGlobalError(response.message || 'No se pudo guardar la categoría.'); return false;
  };

  const removeCategory = async (id: string) => {
    setDeletingCategoryId(id); setGlobalError('');
    const response = await deleteCategory(id);
    if (response.ok) { setCategories((current) => current.filter((category) => category.id !== id)); showNotice('Categoría eliminada.'); }
    else setGlobalError(response.message || 'No se pudo eliminar la categoría.');
    setDeletingCategoryId(null);
  };

  const savePromotion = async (data: Omit<Promotion, 'id'>) => {
    setLoadingPromoForm(true); setGlobalError('');
    const response = editingPromotion ? await updatePromotion({ ...data, id: editingPromotion.id }) : await addPromotion(data);
    if (response.ok && response.data) {
      setEditingPromotion(null);
      setPromotions((current) => editingPromotion ? current.map((item) => item.id === response.data!.id ? response.data! : item) : [response.data!, ...current]);
      showNotice('Promoción guardada correctamente.');
    } else setGlobalError(response.message || 'No se pudo guardar la promoción.');
    setLoadingPromoForm(false);
  };

  const removePromotion = async () => {
    if (!confirmPromo) return;
    setDeletingPromoId(confirmPromo.id);
    const response = await deletePromotion(confirmPromo.id);
    if (response.ok) { setPromotions((current) => current.filter((item) => item.id !== confirmPromo.id)); showNotice('Promoción eliminada.'); }
    else setGlobalError(response.message || 'No se pudo eliminar la promoción.');
    setDeletingPromoId(null); setConfirmPromo(null);
  };

  const saveSeller = async (seller: SellerSaveInput) => {
    const sellerId = seller.id || 'new'; setSavingSellerId(sellerId); setGlobalError('');
    const response = seller.id ? await updateSeller({ id: seller.id, nombre: seller.nombre, codigo: seller.codigo, activo: seller.activo, fechaCreacion: seller.fechaCreacion || '' }) : await addSeller({ nombre: seller.nombre, codigo: seller.codigo, activo: seller.activo });
    setSavingSellerId(null);
    if (response.ok && response.data) { setSellers((current) => seller.id ? current.map((item) => item.id === response.data!.id ? response.data! : item) : [...current, response.data!]); return true; }
    setGlobalError(response.message || 'No se pudo guardar el vendedor.'); return false;
  };

  const toggleSeller = async (seller: Seller) => {
    setSavingSellerId(seller.id); const response = await updateSeller({ ...seller, activo: !seller.activo }); setSavingSellerId(null);
    if (response.ok && response.data) setSellers((current) => current.map((item) => item.id === seller.id ? response.data! : item));
    else setGlobalError(response.message || 'No se pudo cambiar el estado del vendedor.');
  };

  const changeOrderStatus = async (id: string, status: string) => {
    setChangingStatusId(id); const previous = orders; setOrders((current) => current.map((order) => order.id === id ? { ...order, estado: status } : order));
    const response = await updateOrderStatus(id, status);
    if (!response.ok) { setOrders(previous); setGlobalError(response.message || 'No se pudo actualizar el pedido.'); }
    setChangingStatusId(null);
  };

  const stats = useMemo(() => {
    const pending = orders.filter((order) => order.estado === 'Pendiente').length;
    const sales = orders.filter((order) => !['Cancelado'].includes(order.estado)).reduce((sum, order) => sum + order.total, 0);
    const low = products.filter((product) => product.activo !== false && product.stock > 0 && product.stock <= 5).length;
    const out = products.filter((product) => product.activo !== false && product.stock <= 0).length;
    return { pending, sales, low, out };
  }, [orders, products]);

  if (checkingSession) return <main className="admin-login-page"><Loader label="Comprobando sesión administrativa..." /></main>;

  if (!authenticated) return <main className="admin-login-page"><section className="admin-login-shell"><aside className="admin-login-aside"><span className="admin-login-chip"><Icon name="lock" size={14} /> Área privada</span><h2>Gestiona GutiStore desde cualquier dispositivo.</h2><p>Productos, categorías, variantes, inventario, pedidos y referidos en un único panel.</p><img src="/guti-store-mark.jpg" alt="GutiStore" className="admin-login-logo-art" /><ul className="admin-login-highlights"><li><Icon name="products" size={16} /> Catálogo multirubro</li><li><Icon name="layers" size={16} /> Categorías dinámicas</li><li><Icon name="orders" size={16} /> Pedidos con variantes</li></ul></aside><div className="admin-login-card"><div className="admin-login-brand"><BrandLogo /></div><span className="eyebrow">Panel administrativo</span><h1>Bienvenido</h1><p>Ingresa tu contraseña para acceder al panel de GutiStore.</p>{authError && <div className="alert alert-error">{authError}</div>}<form onSubmit={login}><div className="field"><label>Contraseña</label><input type="password" value={passwordInput} onChange={(event) => setPasswordInput(event.target.value)} autoFocus /></div><button className="btn btn-primary btn-block btn-lg" disabled={authLoading}>{authLoading ? <><span className="spinner" /> Verificando...</> : <>Entrar al panel <Icon name="arrowRight" size={17} /></>}</button></form><a href="/" className="admin-back-store"><Icon name="chevronLeft" size={16} /> Volver a la tienda</a></div></section></main>;

  const selectTab = (tab: AdminTab) => { setActiveTab(tab); setMobileNav(false); setEditingProduct(null); setEditingPromotion(null); };

  return <div className="admin-app-shell">
    <aside className={`admin-sidebar ${mobileNav ? 'open' : ''}`}><div className="admin-sidebar-mobile-head"><a href="/" className="admin-sidebar-brand"><BrandLogo /></a><button className="icon-btn" onClick={() => setMobileNav(false)}><Icon name="close" size={19} /></button></div><a href="/" className="admin-sidebar-brand desktop-brand"><BrandLogo /></a><div className="admin-nav-label">Gestión de tienda</div><nav className="admin-nav">{NAV.map((item) => <button key={item.id} className={activeTab === item.id ? 'active' : ''} onClick={() => selectTab(item.id)}><Icon name={item.icon} size={18} /><span>{item.label}</span>{item.id === 'orders' && stats.pending > 0 ? <b>{stats.pending}</b> : item.id === 'products' ? <b>{products.length}</b> : item.id === 'categories' ? <b>{categories.length}</b> : null}</button>)}</nav><div className="admin-sidebar-footer"><a href="/" className="admin-sidebar-link"><Icon name="store" size={17} /> Ver tienda</a><button className="admin-sidebar-link" onClick={() => void adminLogout().then(() => setAuthenticated(false))}><Icon name="logout" size={17} /> Cerrar sesión</button></div></aside>
    {mobileNav && <button className="admin-sidebar-scrim" aria-label="Cerrar menú" onClick={() => setMobileNav(false)} />}

    <main className="admin-main"><header className="admin-topbar"><button className="admin-mobile-menu" onClick={() => setMobileNav(true)}><Icon name="menu" size={19} /></button><div><span className="eyebrow">GutiStore Admin</span><h1>{NAV.find((item) => item.id === activeTab)?.label}</h1></div><div className="admin-topbar-actions"><button className="btn btn-outline btn-sm" onClick={() => void loadAll()}><Icon name="refresh" size={14} /> Actualizar</button><a href="/" className="btn btn-primary btn-sm"><Icon name="store" size={15} /> Ver tienda</a></div></header>
      <div className="admin-content">{globalError && <div className="alert alert-error admin-global-alert"><span>{globalError}</span><button onClick={() => setGlobalError('')}><Icon name="close" size={15} /></button></div>}{notice && <div className="admin-toast"><Icon name="check" size={16} /> {notice}</div>}
        {loadingData ? <Loader label="Cargando GutiStore Admin..." /> : <>
          {activeTab === 'dashboard' && <><section className="admin-welcome"><div><span className="eyebrow"><Icon name="sparkles" size={12} /> Resumen general</span><h2>Tu tienda, de un vistazo.</h2><p>Métricas reales calculadas con los datos actuales de pedidos, inventario y catálogo.</p></div><Icon name="trending" size={34} /></section><section className="admin-stats-grid"><article><Icon name="orders" size={21} /><div><small>Pedidos pendientes</small><strong>{stats.pending}</strong></div></article><article><Icon name="dollar" size={21} /><div><small>Valor solicitado</small><strong>${stats.sales.toFixed(2)}</strong></div></article><article><Icon name="package" size={21} /><div><small>Stock bajo</small><strong>{stats.low}</strong></div></article><article><Icon name="close" size={21} /><div><small>Agotados</small><strong>{stats.out}</strong></div></article></section><div className="admin-dashboard-grid"><section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Pedidos recientes</span><h3>Últimas solicitudes</h3></div><button className="text-link" onClick={() => selectTab('orders')}>Ver todos</button></div><div className="dashboard-order-list">{orders.slice(0,5).map((order) => <button key={order.id} onClick={() => { setHighlightOrderId(order.id); selectTab('orders'); }}><span><strong>{order.cliente}</strong><small>#{order.id.slice(0,8).toUpperCase()} · {order.estado}</small></span><b>${order.total.toFixed(2)}</b></button>)}{!orders.length && <p>No hay pedidos recientes.</p>}</div></section><section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Accesos rápidos</span><h3>Gestiona lo importante</h3></div></div><div className="quick-actions"><button onClick={() => selectTab('products')}><Icon name="plus" size={18} /><span><strong>Crear producto</strong><small>Incluye variantes e imágenes.</small></span></button><button onClick={() => selectTab('categories')}><Icon name="layers" size={18} /><span><strong>Nueva categoría</strong><small>Se integra automáticamente.</small></span></button><button onClick={() => selectTab('inventory')}><Icon name="package" size={18} /><span><strong>Actualizar stock</strong><small>General o por variante.</small></span></button></div></section></div></>}

          {activeTab === 'orders' && <AdminOrderList orders={orders} changingStatusId={changingStatusId} onStatusChange={changeOrderStatus} initialExpandedId={highlightOrderId} />}
          {activeTab === 'products' && <div className="admin-products-layout"><AdminProductForm editingProduct={editingProduct} categories={categories} onSubmit={saveProduct} onCancelEdit={() => setEditingProduct(null)} loading={loadingForm} /><AdminProductList products={products} onEdit={(product) => { setEditingProduct(product); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onDelete={(id) => setConfirmProduct(products.find((product) => product.id === id) || null)} deletingId={deletingId} /></div>}
          {activeTab === 'categories' && <AdminCategoryManager categories={categories} products={products} saving={savingCategory} deletingId={deletingCategoryId} onSave={saveCategory} onDelete={removeCategory} />}
          {activeTab === 'inventory' && <AdminInventory products={products.filter((product) => product.activo !== false)} onProductUpdated={(updated) => setProducts((current) => current.map((product) => product.id === updated.id ? updated : product))} />}
          {activeTab === 'promotions' && <div className="admin-products-layout"><AdminPromotionForm editingPromotion={editingPromotion} onSubmit={savePromotion} onCancelEdit={() => setEditingPromotion(null)} loading={loadingPromoForm} /><AdminPromotionList promotions={promotions} onEdit={setEditingPromotion} onDelete={(id) => setConfirmPromo(promotions.find((promotion) => promotion.id === id) || null)} deletingId={deletingPromoId} /></div>}
          {activeTab === 'sellers' && <AdminSellerDashboard sellers={sellers} orders={orders} savingSellerId={savingSellerId} onSave={saveSeller} onToggle={toggleSeller} />}
          {activeTab === 'settings' && <div className="admin-settings-grid"><AdminRateControl rate={config.tasaBs} onSave={async (rate) => { const response = await updateConfig({ tasaBs: rate }); if (response.ok && response.data) { setConfig(response.data); return true; } setGlobalError(response.message || 'No se pudo guardar la tasa.'); return false; }} /><section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Infraestructura</span><h3>Servicios de GutiStore</h3></div></div><div className="settings-info-list"><div><Icon name="shield" size={18} /><span><strong>Supabase</strong><small>Base de datos, categorías, variantes y Storage.</small></span></div><div><Icon name="mail" size={18} /><span><strong>Resend</strong><small>Notificación automática al administrador después de crear el pedido.</small></span></div><div><Icon name="users" size={18} /><span><strong>Referidos</strong><small>La atribución por ?ref= se mantiene durante el checkout.</small></span></div></div></section></div>}
        </>}
      </div>
    </main>
    <ConfirmDialog open={Boolean(confirmProduct)} title="¿Archivar este producto?" message="Se ocultará de la tienda y sus variantes quedarán inactivas. No se borrarán pedidos históricos." confirmLabel="Archivar producto" destructive loading={Boolean(deletingId)} onCancel={() => setConfirmProduct(null)} onConfirm={() => void archiveProduct()} />
    <ConfirmDialog open={Boolean(confirmPromo)} title="¿Eliminar esta promoción?" message="La promoción se eliminará del módulo de ofertas." confirmLabel="Eliminar promoción" destructive loading={Boolean(deletingPromoId)} onCancel={() => setConfirmPromo(null)} onConfirm={() => void removePromotion()} />
  </div>;
}
