import { FC } from "react";
import { CheckCircle } from "lucide-react";

const Section: FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="mb-12">
    <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>
    <div className="space-y-4 text-gray-300 leading-relaxed">{children}</div>
  </div>
);

const SecurityFeature: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="flex items-start">
        <CheckCircle className="flex-shrink-0 h-6 w-6 text-green-400 mt-1 mr-4" />
        <div>
            <h3 className="font-bold text-white text-lg">{title}</h3>
            <p className="text-gray-400">{children}</p>
        </div>
    </div>
);


const SecurityPage = () => {
  return (
    <div className="bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Security at N8N.AI
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
            We take the security of your data seriously. Our systems are designed to protect your information with multiple layers of security.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl lg:max-w-none">
          <Section title="Our Commitment to Security">
            <p className="text-lg">
              At N8N.AI, we are committed to ensuring the confidentiality, integrity, and availability of your data. We implement and maintain industry-standard security practices to create a secure environment for our users.
            </p>
          </Section>

          <Section title="Key Security Measures">
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-10">
                <SecurityFeature title="Data Encryption">
                    All data transmitted between you and our services is encrypted in transit using TLS 1.2+. Data at rest is also encrypted using AES-256.
                </SecurityFeature>
                <SecurityFeature title="Secure Infrastructure">
                    Our services are hosted on a secure cloud infrastructure that provides robust physical and network security protections.
                </SecurityFeature>
                <SecurityFeature title="Access Control">
                    We enforce strict access control policies. Access to customer data is limited to authorized personnel on a need-to-know basis.
                </SecurityFeature>
                <SecurityFeature title="Regular Security Audits">
                    We conduct regular internal and external security audits to identify and address potential vulnerabilities.
                </SecurityFeature>
                <SecurityFeature title="Secure Development">
                    Our development lifecycle includes security best practices, such as code reviews and vulnerability scanning, to ensure our platform is built securely.
                </SecurityFeature>
                <SecurityFeature title="Account Security">
                    We provide features like strong password enforcement and will be adding multi-factor authentication (MFA) to help you secure your account.
                </SecurityFeature>
            </div>
          </Section>

          <Section title="Reporting Security Vulnerabilities">
            <p>
              If you believe you have discovered a security vulnerability in our services, please let us know immediately. We appreciate your help in keeping our platform secure. Please report any issues to:
               <br />
              <a
                href="mailto:support@n8nai.app?subject=Security%20Vulnerability%20Report"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                support@n8nai.app
              </a>
            </p>
            <p>
                We will investigate all reports and do our best to address valid issues in a timely manner.
            </p>
          </Section>

        </div>
      </div>
    </div>
  );
};

export default SecurityPage; 