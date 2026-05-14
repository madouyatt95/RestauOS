import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore, PRODUCTS } from '../stores/orderStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useGalsenRegions } from '../hooks/useGalsenAPI';
import { ArrowLeft, Send, Bot, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fmt = (n: number) => n.toLocaleString('fr-FR');

interface Message {
  id: string;
  from: 'bot' | 'client';
  text: string;
  time: string;
}

type BotState = 'welcome' | 'menu' | 'cart' | 'address' | 'phone' | 'payment' | 'confirm' | 'done';

const MENU_TEXT = PRODUCTS.map((p, i) => `${i + 1}. ${p.name} — ${fmt(p.price)} F`).join('\n');

const now = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export default function WhatsAppBot() {
  const navigate = useNavigate();
  const { addDelivery } = useDeliveryStore();
  const { addNotification } = useNotificationStore();
  const { searchLocations } = useGalsenRegions();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    { id: 'm0', from: 'bot', text: '🍽️ *Bienvenue chez Teranga Table !*\n\nJe suis votre assistant de commande WhatsApp.\n\nTapez *menu* pour voir notre carte, ou envoyez-moi directement le nom d\'un plat !', time: now() }
  ]);
  const [input, setInput] = useState('');
  const [botState, setBotState] = useState<BotState>('welcome');
  const [clientCart, setClientCart] = useState<{ productIndex: number; qty: number }[]>([]);
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientPayment, setClientPayment] = useState<'especes' | 'wave'>('especes');
  const [addressSuggestions, setAddressSuggestions] = useState<{ name: string; type: string; region: string }[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMsg = (from: 'bot' | 'client', text: string) => {
    setMessages(prev => [...prev, { id: `m${Date.now()}-${Math.random()}`, from, text, time: now() }]);
  };

  const botReply = (text: string, delay = 600) => {
    setTimeout(() => addMsg('bot', text), delay);
  };

  const cartTotal = clientCart.reduce((s, item) => s + PRODUCTS[item.productIndex].price * item.qty, 0);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg) return;
    addMsg('client', msg);
    setInput('');

    const lower = msg.toLowerCase();

    switch (botState) {
      case 'welcome':
      case 'menu': {
        if (lower === 'menu' || lower === 'carte') {
          botReply(`📋 *Notre Carte du Jour*\n\n${MENU_TEXT}\n\n_Envoyez le numéro du plat pour l'ajouter (ex: "1" ou "2x3" pour 2 Mafé)._`);
          setBotState('menu');
          return;
        }

        // Try to parse "2x3" or just "3"
        const multiMatch = lower.match(/^(\d+)\s*x\s*(\d+)$/);
        const singleMatch = lower.match(/^(\d+)$/);

        if (multiMatch) {
          const qty = parseInt(multiMatch[1]);
          const idx = parseInt(multiMatch[2]) - 1;
          if (idx >= 0 && idx < PRODUCTS.length) {
            setClientCart(prev => [...prev, { productIndex: idx, qty }]);
            botReply(`✅ *${qty}x ${PRODUCTS[idx].name}* ajouté !\n\nEnvoyez un autre numéro ou tapez *panier* pour voir votre commande.`);
            setBotState('menu');
            return;
          }
        } else if (singleMatch) {
          const idx = parseInt(singleMatch[1]) - 1;
          if (idx >= 0 && idx < PRODUCTS.length) {
            setClientCart(prev => [...prev, { productIndex: idx, qty: 1 }]);
            botReply(`✅ *${PRODUCTS[idx].name}* ajouté !\n\nEnvoyez un autre numéro ou tapez *panier* pour voir votre commande.`);
            setBotState('menu');
            return;
          }
        }

        // Try name matching
        const found = PRODUCTS.findIndex(p => p.name.toLowerCase().includes(lower));
        if (found >= 0) {
          setClientCart(prev => [...prev, { productIndex: found, qty: 1 }]);
          botReply(`✅ *${PRODUCTS[found].name}* ajouté !\n\nEnvoyez un autre numéro ou tapez *panier* pour voir votre commande.`);
          setBotState('menu');
          return;
        }

        if (lower === 'panier' || lower === 'commande' || lower === 'valider') {
          if (clientCart.length === 0) {
            botReply("Votre panier est vide ! Tapez *menu* pour voir notre carte. 🍽️");
            return;
          }
          const cartText = clientCart.map(item => `• ${item.qty}x ${PRODUCTS[item.productIndex].name} — ${fmt(PRODUCTS[item.productIndex].price * item.qty)} F`).join('\n');
          botReply(`🛒 *Votre Panier*\n\n${cartText}\n\n💰 *Total : ${fmt(cartTotal)} F*\n+ Frais de livraison : 1 500 F\n\n_Tapez *OK* pour confirmer ou *annuler* pour vider._`);
          setBotState('cart');
          return;
        }

        botReply("Je n'ai pas compris 😅\nTapez *menu* pour voir la carte ou envoyez directement un numéro de plat !");
        break;
      }

      case 'cart': {
        if (lower === 'ok' || lower === 'oui' || lower === 'confirmer') {
          botReply("📍 *Parfait !*\n\nEnvoyez-moi votre *adresse de livraison* (quartier, rue, repère).");
          setBotState('address');
          return;
        }
        if (lower === 'annuler') {
          setClientCart([]);
          botReply("🗑️ Panier vidé !\nTapez *menu* pour recommencer.");
          setBotState('welcome');
          return;
        }
        botReply("Tapez *OK* pour confirmer ou *annuler* pour vider votre panier.");
        break;
      }

      case 'address': {
        // Check if user selected a suggestion number
        const suggestionMatch = msg.match(/^(\d+)$/);
        if (suggestionMatch && addressSuggestions.length > 0) {
          const idx = parseInt(suggestionMatch[1]) - 1;
          if (idx >= 0 && idx < addressSuggestions.length) {
            const chosen = addressSuggestions[idx];
            setClientAddress(`${chosen.name}, ${chosen.region}`);
            setAddressSuggestions([]);
            botReply(`\u2705 Adresse confirm\u00e9e : *${chosen.name}, ${chosen.region}*\n\nEnvoyez-moi maintenant votre *num\u00e9ro de t\u00e9l\u00e9phone*.`);
            setBotState('phone');
            return;
          }
        }

        // Try to find location suggestions
        const results = searchLocations(msg, 5);
        if (results.length > 0) {
          setAddressSuggestions(results);
          const suggText = results.map((r, i) => `${i + 1}. ${r.name} _(${r.region} - ${r.type})_`).join('\n');
          botReply(`\ud83d\udccd *Localit\u00e9s trouv\u00e9es :*\n\n${suggText}\n\n_R\u00e9pondez avec le num\u00e9ro ou pr\u00e9cisez votre adresse compl\u00e8te._`);
          return;
        }

        // No match found, use as-is
        setClientAddress(msg);
        setAddressSuggestions([]);
        botReply("\ud83d\udcf1 Merci ! Envoyez-moi maintenant votre *num\u00e9ro de t\u00e9l\u00e9phone*.");
        setBotState('phone');
        break;
      }

      case 'phone': {
        setClientPhone(msg);
        botReply("💳 *Comment souhaitez-vous payer ?*\n\n1. 💵 Espèces (à la livraison)\n2. 📱 Wave\n\n_Répondez 1 ou 2._");
        setBotState('payment');
        break;
      }

      case 'payment': {
        const method = msg === '2' || lower.includes('wave') ? 'wave' : 'especes';
        setClientPayment(method);

        const cartText = clientCart.map(item => `• ${item.qty}x ${PRODUCTS[item.productIndex].name}`).join('\n');
        const total = cartTotal + 1500;
        botReply(`📦 *Récapitulatif Final*\n\n${cartText}\n\n💰 Total repas : ${fmt(cartTotal)} F\n🛵 Livraison : 1 500 F\n━━━━━━━━━━━━\n✨ *TOTAL : ${fmt(total)} F*\n\n📍 ${clientAddress}\n📱 ${clientPhone}\n💳 ${method === 'wave' ? 'Wave' : 'Espèces'}\n\n_Tapez *ENVOYER* pour confirmer votre commande !_`);
        setBotState('confirm');
        break;
      }

      case 'confirm': {
        if (lower === 'envoyer' || lower === 'ok' || lower === 'oui') {
          // Create real order in stores
          const items = clientCart.map(item => ({
            product: PRODUCTS[item.productIndex],
            quantity: item.qty,
          }));

          const orderId = `wa-${Date.now()}`;
          useOrderStore.setState(s => ({
            orders: [...s.orders, {
              id: orderId,
              items,
              total: cartTotal,
              type: 'livraison' as const,
              payment: clientPayment,
              date: new Date().toISOString(),
              serveurName: 'WhatsApp Bot',
              status: 'en_attente' as const,
            }]
          }));

          addDelivery({
            orderId,
            clientName: `Client WhatsApp`,
            clientPhone,
            address: clientAddress,
            amount: cartTotal,
            deliveryFee: 1500,
            paymentStatus: clientPayment === 'wave' ? 'paye' : 'en_attente',
            paymentMethod: clientPayment,
            driverId: 'e5',
            driverName: 'Pape Sow',
            status: 'preparation',
            estimatedTime: 30,
            createdAt: new Date().toISOString(),
          });

          addNotification({
            title: '📱 Commande WhatsApp',
            message: `Nouvelle commande de ${fmt(cartTotal)} F — ${clientAddress}`,
            type: 'order',
            targetRole: 'Gérant',
          });

          botReply("✅ *Commande envoyée en cuisine !*\n\n🧑‍🍳 Notre équipe prépare votre repas.\n🛵 Un livreur Tiak-Tiak sera bientôt en route !\n\nMerci d'avoir commandé chez *Teranga Table* ! 🙏");
          setBotState('done');
          return;
        }
        botReply("Tapez *ENVOYER* pour confirmer ou *annuler* pour recommencer.");
        break;
      }

      case 'done': {
        botReply("Votre commande est déjà en cours de préparation ! 🧑‍🍳\n\nTapez *menu* pour passer une nouvelle commande.");
        setClientCart([]);
        setBotState('welcome');
        break;
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0c10] z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3 shrink-0 shadow-lg">
        <button onClick={() => navigate(-1)} className="text-white">
          <ArrowLeft size={24} />
        </button>
        <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
          <Bot size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-white font-bold text-sm">Teranga Table Bot</h2>
          <p className="text-green-200 text-[10px]">En ligne</p>
        </div>
        <Phone size={20} className="text-white/60" />
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundColor: '#0b1015',
      }}>
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.from === 'client' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-md relative ${
                msg.from === 'client'
                  ? 'bg-[#005C4B] text-white rounded-tr-sm'
                  : 'bg-[#1F2C34] text-white rounded-tl-sm'
              }`}>
                <p className="text-[13px] leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                      .replace(/_(.*?)_/g, '<em class="opacity-60">$1</em>')
                  }}
                />
                <p className={`text-[10px] mt-1 text-right ${msg.from === 'client' ? 'text-green-300/60' : 'text-white/30'}`}>
                  {msg.time}
                  {msg.from === 'client' && ' ✓✓'}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-[#1F2C34] px-3 py-2.5 flex items-center gap-2 shrink-0 border-t border-white/5">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Tapez un message..."
          className="flex-1 bg-[#2A3942] text-white text-sm rounded-full px-5 py-3 outline-none placeholder:text-white/30"
        />
        <button onClick={handleSend} className="w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 active:scale-90 transition-transform shadow-lg shadow-[#25D366]/20">
          <Send size={18} className="text-white ml-0.5" />
        </button>
      </div>
    </div>
  );
}
