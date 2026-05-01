import Link from "next/link";
import { BookOpen, Shield, Key } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col h-full overflow-y-auto w-full max-w-md mx-auto relative pb-20">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-[-20%] w-[60%] h-[40%] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-20%] w-[60%] h-[40%] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center pt-12 px-6 text-center z-10 space-y-6">
        <div className="inline-block px-3 py-1 rounded-full glass text-xs font-semibold text-indigo-400 border border-indigo-500/20">
          Privacy-First PDF Learning
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
          Don&apos;t just read. <br />
          <span className="gradient-text">Understand.</span>
        </h1>
        
        <p className="text-base text-muted-foreground text-balance leading-relaxed">
          Master documents with our tree-based Doubt Graph. 
          Private, local-first, and powered by AI.
        </p>
        
        <div className="flex flex-col w-full gap-3 pt-4">
          <Link 
            href="/viewer" 
            className="w-full py-4 bg-foreground text-background rounded-2xl font-bold active:scale-95 transition-all shadow-xl shadow-indigo-500/10 text-lg flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            Open Document
          </Link>
          <Link 
            href="https://github.com" 
            className="w-full py-4 glass rounded-2xl font-bold active:scale-95 transition-all border border-white/10 text-lg"
          >
            View Source
          </Link>
        </div>
      </div>

      {/* Feature List */}
      <div className="flex flex-col gap-4 mt-12 px-6 z-10">
        <FeatureCard 
          title="Doubt Graph" 
          description="Visualize your learning journey with a non-linear tree of Q&As."
          icon={<BookOpen className="w-6 h-6 text-indigo-400" />}
        />
        <FeatureCard 
          title="Local-First Privacy" 
          description="Documents never leave your device. Parsing happens locally."
          icon={<Shield className="w-6 h-6 text-emerald-400" />}
        />
        <FeatureCard 
          title="Bring Your Key" 
          description="Use your own Gemini keys directly from your device."
          icon={<Key className="w-6 h-6 text-amber-400" />}
        />
      </div>

      <footer className="mt-auto pt-12 pb-6 flex flex-col items-center gap-2 text-xs text-muted-foreground">
        <p>© 2024 DocuLearn AI. Open source.</p>
        <div className="flex gap-4 mt-2">
          <Link href="/privacy" className="underline underline-offset-2">Privacy</Link>
          <Link href="/terms" className="underline underline-offset-2">Terms</Link>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl glass border border-white/5 flex gap-4 items-start active:bg-white/5 transition-colors">
      <div className="p-3 rounded-xl bg-white/5 mt-1 border border-white/5">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-bold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
