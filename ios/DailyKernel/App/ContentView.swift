import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var storeService = StoreKitService.shared

    var body: some View {
        Group {
            if !authService.isAuthenticated {
                LoginView()
            } else if !storeService.isSubscribed {
                PaywallView()
                    .environmentObject(storeService)
            } else {
                MainTabView()
                    .environmentObject(storeService)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authService.isAuthenticated)
        .animation(.easeInOut(duration: 0.3), value: storeService.isSubscribed)
        .task {
            if authService.isAuthenticated {
                await storeService.checkFreePassStatus()
            }
        }
    }
}
