"use client";

export default function TermsAndConditionsPage() {
    return (
        <main className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Terms and Conditions</h1>

            <p>
                Welcome to Schoolm8. By using our service, you agree to comply with these terms and
                conditions. Please read them carefully.
            </p>

            <section>
                <h2 className="text-2xl font-semibold mt-4">1. Acceptance of Terms</h2>
                <p>
                    By accessing or using our service, you agree to be bound by these Terms and
                    Conditions and all applicable laws.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold mt-4">2. User Responsibilities</h2>
                <p>
                    Users are responsible for maintaining the confidentiality of their account
                    information and ensuring that all activity is lawful.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold mt-4">3. Intellectual Property</h2>
                <p>
                    All content, trademarks, and intellectual property displayed in the service
                    remain the property of the company unless otherwise stated.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold mt-4">4. Limitation of Liability</h2>
                <p>
                    We are not liable for any direct, indirect, or consequential damages arising
                    from the use of our service.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold mt-4">5. Changes to Terms</h2>
                <p>
                    We may update these terms at any time. Your continued use of the service
                    constitutes acceptance of the new terms.
                </p>
            </section>

            <p className="text-sm text-gray-500 mt-8">Last updated: 10 February 2026</p>
        </main>
    );
}
