import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReviewStore } from '../stores/reviewStore';
import { Star, Check, MessageSquare } from 'lucide-react';
import { runtimeId, runtimeIso } from '../utils/runtime';

type RatingKey = 'cuisine' | 'service' | 'ambiance' | 'rapport';

export default function Review() {
  const navigate = useNavigate();
  const { addReview } = useReviewStore();
  const [step, setStep] = useState(1);
  const [ratings, setRatings] = useState({ cuisine: 0, service: 0, ambiance: 0, rapport: 0 });
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');

  const overall = Math.round((ratings.cuisine + ratings.service + ratings.ambiance + ratings.rapport) / 4) || 0;

  const handleSubmit = () => {
    addReview({
      orderId: runtimeId('review-order'),
      clientName: name || 'Client Anonyme',
      date: runtimeIso(),
      rating: overall,
      ...ratings,
      comment
    });
    setStep(3);
    setTimeout(() => navigate('/client'), 3000);
  };

  const StarRating = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} onClick={() => onChange(s)} className="active:scale-90 transition-transform">
          <Star size={32} className={s <= value ? 'text-orange fill-orange' : 'text-white/10'} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070A0F] p-6 flex flex-col justify-center">
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm mx-auto">
          <h1 className="text-white font-black text-2xl mb-2 text-center">Comment c'était ?</h1>
          <p className="text-text-secondary text-sm text-center mb-10">Votre avis nous aide à nous améliorer</p>

          <div className="space-y-8 mb-10">
            {([
              { key: 'cuisine', label: 'Cuisine & Boissons' },
              { key: 'service', label: 'Service & Accueil' },
              { key: 'ambiance', label: 'Ambiance & Cadre' },
              { key: 'rapport', label: 'Rapport Qualité/Prix' },
            ] as Array<{ key: RatingKey; label: string }>).map(cat => (
              <div key={cat.key} className="flex flex-col items-center">
                <span className="text-white font-bold text-sm mb-3">{cat.label}</span>
                <StarRating value={ratings[cat.key]} onChange={v => setRatings({ ...ratings, [cat.key]: v })} />
              </div>
            ))}
          </div>

          <button 
            disabled={!ratings.cuisine || !ratings.service || !ratings.ambiance || !ratings.rapport}
            onClick={() => setStep(2)} 
            className="w-full py-4 rounded-2xl bg-orange text-white font-black text-sm uppercase shadow-lg shadow-orange/20 active:scale-95 transition-transform disabled:opacity-30 disabled:active:scale-100">
            Suivant
          </button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm mx-auto">
          <h1 className="text-white font-black text-2xl mb-2 text-center">Un petit mot ?</h1>
          <p className="text-text-secondary text-sm text-center mb-8">Dites-nous ce qui vous a plu (ou moins plu)</p>

          <div className="glass-card p-4 mb-6">
            <div className="flex items-center gap-2 mb-3 text-orange font-bold text-sm">
              <MessageSquare size={16} /> Votre commentaire
            </div>
            <textarea 
              value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Ex: Le thiéboudienne était incroyable mais l'attente un peu longue..."
              className="w-full bg-transparent border-none text-white text-sm focus:outline-none resize-none h-32 placeholder:text-white/20"
            />
          </div>

          <div className="glass-card p-4 mb-8">
            <label className="text-text-tertiary text-xs font-bold mb-2 block">Votre prénom (Optionnel)</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ousmane"
              className="w-full bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-orange pb-2 placeholder:text-white/20" />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="py-4 px-6 rounded-2xl bg-white/5 text-white font-bold text-sm active:scale-95 transition-transform">
              Retour
            </button>
            <button onClick={handleSubmit} className="flex-1 py-4 rounded-2xl bg-orange text-white font-black text-sm uppercase shadow-lg shadow-orange/20 active:scale-95 transition-transform">
              Envoyer
            </button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-24 h-24 rounded-full bg-green/20 flex items-center justify-center mx-auto mb-6">
            <Check size={48} className="text-green" />
          </div>
          <h2 className="text-white font-black text-2xl mb-2">Merci pour votre avis !</h2>
          <p className="text-text-secondary text-sm">Nous espérons vous revoir très vite.</p>
        </motion.div>
      )}
    </div>
  );
}
