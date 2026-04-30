import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center relative px-4 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
        
        <div className="max-w-4xl w-full text-center z-10 space-y-8">
          <div className="inline-block px-4 py-1.5 mb-4 rounded-full glass text-sm font-medium text-indigo-400 border border-indigo-500/20">
            Privacy-First Document Learning
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-balance">
            Don't just read. <br />
            <span className="gradient-text">Understand.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            Master complex documents with our tree-based Doubt Graph system. 
            Private, local-first, and powered by advanced AI chaining.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link 
              href="/viewer" 
              className="px-8 py-4 bg-foreground text-background rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-indigo-500/10"
            >
              Get Started Free
            </Link>
            <Link 
              href="https://github.com" 
              className="px-8 py-4 glass rounded-2xl font-bold hover:bg-white/5 transition-all border border-white/10"
            >
              View Source
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full mt-32 px-4 pb-20">
          <FeatureCard 
            title="Doubt Graph" 
            description="Visualize your learning journey with a non-linear tree of questions and answers."
            icon="🌿"
          />
          <FeatureCard 
            title="Local-First Privacy" 
            description="Your documents never leave your browser. All parsing and embedding happens locally."
            icon="🔒"
          />
          <FeatureCard 
            title="AI Chaining" 
            description="Automatic rotation between Gemini keys with seamless fallback to local Ollama models."
            icon="⛓️"
          />
        </div>
      </main>

      <footer className="py-10 border-t border-white/5 flex flex-col items-center gap-4 text-sm text-muted-foreground">
        <p>© 2024 DocuLearn AI. Open source and privacy-focused.</p>
        <div className="flex gap-8">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: string }) {
  return (
    <div className="p-8 rounded-3xl glass border border-white/5 hover:border-indigo-500/20 transition-all group">
      <div className="text-4xl mb-6 group-hover:scale-110 transition-transform origin-left">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

