const ContactPage = () => {
  return (
    <div className="bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Contact Us
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Have questions or need support? We're here to help. Reach out to us, and we'll get back to you as soon as possible.
          </p>
        </div>

        <div className="mt-16 sm:mt-20 text-center">
          <div className="inline-flex items-center gap-4 p-4 border border-gray-700/50 rounded-lg bg-gray-900/50">
            <svg
              className="w-6 h-6 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <a
              href="mailto:support@n8nai.app"
              className="text-xl font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              support@n8nai.app
            </a>
          </div>
          <p className="mt-8 text-gray-500">
            For technical issues, partnership inquiries, or general questions, please don't hesitate to email us.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage; 