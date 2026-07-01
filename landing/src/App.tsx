import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Bike, 
  Star, 
  ShoppingBag, 
  ArrowRight,
  Database,
  Layers,
  Smartphone,
  CheckCircle
} from 'lucide-react';

// Interfaces for Simulator State
interface SimItem {
  id: string;
  name: string;
  price: number;
  category: string;
  is_veg: boolean;
  desc: string;
  image: string;
}

interface SimCartItem {
  item: SimItem;
  qty: number;
}

interface SimOrder {
  id: string;
  restName: string;
  status: 'pending' | 'accepted' | 'preparing' | 'out_for_delivery' | 'delivered';
  items: SimCartItem[];
  amount: number;
}

export default function App() {
  // LANDING PAGE STATES
  const [downloadCount, setDownloadCount] = useState(148);

  // SIMULATOR STATES
  const [simScreen, setSimScreen] = useState<'login' | 'customer' | 'restaurant' | 'cart' | 'tracking' | 'kitchen' | 'driver' | 'admin'>('login');
  const [simUser, setSimUser] = useState<{name: string, role: string, points: number} | null>(null);
  const [simCart, setSimCart] = useState<SimCartItem[]>([]);
  const [simOrders, setSimOrders] = useState<SimOrder[]>([]);
  const [simPromoCode, setSimPromoCode] = useState<string | null>(null);
  const [simDiscount, setSimDiscount] = useState(0);
  const [simTrackingOffset, setSimTrackingOffset] = useState(0);

  // MOCK SIMULATOR DATA
  const simRestaurants = [
    {
      id: 'r1',
      name: 'Indiranagar Biryani Club',
      cuisine: 'Biryani',
      rating: 4.8,
      time: 25,
      fee: 30,
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80',
      menu: [
        { id: 'r1-m1', name: 'Special Chicken Dum Biryani', price: 290, category: 'Biryani', is_veg: false, desc: 'Fragrant basmati rice layered with juicy marinated chicken.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=100&q=80' },
        { id: 'r1-m2', name: 'Paneer Makhani Biryani', price: 250, category: 'Biryani', is_veg: true, desc: 'Fresh paneer cubes layered in rich butter gravy and basmati.', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=100&q=80' }
      ]
    },
    {
      id: 'r2',
      name: 'Southern Spice Corner',
      cuisine: 'South Indian',
      rating: 4.6,
      time: 15,
      fee: 20,
      image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200&q=80',
      menu: [
        { id: 'r2-m1', name: 'Ghee Podi Masala Dosa', price: 110, category: 'South Indian', is_veg: true, desc: 'Crispy dosa with spicy podi powder and clarified butter.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=100&q=80' },
        { id: 'r2-m2', name: 'Medu Vada (2 Pcs)', price: 70, category: 'Snacks', is_veg: true, desc: 'Crisp fried lentil donuts served with chutney and sambar.', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=100&q=80' }
      ]
    }
  ];

  const [selectedRestId, setSelectedRestId] = useState('r1');
  const activeRest = simRestaurants.find(r => r.id === selectedRestId) || simRestaurants[0];

  // SIMULATOR LOGIC
  const selectRoleAndLogin = (role: string) => {
    const names: Record<string, string> = {
      customer: 'Mohan Kumar',
      restaurant_owner: 'Chef Rajesh',
      delivery_partner: 'Ramesh Rider',
      admin: 'Admin Controller'
    };
    
    setSimUser({
      name: names[role] || 'Mohan Kumar',
      role: role,
      points: role === 'customer' ? 120 : 0
    });

    if (role === 'customer') setSimScreen('customer');
    if (role === 'restaurant_owner') setSimScreen('kitchen');
    if (role === 'delivery_partner') setSimScreen('driver');
    if (role === 'admin') setSimScreen('admin');
  };

  const addToCart = (item: SimItem) => {
    setSimCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const updateCartQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      setSimCart(prev => prev.filter(i => i.item.id !== id));
      return;
    }
    setSimCart(prev => prev.map(i => i.item.id === id ? { ...i, qty: newQty } : i));
  };

  const applyPromo = (code: string) => {
    const subtotal = simCart.reduce((sum, i) => sum + (i.item.price * i.qty), 0);
    if (code === 'FIRST50' && subtotal >= 100) {
      setSimPromoCode('FIRST50');
      setSimDiscount(Math.round(subtotal * 0.5));
    }
  };

  const checkoutOrder = () => {
    const subtotal = simCart.reduce((sum, i) => sum + (i.item.price * i.qty), 0);
    const fee = activeRest.fee;
    const finalAmount = Math.max(0, subtotal + fee - simDiscount);

    const newOrder: SimOrder = {
      id: `order-${Math.floor(Math.random() * 10000)}`,
      restName: activeRest.name,
      status: 'pending',
      items: [...simCart],
      amount: finalAmount
    };

    setSimOrders([newOrder, ...simOrders]);
    setSimCart([]);
    setSimPromoCode(null);
    setSimDiscount(0);
    setSimScreen('tracking');

    // Auto-confirm in kitchen after 4 seconds
    setTimeout(() => {
      updateOrderState(newOrder.id, 'accepted');
    }, 4000);
  };

  const updateOrderState = (id: string, state: SimOrder['status']) => {
    setSimOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      
      // Auto transitions for demo tracking
      if (state === 'accepted') {
        setTimeout(() => updateOrderState(id, 'preparing'), 4000);
      } else if (state === 'preparing') {
        setTimeout(() => updateOrderState(id, 'out_for_delivery'), 6000);
      } else if (state === 'out_for_delivery') {
        // Trigger GPS track progress
        setSimTrackingOffset(0);
      }

      return { ...o, status: state };
    }));
  };

  // Driver route animator simulation
  useEffect(() => {
    const activeOrder = simOrders[0];
    if (activeOrder && activeOrder.status === 'out_for_delivery') {
      const interval = setInterval(() => {
        setSimTrackingOffset(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            updateOrderState(activeOrder.id, 'delivered');
            return 100;
          }
          return prev + 10;
        });
      }, 600);
      return () => clearInterval(interval);
    }
  }, [simOrders[0]?.status]);

  const activeSimOrder = simOrders[0];

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo">
            🛵 Food<span>Express</span>
          </div>
          <ul className="nav-links">
            <li><a href="#features">Key Features</a></li>
            <li><a href="#simulator">App Simulator</a></li>
            <li><a href="#supabase">Database Schema</a></li>
          </ul>
          <button className="btn btn-primary" onClick={() => setDownloadCount(prev => prev + 1)}>
            Download App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero container">
        <div className="hero-content">
          <span className="feature-icon-circle" style={{ padding: '4px 12px', width: 'auto', height: 'auto', display: 'inline-flex', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            📍 INDIRANAGAR LOCAL EXCLUSIVE
          </span>
          <h1 className="gradient-text">Local Diners Meet Quick Logistics.</h1>
          <p>
            An all-in-one local food ecosystem designed for small hotels, diners, and partners. 
            Powered by a real-time Supabase backend, responsive layouts, and built-in delivery tracks.
            Experience the interactive simulator on the right to place a kitchen-to-doorstep order!
          </p>
          <div className="hero-actions">
            <a href="#simulator" className="btn btn-primary">
              Launch Web Demo <ArrowRight size={16} />
            </a>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#FFF' }}>{downloadCount}+ builds</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Generated for iOS & Android</span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE SIMULATOR CARD */}
        <div className="simulator-wrapper" id="simulator">
          <div className="phone-frame">
            <div className="phone-notch" />
            
            {/* Status bar */}
            <div style={{ height: '34px', backgroundColor: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '24px', paddingRight: '24px', borderBottom: '1px solid #ECEFF1', paddingTop: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#263238' }}>10:00 PM</span>
              <span style={{ fontSize: '11px', color: '#78909C', fontWeight: '700' }}>LTE 🔋 98%</span>
            </div>

            {/* SCREEN 1: LOGIN SCREEN */}
            {simScreen === 'login' && (
              <div style={{ flex: 1, backgroundColor: '#F5F7FA', display: 'flex', flexDirection: 'column', padding: '20px' }}>
                <div style={{ alignSelf: 'center', marginTop: '30px', alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '40px' }}>🛵</span>
                  <h2 style={{ color: '#263238', fontSize: '24px', fontWeight: '900', marginTop: '10px' }}>FoodExpress</h2>
                  <span style={{ fontSize: '11px', color: '#90A4AE', fontWeight: '600' }}>Local Dining & Logistics</span>
                </div>

                <div style={{ marginTop: '40px', gap: '12px', display: 'flex', flexDirection: 'column' }}>
                  <input type="text" placeholder="Email Address" defaultValue="mohan.kumar@gmail.com" disabled style={{ padding: '14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '13px', backgroundColor: '#FFF', fontWeight: '600' }} />
                  <input type="password" placeholder="Password" defaultValue="••••••••" disabled style={{ padding: '14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '13px', backgroundColor: '#FFF' }} />
                </div>

                <button style={{ backgroundColor: 'var(--primary)', color: '#FFF', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: '800', marginTop: '16px', cursor: 'pointer' }} onClick={() => selectRoleAndLogin('customer')}>
                  Sign In (Customer Profile)
                </button>

                <div style={{ borderBottom: '1.5px solid #ECEFF1', marginTop: '24px', marginBottom: '24px' }} />
                <span style={{ fontSize: '11px', color: '#78909C', fontWeight: '800', letterSpacing: '1px', textAlign: 'center', marginBottom: '12px' }}>TEST USER PROFILES</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button style={{ backgroundColor: '#E0F2FE', border: '1.5px solid #bae6fd', color: '#0369a1', borderRadius: '10px', padding: '10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }} onClick={() => selectRoleAndLogin('customer')}>
                    👤 Customer
                  </button>
                  <button style={{ backgroundColor: '#FCE7F3', border: '1.5px solid #fbcfe8', color: '#be185d', borderRadius: '10px', padding: '10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }} onClick={() => selectRoleAndLogin('restaurant_owner')}>
                    🍳 Kitchen
                  </button>
                  <button style={{ backgroundColor: '#DCFCE7', border: '1.5px solid #bbf7d0', color: '#15803d', borderRadius: '10px', padding: '10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }} onClick={() => selectRoleAndLogin('delivery_partner')}>
                    🚴 Rider
                  </button>
                  <button style={{ backgroundColor: '#F3E8FF', border: '1.5px solid #e9d5ff', color: '#6b21a8', borderRadius: '10px', padding: '10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }} onClick={() => selectRoleAndLogin('admin')}>
                    🛡️ Admin
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 2: CUSTOMER BROWSE SCREEN */}
            {simScreen === 'customer' && (
              <div style={{ flex: 1, backgroundColor: '#FFF', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0F2F5' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <MapPin size={16} color="var(--primary)" />
                    <div>
                      <span style={{ fontSize: '9px', display: 'block', color: '#90A4AE', fontWeight: '700' }}>DELIVERING TO {simUser?.name} ({simUser?.points} pts)</span>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#263238' }}>Indiranagar, Bangalore</span>
                    </div>
                  </div>
                  <button onClick={() => setSimScreen('login')} style={{ border: 'none', backgroundColor: '#FCE7F3', color: '#be185d', fontSize: '10px', fontWeight: '700', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                  {/* Promo banner */}
                  <div style={{ background: 'linear-gradient(135deg, #FF7043 0%, #FF5722 100%)', borderRadius: '14px', padding: '12px', display: 'flex', color: '#FFF', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', display: 'block' }}>Meal Subscriptions</span>
                      <span style={{ fontSize: '10px', opacity: 0.8 }}>Weekly fresh meals at ₹99/meal.</span>
                    </div>
                    <span style={{ fontSize: '28px' }}>🍱</span>
                  </div>

                  {/* Restaurants Header */}
                  <h3 style={{ fontSize: '14px', color: '#263238', marginBottom: '12px' }}>Featured Restaurants</h3>

                  {simRestaurants.map(rest => (
                    <div key={rest.id} onClick={() => { setSelectedRestId(rest.id); setSimScreen('restaurant'); }} style={{ display: 'flex', border: '1px solid #ECEFF1', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', cursor: 'pointer' }}>
                      <img src={rest.image} style={{ width: '80px', height: '80px', objectFit: 'cover' }} alt={rest.name} />
                      <div style={{ padding: '10px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#263238' }}>{rest.name}</span>
                          <span style={{ backgroundColor: '#4CAF50', color: '#FFF', fontSize: '9px', fontWeight: '700', padding: '2px 4px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}><Star size={8} fill="#FFF" /> {rest.rating}</span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#90A4AE', display: 'block', marginTop: '2px' }}>{rest.cuisine} • Indiranagar</span>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '9px', color: '#546E7A', fontWeight: '700' }}>
                          <span>⏱️ {rest.time}m</span>
                          <span>•</span>
                          <span>₹{rest.fee} delivery</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Floating Cart Panel */}
                {simCart.length > 0 && (
                  <div onClick={() => setSimScreen('cart')} style={{ margin: '12px', padding: '12px', backgroundColor: '#4CAF50', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(76,175,80,0.3)' }}>
                    <span style={{ color: '#FFF', fontSize: '11px', fontWeight: '800' }}>🛒 {simCart.reduce((s,i) => s+i.qty, 0)} Items Added</span>
                    <span style={{ color: '#FFF', fontSize: '11px', fontWeight: '800' }}>View Cart →</span>
                  </div>
                )}
              </div>
            )}

            {/* SCREEN 3: RESTAURANT MENU DETAIL */}
            {simScreen === 'restaurant' && (
              <div style={{ flex: 1, backgroundColor: '#FFF', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #F0F2F5', gap: '8px' }}>
                  <button onClick={() => setSimScreen('customer')} style={{ border: 'none', backgroundColor: '#ECEFF1', width: '28px', height: '28px', borderRadius: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '800', fontSize: '14px' }}>←</button>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#263238' }}>{activeRest.name}</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                  <img src={activeRest.image} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '10px', marginBottom: '16px' }} alt="" />
                  
                  <h4 style={{ fontSize: '12px', color: '#78909C', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Menu Items</h4>
                  
                  {activeRest.menu.map(menuItem => {
                    const cartItem = simCart.find(i => i.item.id === menuItem.id);
                    const qty = cartItem ? cartItem.qty : 0;
                    return (
                      <div key={menuItem.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1.5px solid #F5F7FA', paddingBottom: '14px', marginBottom: '14px' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '10px', color: menuItem.is_veg ? '#4CAF50' : '#E53935', fontWeight: '800', display: 'block' }}>
                            {menuItem.is_veg ? '🟢 VEG' : '🔴 NON-VEG'}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#263238', display: 'block', marginTop: '2px' }}>{menuItem.name}</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#546E7A', display: 'block', marginTop: '2px' }}>₹{menuItem.price}</span>
                        </div>
                        
                        <div style={{ width: '70px', height: '28px', position: 'relative', alignSelf: 'center' }}>
                          {qty === 0 ? (
                            <button onClick={() => addToCart(menuItem)} style={{ width: '100%', height: '100%', border: '1px solid #4CAF50', backgroundColor: '#FFF', color: '#4CAF50', fontSize: '10px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer' }}>ADD</button>
                          ) : (
                            <div style={{ width: '100%', height: '100%', backgroundColor: '#4CAF50', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '6px', paddingLeft: '6px', paddingRight: '6px', color: '#FFF' }}>
                              <button onClick={() => updateCartQty(menuItem.id, qty - 1)} style={{ border: 'none', background: 'none', color: '#FFF', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>-</button>
                              <span style={{ fontSize: '11px', fontWeight: '800' }}>{qty}</span>
                              <button onClick={() => addToCart(menuItem)} style={{ border: 'none', background: 'none', color: '#FFF', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Persistent Footer Checkout trigger */}
                {simCart.length > 0 && (
                  <div onClick={() => setSimScreen('cart')} style={{ margin: '12px', padding: '12px', backgroundColor: '#FF5722', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <span style={{ color: '#FFF', fontSize: '11px', fontWeight: '800' }}>Subtotal: ₹{simCart.reduce((s,i) => s + (i.item.price * i.qty), 0)}</span>
                    <span style={{ color: '#FFF', fontSize: '11px', fontWeight: '800' }}>Checkout →</span>
                  </div>
                )}
              </div>
            )}

            {/* SCREEN 4: SHOPPING CART */}
            {simScreen === 'cart' && (
              <div style={{ flex: 1, backgroundColor: '#F8F9FA', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px', display: 'flex', alignItems: 'center', backgroundColor: '#FFF', borderBottom: '1px solid #F0F2F5', gap: '8px' }}>
                  <button onClick={() => setSimScreen('restaurant')} style={{ border: 'none', backgroundColor: '#ECEFF1', width: '28px', height: '28px', borderRadius: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '800', fontSize: '14px' }}>←</button>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#263238' }}>Checkout Order</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '14px', gap: '12px', display: 'flex', flexDirection: 'column' }}>
                  {/* Cart items */}
                  <div style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '12px', border: '1px solid #ECEFF1' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#78909C', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Items Summary</span>
                    {simCart.map(i => (
                      <div key={i.item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', marginBottom: '6px', fontSize: '12px' }}>
                        <span style={{ fontWeight: '600', color: '#37474F' }}>{i.qty}x {i.item.name}</span>
                        <span style={{ fontWeight: '800', color: '#263238' }}>₹{i.item.price * i.qty}</span>
                      </div>
                    ))}
                  </div>

                  {/* Promo code inputs */}
                  <div style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '12px', border: '1px solid #ECEFF1' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#78909C', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Offers & Discounts</span>
                    {simPromoCode ? (
                      <div style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '8px', padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#2E7D32', fontWeight: '800' }}>'FIRST50' applied (-₹{simDiscount})</span>
                        <button onClick={() => { setSimPromoCode(null); setSimDiscount(0); }} style={{ border: 'none', background: 'none', color: '#C62828', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>Remove</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input id="simPromo" placeholder="Enter FIRST50" style={{ flex: 1, padding: '8px', border: '1px solid #CFD8DC', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }} />
                        <button onClick={() => {
                          const input = document.getElementById('simPromo') as HTMLInputElement;
                          if (input) applyPromo(input.value.toUpperCase());
                        }} style={{ backgroundColor: 'var(--primary)', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>Apply</button>
                      </div>
                    )}
                  </div>

                  {/* Bill Details */}
                  <div style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '12px', border: '1px solid #ECEFF1' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#78909C', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Bill Details</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px', marginBottom: '4px', color: '#546E7A' }}>
                      <span>Subtotal</span>
                      <span>₹{simCart.reduce((s,i) => s + (i.item.price * i.qty), 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px', marginBottom: '4px', color: '#546E7A' }}>
                      <span>Delivery Fee</span>
                      <span>₹{activeRest.fee}</span>
                    </div>
                    {simDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px', marginBottom: '4px', color: '#2E7D32', fontWeight: '700' }}>
                        <span>Promo Discount</span>
                        <span>-₹{simDiscount}</span>
                      </div>
                    )}
                    <div style={{ borderBottom: '1px solid #F5F7FA', marginTop: '8px', marginBottom: '8px' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', color: '#263238' }}>
                      <span>Grand Total</span>
                      <span>₹{Math.max(0, simCart.reduce((s,i) => s + (i.item.price * i.qty), 0) + activeRest.fee - simDiscount)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Place Order CTA */}
                <button onClick={checkoutOrder} style={{ margin: '12px', backgroundColor: '#4CAF50', border: 'none', color: '#FFF', padding: '14px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                  Pay & Place Order →
                </button>
              </div>
            )}

            {/* SCREEN 5: REAL-TIME TRACKING MAP */}
            {simScreen === 'tracking' && (
              <div style={{ flex: 1, backgroundColor: '#F8F9FA', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px', display: 'flex', alignItems: 'center', backgroundColor: '#FFF', borderBottom: '1px solid #F0F2F5', gap: '8px' }}>
                  <button onClick={() => setSimScreen('customer')} style={{ border: 'none', backgroundColor: '#ECEFF1', width: '28px', height: '28px', borderRadius: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '800', fontSize: '14px' }}>←</button>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#263238' }}>Delivery Status</span>
                </div>

                <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                  {activeSimOrder ? (
                    <div>
                      {/* Simulated map graphic */}
                      <div style={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '14px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '800', display: 'block', textTransform: 'uppercase', marginBottom: '14px' }}>Simulated Delivery Route</span>
                        
                        <div style={{ height: '70px', backgroundColor: '#F1F5F9', borderRadius: '8px', position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', overflow: 'hidden' }}>
                          {/* dashed road */}
                          <div style={{ height: '4px', backgroundColor: '#94A3B8', borderStyle: 'dashed', borderWidth: '1px', borderColor: '#FFF', left: '10%', right: '10%', position: 'absolute' }} />
                          
                          {/* Restaurant Pin */}
                          <div style={{ position: 'absolute', left: '5%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ width: '18px', height: '18px', borderRadius: '9px', backgroundColor: '#E53935', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1.5px solid #FFF' }}><ShoppingBag size={8} color="#FFF" /></span>
                            <span style={{ fontSize: '7px', fontWeight: '800', color: '#475569', marginTop: '2px' }}>Kitchen</span>
                          </div>

                          {/* Rider Pin */}
                          {(activeSimOrder.status === 'out_for_delivery' || activeSimOrder.status === 'delivered') && (
                            <div style={{ position: 'absolute', left: `${simTrackingOffset * 0.7 + 10}%`, display: 'flex', flexDirection: 'column', alignItems: 'center', bottom: '15px' }}>
                              <span style={{ width: '22px', height: '22px', borderRadius: '11px', backgroundColor: '#FF5722', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1.5px solid #FFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}><Bike size={10} color="#FFF" /></span>
                              <span style={{ fontSize: '7px', fontWeight: '800', color: '#FF5722', marginTop: '1px' }}>Rider</span>
                            </div>
                          )}

                          {activeSimOrder.status !== 'out_for_delivery' && activeSimOrder.status !== 'delivered' && (
                            <div style={{ position: 'absolute', left: '30%', right: '30%', backgroundColor: '#FFF', borderRadius: '6px', padding: '4px', border: '1px solid #FF572233', display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'center' }}>
                              <span style={{ fontSize: '7px', color: '#FF5722', fontWeight: '800' }}>🍳 Kitchen Preparing</span>
                            </div>
                          )}

                          {/* Home Pin */}
                          <div style={{ position: 'absolute', right: '5%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ width: '18px', height: '18px', borderRadius: '9px', backgroundColor: '#3F51B5', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1.5px solid #FFF' }}><MapPin size={8} color="#FFF" /></span>
                            <span style={{ fontSize: '7px', fontWeight: '800', color: '#475569', marginTop: '2px' }}>Home</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Card details */}
                      <div style={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '14px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B', display: 'block' }}>
                          {activeSimOrder.status === 'pending' && 'Waiting for Confirmation...'}
                          {activeSimOrder.status === 'accepted' && 'Order Accepted!'}
                          {activeSimOrder.status === 'preparing' && 'Chef is Preparing...'}
                          {activeSimOrder.status === 'out_for_delivery' && 'Out for Delivery!'}
                          {activeSimOrder.status === 'delivered' && 'Order Delivered! 🎉'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#4CAF50', fontWeight: '700', display: 'block', marginTop: '4px' }}>Estimated delivery: 25 mins</span>

                        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {[
                            { step: 'Order Placed', active: true },
                            { step: 'Accepted by Kitchen', active: activeSimOrder.status !== 'pending' },
                            { step: 'Kitchen Preparing', active: activeSimOrder.status === 'preparing' || activeSimOrder.status === 'out_for_delivery' || activeSimOrder.status === 'delivered' },
                            { step: 'Out for Delivery', active: activeSimOrder.status === 'out_for_delivery' || activeSimOrder.status === 'delivered' },
                            { step: 'Delivered', active: activeSimOrder.status === 'delivered' }
                          ].map((s, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '5px', backgroundColor: s.active ? '#4CAF50' : '#E2E8F0' }} />
                              <span style={{ fontSize: '11px', fontWeight: s.active ? '700' : '500', color: s.active ? '#334155' : '#94A3B8' }}>{s.step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span style={{ display: 'block', textAlign: 'center', color: '#94A3B8' }}>No active orders simulation.</span>
                  )}
                </div>
              </div>
            )}

            {/* SCREEN 6: RESTAURANT OWNER KITCHEN DASHBOARD */}
            {simScreen === 'kitchen' && (
              <div style={{ flex: 1, backgroundColor: '#F8F9FA', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px', display: 'flex', alignItems: 'center', backgroundColor: '#FFF', borderBottom: '1px solid #F0F2F5', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#263238' }}>Kitchen Management Panel</span>
                </div>

                <div style={{ flex: 1, padding: '14px', overflowY: 'auto' }}>
                  {simOrders.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #ECEFF1' }}>
                      <span style={{ fontSize: '24px', display: 'block' }}>🍳</span>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', display: 'block', marginTop: '10px' }}>No active orders in queue</span>
                      <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginTop: '4px' }}>Use the switcher below to go back and order as Customer.</span>
                    </div>
                  ) : (
                    simOrders.map(o => (
                      <div key={o.id} style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '12px', border: '1px solid #E2E8F0', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#1E293B' }}>ID: #{o.id.split('-')[1]}</span>
                          <span style={{ fontSize: '9px', backgroundColor: '#FFE0B2', color: '#E65100', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>{o.status.toUpperCase()}</span>
                        </div>
                        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                          {o.items.map(it => (
                            <span key={it.item.id} style={{ fontSize: '11px', display: 'block', fontWeight: '600', color: '#475569' }}>• {it.qty}x {it.item.name}</span>
                          ))}
                        </div>
                        {o.status !== 'delivered' && (
                          <button onClick={() => {
                            const nextState: Record<string, SimOrder['status']> = {
                              pending: 'accepted',
                              accepted: 'preparing',
                              preparing: 'out_for_delivery',
                              out_for_delivery: 'delivered'
                            };
                            updateOrderState(o.id, nextState[o.status]);
                          }} style={{ width: '100%', backgroundColor: 'var(--primary)', color: '#FFF', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>
                            {o.status === 'pending' && 'Confirm Order'}
                            {o.status === 'accepted' && 'Start Preparation'}
                            {o.status === 'preparing' && 'Dispatch Delivery'}
                            {o.status === 'out_for_delivery' && 'Mark as Delivered'}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SCREEN 7: RIDER DELIVERY PANEL */}
            {simScreen === 'driver' && (
              <div style={{ flex: 1, backgroundColor: '#F8F9FA', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px', display: 'flex', alignItems: 'center', backgroundColor: '#FFF', borderBottom: '1px solid #F0F2F5', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#263238' }}>Rider Dispatch Terminal</span>
                </div>

                <div style={{ flex: 1, padding: '14px', overflowY: 'auto' }}>
                  {/* Earnings card */}
                  <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '14px', color: '#FFF', textAlign: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Today's Rider Earnings</span>
                    <span style={{ fontSize: '24px', fontWeight: '900', display: 'block', marginTop: '4px', marginBottom: '4px' }}>₹{simOrders.filter(o => o.status === 'delivered').length * 40}</span>
                    <span style={{ fontSize: '9px', opacity: 0.6 }}>₹40 base pay per local delivery</span>
                  </div>

                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '8px' }}>Active Delivery Runs</span>
                  
                  {simOrders.length === 0 ? (
                    <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block', textAlign: 'center' }}>No jobs assigned.</span>
                  ) : (
                    simOrders.map(o => (
                      <div key={o.id} style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '12px', border: '1px solid #E2E8F0', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                          <span style={{ fontWeight: '800', color: '#334155' }}>ID: #{o.id.split('-')[1]}</span>
                          <span style={{ fontWeight: '800', color: '#FF5722' }}>{o.status.toUpperCase()}</span>
                        </div>
                        <div style={{ marginTop: '10px', borderLeft: '2px solid #E2E8F0', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px', color: '#64748B' }}>
                          <span>📍 Pickup: Indiranagar, Bangalore</span>
                          <span>🏠 Dropoff: Prestige Heights, Indiranagar</span>
                        </div>
                        {o.status === 'out_for_delivery' && (
                          <button onClick={() => updateOrderState(o.id, 'delivered')} style={{ width: '100%', backgroundColor: '#4CAF50', border: 'none', color: '#FFF', padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', marginTop: '10px', cursor: 'pointer' }}>
                            Mark Order Delivered
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SCREEN 8: ADMIN ANALYTICS CONTROL */}
            {simScreen === 'admin' && (
              <div style={{ flex: 1, backgroundColor: '#F8F9FA', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px', display: 'flex', alignItems: 'center', backgroundColor: '#FFF', borderBottom: '1px solid #F0F2F5', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#263238' }}>Superadmin Control Center</span>
                </div>

                <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Metrics grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ backgroundColor: '#FFF', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '700' }}>TOTAL GMV</span>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#263238', display: 'block' }}>₹{simOrders.reduce((s,o) => s + o.amount, 0)}</span>
                    </div>
                    <div style={{ backgroundColor: '#FFF', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '700' }}>COMPLETED ORDERS</span>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#263238', display: 'block' }}>{simOrders.filter(o => o.status === 'delivered').length}</span>
                    </div>
                  </div>

                  {/* Registered hotels */}
                  <div style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '12px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#78909C', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Onboarding Approvals (Mock)</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <div>
                        <span style={{ fontWeight: '800', color: '#334155', display: 'block' }}>Indiranagar Chaat House</span>
                        <span style={{ fontSize: '9px', color: '#94A3B8' }}>HAL 2nd Stage • Snacks</span>
                      </div>
                      <button onClick={() => alert('Onboarded partner successfully approved!')} style={{ backgroundColor: '#4CAF50', border: 'none', color: '#FFF', fontSize: '10px', fontWeight: '800', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>Approve</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick simulation switcher inside mockup frame */}
            <div style={{ height: '48px', backgroundColor: '#ECEFF1', display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: '1px solid #CFD8DC' }}>
              <button onClick={() => setSimScreen('customer')} style={{ border: 'none', background: 'none', fontSize: '11px', fontWeight: simScreen === 'customer' || simScreen === 'restaurant' || simScreen === 'cart' || simScreen === 'tracking' ? '800' : '500', color: simScreen === 'customer' || simScreen === 'restaurant' || simScreen === 'cart' || simScreen === 'tracking' ? '#FF5722' : '#546E7A', cursor: 'pointer' }}>👤 User</button>
              <button onClick={() => setSimScreen('kitchen')} style={{ border: 'none', background: 'none', fontSize: '11px', fontWeight: simScreen === 'kitchen' ? '800' : '500', color: simScreen === 'kitchen' ? '#FF5722' : '#546E7A', cursor: 'pointer' }}>🍳 Kitchen</button>
              <button onClick={() => setSimScreen('driver')} style={{ border: 'none', background: 'none', fontSize: '11px', fontWeight: simScreen === 'driver' ? '800' : '500', color: simScreen === 'driver' ? '#FF5722' : '#546E7A', cursor: 'pointer' }}>🚴 Rider</button>
              <button onClick={() => setSimScreen('admin')} style={{ border: 'none', background: 'none', fontSize: '11px', fontWeight: simScreen === 'admin' ? '800' : '500', color: simScreen === 'admin' ? '#FF5722' : '#546E7A', cursor: 'pointer' }}>🛡️ Admin</button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid Section */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-header">
            <h2>Designed for Local Hyperlocal Scale</h2>
            <p>FoodExpress solves the logistical challenges of small local hotels with custom features built right into the platform.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-circle">
                <Smartphone size={24} />
              </div>
              <h3>1. Unified Mobile App</h3>
              <p>One cross-platform app binaries generated for iOS (IPA) and Android (AAB) containing modules for customers, restaurant partners, and dispatch riders.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-circle">
                <Database size={24} />
              </div>
              <h3>2. Supabase Integration</h3>
              <p>Fully secure Row Level Security (RLS) tables handling customer authentication, profile synchronizations, catalog pricing, and coupon applications.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-circle">
                <Bike size={24} />
              </div>
              <h3>3. Live Map Simulation</h3>
              <p>Simulated real-time driving paths tracking coordinates from kitchen stoves to customer doorsteps in a few lines of responsive React triggers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Supabase Schema highlighting section */}
      <section className="features-section" id="supabase" style={{ backgroundColor: 'rgba(11, 15, 25, 0.4)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
            <div>
              <span className="feature-icon-circle" style={{ display: 'flex', color: 'var(--primary)' }}>
                <Layers size={24} />
              </span>
              <h2 style={{ fontSize: '32px', marginTop: '16px', marginBottom: '16px' }}>Supabase Backend Database Design</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
                The relational schema is configured with complete constraints, custom triggers mapping user signs to profile logs, and security controls restrict access strictly to authorized stakeholders.
              </p>
              
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: 'var(--text-main)', fontWeight: '600' }}>
                  <CheckCircle size={16} color="var(--primary)" /> Row Level Security (RLS) policies prevent cross-tenant menu edits.
                </li>
                <li style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: 'var(--text-main)', fontWeight: '600' }}>
                  <CheckCircle size={16} color="var(--primary)" /> Database Triggers auto-provision welcome loyalty credits (100 points).
                </li>
                <li style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: 'var(--text-main)', fontWeight: '600' }}>
                  <CheckCircle size={16} color="var(--primary)" /> Meal subscription balances auto-deduct per ordered coupon.
                </li>
              </ul>
            </div>

            <div style={{ backgroundColor: 'var(--dark-surface)', borderRadius: '24px', padding: '24px', border: '1px solid var(--dark-border)', overflowX: 'auto', fontFamily: 'monospace', fontSize: '11px', color: '#68D391', maxHeight: '350px' }}>
              <span style={{ color: '#E2E8F0', display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>-- profiles RLS config snippet --</span>
              {`create table public.profiles (
  id uuid references auth.users primary key,
  name text not null,
  role text not null default 'customer',
  loyalty_points integer not null default 0
);

alter table public.profiles enable row level security;

create policy "Profiles viewable by everyone"
  on public.profiles for select using (true);

create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);`}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-main">
        <div className="container">
          <p>© 2026 FoodExpress Inc. All rights reserved. Designed for local small hotels in Indiranagar.</p>
        </div>
      </footer>
    </div>
  );
}
