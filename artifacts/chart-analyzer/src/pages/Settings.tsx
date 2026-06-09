import React, { useState } from 'react';
import { Show } from '@clerk/react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Lock, Key, Copy, Check, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { useGetApiKeyStatus, useGenerateApiKey } from '@workspace/api-client-react';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
      title="Copier"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function ApiKeySection() {
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const { data: status, isLoading, refetch } = useGetApiKeyStatus();
  const generateMutation = useGenerateApiKey({
    mutation: {
      onSuccess: (data) => {
        setGeneratedKey(data.key);
        refetch();
      },
    },
  });

  const handleGenerate = () => {
    if (status?.hasKey) {
      if (!confirm('Cela va invalider votre clé actuelle. Continuer ?')) return;
    }
    generateMutation.mutate(undefined);
  };

  if (isLoading) {
    return <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto my-8" />;
  }

  return (
    <div className="space-y-6">
      {generatedKey ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
              Copiez cette clé maintenant — elle ne sera plus jamais affichée.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Votre clé API MT5
            </label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3">
              <code className="flex-1 text-sm font-mono text-slate-900 dark:text-white break-all">
                {generatedKey}
              </code>
              <CopyButton text={generatedKey} />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
            <p className="font-semibold mb-1">Comment l'utiliser dans MT5 :</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-600 dark:text-blue-400">
              <li>Outils → Options → Expert Advisors → Autoriser WebRequest pour <code className="text-xs bg-blue-100 dark:bg-blue-900/40 px-1 rounded">https://chartattack.net</code></li>
              <li>Dans les paramètres de l'EA : collez la clé dans <code className="text-xs bg-blue-100 dark:bg-blue-900/40 px-1 rounded">InpApiKey</code></li>
              <li>L'EA enverra automatiquement exit + R réel à la clôture de chaque position</li>
            </ol>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setGeneratedKey(null)}
            className="text-slate-600 dark:text-slate-400"
          >
            J'ai sauvegardé ma clé
          </Button>
        </div>
      ) : status?.hasKey ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Clé active</p>
              {status.createdAt && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Générée le {new Date(status.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              La clé est stockée en hash SHA-256 — il est impossible de la retrouver. Si vous l'avez perdue, régénérez-en une nouvelle.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
            Régénérer une nouvelle clé
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Générez une clé API pour que votre EA MT5 puisse remonter automatiquement les résultats de vos trades (exit + R réel) vers ChartAttack.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Key className={`w-4 h-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
            {generateMutation.isPending ? 'Génération...' : 'Générer une clé API'}
          </Button>
        </div>
      )}
    </div>
  );
}

function SignedOutPrompt() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
        <Lock className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Connexion requise</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
        Les réglages sont liés à votre compte. Connectez-vous pour gérer votre clé API MT5.
      </p>
      <Button onClick={() => setLocation('/sign-in')} className="bg-blue-600 hover:bg-blue-700 text-white">
        Se connecter
      </Button>
    </div>
  );
}

export default function Settings() {
  return (
    <>
      <Show when="signed-in">
        <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-2xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Réglages</h1>
            <p className="text-slate-500 dark:text-slate-400">Configuration de votre compte ChartAttack.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Clé API MT5</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Permet à votre EA de remonter les résultats automatiquement</p>
              </div>
            </div>
            <ApiKeySection />
          </div>
        </div>
      </Show>
      <Show when="signed-out">
        <SignedOutPrompt />
      </Show>
    </>
  );
}
