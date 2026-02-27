export function PrivacyNotice() {
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <div>
          <h4 className="text-sm font-medium text-gray-900">Your Privacy</h4>
          <p className="text-xs text-gray-500 mt-1">
            Your address is used to find your representatives. If you have an
            account, your address and messages are stored securely in your profile.
            We never sell or share your personal information.
          </p>
        </div>
      </div>
    </div>
  );
}
