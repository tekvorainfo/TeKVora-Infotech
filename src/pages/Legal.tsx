import { useParams } from '../lib/router';
import Layout from '../components/Layout';

const content: Record<string, { title: string; body: string }> = {
  terms: {
    title: 'Terms of Service',
    body: `Last updated: January 2026

1. Acceptance of Terms
By accessing TeKVora Infotech platform, you agree to these terms.

2. Services
TeKVora Infotech provides IT education courses and internship programs.

3. Payment Policy
Course fees are paid manually via UPI/Bank Transfer. No refunds after access is granted unless explicitly approved by admin.

4. Certificate Policy
Certificates are issued by admin upon successful completion. Certificates are non-transferable.

5. Conduct
Users must maintain professional conduct. Misuse will result in account suspension.

6. Privacy
We collect minimal personal data for program management. Data is not shared with third parties without consent.

Contact: info@tekvora.com | +91 9022302322`,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `Last updated: January 2026

TeKVora Infotech ("we") respects your privacy.

Information We Collect:
- Name, email, phone for registration
- Payment proof for enrollment
- Resume for internship applications

How We Use It:
- Program management and communication
- Certificate generation
- Admin credentialing

Data Security:
We use industry-standard security measures.

Contact for privacy concerns: info@tekvora.com`,
  },
  refund: {
    title: 'Refund Policy',
    body: `Last updated: January 2026

Refund Policy:
- Refund requests must be submitted within 7 days of payment
- Refunds are processed within 5-7 business days
- No refund after course access is granted
- Internship programs: No fee charged, no refund applicable

For refund requests: info@tekvora.com | +91 9022302322`,
  },
};

export default function Legal() {
  const { type } = useParams<{ type: string }>();
  const page = content[type || ''] || content['terms'];

  return (
    <Layout>
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-white">{page.title}</h1>
        </div>
      </section>
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="card p-8">
            <pre className="whitespace-pre-wrap text-gray-600 text-sm leading-relaxed font-poppins">{page.body}</pre>
          </div>
        </div>
      </section>
    </Layout>
  );
}
