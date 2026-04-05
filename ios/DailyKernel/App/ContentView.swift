import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var storeService = StoreKitService.shared
    @State private var onboardingComplete = UserDefaults.standard.bool(forKey: "onboarding_complete")

    var body: some View {
        Group {
            if !authService.isAuthenticated {
                LoginView()
            } else if !storeService.isSubscribed {
                PaywallView()
                    .environmentObject(storeService)
            } else if !onboardingComplete {
                OnboardingView(isComplete: $onboardingComplete)
            } else {
                MainTabView()
                    .environmentObject(storeService)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authService.isAuthenticated)
        .animation(.easeInOut(duration: 0.3), value: storeService.isSubscribed)
        .animation(.easeInOut(duration: 0.3), value: onboardingComplete)
        .task {
            if authService.isAuthenticated {
                await storeService.checkFreePassStatus()
            }
        }
    }
}
