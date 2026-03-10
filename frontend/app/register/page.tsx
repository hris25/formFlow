'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Lock, Loader2, ArrowRight, CheckCircle2, Sparkles, Layout, BarChart, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { register as registerApi } from '@/lib/api'
import { useAuthStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const registerSchema = z.object({
  name: z.string().min(2, 'Nom minimum 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe minimum 6 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const response = await registerApi(data.name, data.email, data.password)
      const { token, user } = response.data
      login(user, token)
      toast.success('Compte créé avec succès !')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du compte')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side: Form Section */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Logo & Header */}
          <div className="mb-10 flex flex-col items-center lg:items-start">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white mb-6 shadow-xl shadow-primary/20"
            >
              <Layout className="w-7 h-7" />
            </motion.div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">FormFlow</h1>
            <p className="text-muted-foreground text-lg">Créez votre espace pédagogique en quelques clics.</p>
          </div>

          <Card className="border border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

            <CardHeader className="space-y-1 pb-6 pt-8 px-8 relative">
              <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
              <CardDescription className="text-base">
                Rejoignez des milliers d'enseignants satisfaits.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-6 px-8 relative">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Nom complet</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Prof Dupont"
                      className="pl-11 h-12 bg-background/50 border-border/80 focus:ring-primary/20 transition-all text-base"
                      {...register('name')}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.name && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="text-sm text-destructive font-medium"
                      >
                        {errors.name.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Email Professionnel</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre.nom@ecole.fr"
                      className="pl-11 h-12 bg-background/50 border-border/80 focus:ring-primary/20 transition-all text-base"
                      {...register('email')}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="text-sm text-destructive font-medium"
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Mot de passe</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-11 h-12 bg-background/50 border-border/80 focus:ring-primary/20 transition-all text-base"
                      {...register('password')}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="text-sm text-destructive font-medium"
                      >
                        {errors.password.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                  className="space-y-2"
                >
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Confirmer le mot de passe</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-11 h-12 bg-background/50 border-border/80 focus:ring-primary/20 transition-all text-base"
                      {...register('confirmPassword')}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.confirmPassword && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="text-sm text-destructive font-medium"
                      >
                        {errors.confirmPassword.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              </CardContent>

              <CardFooter className="flex flex-col gap-6 pt-10 pb-10 px-8 relative border-t-0 bg-transparent">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <Button
                    type="submit"
                    className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/25 rounded-xl transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        Créer mon compte
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </motion.div>

                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Déjà un compte ?{' '}
                    <Link
                      href="/login"
                      className="text-primary font-bold hover:underline underline-offset-4 decoration-2"
                    >
                      Se connecter
                    </Link>
                  </p>
                </div>
              </CardFooter>
            </form>
          </Card>

          <footer className="mt-12 text-center lg:text-left">
            <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto lg:mx-0">
              En continuant, vous acceptez nos <span className="underline cursor-pointer">Conditions d'Utilisation</span> et notre <span className="underline cursor-pointer">Politique de Confidentialité</span>.
            </p>
          </footer>
        </motion.div>
      </div>

      {/* Right Side: Visual Section */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-primary/95">
        <div className="absolute inset-0 z-0">
          <img
            src="/login-bg.png"
            alt="FormFlow Background"
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
        </div>

        <div className="relative z-10 w-full flex flex-col justify-between p-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-8 opacity-90">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-[0.2em]">IA Inside</span>
            </div>
            <h2 className="text-5xl font-extrabold leading-tight mb-6">
              Rejoignez la<br />communauté éducative.
            </h2>
            <p className="text-xl text-primary-foreground/80 max-w-lg leading-relaxed">
              Créez des formulaires intelligents, collectez des retours et analysez les résultats avec l'aide de l'IA.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="grid grid-cols-1 gap-8 mt-auto"
          >
            {[
              { icon: CheckCircle2, title: "Création Rapide", desc: "Formulaires prêts en moins de 2 minutes." },
              { icon: BarChart, title: "Analytics Avancés", desc: "Visualisez et comprenez les données instantanément." },
              { icon: ShieldCheck, title: "Gratuit & Sécurisé", desc: "Aucune carte bancaire requise, données protégées." }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                <div className="p-3 rounded-xl bg-white/10">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-primary-foreground/60 text-sm whitespace-nowrap">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-8 h-full w-full pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-white/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [0, -90, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-accent/30 rounded-full blur-[120px]"
          />
        </div>
      </div>
    </div>
  )
}
