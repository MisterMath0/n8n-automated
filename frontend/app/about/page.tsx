const AboutPage = () => {
  return (
    <div className="bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            About Autokraft
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
            Streamlining workflow automation for developers worldwide.
          </p>
        </div>

        <div className="mt-20 max-w-4xl mx-auto text-left">
            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
                At Autokraft, our mission is to build the AI-powered N8N workflow generator that actually works. We are a team of developers who grew frustrated with the limitations of existing automation tools—the buggy interfaces, the unreliable outputs, and the valuable time wasted on manual configurations. We knew there had to be a better way.
            </p>

            <h2 className="text-3xl font-bold text-white mb-6">Built for Developers, by Developers</h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
                We designed Autokraft with the professional developer in mind. Our platform is engineered to understand complex requirements and generate robust, production-ready N8N workflows in seconds. We focus on reliability, efficiency, and precision, so you can focus on building great products instead of debugging automation scripts.
            </p>

            <h2 className="text-3xl font-bold text-white mb-6">Why Choose Us?</h2>
            <div className="grid md:grid-cols-2 gap-8 text-lg">
                <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700/50">
                    <h3 className="font-bold text-white mb-2">Speed & Efficiency</h3>
                    <p className="text-gray-400">Go from prompt to a fully functional workflow in a fraction of the time it takes to build manually. Our AI is optimized to save you hundreds of hours.</p>
                </div>
                <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700/50">
                    <h3 className="font-bold text-white mb-2">Reliable Outputs</h3>
                    <p className="text-gray-400">Say goodbye to broken JSON and faulty logic. We pride ourselves on generating clean, effective workflows that work right out of the box.</p>
                </div>
                 <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700/50">
                    <h3 className="font-bold text-white mb-2">Focus on What Matters</h3>
                    <p className="text-gray-400">Free up your development cycles to concentrate on innovation and core product features, not tedious automation tasks.</p>
                </div>
                 <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700/50">
                    <h3 className="font-bold text-white mb-2">Continuous Improvement</h3>
                    <p className="text-gray-400">We are constantly refining our AI models and platform features based on user feedback to deliver an ever-improving experience.</p>
                </div>
            </div>
            
            <div className="text-center mt-20">
                <p className="text-xl text-gray-300">Join us in revolutionizing the way developers build automations.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 