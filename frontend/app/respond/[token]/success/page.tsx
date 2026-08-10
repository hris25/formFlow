'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, PartyPopper } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-md w-full text-center animate-scale-in">
        <div className="relative inline-block mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div className="absolute -top-2 -right-2">
            <PartyPopper className="w-8 h-8 text-accent animate-bounce" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Merci pour votre réponse !</h1>
        <p className="text-muted-foreground mb-8">
          Votre avis a bien été enregistré. Votre enseignant appréciera votre feedback.
        </p>

        <div className="p-4 rounded-xl bg-muted/50 mb-6">
          <p className="text-sm text-muted-foreground">
            Vous pouvez maintenant fermer cette page.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          FormFlow — Formulaires intelligents pour enseignants
        </p>
      </div>
    </div>
  )
}
