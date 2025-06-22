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

const CookiesPage = () => {
  return (
    <div className="bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Cookie Policy
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Last Updated: {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl lg:max-w-none text-gray-300">
          <Section title="What Are Cookies?">
            <p>
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
            </p>
          </Section>

          <Section title="How We Use Cookies">
            <p>We use cookies for a variety of reasons, including:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Essential Cookies:</strong> These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in, or filling in forms.
              </li>
              <li>
                <strong>Performance and Analytics Cookies:</strong> These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.
              </li>
              <li>
                <strong>Functionality Cookies:</strong> These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.
              </li>
            </ul>
          </Section>

          <Section title="Your Choices Regarding Cookies">
            <p>
              You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by setting or amending your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website, though your access to some functionality and areas of our website may be restricted.
            </p>
          </Section>

          <Section title="Changes to This Cookie Policy">
            <p>
              We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
            </p>
          </Section>

          <Section title="Contact Us">
            <p>
              If you have any questions about our use of cookies, please contact us at:{" "}
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

export default CookiesPage; 