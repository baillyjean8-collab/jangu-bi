import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api';
import { AuthShell } from '../../components/layout';
import { Button, Input, useToast } from '../../components/ui';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1=email, 2=otp+newpw
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [form, setForm] = useState({ otp: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});

  async function handleSendOtp(e) {
    e.preventDefault();
    if (!email) return setErrors({ email: 'Email requis' });
    setLoading(true);
    setErrors({});
    try {
      const { data } = await authApi.forgotPassword({ email });
      // API returns userId even if email not found (generic response) — only set if present
      if (data.data?.userId) setUserId(data.data.userId);
      toast({ message: 'Si cet email est enregistré, vous recevrez un code.', type: 'info' });
      setStep(2);
    } catch (err) {
      toast({ message: err?.response?.data?.message || 'Erreur', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    const newErrors = {};
    if (!form.otp || form.otp.length !== 6) newErrors.otp = 'Code à 6 chiffres requis';
    if (!form.newPassword || form.newPassword.length < 8) newErrors.newPassword = 'Minimum 8 caractères';
    if (form.newPassword !== form.confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (Object.keys(newErrors).length) return setErrors(newErrors);

    setLoading(true);
    setErrors({});
    try {
      await authApi.resetPassword({ userId, otp: form.otp, newPassword: form.newPassword });
      toast({ message: 'Mot de passe réinitialisé ! Connectez-vous.', type: 'success' });
      navigate('/login');
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else toast({ message: data?.message || 'Code invalide ou expiré', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="card animate-fade-up">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-gold' : 'bg-forest-light/30'}`} />
          ))}
        </div>

        {step === 1 ? (
          <>
            <div className="text-center mb-6">
              <span className="text-4xl block mb-3">🔑</span>
              <h2 className="font-display text-2xl text-ivory">Mot de passe oublié</h2>
              <p className="text-mist text-sm mt-1">Entrez votre email pour recevoir un code</p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
              <Input
                label="Adresse email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors({}); }}
                error={errors.email}
                autoComplete="email"
                autoFocus
              />
              <Button type="submit" variant="primary" loading={loading} className="w-full">
                Envoyer le code de réinitialisation
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <span className="text-4xl block mb-3">📱</span>
              <h2 className="font-display text-2xl text-ivory">Nouveau mot de passe</h2>
              <p className="text-mist text-sm mt-1">
                Code envoyé à <span className="text-gold">{email}</span>
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-4" noValidate>
              <div>
                <label className="label">Code de vérification</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.otp}
                  onChange={e => { setForm(f => ({ ...f, otp: e.target.value.replace(/\D/g, '') })); setErrors(fe => ({ ...fe, otp: null })); }}
                  placeholder="000000"
                  className={`input text-center text-2xl tracking-[0.4em] font-display ${errors.otp ? 'input-error' : ''}`}
                  autoFocus
                />
                {errors.otp && <p className="text-red-400 text-xs mt-1">{errors.otp}</p>}
              </div>

              <Input
                label="Nouveau mot de passe"
                type="password"
                value={form.newPassword}
                onChange={e => { setForm(f => ({ ...f, newPassword: e.target.value })); setErrors(fe => ({ ...fe, newPassword: null })); }}
                error={errors.newPassword}
                hint="8+ caractères, majuscule, minuscule, chiffre"
                autoComplete="new-password"
              />

              <Input
                label="Confirmer le mot de passe"
                type="password"
                value={form.confirmPassword}
                onChange={e => { setForm(f => ({ ...f, confirmPassword: e.target.value })); setErrors(fe => ({ ...fe, confirmPassword: null })); }}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />

              <Button type="submit" variant="primary" loading={loading} className="w-full">
                Réinitialiser le mot de passe
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                ← Changer l'email
              </Button>
            </form>
          </>
        )}

        <div className="divider" />
        <p className="text-center text-sm text-mist">
          Vous vous souvenez ?{' '}
          <Link to="/login" className="text-gold hover:underline">Se connecter</Link>
        </p>
      </div>
    </AuthShell>
  );
}
