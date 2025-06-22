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

const TermsPage = () => {
  return (
    <div className="bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Terms of Service
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Last Updated: {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-gray-300 mb-10">
            Welcome to Autokraft ("Autokraft", "we", "us", or "our"). We provide an
            AI-powered N8N workflow generator. These Terms of Service ("Terms")
            govern your use of our website, products, and services
            (collectively, the "Services"). Please read them carefully. By
            accessing or using our Services, you agree to be bound by these
            Terms.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-4xl lg:max-w-none text-gray-300">
          <Section title="1. Use of Our Services">
            <p>
              You must be at least 18 years old to use our Services. You are
              responsible for your conduct and any data, text, information, and
              other content ("Content") that you submit to the Services. You
              agree to comply with all applicable laws and regulations in your
              use of the Services.
            </p>
            <p>
              We grant you a limited, non-exclusive, non-transferable, and
              revocable license to use our Services for your own internal
              business or personal purposes, subject to these Terms.
            </p>
          </Section>

          <Section title="2. User Accounts">
            <p>
              To access certain features of our Services, you may be required
              to create an account. You are responsible for safeguarding your
              account credentials and for all activities that occur under your
              account. You must notify us immediately of any unauthorized use
              of your account.
            </p>
          </Section>

          <Section title="3. Generated Content">
            <p>
              Our Services allow you to generate N8N workflows and other
              related content ("Generated Content"). You are solely responsible
              for the Generated Content you create. You represent and warrant
              that you have all necessary rights to the prompts you provide and
              that the Generated Content will not violate any third-party
              rights or applicable laws.
            </p>
            <p>
              We do not claim ownership of your prompts or the Generated
              Content. However, we may use them to provide, maintain, and
              improve our Services.
            </p>
          </Section>

          <Section title="4. Prohibited Activities">
            <p>You agree not to engage in any of the following activities:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Violating any laws or regulations, including intellectual
                property rights of others.
              </li>
              <li>
                Using the Services for any illegal, harmful, fraudulent, or
                unauthorized purpose.
              </li>
              <li>
                Interfering with or disrupting the integrity or performance of
                the Services.
              </li>
              <li>
                Attempting to gain unauthorized access to the Services or our
                systems.
              </li>
              <li>
                Reverse engineering, decompiling, or disassembling any part of
                the Services.
              </li>
            </ul>
          </Section>

          <Section title="5. Termination">
            <p>
              We may suspend or terminate your access to the Services at any
              time, for any reason, without notice. You may also terminate your
              account at any time. Upon termination, your right to use the
              Services will immediately cease.
            </p>
          </Section>

          <Section title="6. Disclaimer of Warranties">
            <p>
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM
              ALL WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
              WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              AND NON-INFRINGEMENT.
            </p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>
              IN NO EVENT SHALL Autokraft BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
              PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR
              ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES,
              RESULTING FROM YOUR USE OF THE SERVICES.
            </p>
          </Section>

          <Section title="8. Governing Law">
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of the jurisdiction in which our company is established,
              without regard to its conflict of law principles.
            </p>
          </Section>

          <Section title="9. Changes to Terms">
            <p>
              We reserve the right to modify these Terms at any time. We will
              notify you of any changes by posting the new Terms on our
              website. Your continued use of the Services after any such
              changes constitutes your acceptance of the new Terms.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>
              If you have any questions about these Terms, please contact us at:{" "}
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

export default TermsPage; 