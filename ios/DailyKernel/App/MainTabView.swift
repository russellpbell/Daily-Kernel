import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                BriefingView()
                    .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            }
            .tabItem {
                Label("Briefing", systemImage: "newspaper.fill")
                    .symbolRenderingMode(.hierarchical)
            }
            .tag(0)

            NavigationStack {
                LibraryView()
                    .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            }
            .tabItem {
                Label("Library", systemImage: "books.vertical.fill")
                    .symbolRenderingMode(.hierarchical)
            }
            .tag(1)

            NavigationStack {
                CategoriesView()
                    .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            }
            .tabItem {
                Label("Topics", systemImage: "square.grid.2x2.fill")
                    .symbolRenderingMode(.hierarchical)
            }
            .tag(2)

            NavigationStack {
                StatsView()
                    .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            }
            .tabItem {
                Label("Progress", systemImage: "chart.bar.fill")
                    .symbolRenderingMode(.hierarchical)
            }
            .tag(3)

            NavigationStack {
                SettingsView()
                    .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape.fill")
                    .symbolRenderingMode(.hierarchical)
            }
            .tag(4)
        }
        .tint(Color.appPrimary)
        .toolbarBackground(.ultraThinMaterial, for: .tabBar)
        .sensoryFeedback(.selection, trigger: selectedTab)
    }
}
