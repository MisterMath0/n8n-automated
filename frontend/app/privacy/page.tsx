import { FC } from "react";

const Section: FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="mb-10">
    <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
    <div className="space-y-4 text-gray-300 leading-relaxed">{children}</div>
  </div>
);

const PrivacyPage = () => {
  return (
    <div className="bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Last Updated: {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-gray-300 mb-10">
            N8N.AI ("we," "our," or "us") is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our
            Services.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl lg:max-w-none text-gray-300">
          <Section title="1. Information We Collect">
            <p>
              We may collect personal information that you provide to us directly, such as when you create an account, as well as information that is automatically collected when you use our Services.
            </p>
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Personal Information:</strong> Name, email address, password, and other information you provide during account registration.</li>
                <li><strong>Usage Data:</strong> We may collect information about how you use the Services, such as the features you use, the prompts you enter, and the workflows you generate.</li>
                <li><strong>Cookies and Tracking Technologies:</strong> We use cookies and similar tracking technologies to track activity on our Services and hold certain information.</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide, operate, and maintain our Services.</li>
              <li>Improve, personalize, and expand our Services.</li>
              <li>Understand and analyze how you use our Services.</li>
              <li>Develop new products, services, features, and functionality.</li>
              <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the Service, and for marketing and promotional purposes.</li>
               <li>Process your transactions.</li>
               <li>Find and prevent fraud.</li>
            </ul>
          </Section>

          <Section title="3. How We Share Your Information">
             <p>We do not share your personal information with third parties except in the following circumstances:</p>
             <ul className="list-disc list-inside space-y-2">
                <li><strong>With your consent:</strong> We may share your information with your consent.</li>
                <li><strong>Service Providers:</strong> We may share your information with third-party vendors and service providers that perform services on our behalf.</li>
                <li><strong>For Legal Reasons:</strong> We may share your information when we believe it is necessary to comply with a legal obligation or to protect our rights and property.</li>
             </ul>
          </Section>

          <Section title="4. Data Security">
            <p>
              We use a variety of security measures to protect your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure.
            </p>
          </Section>

          <Section title="5. Your Rights">
            <p>
              Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data. Please contact us to exercise your rights.
            </p>
          </Section>
          
          <Section title="6. Changes to This Privacy Policy">
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>
          </Section>

          <Section title="7. Contact Us">
            <p>
              If you have any questions about this Privacy Policy, please contact us at:{" "}
              <a
                href="mailto:support@n8nai.app"
                className="text-blue-400 hover:text-blue-300"
              >
                support@n8nai.app
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage; 