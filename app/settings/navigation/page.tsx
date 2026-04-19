const backgroundImage = "/images/backgrounds/builtin/onboarding.png";

export default function NavigationSettings() {
    return (
        <div
            className="relative min-h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})`, backgroundAttachment: "fixed" }}
        >
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/30 to-black/50 backdrop-blur-sm" />
            {/* Main container */}
            <div className="relative z-10 flex min-h-screen items-center justify-center px-6 gap-8">
                {/* LEFT PANEL: step list */}
                <div className="w-full max-w-70 rounded-2xl ring-1 ring-white/50 bg-white/30 backdrop-blur-lg overflow-hidden flex flex-col shadow-xl">
                    <h1 className="w-full text-center p-2 text-xl font-bold text-white">
                        Navigation Settings
                    </h1>

                    <h3 className="w-full text-center p-2 text-md text-white/80">
                        No settings available currently. Go{" "}
                        <a href="/settings/appearance" className="text-blue-400 hover:underline">
                            here
                        </a>{" "}
                        to edit themes, styles and appearance of the app and navigation.
                    </h3>
                </div>
            </div>
        </div>
    );
}
